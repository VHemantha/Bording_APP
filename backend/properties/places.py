"""Nearby places (schools, supermarkets, hospitals, ...) for the map's "Nearby places" menu.

Data comes from OpenStreetMap through the public Overpass API, which is free and needs no
key. Requests go through this server rather than straight from browsers so that results
are cached (the same map area is asked for over and over) and the shared public service
isn't hit once per visitor.
"""
import hashlib
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.cache import cache

# One Overpass filter per category. `classify` below must agree with these.
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

# Bigger areas would return thousands of points and a slow query: the map asks the user to
# zoom in instead (about 25 km across).
MAX_SPAN_DEGREES = 0.25
PER_CATEGORY_LIMIT = 80
CACHE_SECONDS = 24 * 60 * 60
GRID = 0.02  # areas are snapped outwards to this grid so nearby views share a cache entry


class PlacesError(Exception):
    pass


def classify(tags):
    name = f"{tags.get('name', '')} {tags.get('brand', '')}".lower()
    if tags.get('shop') == 'supermarket':
        if 'keells' in name:
            return 'keells'
        if 'cargills' in name or 'food city' in name or 'foodcity' in name:
            return 'foodcity'
        return None
    if tags.get('amenity') in ('school', 'college'):
        return 'school'
    if tags.get('tourism') == 'hotel':
        return 'hotel'
    if tags.get('amenity') == 'hospital':
        return 'hospital'
    if tags.get('leisure') == 'fitness_centre' or tags.get('amenity') == 'gym':
        return 'gym'
    if tags.get('amenity') == 'restaurant':
        return 'restaurant'
    if tags.get('shop') in ('hairdresser', 'beauty'):
        return 'salon'
    return None


def snap_bbox(south, west, north, east):
    """Rounds the box outwards to the cache grid."""
    down = lambda v: math.floor(v / GRID) * GRID  # noqa: E731
    up = lambda v: math.ceil(v / GRID) * GRID  # noqa: E731
    return round(down(south), 4), round(down(west), 4), round(up(north), 4), round(up(east), 4)


def nearby_places(categories, south, west, north, east):
    """Returns (places, unavailable): [{id, category, name, lat, lng}] for the requested
    categories in the box, plus the categories that couldn't be fetched right now."""
    if north - south > MAX_SPAN_DEGREES or east - west > MAX_SPAN_DEGREES:
        raise ValueError('area too large')
    bbox = snap_bbox(south, west, north, east)
    wanted = sorted(set(categories))

    # Cached per category, so ticking one more category only fetches that one.
    keys = {cat: 'places:' + hashlib.sha1(json.dumps([cat, bbox]).encode()).hexdigest() for cat in wanted}
    found = {cat: cache.get(key) for cat, key in keys.items()}
    missing = [cat for cat in wanted if found[cat] is None]
    unavailable = []
    if missing:
        try:
            fetched = _fetch(missing, bbox)
        except PlacesError:
            unavailable = missing
        else:
            for cat in missing:
                found[cat] = fetched.get(cat, [])
                cache.set(keys[cat], found[cat], CACHE_SECONDS)
    places = [place for cat in wanted if found[cat] for place in found[cat]]
    return places, unavailable


def _fetch(categories, bbox):
    """One Overpass request for all the categories. The public server limits how often one
    address may query, so a single combined request is far faster than one per category.
    Each category is its own output set with its own limit, so a busy category
    (restaurants) can't crowd out a rare one (Keells)."""
    box = '({},{},{},{})'.format(*bbox)
    sets = ''.join(
        f'({"".join(f"{q}{box};" for q in CATEGORY_QUERIES[cat])})->.s{i};.s{i} out center tags {PER_CATEGORY_LIMIT};'
        for i, cat in enumerate(categories)
    )
    body = urllib.parse.urlencode({'data': f'[out:json][timeout:25];{sets}'}).encode()

    elements = None
    # Try each configured server; a busy one (429/504) gets one retry after a short pause.
    attempts = [url for url in settings.OVERPASS_URLS for _ in range(2)]
    for i, url in enumerate(attempts):
        request = urllib.request.Request(
            url, data=body, headers={'User-Agent': settings.OVERPASS_USER_AGENT, 'Accept': 'application/json'}
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                elements = json.load(response).get('elements', [])
            break
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 504) and i % 2 == 0:
                time.sleep(3)
        except (urllib.error.URLError, TimeoutError, ValueError):
            pass
    if elements is None:
        raise PlacesError(', '.join(categories))

    grouped, seen = {}, set()
    for el in elements:
        tags = el.get('tags', {})
        category = classify(tags)
        lat = el.get('lat', el.get('center', {}).get('lat'))
        lng = el.get('lon', el.get('center', {}).get('lon'))
        place_id = f"{el['type'][0]}{el['id']}"
        if category not in categories or lat is None or lng is None or place_id in seen:
            continue
        seen.add(place_id)
        grouped.setdefault(category, []).append({
            'id': place_id,
            'category': category,
            'name': tags.get('name:en') or tags.get('name') or '',
            'lat': lat,
            'lng': lng,
        })
    return grouped
