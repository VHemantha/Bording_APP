from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Anyone can browse listings; only staff (the admin role) can create/edit/delete them."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
