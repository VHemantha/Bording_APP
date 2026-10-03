from rest_framework import permissions


class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """Anyone can browse listings. Any signed-in user can post one; only its owner or an
    admin (staff) can change or delete it."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_manage(request.user, obj)


def can_manage(user, listing):
    return bool(user and user.is_authenticated and (user.is_staff or listing.owner_id == user.id))
