from rest_framework import viewsets

from .filters import PropertyFilter
from .models import Property
from .serializers import PropertyDetailSerializer, PropertyListSerializer


class PropertyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Property.objects.prefetch_related('images').all()
    filterset_class = PropertyFilter

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        return PropertyListSerializer
