import time

from django.core.management.base import BaseCommand
from django.utils import timezone

from properties.models import PlaceTile
from properties.places import REFRESH_AFTER, PlacesError, download_tiles, tile_key, tile_of

from .seed_properties import CITIES


class Command(BaseCommand):
    help = (
        "Downloads the map's nearby places around every city ahead of time, so visitors find "
        'them already stored. Slow (the public Overpass service takes ~30 s per city), so run '
        'it in the background: docker compose exec -d web python manage.py warm_places'
    )

    def add_arguments(self, parser):
        parser.add_argument('--radius', type=int, default=1, help='grid squares around each city centre (1 = 3x3)')
        parser.add_argument('--pause', type=float, default=5, help='seconds between requests, to be polite')
        parser.add_argument('--force', action='store_true', help='re-download squares that are already stored')

    def handle(self, radius, pause, force, **options):
        done = failed = 0
        for i, city in enumerate(CITIES, 1):
            row, col = tile_of(city['lat'], city['lng'])
            keys = [tile_key(row + dr, col + dc) for dr in range(-radius, radius + 1) for dc in range(-radius, radius + 1)]
            if not force:
                fresh = set(
                    PlaceTile.objects.filter(key__in=keys, fetched_at__gte=timezone.now() - REFRESH_AFTER)
                    .values_list('key', flat=True)
                )
                keys = [k for k in keys if k not in fresh]
            if not keys:
                self.stdout.write(f'[{i}/{len(CITIES)}] {city["city"]}: already stored')
                continue

            PlaceTile.objects.bulk_create(
                [PlaceTile(key=k, requested_at=timezone.now()) for k in keys], ignore_conflicts=True
            )
            # One retry after a longer pause: the public service often turns away a busy client.
            for attempt in range(2):
                try:
                    count = download_tiles(keys)
                except PlacesError:
                    if attempt == 0:
                        time.sleep(pause * 6)
                        continue
                    failed += 1
                    self.stdout.write(self.style.WARNING(f'[{i}/{len(CITIES)}] {city["city"]}: failed, try again later'))
                else:
                    done += 1
                    self.stdout.write(f'[{i}/{len(CITIES)}] {city["city"]}: {count} places')
                break
            time.sleep(pause)

        self.stdout.write(self.style.SUCCESS(f'Done: {done} cities downloaded, {failed} failed.'))
