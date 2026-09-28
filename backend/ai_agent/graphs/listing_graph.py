"""Admin "list a boarding with the AI agent" flow, as a LangGraph state machine:

    extract  ->  validate

`extract` turns a pasted blob of text (an owner's email, a scraped listing,
rough notes) into a structured ListingDraft via Claude. `validate` runs plain
Python checks and returns human-readable warnings for the admin to resolve before
publishing — nothing is written to the database here.
"""
from datetime import date
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from ..llm import get_llm
from ..schemas import ListingDraft

_EXTRACT_SYSTEM = (
    "You are a listings assistant for a real estate marketplace. Extract a single "
    "property listing from the text the admin pastes. Normalise price/rent to a "
    "plain integer. Write a clean, appealing 2-4 sentence description even if the "
    "source is terse. If a value is genuinely absent, use a sensible default and it "
    "will be flagged for review."
)


class ListingState(TypedDict, total=False):
    raw_text: str
    listing: dict[str, Any]
    warnings: list[str]


def _extract(state: ListingState) -> ListingState:
    llm = get_llm(temperature=0)
    structured = llm.with_structured_output(ListingDraft)
    draft: ListingDraft = structured.invoke([
        SystemMessage(content=_EXTRACT_SYSTEM),
        HumanMessage(content=state['raw_text']),
    ])
    listing = draft.model_dump()
    listing.setdefault('listed_date', date.today().isoformat())
    listing['listed_date'] = listing.get('listed_date') or date.today().isoformat()
    # No geocoding service is wired up; the admin sets the map pin.
    listing.setdefault('latitude', None)
    listing.setdefault('longitude', None)
    return {'listing': listing}


def _validate(state: ListingState) -> ListingState:
    listing = state.get('listing', {})
    warnings: list[str] = []

    for field in ('address', 'city', 'state', 'zip_code'):
        if not listing.get(field):
            warnings.append(f'Missing {field.replace("_", " ")}.')
    if not listing.get('price'):
        warnings.append('Could not determine a price - set it manually.')
    if not listing.get('sqft'):
        warnings.append('Square footage missing.')
    if listing.get('latitude') in (None, 0) or listing.get('longitude') in (None, 0):
        warnings.append('Map location not set - drop a pin or enter latitude/longitude.')
    if not listing.get('primary_image_url'):
        warnings.append('No photo found - add at least a primary image URL.')

    return {'warnings': warnings}


def _build_graph():
    graph = StateGraph(ListingState)
    graph.add_node('extract', _extract)
    graph.add_node('validate', _validate)
    graph.add_edge(START, 'extract')
    graph.add_edge('extract', 'validate')
    graph.add_edge('validate', END)
    return graph.compile()


_GRAPH = None


def run_listing_agent(raw_text: str) -> dict[str, Any]:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build_graph()
    final = _GRAPH.invoke({'raw_text': raw_text})
    return {'listing': final.get('listing', {}), 'warnings': final.get('warnings', [])}
