import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from properties.models import Property, PropertyImage

CITIES = [
    {'city': 'Austin', 'state': 'TX', 'lat': 30.2672, 'lng': -97.7431, 'zips': ['78701', '78704', '78745', '78749']},
    {'city': 'Seattle', 'state': 'WA', 'lat': 47.6062, 'lng': -122.3321, 'zips': ['98101', '98107', '98115', '98122']},
    {'city': 'Denver', 'state': 'CO', 'lat': 39.7392, 'lng': -104.9903, 'zips': ['80202', '80206', '80210', '80218']},
    {'city': 'Raleigh', 'state': 'NC', 'lat': 35.7796, 'lng': -78.6382, 'zips': ['27601', '27605', '27609', '27612']},
]

STREET_NAMES = [
    'Maple', 'Oak', 'Cedar', 'Elm', 'Birch', 'Willow', 'Pine', 'Sunset',
    'Highland', 'Lakeview', 'Meadow', 'River', 'Hillcrest', 'Magnolia',
    'Spruce', 'Aspen', 'Canyon', 'Prairie', 'Orchard', 'Ridge',
]
STREET_TYPES = ['St', 'Ave', 'Dr', 'Ln', 'Ct', 'Blvd', 'Way', 'Rd']

HOME_TYPES = [c[0] for c in Property.HomeType.choices]
STATUSES = [c[0] for c in Property.Status.choices]

DESCRIPTIONS = [
    'Beautifully updated home featuring an open-concept layout, natural light throughout, and a spacious backyard perfect for entertaining.',
    'Charming property in a highly sought-after neighborhood, close to parks, schools, and local shops.',
    'Modern finishes throughout including quartz countertops, stainless steel appliances, and hardwood floors.',
    'Move-in ready with a newly renovated kitchen, updated bathrooms, and a two-car garage.',
    'Spacious floor plan with vaulted ceilings, a cozy fireplace, and a private outdoor patio.',
    'Bright and airy with large windows, a finished basement, and a fenced-in yard.',
    'Quiet cul-de-sac location with mature trees, updated HVAC, and a newer roof.',
    'Stylish urban living with rooftop access, in-unit laundry, and walkable access to restaurants and transit.',
]


class Command(BaseCommand):
    help = 'Seeds the database with mock property listings across several cities.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=100, help='Number of properties to generate')
        parser.add_argument('--clear', action='store_true', help='Delete existing properties first')

    def handle(self, *args, **options):
        count = options['count']
        if options['clear']:
            deleted, _ = Property.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing records.'))

        created = 0
        for i in range(count):
            city_info = random.choice(CITIES)
            home_type = random.choice(HOME_TYPES)
            status = random.choices(STATUSES, weights=[0.8, 0.2])[0]

            beds = random.randint(1, 5)
            baths = random.choice([1, 1.5, 2, 2.5, 3, 3.5])
            sqft = random.randint(600, 4200)

            base_price_per_sqft = random.uniform(180, 420)
            price = int(sqft * base_price_per_sqft)
            if status == Property.Status.FOR_RENT:
                price = int(price / 180)  # rough monthly rent estimate

            lat = city_info['lat'] + random.uniform(-0.08, 0.08)
            lng = city_info['lng'] + random.uniform(-0.08, 0.08)

            street_number = random.randint(100, 9999)
            street_name = random.choice(STREET_NAMES)
            street_type = random.choice(STREET_TYPES)
            address = f'{street_number} {street_name} {street_type}'

            image_seed = f'property-{i}'
            primary_image_url = f'https://picsum.photos/seed/{image_seed}/800/600'

            listed_days_ago = random.randint(0, 120)

            prop = Property.objects.create(
                address=address,
                city=city_info['city'],
                state=city_info['state'],
                zip_code=random.choice(city_info['zips']),
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                price=price,
                beds=beds,
                baths=baths,
                sqft=sqft,
                home_type=home_type,
                status=status,
                description=random.choice(DESCRIPTIONS),
                year_built=random.randint(1950, 2024),
                primary_image_url=primary_image_url,
                listed_date=date.today() - timedelta(days=listed_days_ago),
            )

            num_images = random.randint(4, 8)
            images = [
                PropertyImage(
                    property=prop,
                    image_url=f'https://picsum.photos/seed/{image_seed}-{j}/800/600',
                    ordering=j,
                )
                for j in range(num_images)
            ]
            PropertyImage.objects.bulk_create(images)

            created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} properties.'))
