"""Natural-language property search as a LangGraph state machine:

    extract_filters  ->  fetch_listings  ->  compose_reply

`extract_filters` turns "3 bed house in Austin under 500k" into structured filter
params (Claude, structured output). `fetch_listings` runs those through the exact
same PropertyFilter the REST API uses. `compose_reply` has Claude write a short,
friendly sentence about what came back.
"""
from typing import Any, Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from properties.serializers import PropertyListSerializer
from properties.services import run_property_search

from ..llm import get_llm
from ..schemas import PropertySearchFilters

MAX_RESULTS = 24
PREVIEW_COUNT = 6

_EXTRACT_SYSTEM = (
    "You translate a home-shopper's message into structured search filters for a real "
    "estate site. Only set a field when the message clearly implies it. Interpret "
    "'k' as thousands and 'm' as millions. If they mention renting, set status to "
    "for_rent; buying, for_sale."
)


class SearchState(TypedDict, total=False):
    query: str
    history: list[dict[str, str]]
    filters: dict[str, Any]
    results: list[dict[str, Any]]
    count: int
    reply: str


def _extract_filters(state: SearchState) -> SearchState:
    llm = get_llm(temperature=0)
    structured = llm.with_structured_output(PropertySearchFilters)
    result: PropertySearchFilters = structured.invoke([
        SystemMessage(content=_EXTRACT_SYSTEM),
        HumanMessage(content=state['query']),
    ])
    filters = {k: v for k, v in result.model_dump().items() if v is not None}
    return {'filters': filters}


def _fetch_listings(state: SearchState) -> SearchState:
    queryset = run_property_search(state.get('filters', {}))[:MAX_RESULTS]
    results = PropertyListSerializer(queryset, many=True).data
    return {'results': list(results), 'count': len(results)}


def _compose_reply(state: SearchState) -> SearchState:
    llm = get_llm(temperature=0.4)
    preview = [
        f"- {r['address']}, {r['city']} {r['state']} - ${r['price']:,} "
        f"({r['beds']}bd/{r['baths']}ba, {r['sqft']:,} sqft)"
        for r in state.get('results', [])[:PREVIEW_COUNT]
    ]
    prompt = (
        f"The shopper asked: {state['query']!r}\n"
        f"Filters applied: {state.get('filters', {})}\n"
        f"{state.get('count', 0)} matching homes were found. Sample:\n"
        + ("\n".join(preview) if preview else "(none)")
        + "\n\nWrite 1-2 warm, concise sentences summarising the results. "
        "Do not invent listings or prices. If nothing matched, suggest loosening a filter."
    )
    reply = llm.invoke([HumanMessage(content=prompt)]).content
    if isinstance(reply, list):  # some providers return content blocks
        reply = " ".join(part.get('text', '') for part in reply if isinstance(part, dict))
    return {'reply': reply.strip()}


def _build_graph():
    graph = StateGraph(SearchState)
    graph.add_node('extract_filters', _extract_filters)
    graph.add_node('fetch_listings', _fetch_listings)
    graph.add_node('compose_reply', _compose_reply)
    graph.add_edge(START, 'extract_filters')
    graph.add_edge('extract_filters', 'fetch_listings')
    graph.add_edge('fetch_listings', 'compose_reply')
    graph.add_edge('compose_reply', END)
    return graph.compile()


_GRAPH = None


def run_search_agent(query: str, history: Optional[list[dict[str, str]]] = None) -> dict[str, Any]:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build_graph()
    final = _GRAPH.invoke({'query': query, 'history': history or []})
    return {
        'reply': final.get('reply', ''),
        'filters': final.get('filters', {}),
        'results': final.get('results', []),
        'count': final.get('count', 0),
    }
