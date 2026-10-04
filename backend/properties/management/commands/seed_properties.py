import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from properties.models import Property, PropertyImage

# Same city names as the home page's city grid (frontend/src/i18n/translations.js), so every
# tile there finds listings. `state` is the two-letter province code; `zips` are postal codes.
CITIES = [
    {'city': 'Colombo', 'state': 'WP', 'lat': 6.9271, 'lng': 79.8612, 'zips': ['00100']},
    {'city': 'Kesbewa', 'state': 'WP', 'lat': 6.7957, 'lng': 79.9408, 'zips': ['10240']},
    {'city': 'Mount Lavinia', 'state': 'WP', 'lat': 6.8317, 'lng': 79.8628, 'zips': ['10370']},
    {'city': 'Maharagama', 'state': 'WP', 'lat': 6.8473, 'lng': 79.9266, 'zips': ['10280']},
    {'city': 'Gampaha', 'state': 'WP', 'lat': 7.0917, 'lng': 79.9999, 'zips': ['11000']},
    {'city': 'Moratuwa', 'state': 'WP', 'lat': 6.7747, 'lng': 79.8826, 'zips': ['10400']},
    {'city': 'Ratnapura', 'state': 'SG', 'lat': 6.6828, 'lng': 80.3992, 'zips': ['70000']},
    {'city': 'Negombo', 'state': 'WP', 'lat': 7.2094, 'lng': 79.8331, 'zips': ['11500']},
    {'city': 'Kandy', 'state': 'CP', 'lat': 7.2931, 'lng': 80.635, 'zips': ['20000']},
    {'city': 'Sri Jayewardenepura Kotte', 'state': 'WP', 'lat': 6.8883, 'lng': 79.9187, 'zips': ['10100']},
    {'city': 'Mawanella', 'state': 'SG', 'lat': 7.2523, 'lng': 80.446, 'zips': ['71500']},
    {'city': 'Kotmale', 'state': 'CP', 'lat': 7.0608, 'lng': 80.5969, 'zips': ['20560']},
    {'city': 'Kilinochchi', 'state': 'NP', 'lat': 9.384, 'lng': 80.4087, 'zips': ['44000']},
    {'city': 'Hikkaduwa', 'state': 'SP', 'lat': 6.1408, 'lng': 80.1028, 'zips': ['80240']},
    {'city': 'Trincomalee', 'state': 'EP', 'lat': 8.5764, 'lng': 81.2345, 'zips': ['31000']},
    {'city': 'Batticaloa', 'state': 'EP', 'lat': 7.731, 'lng': 81.6747, 'zips': ['30000']},
    {'city': 'Galle', 'state': 'SP', 'lat': 6.0328, 'lng': 80.215, 'zips': ['80000']},
    {'city': 'Kalmunai', 'state': 'EP', 'lat': 7.4132, 'lng': 81.8269, 'zips': ['32300']},
    {'city': 'Jaffna', 'state': 'NP', 'lat': 9.6651, 'lng': 80.0093, 'zips': ['40000']},
    {'city': 'Vavuniya', 'state': 'NP', 'lat': 8.7594, 'lng': 80.5001, 'zips': ['43000']},
    {'city': 'Weligama', 'state': 'SP', 'lat': 5.9751, 'lng': 80.4291, 'zips': ['81700']},
    {'city': 'Tangalla', 'state': 'SP', 'lat': 6.0243, 'lng': 80.7941, 'zips': ['82200']},
    {'city': 'Matara', 'state': 'SP', 'lat': 5.9478, 'lng': 80.5483, 'zips': ['81000']},
    {'city': 'Kalpitiya', 'state': 'NW', 'lat': 8.2368, 'lng': 79.7662, 'zips': ['61360']},
    {'city': 'Kolonnawa', 'state': 'WP', 'lat': 6.9326, 'lng': 79.8903, 'zips': ['10600']},
    {'city': 'Akurana', 'state': 'CP', 'lat': 7.3603, 'lng': 80.6006, 'zips': ['20850']},
    {'city': 'Anuradhapura', 'state': 'NC', 'lat': 8.335, 'lng': 80.4106, 'zips': ['50000']},
    {'city': 'Puttalam', 'state': 'NW', 'lat': 8.0362, 'lng': 79.8283, 'zips': ['61300']},
    {'city': 'Badulla', 'state': 'UP', 'lat': 6.99, 'lng': 81.057, 'zips': ['90000']},
    {'city': 'Mullaittivu', 'state': 'NP', 'lat': 9.2671, 'lng': 80.8142, 'zips': ['42000']},
    {'city': 'Kalutara', 'state': 'WP', 'lat': 6.5854, 'lng': 79.9607, 'zips': ['12000']},
    {'city': 'Bentota', 'state': 'SP', 'lat': 6.4215, 'lng': 79.9979, 'zips': ['80500']},
    {'city': 'Matale', 'state': 'CP', 'lat': 7.4675, 'lng': 80.6234, 'zips': ['21000']},
    {'city': 'Mannar', 'state': 'NP', 'lat': 8.9813, 'lng': 79.9044, 'zips': ['41000']},
    {'city': 'Bandarawela', 'state': 'UP', 'lat': 6.8305, 'lng': 80.9888, 'zips': ['90100']},
    {'city': 'Point Pedro', 'state': 'NP', 'lat': 9.8241, 'lng': 80.2362, 'zips': ['40400']},
    {'city': 'Kurunegala', 'state': 'NW', 'lat': 7.487, 'lng': 80.3649, 'zips': ['60000']},
    {'city': 'Mabole', 'state': 'WP', 'lat': 7.0049, 'lng': 79.8969, 'zips': ['11104']},
    {'city': 'Gampola', 'state': 'CP', 'lat': 7.1636, 'lng': 80.5703, 'zips': ['20500']},
    {'city': 'Nuwara Eliya', 'state': 'CP', 'lat': 6.9497, 'lng': 80.7891, 'zips': ['22200']},
    {'city': 'Galhinna', 'state': 'CP', 'lat': 7.4184, 'lng': 80.5633, 'zips': ['20112']},
    {'city': 'Kegalle', 'state': 'SG', 'lat': 7.2513, 'lng': 80.3464, 'zips': ['71000']},
    {'city': 'Hatton', 'state': 'CP', 'lat': 6.8916, 'lng': 80.5985, 'zips': ['22000']},
    {'city': 'Gandara West', 'state': 'SP', 'lat': 5.9377, 'lng': 80.6134, 'zips': ['81170']},
    {'city': 'Hambantota', 'state': 'SP', 'lat': 6.1249, 'lng': 81.1243, 'zips': ['82000']},
    {'city': 'Abasingammedda', 'state': 'CP', 'lat': 7.317, 'lng': 80.667, 'zips': ['20000']},
    {'city': 'Monaragala', 'state': 'UP', 'lat': 6.8727, 'lng': 81.3506, 'zips': ['91000']},
    {'city': 'Polikandi', 'state': 'NP', 'lat': 9.8162, 'lng': 80.1859, 'zips': ['40520']},
    {'city': 'Athurugiriya', 'state': 'WP', 'lat': 6.878, 'lng': 79.99, 'zips': ['10150']},
    {'city': 'Mirissa South', 'state': 'SP', 'lat': 5.9494, 'lng': 80.4558, 'zips': ['81740']},
    {'city': 'Oruwala', 'state': 'WP', 'lat': 6.8919, 'lng': 79.9955, 'zips': ['10150']},
    {'city': 'Yakkala', 'state': 'WP', 'lat': 7.0859, 'lng': 80.0336, 'zips': ['11870']},
    {'city': 'Nittambuwa', 'state': 'WP', 'lat': 7.1441, 'lng': 80.0965, 'zips': ['11880']},
    {'city': 'Wathupitiwala', 'state': 'WP', 'lat': 7.1256, 'lng': 80.111, 'zips': ['11054']},
]

