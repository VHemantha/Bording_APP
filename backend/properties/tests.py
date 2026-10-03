import shutil
import tempfile
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import Inquiry, Property

User = get_user_model()

TEMP_MEDIA = tempfile.mkdtemp()


def listing_payload(**overrides):
    data = {
        'address': '12 Temple Rd', 'city': 'Colombo', 'latitude': 6.9, 'longitude': 79.86,
        'price': 50000, 'beds': 2, 'baths': 1, 'sqft': 900, 'home_type': 'annex',
        'status': 'for_rent', 'key_money': 300000, 'parking_slots': 1, 'stories': 1,
        'furnishing': 'furnished', 'description': 'Quiet annex near the station.',
        'primary_image_url': 'https://example.com/a.jpg', 'images': ['https://example.com/a.jpg'],
        'contact_name': 'Nimal', 'contact_phone': '+94 77 123 4567',
    }
    data.update(overrides)
    return data


def photo_file(fmt='PNG', name='photo.png', exif_gps=False):
    buf = BytesIO()
    img = Image.new('RGBA' if fmt == 'PNG' else 'RGB', (3000, 1500), 'red')
    kwargs = {}
    if exif_gps:
        exif = Image.Exif()
        exif[0x8825] = {1: 'N', 2: (6.0, 55.0, 0.0)}  # GPSInfo
        kwargs['exif'] = exif
    img.save(buf, fmt, **kwargs)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=f'image/{fmt.lower()}')


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ListingOwnershipTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def setUp(self):
        self.owner = User.objects.create_user('owner', 'owner@example.com', 'pw-123456')
        self.other = User.objects.create_user('other', 'other@example.com', 'pw-123456')
        self.admin = User.objects.create_user('boss', 'boss@example.com', 'pw-123456', is_staff=True)

    def create_listing(self, user=None, **overrides):
        self.client.force_authenticate(user or self.owner)
        response = self.client.post('/api/properties/', listing_payload(**overrides), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.client.force_authenticate(None)
        return response.data

    def test_anonymous_cannot_post(self):
        response = self.client.post('/api/properties/', listing_payload(), format='json')
        self.assertEqual(response.status_code, 401)

    def test_signed_in_user_posts_and_becomes_owner(self):
        data = self.create_listing()
        listing = Property.objects.get(pk=data['id'])
        self.assertEqual(listing.owner, self.owner)
        self.assertEqual(listing.furnishing, 'furnished')
        self.assertEqual(listing.contact_phone, '+94 77 123 4567')
        self.assertIsNotNone(listing.listed_date)  # defaulted, not required from the form

    def test_only_owner_or_admin_can_edit_and_delete(self):
        pk = self.create_listing()['id']
        url = f'/api/properties/{pk}/'

        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.patch(url, {'price': 1}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)

        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.patch(url, {'price': 45000}, format='json').status_code, 200)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(url, {'price': 46000}, format='json').status_code, 200)

        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Property.objects.filter(pk=pk).exists())

    def test_detail_reports_can_edit_for_owner_only(self):
        pk = self.create_listing()['id']
        self.assertFalse(self.client.get(f'/api/properties/{pk}/').data['can_edit'])
        self.client.force_authenticate(self.other)
        self.assertFalse(self.client.get(f'/api/properties/{pk}/').data['can_edit'])
        self.client.force_authenticate(self.owner)
        self.assertTrue(self.client.get(f'/api/properties/{pk}/').data['can_edit'])

    def test_mine_lists_only_own_listings(self):
        mine = self.create_listing()['id']
        self.create_listing(user=self.other)
        self.client.force_authenticate(self.owner)
        ids = [item['id'] for item in self.client.get('/api/properties/mine/').data]
        self.assertEqual(ids, [mine])

    def test_furnishing_filter(self):
        self.create_listing(furnishing='furnished')
        self.create_listing(furnishing='unfurnished')
        self.assertEqual(len(self.client.get('/api/properties/?furnishing=furnished').data), 1)
        self.assertEqual(len(self.client.get('/api/properties/?furnishing=furnished,unfurnished').data), 2)

    def test_rejects_non_photo_references(self):
        self.client.force_authenticate(self.owner)
        for bad in ['javascript:alert(1)', '/media/../settings.py', '/etc/passwd']:
            response = self.client.post('/api/properties/', listing_payload(primary_image_url=bad), format='json')
            self.assertEqual(response.status_code, 400, bad)

    def test_rejects_bad_phone(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post('/api/properties/', listing_payload(contact_phone='call me'), format='json')
        self.assertEqual(response.status_code, 400)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class PhotoUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('poster', 'p@example.com', 'pw-123456')

    def upload(self, file):
        return self.client.post('/api/properties/upload-photo/', {'photo': file}, format='multipart')

    def test_requires_sign_in(self):
        self.assertEqual(self.upload(photo_file()).status_code, 401)

    def test_photo_is_reencoded_resized_and_stripped(self):
        self.client.force_authenticate(self.user)
        response = self.upload(photo_file('JPEG', 'p.jpg', exif_gps=True))
        self.assertEqual(response.status_code, 201, response.data)
        url = response.data['url']
        self.assertTrue(url.startswith('/media/listings/') and url.endswith('.jpg'))

        with Image.open(f'{TEMP_MEDIA}/{url[len("/media/"):]}') as saved:
            self.assertEqual(saved.format, 'JPEG')
            self.assertLessEqual(max(saved.size), 2000)
            self.assertNotIn(0x8825, saved.getexif())  # no GPS data

    def test_png_with_transparency_is_accepted(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.upload(photo_file('PNG')).status_code, 201)

    def test_rejects_non_images(self):
        self.client.force_authenticate(self.user)
        fake = SimpleUploadedFile('evil.jpg', b'<script>alert(1)</script>', content_type='image/jpeg')
        self.assertEqual(self.upload(fake).status_code, 400)

    def test_uploaded_photo_deleted_with_listing(self):
        self.client.force_authenticate(self.user)
        url = self.upload(photo_file()).data['url']
        created = self.client.post(
            '/api/properties/', listing_payload(primary_image_url=url, images=[url]), format='json'
        )
        self.assertEqual(created.status_code, 201, created.data)
        path = f'{TEMP_MEDIA}/{url[len("/media/"):]}'
        with self.captureOnCommitCallbacks(execute=True):
            self.client.delete(f'/api/properties/{created.data["id"]}/')
        import os
        self.assertFalse(os.path.exists(path))


class InquiryTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user('owner', 'o@example.com', 'pw-123456')
        self.listing = Property.objects.create(
            owner=self.owner, address='1 Lake Rd', city='Kandy', latitude=7.29, longitude=80.63,
            price=40000, beds=1, baths=1, sqft=500, primary_image_url='https://example.com/x.jpg',
        )
        self.url = f'/api/properties/{self.listing.pk}/inquiries/'

    def test_visitor_can_message_owner(self):
        response = self.client.post(self.url, {'name': 'Kamala', 'phone': '0771234567', 'message': 'Is it available?'})
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Inquiry.objects.get().property, self.listing)

    def test_needs_a_way_to_reply(self):
        response = self.client.post(self.url, {'name': 'Kamala', 'message': 'Hi'})
        self.assertEqual(response.status_code, 400)

    def test_only_owner_reads_messages(self):
        self.client.post(self.url, {'name': 'Kamala', 'email': 'k@example.com', 'message': 'Hi'})
        self.assertEqual(self.client.get(self.url).status_code, 403)
        stranger = User.objects.create_user('x', 'x@example.com', 'pw-123456')
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.client.force_authenticate(self.owner)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['name'], 'Kamala')


