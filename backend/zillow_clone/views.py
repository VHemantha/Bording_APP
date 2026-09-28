from django.conf import settings
from django.http import FileResponse, HttpResponse


def spa_index(request):
    """Serve the React app's index.html for any client-side route (/search, /property/3, ...).

    Real files (/assets/*, /favicon.svg) are handled earlier by WhiteNoise.
    """
    index = settings.FRONTEND_DIST / 'index.html'
    if not index.is_file():
        return HttpResponse(
            'Frontend build not found. In development run the Vite dev server '
            '(npm run dev); in production build the Docker image (see DEPLOY_AWS.md).',
            status=404,
            content_type='text/plain',
        )
    response = FileResponse(open(index, 'rb'), content_type='text/html; charset=utf-8')
    # index.html names the hashed JS/CSS bundles; it must never be cached across deploys.
    response['Cache-Control'] = 'no-cache'
    return response