STREET_NAMES = [
    'Temple', 'Lake', 'Station', 'Hill', 'Park', 'Church', 'Beach', 'Garden',
    'Flower', 'Palm', 'Jasmine', 'Lotus', 'River', 'School', 'Market', 'Main',
    'Cinnamon', 'Coconut Grove', 'Araliya', 'Sea View',
]
STREET_TYPES = ['Rd', 'Mawatha', 'Lane', 'Place', 'Avenue', 'Gardens']
CONTACT_NAMES = ['Nimal Perera', 'Kamala Silva', 'Ruwan Fernando', 'Fathima Rizwan', 'Suresh Kumar', 'Dilani Jayawardena']

HOME_TYPES = [c[0] for c in Property.HomeType.choices]

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
            status = Property.Status.FOR_RENT  # the site lists rentals only

            beds = random.randint(1, 5)
            baths = random.choice([1, 1.5, 2, 2.5, 3, 3.5])
            sqft = random.randint(600, 4200)
            stories = random.choice([1, 1, 2, 2, 3])
            parking_slots = random.choice([0, 1, 1, 2, 3])
            if home_type == Property.HomeType.LAND:
                # Bare land: nothing built on it yet.
                beds, baths, stories = 0, 0, None

            # Monthly rent in LKR, rounded to the nearest 500.
            price = round(sqft * random.uniform(25, 80) / 500) * 500
            # Rentals usually ask for some months of rent up front; sales don't.
            key_money_months = random.choice([0, 0, 1, 2, 3, 6, 6, 10, 12])

            lat = city_info['lat'] + random.uniform(-0.012, 0.012)
            lng = city_info['lng'] + random.uniform(-0.012, 0.012)

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
                key_money_months=key_money_months,
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
