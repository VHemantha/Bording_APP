import logging

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response

from .llm import AIUnavailableError
from .throttles import AIRateThrottle

logger = logging.getLogger(__name__)


def _unavailable():
    return Response(
        {'error': 'AI features need ANTHROPIC_API_KEY configured on the server.'},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AIRateThrottle])
def ai_search(request):
    query = (request.data.get('query') or '').strip()
    if not query:
        return Response({'detail': 'query is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        from .graphs.search_graph import run_search_agent

        return Response(run_search_agent(query, request.data.get('history')))
    except AIUnavailableError:
        return _unavailable()
    except Exception:
        logger.exception('ai_search failed')
        return Response(
            {'error': 'The AI search agent hit an error. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([AIRateThrottle])
def ai_assistant(request):
    message = (request.data.get('message') or '').strip()
    if not message:
        return Response({'detail': 'message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        from .graphs.assistant_graph import run_assistant

        return Response(run_assistant(message, request.data.get('history')))
    except AIUnavailableError:
        return _unavailable()
    except Exception:
        logger.exception('ai_assistant failed')
        return Response(
            {'error': 'The assistant hit an error. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def ai_extract_listing(request):
    text = (request.data.get('text') or '').strip()
    if len(text) < 20:
        return Response(
            {'detail': 'Paste more listing detail (at least a sentence or two).'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        from .graphs.listing_graph import run_listing_agent

        return Response(run_listing_agent(text))
    except AIUnavailableError:
        return _unavailable()
    except Exception:
        logger.exception('ai_extract_listing failed')
        return Response(
            {'error': 'The listing extraction agent hit an error. Please try again.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
