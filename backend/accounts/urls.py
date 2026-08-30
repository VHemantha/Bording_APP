from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import FavoriteDestroyView, FavoriteListCreateView, MeView, RegisterView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('favorites/', FavoriteListCreateView.as_view(), name='favorite-list'),
    path('favorites/<int:property_id>/', FavoriteDestroyView.as_view(), name='favorite-destroy'),
]
