from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from django.contrib.auth       import get_user_model
from .models import AllowedInstitutionDomain

User = get_user_model()


def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)

def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


# ══ USER MANAGEMENT ═══════════════════════════════════════════════════════════

# GET /api/admin/users/?role=student
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    role_filter = request.query_params.get('role')
    users = User.objects.all().order_by('role', 'username')
    if role_filter:
        users = users.filter(role=role_filter.lower())
    data = [
        {'id': u.pk, 'username': u.username, 'email': u.email,
         'full_name': u.full_name, 'role': u.role,
         'is_active': u.is_active, 'town': u.town}
        for u in users
    ]
    return ok(data=data, message=f"{len(data)} user(s) found.")


# GET /api/admin/users/<pk>/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return fail("User not found.", status.HTTP_404_NOT_FOUND)
    return ok(data={'id': u.pk, 'username': u.username, 'email': u.email,
                    'full_name': u.full_name, 'role': u.role,
                    'is_active': u.is_active, 'town': u.town, 'pnum': u.pnum})


# PATCH /api/admin/users/<pk>/update/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return fail("User not found.", status.HTTP_404_NOT_FOUND)
    u.full_name = request.data.get('full_name', u.full_name)
    u.email     = request.data.get('email',     u.email)
    u.town      = request.data.get('town',      u.town)
    u.pnum      = request.data.get('pnum',      u.pnum)
    if 'is_active' in request.data:
        u.is_active = bool(request.data['is_active'])
    u.save(update_fields=['full_name', 'email', 'town', 'pnum', 'is_active'])
    return ok(message=f"User '{u.username}' updated.")


# DELETE /api/admin/users/<pk>/delete/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return fail("User not found.", status.HTTP_404_NOT_FOUND)
    if u.pk == request.user.pk:
        return fail("You cannot delete your own account.")
    username = u.username
    u.delete()
    return ok(message=f"User '{username}' deleted.")


# ══ ADMINISTRATION EMAIL WHITELIST ════════════════════════════════════════════
#
# How this works:
#   1. A university contacts the platform admin and says:
#      "We want to join Stag.io. Our administration officer's email is
#       chef.stage@ummto.dz and our university is UMMTO."
#   2. The platform admin calls POST /api/admin/administration-emails/add/
#      with { "email": "chef.stage@ummto.dz", "institution": "UMMTO" }
#   3. Now only that exact email can register with role='administration'.
#      Any other @ummto.dz email (student, etc.) cannot use that role.
#   4. The domain part (ummto.dz) is also used to scope statistics —
#      the administration user only sees students from their university.
#
# The admin can register multiple emails per university if needed
# (e.g. chef.stage@ummto.dz AND responsable.pedago@ummto.dz).


# POST /api/admin/administration-emails/add/
# Body: { "email": "chef.stage@ummto.dz", "institution": "UMMTO" }
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_administration_email(request):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)

    email       = request.data.get('email', '').strip().lower()
    institution = request.data.get('institution', '').strip()

    if not email:
        return fail("'email' is required. Example: 'chef.stage@ummto.dz'")

    if '@' not in email:
        return fail("Invalid email address. Must contain '@'.")

    if AllowedInstitutionDomain.objects.filter(email__iexact=email).exists():
        return fail(f"The email '{email}' is already registered.")

    entry = AllowedInstitutionDomain.objects.create(
        email=email,
        institution=institution,
        added_by=request.user,
    )

    domain = entry.domain   # extracted from the email automatically via @property
    return ok(
        data={
            'id':          entry.pk,
            'email':       entry.email,
            'domain':      domain,
            'institution': entry.institution,
        },
        message=(
            f"Email '{email}' approved. "
            f"That person can now register with role='administration'. "
            f"Students from '{domain}' will be scoped to this university in statistics."
        )
    )


# GET /api/admin/administration-emails/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_administration_emails(request):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)

    entries = AllowedInstitutionDomain.objects.all().order_by('institution', 'email')
    data = [
        {
            'id':          e.pk,
            'email':       e.email,
            'domain':      e.domain,         # ummto.dz — for display
            'institution': e.institution,
            'created_at':  e.created_at.isoformat(),
            # Check if this email has already registered
            'is_registered': User.objects.filter(
                email__iexact=e.email, role='administration'
            ).exists(),
        }
        for e in entries
    ]
    return ok(data=data, message=f"{len(data)} approved administration email(s).")


# DELETE /api/admin/administration-emails/<pk>/delete/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_administration_email(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)

    try:
        entry = AllowedInstitutionDomain.objects.get(pk=pk)
    except AllowedInstitutionDomain.DoesNotExist:
        return fail("Entry not found.", status.HTTP_404_NOT_FOUND)

    email = entry.email

    # Warn if this email already has an active account
    already_registered = User.objects.filter(
        email__iexact=email, role='administration'
    ).exists()

    entry.delete()

    if already_registered:
        return ok(
            message=(
                f"Email '{email}' removed from the whitelist. "
                f"Note: the account that already registered with this email still exists. "
                f"Delete it manually from the users list if needed."
            )
        )
    return ok(message=f"Email '{email}' removed from the whitelist.")