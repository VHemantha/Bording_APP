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


class SentCodes:
    """Catches the SMS codes the app sends (instead of texting them) for the tests."""

    def __enter__(self):
        import re
        from unittest import mock
        self.messages = []
        self._patch = mock.patch('accounts.otp.send_sms', side_effect=lambda phone, msg: self.messages.append((phone, msg)))
        self._patch.start()
        self.code = lambda: re.search(r'\b(\d{6})\b', self.messages[-1][1]).group(1)
        return self

    def __exit__(self, *exc):
        self._patch.stop()


class EmailOrPhoneAuthTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    def register(self, identifier, password='Str0ng-Pass!2026'):
        payload = {'identifier': identifier, 'password': password}
        if '@' not in identifier and any(ch.isdigit() for ch in identifier):
            # Phone sign-up: get the texted code first.
            with SentCodes() as sms:
                sent = self.client.post('/api/auth/phone-code/', {'phone': identifier, 'purpose': 'register'})
                if sent.status_code != 200:
                    return sent
                payload['code'] = sms.code()
        return self.client.post('/api/auth/register/', payload)

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
        self.assertIn('phone', response.data)  # refused before any code is sent

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


class PhoneCodeTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    def send(self, phone='077 123 4567', purpose='register'):
        return self.client.post('/api/auth/phone-code/', {'phone': phone, 'purpose': purpose})

    def test_phone_sign_up_needs_the_texted_code(self):
        with SentCodes() as sms:
            self.assertEqual(self.send().status_code, 200)
            code = sms.code()
            self.assertEqual(sms.messages[0][0], '+94771234567')
            self.assertIn('PlaceEka', sms.messages[0][1])
        payload = {'identifier': '0771234567', 'password': 'Str0ng-Pass!2026'}
        self.assertIn('code', self.client.post('/api/auth/register/', payload).data)
        wrong = '000000' if code != '000000' else '111111'
        self.assertEqual(self.client.post('/api/auth/register/', {**payload, 'code': wrong}).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/register/', {**payload, 'code': code}).status_code, 201)
        self.assertTrue(User.objects.filter(username='+94771234567').exists())

    def test_code_works_once_and_only_for_five_guesses(self):
        with SentCodes() as sms:
            self.send()
            code = sms.code()
        payload = {'identifier': '0771234567', 'password': 'Str0ng-Pass!2026'}
        wrong = '000000' if code != '000000' else '111111'
        for _ in range(5):
            self.client.post('/api/auth/register/', {**payload, 'code': wrong})
        self.assertEqual(self.client.post('/api/auth/register/', {**payload, 'code': code}).status_code, 400)

    def test_resend_waits_a_minute(self):
        with SentCodes():
            self.assertEqual(self.send().status_code, 200)
            again = self.send()
        self.assertEqual((again.status_code, again.data['code']), (429, 'too_soon'))
        self.assertGreater(again.data['retry_after'], 0)

    def test_sms_failure_is_reported_and_not_counted(self):
        from unittest import mock
        from accounts.sms import SmsError
        with mock.patch('accounts.otp.send_sms', side_effect=SmsError('down')):
            response = self.send()
        self.assertEqual((response.status_code, response.data['code']), (503, 'sms_failed'))
        with SentCodes():
            self.assertEqual(self.send().status_code, 200)  # no waiting after a failed send

    def test_email_is_not_a_phone(self):
        self.assertEqual(self.send(phone='nimal@example.com').status_code, 400)

    def test_phone_password_reset(self):
        User.objects.create_user('+94771234567', '', 'Old-pass-123')
        with SentCodes() as sms:
            self.assertEqual(self.send(purpose='reset').status_code, 200)
            code = sms.code()
            # Unknown numbers get the same reply, but nothing is sent.
            self.assertEqual(self.send(phone='0779999999', purpose='reset').data, {'detail': 'Code sent.', 'resend_after': 60})
            self.assertEqual(len(sms.messages), 1)
        reset = lambda c, pw='New-pass-456': self.client.post(  # noqa: E731
            '/api/auth/password-reset/phone/', {'phone': '0771234567', 'code': c, 'password': pw})
        self.assertEqual(reset(code, '123').status_code, 400)  # weak password
        self.assertEqual(reset(code).status_code, 200)
        self.assertTrue(User.objects.get(username='+94771234567').check_password('New-pass-456'))
        self.assertEqual(reset(code, 'Other-pass-789').status_code, 400)  # used up
