from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    FavoriteDestroyView,
    FavoriteListCreateView,
    GoogleLoginView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PhoneCodeView,
    PhonePasswordResetView,
    RegisterView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/phone-code/', PhoneCodeView.as_view(), name='phone_code'),
    path('auth/password-reset/phone/', PhonePasswordResetView.as_view(), name='password_reset_phone'),
    path('favorites/', FavoriteListCreateView.as_view(), name='favorite-list'),
    path('favorites/<int:property_id>/', FavoriteDestroyView.as_view(), name='favorite-destroy'),
]
