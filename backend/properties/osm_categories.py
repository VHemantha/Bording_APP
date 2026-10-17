"""Which "Nearby places" category an OpenStreetMap feature belongs to, from its tags.

No Django imports, so scripts/build_places_data.py can use it outside the app. Must agree
with CATEGORY_QUERIES in places.py.
"""


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
