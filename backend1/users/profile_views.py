from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from django.utils import timezone
from .models import Student, Company


def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)


def get_profile(request):
    user = request.user
    data = {
        'id':        user.pk,
        'username':  user.username,
        'email':     user.email,
        'full_name': user.full_name,
        'town':      user.town,
        'pnum':      user.pnum,
        'role':      user.role,
    }
    if user.role == 'student':
        try:
            s = user.student
            data['student'] = {
                'student_number': s.student_number,
                'average_mark':   s.average_mark,
                'speciality':     s.speciality,
                'institution':    s.institution,
                'field':          s.field,
                'grade':          s.grade,
            }
        except Exception:
            data['student'] = None
    elif user.role == 'company':
        try:
            c = user.company
            data['company'] = {
                'company_name':     c.company_name,
                'company_sector':   c.company_sector,
                'company_website':  c.company_website,
                'description':      c.description,
                'town':             c.town,
                'is_approved':      c.is_approved,
                'is_rejected':      c.is_rejected,
                'rejection_reason': c.rejection_reason,
                'submitted_at':     c.submitted_at,
                'approved_at':      c.approved_at,
                'logo': c.logo.url if c.logo else None,
            }
        except Exception:
            data['company'] = None
    return ok(data=data, message="Profile retrieved.")


def update_profile(request):
    user = request.user
    user.full_name = request.data.get('full_name', user.full_name)
    user.town      = request.data.get('town',      user.town)
    user.pnum      = request.data.get('pnum',      user.pnum)
    user.email     = request.data.get('email',     user.email)
    user.save(update_fields=['full_name', 'town', 'pnum', 'email'])

    if user.role == 'student':
        try:
            s = user.student
            s.speciality  = request.data.get('speciality',  s.speciality)
            s.institution = request.data.get('institution', s.institution)
            s.field       = request.data.get('field',       s.field)
            s.grade       = request.data.get('grade',       s.grade)
            s.save(update_fields=['speciality', 'institution', 'field', 'grade'])
        except Exception:
            pass
    elif user.role == 'company':
        try:
            c = user.company
            if c.submitted_at and not c.is_approved and not c.is_rejected:
                return fail(
                    "Your account is pending admin approval. Profile edits are locked until review is complete.",
                    status.HTTP_403_FORBIDDEN
                )
            c.company_name    = request.data.get('company_name',    c.company_name)
            c.company_sector  = request.data.get('company_sector',  c.company_sector)
            c.company_website = request.data.get('company_website', c.company_website)
            c.description     = request.data.get('description',     c.description)
            c.town            = request.data.get('company_town',    c.town)
            c.save(update_fields=[
                'company_name', 'company_sector',
                'company_website', 'description', 'town',
            ])
        except Exception:
            pass
    return ok(message="Profile updated successfully.")


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_me(request):
    if request.method == 'GET':
        return get_profile(request)
    return update_profile(request)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_company_profile(request):
    if request.user.role != 'company':
        return fail("Only company accounts can complete this profile.", status.HTTP_403_FORBIDDEN)
    try:
        company = request.user.company
    except Company.DoesNotExist:
        return fail("Company profile not found.", status.HTTP_404_NOT_FOUND)

    # company_website and company_sector are optional
    required_fields = ['company_name', 'company_rc', 'town', 'description']
    missing = [f for f in required_fields if not request.data.get(f)]
    if missing:
        return fail(f"Missing required fields: {', '.join(missing)}")

    full_name = request.data.get('full_name', '').strip()
    if full_name:
        request.user.full_name = full_name
        request.user.save(update_fields=['full_name'])

    company.company_name    = request.data.get('company_name')
    company.company_sector  = request.data.get('company_sector', '')
    company.company_rc      = request.data.get('company_rc')
    company.company_website = request.data.get('company_website', '') or ''
    company.town            = request.data.get('town')
    company.description     = request.data.get('description')
    if request.FILES.get('logo'):
        company.logo = request.FILES.get('logo')
    company.is_rejected      = False
    company.rejection_reason = None
    company.submitted_at     = timezone.now()
    company.save()

    # Notify admins
    from django.contrib.auth import get_user_model
    from notifications.models import Notification
    User = get_user_model()
    admin_users = User.objects.filter(role='admin', is_active=True)
    for admin in admin_users:
        Notification.objects.create(
            recipient=admin,
            message=f"Company profile completed by {request.user.email}.",
        )

    return ok(message="Company profile submitted for admin approval.")