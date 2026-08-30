import django_filters

from .models import Property


class PropertyFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='city', lookup_expr='iexact')
    zip_code = django_filters.CharFilter(field_name='zip_code', lookup_expr='exact')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_beds = django_filters.NumberFilter(field_name='beds', lookup_expr='gte')
    min_baths = django_filters.NumberFilter(field_name='baths', lookup_expr='gte')
    home_type = django_filters.CharFilter(field_name='home_type', lookup_expr='exact')
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
            'min_baths', 'home_type', 'status', 'min_lat', 'max_lat',
            'min_lng', 'max_lng',
        ]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(city__icontains=value) |
            Q(state__icontains=value) |
            Q(zip_code__icontains=value) |
            Q(address__icontains=value)
        )
