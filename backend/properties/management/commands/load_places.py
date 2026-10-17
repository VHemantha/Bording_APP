import gzip
import json
import os
from datetime import datetime, time

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from properties.models import Place, PlaceTile
from properties.places import tiles_for

BUNDLE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'places_lk.json.gz')
# Grid squares the bundle covers (all of Sri Lanka). They count as downloaded, so the map
# never waits on the public Overpass service anywhere in the country.
SRI_LANKA = (5.85, 79.5, 9.9, 81.95)


class Command(BaseCommand):
    help = (
        "Loads the bundled nearby places for Sri Lanka (properties/data/places_lk.json.gz, "
        'built by scripts/build_places_data.py) into the database. Runs on every deploy.'
    )

    def handle(self, **options):
        with gzip.open(BUNDLE, 'rt', encoding='utf-8') as f:
            data = json.load(f)
        built = timezone.make_aware(datetime.combine(datetime.fromisoformat(data['built']).date(), time()))
        places = [
            Place(osm_id=osm_id, category=category, name=name, lat=lat, lng=lng)
            for osm_id, category, name, lat, lng in data['places']
        ]
        keys = tiles_for(*SRI_LANKA)

        with transaction.atomic():
            # Replaces everything inside Sri Lanka, including squares re-downloaded live since
            # the last deploy: the bundle is the reference copy.
            south, west, north, east = SRI_LANKA
            Place.objects.filter(lat__gte=south, lat__lte=north, lng__gte=west, lng__lte=east).delete()
            Place.objects.filter(osm_id__in=[p.osm_id for p in places]).delete()
            Place.objects.bulk_create(places, batch_size=1000)
            PlaceTile.objects.bulk_create(
                [PlaceTile(key=k, fetched_at=built, requested_at=built) for k in keys],
                batch_size=1000,
                update_conflicts=True,
                unique_fields=['key'],
                update_fields=['fetched_at', 'requested_at', 'failed_at'],
            )
        self.stdout.write(f'Loaded {len(places)} nearby places (data from {data["built"]}).')
