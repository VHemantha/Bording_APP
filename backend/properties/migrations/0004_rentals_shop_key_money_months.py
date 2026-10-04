from django.core.validators import MaxValueValidator
from django.db import migrations, models


def key_money_to_months(apps, schema_editor):
    """Key money used to be an amount; it is now a number of months' rent (0-12)."""
    Property = apps.get_model('properties', 'Property')
    for listing in Property.objects.exclude(key_money=0).only('id', 'price', 'key_money'):
        months = round(listing.key_money / listing.price) if listing.price else 0
        listing.key_money_months = max(0, min(12, months))
        listing.save(update_fields=['key_money_months'])


def months_to_key_money(apps, schema_editor):
    Property = apps.get_model('properties', 'Property')
    for listing in Property.objects.exclude(key_money_months=0).only('id', 'price', 'key_money_months'):
        listing.key_money = listing.price * listing.key_money_months
        listing.save(update_fields=['key_money'])


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0003_listing_owner_contact_furnishing'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='key_money_months',
            field=models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(12)]),
        ),
        migrations.RunPython(key_money_to_months, months_to_key_money),
        migrations.RemoveField(model_name='property', name='key_money'),
        migrations.AlterField(
            model_name='property',
            name='status',
            field=models.CharField(
                choices=[('for_sale', 'For Sale'), ('for_rent', 'For Rent')], default='for_rent', max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='property',
            name='home_type',
            field=models.CharField(
                choices=[
                    ('house', 'House'), ('apartment', 'Apartment'), ('annex', 'Annex'), ('land', 'Land'),
                    ('upper_floor_house', 'Upper floor house'), ('shop', 'Shop'),
                ],
                default='house',
                max_length=20,
            ),
        ),
    ]
