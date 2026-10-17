"""Nearby places (schools, supermarkets, hospitals, ...) for the map's "Nearby places" menu.

Data comes from OpenStreetMap. Visitors never wait on an outside service: places are kept in
our own database (`Place`), one grid square (`PlaceTile`) at a time.
- All of Sri Lanka ships with the app (properties/data/places_lk.json.gz, built from the
  Geofabrik download by scripts/build_places_data.py) and `manage.py load_places` loads it
  on every deploy.
- Squares outside it, or older than REFRESH_AFTER, are downloaded from the public Overpass
  API (slow, often down) in a background thread. A never-downloaded square makes the reply
  say `pending`, and the browser asks again a few seconds later.
"""
import json
import logging
import math
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta

from django.conf import settings
from django.db import close_old_connections, connections, transaction
from django.utils import timezone

from .models import Place, PlaceTile
from .osm_categories import classify

logger = logging.getLogger(__name__)

# One Overpass filter per category. `classify` (osm_categories.py) must agree with these.
CATEGORY_QUERIES = {
    'school': ['nwr["amenity"~"^(school|college)$"]'],
    'foodcity': ['nwr["shop"="supermarket"]["name"~"food ?city|cargills",i]'],
    'keells': ['nwr["shop"="supermarket"]["name"~"keells",i]'],
    'hotel': ['nwr["tourism"="hotel"]'],
    'hospital': ['nwr["amenity"="hospital"]'],
    'gym': ['nwr["leisure"="fitness_centre"]', 'nwr["amenity"="gym"]'],
    'restaurant': ['nwr["amenity"="restaurant"]'],
    'salon': ['nwr["shop"~"^(hairdresser|beauty)$"]'],
}
CATEGORIES = tuple(CATEGORY_QUERIES)

# Bigger areas would put thousands of points on the map: it asks the user to zoom in instead
# (about 25 km across).
MAX_SPAN_DEGREES = 0.25
PER_CATEGORY_LIMIT = 150  # the ones nearest the middle of the view are returned
TILE = 0.05  # grid square size in degrees (about 5.5 km)
REFRESH_AFTER = timedelta(days=90)  # places change slowly; older squares are re-downloaded
RETRY_AFTER = timedelta(minutes=3)  # a download in progress (or failed) isn't restarted sooner
QUERY_TIMEOUT = 90  # seconds Overpass may spend on the query
HTTP_TIMEOUT = 120


class PlacesError(Exception):
    pass


# ---------- grid ----------

def tile_of(lat, lng):
    return math.floor(lat / TILE), math.floor(lng / TILE)


def tile_key(row, col):
    return f'{row}:{col}'


def tiles_for(south, west, north, east):
    """Keys of the grid squares the box touches."""
    r0, c0 = tile_of(south, west)
    r1, c1 = tile_of(north, east)
    return [tile_key(r, c) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]


def tile_bbox(keys):
    """(south, west, north, east) covering all the given squares."""
    cells = [tuple(map(int, k.split(':'))) for k in keys]
    rows = [r for r, _ in cells]
    cols = [c for _, c in cells]
    return (
        round(min(rows) * TILE, 6), round(min(cols) * TILE, 6),
        round((max(rows) + 1) * TILE, 6), round((max(cols) + 1) * TILE, 6),
    )


# ---------- reading ----------

def nearby_places(categories, south, west, north, east):
    """Returns (places, unavailable, pending): [{id, category, name, lat, lng}] for the
    categories in the box, the categories that couldn't be downloaded just now, and whether
    part of the box is still downloading (ask again shortly)."""
    if north - south > MAX_SPAN_DEGREES or east - west > MAX_SPAN_DEGREES:
        raise ValueError('area too large')
    wanted = sorted(set(categories))
    keys = tiles_for(south, west, north, east)

    now = timezone.now()
    tiles = {t.key: t for t in PlaceTile.objects.filter(key__in=keys)}
    never = [k for k in keys if k not in tiles or tiles[k].fetched_at is None]
    stale = [k for k in keys if k in tiles and tiles[k].fetched_at and now - tiles[k].fetched_at > REFRESH_AFTER]

    started = request_download(never + stale)
    if started and not settings.PLACES_FETCH_IN_BACKGROUND:
        tiles = {t.key: t for t in PlaceTile.objects.filter(key__in=keys)}
        never = [k for k in keys if tiles[k].fetched_at is None]

    # A square that has never been downloaded and whose last attempt failed: tell the user
    # rather than keep them waiting. Anything else not yet downloaded is still in progress.
    failed = [k for k in never if tiles.get(k) and tiles[k].failed_at and tiles[k].failed_at >= tiles[k].requested_at]
    pending = len(failed) < len(never)

    mid_lat, mid_lng = (south + north) / 2, (west + east) / 2
    places = []
    for cat in wanted:
        rows = Place.objects.filter(
            category=cat, lat__gte=south, lat__lte=north, lng__gte=west, lng__lte=east
        ).values_list('osm_id', 'name', 'lat', 'lng')
        rows = sorted(rows, key=lambda r: (r[2] - mid_lat) ** 2 + (r[3] - mid_lng) ** 2)
        places += [
            {'id': osm_id, 'category': cat, 'name': name, 'lat': lat, 'lng': lng}
            for osm_id, name, lat, lng in rows[:PER_CATEGORY_LIMIT]
        ]
    return places, (wanted if failed else []), pending


