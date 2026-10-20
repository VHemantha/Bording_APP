import django_filters

from .models import Property


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Comma-separated list of strings, e.g. home_type=house,annex."""


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """Comma-separated list of numbers, e.g. stories=1,2."""


class PropertyFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name='city', lookup_expr='iexact')
    district = django_filters.CharFilter(field_name='district', lookup_expr='iexact')
    zip_code = django_filters.CharFilter(field_name='zip_code', lookup_expr='exact')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_beds = django_filters.NumberFilter(field_name='beds', lookup_expr='gte')
    min_baths = django_filters.NumberFilter(field_name='baths', lookup_expr='gte')
    # One value or several (the search page's "Property type" checkboxes).
    home_type = CharInFilter(field_name='home_type', lookup_expr='in')
    max_key_money_months = django_filters.NumberFilter(field_name='key_money_months', lookup_expr='lte')
    # Sales: listings asking no advance always fit the budget.
    max_advance = django_filters.NumberFilter(method='filter_max_advance')
    min_parking = django_filters.NumberFilter(field_name='parking_slots', lookup_expr='gte')
    min_sqft = django_filters.NumberFilter(field_name='sqft', lookup_expr='gte')
    max_sqft = django_filters.NumberFilter(field_name='sqft', lookup_expr='lte')
    stories = NumberInFilter(field_name='stories', lookup_expr='in')
    furnishing = CharInFilter(field_name='furnishing', lookup_expr='in')
    # Land for sale: one or more deed types, e.g. deed_type=sinnakkara,bimsaviya.
    deed_type = CharInFilter(field_name='deed_type', lookup_expr='in')
    # Only listings with a video tour.
    has_video = django_filters.BooleanFilter(method='filter_has_video')
    # true = only one shared bathroom, false = private bathroom(s).
    shared_bathroom = django_filters.BooleanFilter(field_name='shared_bathroom')
    # Land size range in `land_unit` (perch, the default, or acre); listings stored in the
    # other unit are compared after converting (1 acre = 160 perches).
    min_land_size = django_filters.NumberFilter(method='filter_land_size')
    max_land_size = django_filters.NumberFilter(method='filter_land_size')
    land_unit = django_filters.CharFilter(method='filter_noop')
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')

    min_lat = django_filters.NumberFilter(field_name='latitude', lookup_expr='gte')
    max_lat = django_filters.NumberFilter(field_name='latitude', lookup_expr='lte')
    min_lng = django_filters.NumberFilter(field_name='longitude', lookup_expr='gte')
    max_lng = django_filters.NumberFilter(field_name='longitude', lookup_expr='lte')

    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Property
        fields = [
            'city', 'district', 'zip_code', 'min_price', 'max_price', 'min_beds',
            'min_baths', 'home_type', 'max_key_money_months', 'max_advance', 'min_parking', 'min_sqft',
            'max_sqft', 'stories', 'furnishing', 'shared_bathroom', 'min_land_size', 'max_land_size', 'land_unit',
            'deed_type', 'has_video', 'status', 'min_lat', 'max_lat', 'min_lng', 'max_lng',
        ]

    def filter_has_video(self, queryset, name, value):
        return queryset.exclude(video_url='') if value else queryset.filter(video_url='')

    def filter_noop(self, queryset, name, value):
        return queryset  # read by filter_land_size

    def filter_land_size(self, queryset, name, value):
        from django.db.models import Q
        perches = float(value) * (160 if self.data.get('land_unit') == 'acre' else 1)
        op = 'gte' if name == 'min_land_size' else 'lte'
        return queryset.filter(
            Q(land_unit='perch', **{f'land_size__{op}': perches})
            | Q(land_unit='acre', **{f'land_size__{op}': perches / 160})
        )

    def filter_max_advance(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(Q(advance_amount__lte=value) | Q(advance_amount__isnull=True))

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(city__icontains=value) |
            Q(state__icontains=value) |
            Q(zip_code__icontains=value) |
            Q(address__icontains=value)
        )
