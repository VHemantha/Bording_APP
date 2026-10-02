"""Tools available to the site-guide assistant agent (graphs/assistant_graph.py)."""
from typing import Optional

from langchain_core.tools import tool

from properties.serializers import PropertyListSerializer
from properties.services import run_property_search

SITE_HELP = {
    'search': (
        "Use the search bar on the home page (or the AI search box) to type things like "
        "'3 bed house in Austin under 500k'. You can also use the filter bar on the Search "
        "Results page for precise price/bed/bath/type filters."
    ),
    'save': (
        "Click the heart icon on any listing card or detail page to save it. Saved Homes are "
        "under the 'Saved Homes' link in the navbar once you're signed in."
    ),
    'account': (
        "Click 'Sign in' in the top right to open the sign-in panel. You can register with "
        "email/password or continue with Google. New accounts are regular buyer/renter "
        "accounts by default."
    ),
    'admin': (
        "Admin accounts are created by the site owner (via the create_admin management "
        "command) and sign in through the same 'Sign in' panel; they're then routed to the "
        "/admin dashboard to manage listings."
    ),
    'listing': (
        "Admins can add a listing two ways from the dashboard: fill in the manual 'Add "
        "Listing' form, or paste raw text into 'AI Import' and let the AI agent extract the "
        "structured listing for review before publishing."
    ),
    'contact': "There's no live agent chat yet - this assistant can answer most how-to questions directly.",
}


@tool
def get_site_help(topic: str) -> str:
    """Look up how-to guidance for this real estate site. `topic` should be one of:
    search, save, account, admin, listing, contact - or any short free-text topic,
    in which case the closest match is returned.
    """
    key = topic.strip().lower()
    if key in SITE_HELP:
        return SITE_HELP[key]
    for name, text in SITE_HELP.items():
        if name in key or key in name:
            return text
    return (
        "I don't have a specific help article for that, but you can browse homes from the "
        "navbar, use natural-language search, save favorites, or ask me something more specific."
    )


def make_search_properties_tool(filters_sink: list):
    """Builds the `search_properties` tool, recording whatever filters it was called
    with into `filters_sink` so the caller can offer the shopper a direct link to
    those results on the Search page.
    """

    @tool
    def search_properties(
        city: Optional[str] = None,
        status: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        min_beds: Optional[int] = None,
        min_baths: Optional[float] = None,
        home_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> str:
        """Search live property listings. `status` is 'for_sale' or 'for_rent',
        `home_type` is one of house/apartment/annex/land/upper_floor_house. Returns a short
        text summary of matching homes (not the full data).
        """
        filters = {
            'city': city,
            'status': status,
            'min_price': min_price,
            'max_price': max_price,
            'min_beds': min_beds,
            'min_baths': min_baths,
            'home_type': home_type,
            'search': search,
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        filters_sink.append(filters)

        queryset = run_property_search(filters)[:5]
        results = PropertyListSerializer(queryset, many=True).data
        count = run_property_search(filters).count()
        if not results:
            return 'No listings matched those filters.'
        lines = [
            f"{r['address']}, {r['city']} {r['state']} - ${r['price']:,} "
            f"({r['beds']}bd/{r['baths']}ba)"
            for r in results
        ]
        return f"{count} homes match. Top results:\n" + "\n".join(lines)

    return search_properties
