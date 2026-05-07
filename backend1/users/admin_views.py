from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from django.contrib.auth       import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import AllowedInstitutionDomain
from .models import Company

User = get_user_model()


def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)

def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


# ══ USER MANAGEMENT ═══════════════════════════════════════════════════════════

# GET /api/admin/users/?role=student
# users/admin_views.py — list_users function, update the company query
from django.db.models import Count

# When role == 'company', annotate with counts:
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    role_filter = request.query_params.get('role')
    users = User.objects.all().order_by('role', 'username')
    if role_filter:
        users = users.filter(role=role_filter.lower())
    
    data = []
    for u in users:
        row = {'id': u.pk, 'username': u.username, 'email': u.email,
               'full_name': u.full_name, 'role': u.role,
               'is_active': u.is_active, 'town': u.town}
        if u.role == 'company':
            try:
                c = u.company
                row['offers_count'] = c.internshipoffer_set.count()
                row['conventions_count'] = c.internshipoffer_set.aggregate(
                    total=Count('applications__convention')
                )['total'] or 0
            except Exception:
                row['offers_count'] = 0
                row['conventions_count'] = 0
        data.append(row)
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_companies(request):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    companies = Company.objects.filter(
        is_approved=False,
        is_rejected=False,
        submitted_at__isnull=False,
    ).select_related('user').order_by('-submitted_at')
    data = [{
        'id': c.pk,
        'user_id': c.user_id,
        'email': c.user.email,
        'company_name': c.company_name,
        'company_sector': c.company_sector,
        'company_rc': c.company_rc,
        'company_website': c.company_website,
        'town': c.town,
        'submitted_at': c.submitted_at.isoformat() if c.submitted_at else None,
    } for c in companies]
    return ok(data=data, message=f"{len(data)} pending company profiles.")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_company(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    try:
        c = Company.objects.select_related('user').get(pk=pk)
    except Company.DoesNotExist:
        return fail("Company not found.", status.HTTP_404_NOT_FOUND)
    return ok(data={
        'id': c.pk,
        'user_id': c.user_id,
        'email': c.user.email,
        'full_name': c.user.full_name,
        'is_active': c.user.is_active,
        'company_name': c.company_name,
        'company_sector': c.company_sector,
        'company_rc': c.company_rc,
        'company_website': c.company_website,
        'description': c.description,
        'town': c.town,
        'latitude': c.latitude,
        'longitude': c.longitude,
        'logo': c.logo.url if c.logo else None,
        'is_approved': c.is_approved,
        'is_rejected': c.is_rejected,
        'rejection_reason': c.rejection_reason,
        'submitted_at': c.submitted_at.isoformat() if c.submitted_at else None,
        'approved_at': c.approved_at.isoformat() if c.approved_at else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_company(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    try:
        company = Company.objects.select_related('user').get(pk=pk)
    except Company.DoesNotExist:
        return fail("Company not found.", status.HTTP_404_NOT_FOUND)

    company.is_approved = True
    company.is_rejected = False
    company.rejection_reason = None
    company.approved_at = timezone.now()
    company.save(update_fields=['is_approved', 'is_rejected', 'rejection_reason', 'approved_at'])
    send_mail(
        "[Stag.io] Company account approved",
        "Your company profile has been approved. You can now publish internship offers.",
        getattr(settings, "DEFAULT_FROM_EMAIL", None),
        [company.user.email],
        fail_silently=True,
    )
    return ok(message="Company approved.")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_company(request, pk):
    if not is_admin(request.user):
        return fail("Admins only.", status.HTTP_403_FORBIDDEN)
    reason = (request.data.get('reason') or '').strip()
    if not reason:
        return fail("'reason' is required.")
    try:
        company = Company.objects.select_related('user').get(pk=pk)
    except Company.DoesNotExist:
        return fail("Company not found.", status.HTTP_404_NOT_FOUND)

    company.is_approved = False
    company.is_rejected = True
    company.rejection_reason = reason
    company.approved_at = None
    company.save(update_fields=['is_approved', 'is_rejected', 'rejection_reason', 'approved_at'])
    send_mail(
        "[Stag.io] Company account rejected",
        f"Your company profile was rejected.\nReason: {reason}",
        getattr(settings, "DEFAULT_FROM_EMAIL", None),
        [company.user.email],
        fail_silently=True,
    )
    return ok(message="Company rejected.")