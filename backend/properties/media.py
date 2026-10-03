"""Photo uploads for listings.

Every upload is decoded and re-encoded with Pillow rather than stored as sent. That
rejects anything that isn't really an image (so nothing scriptable is ever served from
our origin), strips the EXIF metadata phones embed (including the GPS position of the
owner's home), applies the camera's rotation, and caps the size.
"""
import uuid
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageOps

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_EDGE = 2000  # longest side after resizing, in pixels
ALLOWED_FORMATS = {'JPEG', 'PNG', 'WEBP'}
UPLOAD_DIR = 'listings'

# Pillow refuses images above this many pixels (decompression-bomb protection).
Image.MAX_IMAGE_PIXELS = 40_000_000


class InvalidImage(ValueError):
    pass


def save_listing_photo(upload) -> str:
    """Validates and stores an uploaded photo; returns its public path (/media/listings/....jpg)."""
    if upload.size > MAX_UPLOAD_BYTES:
        raise InvalidImage('Photos must be 10 MB or smaller.')
    try:
        with Image.open(upload) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise InvalidImage('Upload a JPEG, PNG or WebP photo.')
            probe.verify()  # structural check; the image must be reopened afterwards
        upload.seek(0)
        with Image.open(upload) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((MAX_EDGE, MAX_EDGE))
            if img.mode != 'RGB':
                # JPEG has no transparency: flatten onto white.
                background = Image.new('RGB', img.size, 'white')
                rgba = img.convert('RGBA')
                background.paste(rgba, mask=rgba.getchannel('A'))
                img = background
            out = BytesIO()
            img.save(out, 'JPEG', quality=85, optimize=True)  # no exif= argument: metadata is dropped
    except InvalidImage:
        raise
    except Exception as exc:  # truncated, corrupt, too large, unknown format, ...
        raise InvalidImage('That file could not be read as a photo.') from exc

    name = default_storage.save(f'{UPLOAD_DIR}/{uuid.uuid4().hex}.jpg', ContentFile(out.getvalue()))
    return settings.MEDIA_URL + name


def delete_uploaded_photos(paths):
    """Removes photos this site stored. External URLs (and anything else) are left alone."""
    prefix = settings.MEDIA_URL + UPLOAD_DIR + '/'
    for path in paths:
        if path and path.startswith(prefix):
            default_storage.delete(path[len(settings.MEDIA_URL):])


def is_valid_photo_reference(value: str) -> bool:
    """A listing photo is either a full http(s) URL or one of our own uploaded files."""
    if value.startswith(('http://', 'https://')):
        return True
    return value.startswith(settings.MEDIA_URL + UPLOAD_DIR + '/') and '..' not in value
