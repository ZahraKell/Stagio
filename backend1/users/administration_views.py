from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Company, Student


def ok(data=None, message="OK"):
    from rest_framework.response import Response
    return Response({"error": False, "message": message, "data": data})


def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    from rest_framework.response import Response
    return Response({"error": True, "message": message}, status=http_status)


def _administration_domain(user):
    if user.role != "administration":
        return None
    email = user.email or ""
    if "@" not in email:
        return None
    return email.split("@")[1].lower()


def _scoped_students_queryset(user):
    domain = _administration_domain(user)
    if not domain:
        return Student.objects.none()
    return Student.objects.filter(user__email__iendswith=f"@{domain}").select_related("user")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_scoped_students(request):
    if request.user.role != "administration":
        return fail("Administration only.", status.HTTP_403_FORBIDDEN)
    students = _scoped_students_queryset(request.user).order_by("user__full_name")
    data = [
        {
            "id": s.pk,
            "full_name": s.user.full_name,
            "email": s.user.email,
            "phone": s.user.pnum,
            "town": s.user.town,
            "student_number": s.student_number,
            "speciality": s.speciality,
            "institution": s.institution,
            "field": s.field,
            "grade": s.grade,
            "average_mark": s.average_mark,
        }
        for s in students
    ]
    return ok(data=data, message=f"{len(data)} student(s).")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_scoped_companies(request):
    if request.user.role != "administration":
        return fail("Administration only.", status.HTTP_403_FORBIDDEN)
    from applications.models import Application

    scoped = _scoped_students_queryset(request.user)
    company_ids = (
        Application.objects.filter(student__in=scoped)
        .values_list("offer__company_id", flat=True)
        .distinct()
    )
    companies = Company.objects.filter(pk__in=company_ids).select_related("user").order_by("company_name")
    data = [
        {
            "id": c.pk,
            "company_name": c.company_name or c.user.full_name,
            "company_sector": c.company_sector,
            "town": c.town,
            "company_website": c.company_website,
            "email": c.user.email,
            "is_approved": c.is_approved,
            "is_rejected": c.is_rejected,
        }
        for c in companies
    ]
    return ok(data=data, message=f"{len(data)} compan(ies).")
