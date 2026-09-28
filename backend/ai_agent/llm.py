"""Single place that knows how to construct the foundation model (Claude, via
langchain-anthropic). Every graph/agent in this app calls get_llm() instead of
constructing ChatAnthropic directly, so there is exactly one spot to change
models/keys and exactly one spot that raises when the key is missing.
"""
from django.conf import settings


class AIUnavailableError(RuntimeError):
    """Raised whenever an AI feature is called without ANTHROPIC_API_KEY configured."""


def get_llm(temperature: float = 0.2):
    # `temperature` is accepted for backwards compatibility but no longer forwarded:
    # newer Claude models (claude-sonnet-5 and up) reject the `temperature` param
    # with a 400. Callers that still pass it keep working; the value is ignored.
    if not settings.ANTHROPIC_API_KEY:
        raise AIUnavailableError(
            'AI features need ANTHROPIC_API_KEY set in the backend environment.'
        )

    from langchain_anthropic import ChatAnthropic

    kwargs = dict(
        model=settings.ANTHROPIC_MODEL,
        api_key=settings.ANTHROPIC_API_KEY,
        max_tokens=1024,
    )
    # Identity-linked (workspace) API keys must name the workspace on every request.
    if settings.ANTHROPIC_WORKSPACE_ID:
        kwargs['default_headers'] = {'anthropic-workspace-id': settings.ANTHROPIC_WORKSPACE_ID}

    return ChatAnthropic(**kwargs)