# ---------- downloading ----------

def request_download(keys):
    """Starts downloading the squares no one else is already downloading. Returns True if a
    download was started (in a background thread, or finished already when
    PLACES_FETCH_IN_BACKGROUND is off, as in tests)."""
    if not keys:
        return False
    now = timezone.now()
    long_ago = now - timedelta(days=3650)
    PlaceTile.objects.bulk_create(
        [PlaceTile(key=k, requested_at=long_ago) for k in keys], ignore_conflicts=True
    )
    # Claim each square with a conditional update, so two visitors (or two server processes)
    # looking at the same area start only one download.
    claimed = [
        k for k in keys
        if PlaceTile.objects.filter(key=k, requested_at__lt=now - RETRY_AFTER).update(requested_at=now)
    ]
    if not claimed:
        return False
    if settings.PLACES_FETCH_IN_BACKGROUND:
        threading.Thread(target=_download_in_thread, args=(claimed,), daemon=True).start()
    else:
        download_tiles(claimed, raise_errors=False)
    return True


def _download_in_thread(keys):
    close_old_connections()
    try:
        download_tiles(keys, raise_errors=False)
    finally:
        connections.close_all()


def download_tiles(keys, raise_errors=True):
    """Downloads every category for the squares and replaces what was stored for them."""
    try:
        elements = _overpass(tile_bbox(keys))
    except PlacesError:
        PlaceTile.objects.filter(key__in=keys).update(failed_at=timezone.now())
        logger.warning('Nearby places download failed for %d squares', len(keys))
        if raise_errors:
            raise
        return 0

    wanted = set(keys)
    found = {}
    for el in elements:
        tags = el.get('tags', {})
        category = classify(tags)
        lat = el.get('lat', el.get('center', {}).get('lat'))
        lng = el.get('lon', el.get('center', {}).get('lon'))
        if category is None or lat is None or lng is None or tile_key(*tile_of(lat, lng)) not in wanted:
            continue
        osm_id = f"{el['type'][0]}{el['id']}"
        found[osm_id] = Place(
            osm_id=osm_id, category=category, lat=lat, lng=lng,
            name=(tags.get('name:en') or tags.get('name') or '')[:200],
        )

    bbox = tile_bbox(keys)
    with transaction.atomic():
        # Places in the downloaded squares are replaced (closed shops disappear). The union
        # box can be larger than the squares, so only rows that fall in them are removed.
        old = Place.objects.filter(lat__gte=bbox[0], lat__lt=bbox[2], lng__gte=bbox[1], lng__lt=bbox[3])
        old_ids = [pk for pk, lat, lng in old.values_list('pk', 'lat', 'lng') if tile_key(*tile_of(lat, lng)) in wanted]
        Place.objects.filter(pk__in=old_ids).delete()
        Place.objects.filter(osm_id__in=list(found)).delete()  # same place stored under another square
        Place.objects.bulk_create(found.values(), batch_size=500)
        PlaceTile.objects.filter(key__in=keys).update(fetched_at=timezone.now(), failed_at=None)
    return len(found)


def _overpass(bbox):
    """One Overpass request for every category in the box (the public server limits how
    often one address may query, so a single combined request is far faster)."""
    box = '({},{},{},{})'.format(*bbox)
    filters = ''.join(f'{q}{box};' for queries in CATEGORY_QUERIES.values() for q in queries)
    body = urllib.parse.urlencode({'data': f'[out:json][timeout:{QUERY_TIMEOUT}];({filters});out center tags;'}).encode()

    # Try each configured server; a busy one (429/504) gets one retry after a pause.
    attempts = [url for url in settings.OVERPASS_URLS for _ in range(2)]
    for i, url in enumerate(attempts):
        request = urllib.request.Request(
            url, data=body, headers={'User-Agent': settings.OVERPASS_USER_AGENT, 'Accept': 'application/json'}
        )
        try:
            with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
                return json.load(response).get('elements', [])
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 504) and i % 2 == 0:
                time.sleep(10)
        except (urllib.error.URLError, TimeoutError, ValueError, OSError):
            pass
    raise PlacesError('Overpass unavailable')
