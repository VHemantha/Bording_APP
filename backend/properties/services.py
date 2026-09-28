"""Shared query logic so every caller (the REST viewset, the AI search graph, the
assistant agent's tool) filters listings exactly the same way.
"""
from .filters import PropertyFilter
from .models import Property


def run_property_search(params: dict):
    """Applies PropertyFilter to the full Property queryset.

    `params` uses the same keys as the public API's query string (city, status,
    min_price, max_price, min_beds, min_baths, home_type, search, ...).
    """
    clean = {k: v for k, v in params.items() if v not in (None, '')}
    queryset = Property.objects.prefetch_related('images').all()
    return PropertyFilter(clean, queryset=queryset).qs
