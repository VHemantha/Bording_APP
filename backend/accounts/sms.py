"""Sending SMS (one-time codes) through Notify.lk, a Sri Lankan SMS gateway.

Configured with NOTIFY_LK_USER_ID, NOTIFY_LK_API_KEY and NOTIFY_LK_SENDER_ID (your approved
sender name; Notify.lk's "NotifyDEMO" sender must not be used for codes). Without them the
message is only written to the server log, which is what local development uses.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

NOTIFY_LK_URL = 'https://app.notify.lk/api/v1/send'


class SmsError(Exception):
    pass


def sms_configured():
    return bool(settings.NOTIFY_LK_USER_ID and settings.NOTIFY_LK_API_KEY and settings.NOTIFY_LK_SENDER_ID)


def send_sms(phone, message):
    """Sends `message` to `phone` (+94771234567). Raises SmsError if the gateway refuses."""
    if not sms_configured():
        logger.warning('SMS not configured; message to %s: %s', phone, message)
        return
    params = {
        'user_id': settings.NOTIFY_LK_USER_ID,
        'api_key': settings.NOTIFY_LK_API_KEY,
        'sender_id': settings.NOTIFY_LK_SENDER_ID,
        'to': phone.lstrip('+'),  # Notify.lk wants 9471XXXXXXX
        'message': message,
    }
    if not message.isascii():
        params['type'] = 'unicode'
    request = urllib.request.Request(NOTIFY_LK_URL, data=urllib.parse.urlencode(params).encode())
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            reply = json.load(response)
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise SmsError(f'Notify.lk unreachable: {exc}') from exc
    if reply.get('status') != 'success':
        raise SmsError(f'Notify.lk refused the message: {reply}')
