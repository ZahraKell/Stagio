from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from .models import Student, Company


# ── HELPERS ───────────────────────────────────────────────────────────────────

def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)


# ── VIEW 1: GET MY PROFILE ────────────────────────────────────────────────────
# GET /api/auth/profile/
# Returns base user data + extra role-specific data in a nested object.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user

    # Base fields — same for every role
    data = {
        'id':        user.pk,
        'username':  user.username,
        'email':     user.email,
        'full_name': user.full_name,
        'town':      user.town,
        'pnum':      user.pnum,
        'role':      user.role,
    }

    # Add role-specific fields
    if user.role == 'student':
        try:
            s = user.student    # related_name='student' on Student model
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
            c = user.company    # related_name='company' on Company model
            data['company'] = {
                'company_name':    c.company_name,
                'company_sector':  c.company_sector,
                'company_website': c.company_website,
                'description':     c.description,
                'town':            c.town,
                # .url gives the full media URL for the image file; None if no logo
                'logo': c.logo.url if c.logo else None,
            }
        except Exception:
            data['company'] = None

    return ok(data=data, message="Profile retrieved.")


# ── VIEW 2: UPDATE MY PROFILE ─────────────────────────────────────────────────
# PATCH /api/auth/profile/update/
#
# PATCH means partial update — only send the fields you want to change.
# Example body for a student:
#   { "full_name": "Ali Benali", "speciality": "Informatique" }
# Example body for a company:
#   { "company_name": "TechCorp", "company_sector": "IT" }
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user

    # ── Step 1: Update base CustomUser fields ─────────────────────────────────
    # Only update what was actually sent. If a field is missing from the request,
    # keep the current value (don't overwrite with None).
    user.full_name = request.data.get('full_name', user.full_name)
    user.town      = request.data.get('town',      user.town)
    user.pnum      = request.data.get('pnum',      user.pnum)
    user.email     = request.data.get('email',     user.email)

    # update_fields tells Django to only run UPDATE on these 4 columns,
    # not re-save the entire user row (more efficient, safer).
    user.save(update_fields=['full_name', 'town', 'pnum', 'email'])

    # ── Step 2: Update role-specific fields ───────────────────────────────────

    if user.role == 'student':
        try:
            s = user.student
            s.speciality  = request.data.get('speciality',  s.speciality)
            s.institution = request.data.get('institution', s.institution)
            s.field       = request.data.get('field',       s.field)
            s.grade       = request.data.get('grade',       s.grade)
            s.save(update_fields=['speciality', 'institution', 'field', 'grade'])
        except Exception:
            pass   # Student profile might not exist in edge cases

    elif user.role == 'company':
        try:
            c = user.company
            c.company_name    = request.data.get('company_name',    c.company_name)
            c.company_sector  = request.data.get('company_sector',  c.company_sector)
            c.company_website = request.data.get('company_website', c.company_website)
            c.description     = request.data.get('description',     c.description)
            # 'company_town' to avoid conflict with the base user 'town' field
            c.town            = request.data.get('company_town',    c.town)
            c.save(update_fields=[
                'company_name', 'company_sector',
                'company_website', 'description', 'town',
            ])
        except Exception:
            pass

    return ok(message="Profile updated successfully.")