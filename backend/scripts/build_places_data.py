"""Builds properties/data/places_lk.json.gz, the bundled "Nearby places" for all of Sri Lanka.

The app loads that file into its database on deploy (`manage.py load_places`), so the map
never depends on the public Overpass service being up. Re-run this now and then to pick up
new shops and schools, then commit the file:

    pip install osmium            # in any Python environment, not the app's
    curl -L -o sri-lanka.osm.pbf https://download.geofabrik.de/asia/sri-lanka-latest.osm.pbf
    python scripts/build_places_data.py sri-lanka.osm.pbf

Run it from the backend folder.
"""
import gzip
import json
import os
import sys
from datetime import date

import osmium

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'properties'))
from osm_categories import classify  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'properties', 'data', 'places_lk.json.gz')


class Collector(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.places = {}

    def add(self, osm_id, tags, lat, lng):
        tags = {t.k: t.v for t in tags}
        category = classify(tags)
        if category:
            name = (tags.get('name:en') or tags.get('name') or '')[:200]
            self.places[osm_id] = [osm_id, category, name, round(lat, 6), round(lng, 6)]

    def node(self, n):
        if n.tags and n.location.valid():
            self.add(f'n{n.id}', n.tags, n.location.lat, n.location.lon)

    def way(self, w):
        # The middle of the way's bounding box, like Overpass's `out center`.
        if not w.tags:
            return
        lats = [nd.lat for nd in w.nodes if nd.location.valid()]
        lngs = [nd.lon for nd in w.nodes if nd.location.valid()]
        if lats:
            self.add(f'w{w.id}', w.tags, (min(lats) + max(lats)) / 2, (min(lngs) + max(lngs)) / 2)

    def area(self, a):
        # Multipolygon relations (closed ways are already handled above).
        if a.from_way():
            return
        lats, lngs = [], []
        for ring in a.outer_rings():
            for nd in ring:
                lats.append(nd.lat)
                lngs.append(nd.lon)
        if lats:
            self.add(f'r{a.orig_id()}', a.tags, (min(lats) + max(lats)) / 2, (min(lngs) + max(lngs)) / 2)


def main(pbf):
    collector = Collector()
    collector.apply_file(pbf, locations=True)
    places = sorted(collector.places.values())
    data = {'built': date.today().isoformat(), 'places': places}
    with gzip.open(OUT, 'wt', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    counts = {}
    for p in places:
        counts[p[1]] = counts.get(p[1], 0) + 1
    print(f'{len(places)} places -> {os.path.normpath(OUT)}', counts)


if __name__ == '__main__':
    main(sys.argv[1])
