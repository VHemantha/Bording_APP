from django.test import TestCase

# Create your tests here.


from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .identifiers import normalize_phone


class PhoneNormalisationTests(APITestCase):
    def test_local_and_international_forms_match(self):
        for typed in ['0771234567', '077 123 4567', '+94 77 123 4567', '94771234567', '+94-77-123-4567']:
            self.assertEqual(normalize_phone(typed), '+94771234567', typed)

    def test_rejects_non_numbers(self):
        for typed in ['call me', '12', 'abc123']:
            self.assertIsNone(normalize_phone(typed), typed)


class EmailOrPhoneAuthTests(APITestCase):
    def register(self, identifier, password='Str0ng-Pass!2026'):
        return self.client.post('/api/auth/register/', {'identifier': identifier, 'password': password})

    def login(self, identifier, password='Str0ng-Pass!2026'):
        return self.client.post('/api/auth/token/', {'username': identifier, 'password': password})

    def test_register_and_login_with_phone_in_any_format(self):
        response = self.register('077 123 4567')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(User.objects.get().username, '+94771234567')
        for typed in ['0771234567', '+94771234567', '+94 77 123 4567']:
            self.assertEqual(self.login(typed).status_code, 200, typed)
        self.assertEqual(self.login('0771234567', 'wrong-password').status_code, 401)

    def test_same_phone_cannot_register_twice(self):
        self.register('0771234567')
        response = self.register('+94 77 123 4567')
        self.assertEqual(response.status_code, 400)
        self.assertIn('identifier', response.data)

    def test_register_and_login_with_email(self):
        self.assertEqual(self.register('Nimal@Example.com').status_code, 201)
        user = User.objects.get()
        self.assertEqual((user.username, user.email), ('nimal@example.com', 'nimal@example.com'))
        self.assertEqual(self.login('NIMAL@example.com').status_code, 200)

    def test_rejects_garbage_identifier(self):
        self.assertEqual(self.register('not an email').status_code, 400)

    def test_existing_username_accounts_still_sign_in(self):
        User.objects.create_user('siteadmin', 'admin@example.com', 'Str0ng-Pass!2026')
        self.assertEqual(self.login('siteadmin').status_code, 200)
        self.assertEqual(self.login('admin@example.com').status_code, 200)
