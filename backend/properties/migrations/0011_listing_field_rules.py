"""Brings existing listings in line with the per-type field rules (Property.land_size_applies
and the land rules in PropertyWriteSerializer.validate):

- land size only for sale listings (except apartments and annexes) and for land for rent;
- bare land has no floor area, parking, furnishing or advance.
"""
from django.db import migrations


def apply_rules(apps, schema_editor):
    Property = apps.get_model('properties', 'Property')
    # Land size: drop it where it no longer applies.
    Property.objects.filter(home_type__in=['apartment', 'annex']).update(land_size=None)
    Property.objects.filter(status='for_rent').exclude(home_type='land').update(land_size=None)
    # Bare land.
    Property.objects.filter(home_type='land').update(
        sqft=None, parking_slots=0, furnishing='unfurnished', advance_amount=None,
        beds=0, baths=0, shared_bathroom=False, stories=None,
    )


class Migration(migrations.Migration):
    dependencies = [('properties', '0010_land_size')]

    operations = [migrations.RunPython(apply_rules, migrations.RunPython.noop)]
