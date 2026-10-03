from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import NearbyPlacesView, PropertyViewSet

router = DefaultRouter()
router.register('properties', PropertyViewSet, basename='property')

urlpatterns = [
    path('places/', NearbyPlacesView.as_view(), name='nearby-places'),
    *router.urls,
]
