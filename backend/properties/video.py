"""Listing video tours hosted on YouTube (free hosting: the owner uploads, we embed)."""
import re

_YOUTUBE_ID = re.compile(
    r'^(?:https?://)?(?:www\.|m\.|music\.)?'
    r'(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|live/|v/)|youtu\.be/|youtube-nocookie\.com/embed/)'
    r'([A-Za-z0-9_-]{11})(?:[?&#/].*)?$'
)


def youtube_id(url):
    """The 11-character video id from any common YouTube link, or None."""
    match = _YOUTUBE_ID.match((url or '').strip())
    return match.group(1) if match else None


def normalize_youtube_url(url):
    """'https://www.youtube.com/watch?v=<id>' for a YouTube link, '' for empty, None if not YouTube."""
    if not (url or '').strip():
        return ''
    video = youtube_id(url)
    return f'https://www.youtube.com/watch?v={video}' if video else None