class NearbyPlacesTests(APITestCase):
    URL = '/api/places/?south=6.88&west=79.84&north=6.94&east=79.90&categories='

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    @staticmethod
    def overpass_reply(elements):
        import json
        from unittest import mock
        response = mock.MagicMock()
        response.__enter__.return_value = BytesIO(json.dumps({'elements': elements}).encode())
        return response

    def test_groups_places_by_category_and_caches_them(self):
        from unittest import mock
        elements = [
            {'type': 'node', 'id': 1, 'lat': 6.9, 'lon': 79.86, 'tags': {'shop': 'supermarket', 'name': 'Keells Super'}},
            {'type': 'way', 'id': 2, 'center': {'lat': 6.91, 'lon': 79.87}, 'tags': {'shop': 'supermarket', 'name': 'Cargills Food City'}},
            {'type': 'node', 'id': 3, 'lat': 6.92, 'lon': 79.88, 'tags': {'shop': 'supermarket', 'name': 'Arpico'}},
        ]
        with mock.patch('urllib.request.urlopen', return_value=self.overpass_reply(elements)) as urlopen:
            first = self.client.get(self.URL + 'keells,foodcity').data
            again = self.client.get(self.URL + 'keells,foodcity').data
        self.assertEqual(urlopen.call_count, 1)  # second answer came from the cache
        self.assertEqual(first, again)
        self.assertEqual({p['category'] for p in first['places']}, {'keells', 'foodcity'})
        self.assertEqual(first['unavailable'], [])
        self.assertEqual(len(first['places']), 2)  # the non-chain supermarket is left out

    def test_too_large_an_area_asks_to_zoom_in(self):
        response = self.client.get('/api/places/?categories=school&south=6&west=79&north=8&east=81')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['code'], 'zoom')

    def test_service_down_reports_categories_as_unavailable(self):
        import urllib.error
        from unittest import mock
        with mock.patch('urllib.request.urlopen', side_effect=urllib.error.URLError('down')), mock.patch('time.sleep'):
            response = self.client.get(self.URL + 'school')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {'places': [], 'unavailable': ['school']})

    def test_unknown_categories_are_ignored(self):
        self.assertEqual(self.client.get(self.URL + 'casino').data, {'places': [], 'unavailable': []})
