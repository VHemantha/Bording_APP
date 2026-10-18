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


class PasswordResetTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()  # the reset endpoints are rate limited; each test starts with a fresh count
        self.email_user = User.objects.create_user('nimal@example.com', 'nimal@example.com', 'Old-pass-123')
        self.phone_user = User.objects.create_user('+94771234567', '', 'Old-pass-123')

    def request_reset(self, identifier, **extra):
        return self.client.post('/api/auth/password-reset/', {'identifier': identifier, **extra}, format='json',
                                HTTP_ORIGIN='http://localhost:5173')

    def link_parts(self, message):
        from urllib.parse import parse_qs, urlparse
        link = next(word for word in message.body.split() if '/reset-password?' in word)
        query = parse_qs(urlparse(link).query)
        return link, query['uid'][0], query['token'][0]

    def test_email_account_gets_a_link_that_changes_the_password_once(self):
        from django.core import mail
        response = self.request_reset('Nimal@Example.com')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['nimal@example.com'])
        link, uid, token = self.link_parts(mail.outbox[0])
        self.assertTrue(link.startswith('http://localhost:5173/reset-password?'))

        confirm = {'uid': uid, 'token': token, 'password': 'New-pass-456'}
        self.assertEqual(self.client.post('/api/auth/password-reset/confirm/', confirm, format='json').status_code, 200)
        self.email_user.refresh_from_db()
        self.assertTrue(self.email_user.check_password('New-pass-456'))
        # The same link can't be used again.
        again = self.client.post('/api/auth/password-reset/confirm/', {**confirm, 'password': 'Other-pass-789'}, format='json')
        self.assertEqual((again.status_code, again.data['code']), (400, 'invalid_link'))

    def test_same_reply_for_unknown_and_phone_only_accounts(self):
        from django.core import mail
        known = self.request_reset('nimal@example.com').data
        for identifier in ('nobody@example.com', '077 123 4567'):
            self.assertEqual(self.request_reset(identifier).data, known)
        self.assertEqual(len(mail.outbox), 1)  # only the account with an email address

    def test_email_in_the_visitors_language(self):
        from django.core import mail
        self.request_reset('nimal@example.com', lang='si')
        self.assertIn('මුරපදය', mail.outbox[0].subject)

    def test_weak_password_and_bad_link_are_refused(self):
        from django.core import mail
        self.request_reset('nimal@example.com')
        _, uid, token = self.link_parts(mail.outbox[0])
        weak = self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': token, 'password': '123'}, format='json')
        self.assertEqual(weak.status_code, 400)
        self.assertIn('password', weak.data)
        bad = self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': 'nope', 'password': 'New-pass-456'}, format='json')
        self.assertEqual(bad.status_code, 400)

    def test_link_can_be_checked_before_typing_a_password(self):
        from django.core import mail
        self.request_reset('nimal@example.com')
        _, uid, token = self.link_parts(mail.outbox[0])
        check = lambda u, tk: self.client.get('/api/auth/password-reset/confirm/', {'uid': u, 'token': tk}).data  # noqa: E731
        self.assertEqual(check(uid, token), {'valid': True})
        self.assertEqual(check(uid, 'nope'), {'valid': False})
        self.assertEqual(check('x', 'y'), {'valid': False})
