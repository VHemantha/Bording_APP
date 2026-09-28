from rest_framework import viewsets

from .filters import PropertyFilter
from .models import Property
from .permissions import IsAdminOrReadOnly
from .serializers import PropertyDetailSerializer, PropertyListSerializer, PropertyWriteSerializer


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.prefetch_related('images').all()
    filterset_class = PropertyFilter
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return PropertyWriteSerializer
        return PropertyListSerializer
