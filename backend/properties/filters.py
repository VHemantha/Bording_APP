import django_filters

from .models import Property


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Comma-separated list of strings, e.g. home_type=house,annex."""


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """Comma-separated list of numbers, e.g. stories=1,2."""


class PropertyFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='city', lookup_expr='iexact')
    zip_code = django_filters.CharFilter(field_name='zip_code', lookup_expr='exact')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_beds = django_filters.NumberFilter(field_name='beds', lookup_expr='gte')
    min_baths = django_filters.NumberFilter(field_name='baths', lookup_expr='gte')
    # One value or several (the search page's "Property type" checkboxes).
    home_type = CharInFilter(field_name='home_type', lookup_expr='in')
    max_key_money = django_filters.NumberFilter(field_name='key_money', lookup_expr='lte')
    min_parking = django_filters.NumberFilter(field_name='parking_slots', lookup_expr='gte')
    min_sqft = django_filters.NumberFilter(field_name='sqft', lookup_expr='gte')
    max_sqft = django_filters.NumberFilter(field_name='sqft', lookup_expr='lte')
    stories = NumberInFilter(field_name='stories', lookup_expr='in')
    furnishing = CharInFilter(field_name='furnishing', lookup_expr='in')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')

    min_lat = django_filters.NumberFilter(field_name='latitude', lookup_expr='gte')
    max_lat = django_filters.NumberFilter(field_name='latitude', lookup_expr='lte')
    min_lng = django_filters.NumberFilter(field_name='longitude', lookup_expr='gte')
    max_lng = django_filters.NumberFilter(field_name='longitude', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Property
        fields = [
            'city', 'zip_code', 'min_price', 'max_price', 'min_beds',
            'min_baths', 'home_type', 'max_key_money', 'min_parking', 'min_sqft',
            'max_sqft', 'stories', 'furnishing', 'status', 'min_lat', 'max_lat', 'min_lng', 'max_lng',
        ]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(city__icontains=value) |
            Q(state__icontains=value) |
            Q(zip_code__icontains=value) |
            Q(address__icontains=value)
        )
