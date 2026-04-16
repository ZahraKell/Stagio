from rest_framework.permissions import BasePermission # pyright: ignore[reportMissingImports]


class IsStudent(BasePermission):
    message = "Only active student accounts can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "student"
            and request.user.status == "ACTIVE"
        )

class IsCompany(BasePermission):
    message = "Only active company accounts can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "company"
            and request.user.status == "ACTIVE"
        )

class IsAdmin(BasePermission):
    message = "Only admin accounts can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )

class IsApplicationOwner(BasePermission):
    message = "You do not have permission to access this application."

    def has_object_permission(self, request, view, obj):
        return obj.student == request.user


class IsOfferOwnerOrAdmin(BasePermission):
    message = "Only the offer owner or an admin can perform this action."

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # obj is an Application — check its offer's owner
        return obj.offer.created_by == request.user