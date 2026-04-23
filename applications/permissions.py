from rest_framework.permissions import BasePermission # pyright: ignore[reportMissingImports]


class IsStudent(BasePermission):
    # Only authenticated users whose role is 'student' can pass.
    # NOTE: CustomUser has no 'status' field, so we only check role.
    message = "Only student accounts can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "student"
        )

class IsCompany(BasePermission):
    # Only authenticated users whose role is 'company' can pass.
    # NOTE: CustomUser has no 'status' field, so we only check role.
    message = "Only company accounts can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "company"
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
        # obj.student is a Student instance; request.user is a CustomUser instance.
        # We must compare obj.student.user (the CustomUser) to request.user.
        return obj.student.user == request.user


class IsOfferOwnerOrAdmin(BasePermission):
    message = "Only the offer owner or an admin can perform this action."

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # obj is an Application — check that the logged-in user owns the offer.
        # InternshipOffer has a 'company' FK → Company → user (CustomUser).
        # There is no 'created_by' field on InternshipOffer, so we go through company.
        return obj.offer.company.user == request.user