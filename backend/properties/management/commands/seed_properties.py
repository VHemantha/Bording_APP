import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from properties.models import Property, PropertyImage

# Same city names as the home page's city grid (frontend/src/i18n/translations.js), so every
# tile there finds listings. `state` is the two-letter province code; `zips` are postal codes.
# Coastal cities are centred slightly inland so the randomised pins stay on land.
CITIES = [
    {'city': 'Colombo', 'state': 'WP', 'lat': 6.9271, 'lng': 79.8780, 'zips': ['00100', '00300', '00500', '00700']},
    {'city': 'Kandy', 'state': 'CP', 'lat': 7.2906, 'lng': 80.6337, 'zips': ['20000']},
    {'city': 'Galle', 'state': 'SP', 'lat': 6.0735, 'lng': 80.2210, 'zips': ['80000']},
    {'city': 'Jaffna', 'state': 'NP', 'lat': 9.6615, 'lng': 80.0255, 'zips': ['40000']},
    {'city': 'Negombo', 'state': 'WP', 'lat': 7.2083, 'lng': 79.8558, 'zips': ['11500']},
    {'city': 'Anuradhapura', 'state': 'NC', 'lat': 8.3114, 'lng': 80.4037, 'zips': ['50000']},
    {'city': 'Trincomalee', 'state': 'EP', 'lat': 8.5874, 'lng': 81.1952, 'zips': ['31000']},
    {'city': 'Batticaloa', 'state': 'EP', 'lat': 7.7310, 'lng': 81.6547, 'zips': ['30000']},
    {'city': 'Matara', 'state': 'SP', 'lat': 5.9749, 'lng': 80.5550, 'zips': ['81000']},
    {'city': 'Kurunegala', 'state': 'NW', 'lat': 7.4863, 'lng': 80.3647, 'zips': ['60000']},
    {'city': 'Ratnapura', 'state': 'SG', 'lat': 6.6828, 'lng': 80.3992, 'zips': ['70000']},
    {'city': 'Badulla', 'state': 'UP', 'lat': 6.9934, 'lng': 81.0550, 'zips': ['90000']},
    {'city': 'Nuwara Eliya', 'state': 'CP', 'lat': 6.9497, 'lng': 80.7891, 'zips': ['22200']},
    {'city': 'Gampaha', 'state': 'WP', 'lat': 7.0840, 'lng': 79.9939, 'zips': ['11000']},
    {'city': 'Kalutara', 'state': 'WP', 'lat': 6.5854, 'lng': 79.9807, 'zips': ['12000']},
    {'city': 'Moratuwa', 'state': 'WP', 'lat': 6.7730, 'lng': 79.9016, 'zips': ['10400']},
    {'city': 'Dehiwala-Mount Lavinia', 'state': 'WP', 'lat': 6.8409, 'lng': 79.8850, 'zips': ['10350', '10370']},
    {'city': 'Sri Jayawardenepura Kotte', 'state': 'WP', 'lat': 6.8868, 'lng': 79.9187, 'zips': ['10100']},
    {'city': 'Vavuniya', 'state': 'NP', 'lat': 8.7514, 'lng': 80.4971, 'zips': ['43000']},
    {'city': 'Hambantota', 'state': 'SP', 'lat': 6.1441, 'lng': 81.1185, 'zips': ['82000']},
]

STREET_NAMES = [
    'Temple', 'Lake', 'Station', 'Hill', 'Park', 'Church', 'Beach', 'Garden',
    'Flower', 'Palm', 'Jasmine', 'Lotus', 'River', 'School', 'Market', 'Main',
    'Cinnamon', 'Coconut Grove', 'Araliya', 'Sea View',
]
STREET_TYPES = ['Rd', 'Mawatha', 'Lane', 'Place', 'Avenue', 'Gardens']
CONTACT_NAMES = ['Nimal Perera', 'Kamala Silva', 'Ruwan Fernando', 'Fathima Rizwan', 'Suresh Kumar', 'Dilani Jayawardena']

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
            status = random.choices(STATUSES, weights=[0.4, 0.6])[0]

            beds = random.randint(1, 5)
            baths = random.choice([1, 1.5, 2, 2.5, 3, 3.5])
            sqft = random.randint(600, 4200)
            stories = random.choice([1, 1, 2, 2, 3])
            parking_slots = random.choice([0, 1, 1, 2, 3])
            if home_type == Property.HomeType.LAND:
                # Bare land: nothing built on it yet.
                beds, baths, stories = 0, 0, None

            base_price_per_sqft = random.uniform(180, 420)
            price = int(sqft * base_price_per_sqft)
            if status == Property.Status.FOR_RENT:
                price = int(price / 180)  # rough monthly rent estimate
            # Rentals usually ask for some months of rent up front; sales don't.
            key_money = price * random.choice([0, 3, 6, 12]) if status == Property.Status.FOR_RENT else 0

            lat = city_info['lat'] + random.uniform(-0.018, 0.018)
            lng = city_info['lng'] + random.uniform(-0.018, 0.018)

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
                key_money=key_money,
                parking_slots=parking_slots,
                stories=stories,
                furnishing=random.choice(['furnished', 'unfurnished']),
                contact_name=random.choice(CONTACT_NAMES),
                contact_phone=f'+94 7{random.randint(0, 8)} {random.randint(100, 999)} {random.randint(1000, 9999)}',
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
