import os
from django.http              import FileResponse, Http404
from django.shortcuts         import get_object_or_404
from django.conf              import settings
from rest_framework.views     import APIView
from rest_framework.response  import Response
from rest_framework           import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .models          import Convention
from .pdf_generator   import generate_convention_pdf
from django.utils import timezone
from notifications.models import Notification
from users.models import CustomUser

#  HELPERS — same ok/fail pattern as other apps

def ok(data=None, message="OK", http_status=status.HTTP_200_OK):
    return Response({"error": False, "message": message, "data": data}, status=http_status)

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)

def _can_access_convention(user, convention):
    """
    Returns True if the user is allowed to access this convention.
    Called inside the view before serving the file.
    """
    if user.role in ["admin", "administration"]:
        return True

    student = convention.application.student.user
    company = convention.application.offer.company.user

    if user == student:
        return True
    if user == company:
        return True

    return False

class DownloadConventionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # ── Fetch the convention ─────────────────
        convention = get_object_or_404(
            Convention.objects.select_related(
                "application",
                "application__student__user",
                "application__offer",
                "application__offer__company__user",
            ),
            pk=pk,
        )

        # ── Access control ───────────────────────
        if not _can_access_convention(request.user, convention):
            return fail(
                "You do not have permission to download this convention.",
                status.HTTP_403_FORBIDDEN,
            )

        try:
            rel_path = generate_convention_pdf(convention)
        except Exception as e:
            return fail(
                f"PDF generation failed: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ── Save the path to the DB if not already saved ──
        if not convention.pdf_file:
            convention.pdf_file = rel_path
            convention.save(update_fields=["pdf_file"])

        # ── Build the absolute path and serve the file ──
        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)

        if not os.path.exists(abs_path):
            return fail("PDF file not found on server.", status.HTTP_500_INTERNAL_SERVER_ERROR)

        # FileResponse streams the file directly to the browser
        # as_attachment=True → browser downloads it instead of displaying it
        student_name = convention.application.student.user.full_name.replace(" ", "_")
        download_name = f"Convention_Stage_{student_name}_CONV{pk:04d}.pdf"

        response = FileResponse(
            open(abs_path, "rb"),
            content_type="application/pdf",
            as_attachment=True,
            filename=download_name,
        )
        return response


class ConventionPreviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        convention = get_object_or_404(
            Convention.objects.select_related(
                "application",
                "application__student__user",
                "application__offer",
                "application__offer__company__user",
            ),
            pk=pk,
        )

        if not _can_access_convention(request.user, convention):
            return fail(
                "You do not have permission to view this convention.",
                status.HTTP_403_FORBIDDEN,
            )

        student = convention.application.student.user
        student_profile = convention.application.student
        company = convention.application.offer.company.user
        company_profile = convention.application.offer.company
        offer   = convention.application.offer

        return ok(data={
            "id":     convention.pk,
            "status": convention.status,
            "ref":    f"CONV-{convention.pk:04d}",

            # Parties
            "student": {
                "name":        student.full_name,
                "email":       student.email,
                "institution": student_profile.institution,
                "grade":       student_profile.grade,
            },
            "company": {
                "name":   company_profile.company_name or company.full_name,
                "email":  company.email,
                "sector": company_profile.company_sector,
            },

            # Internship details
            "offer": {
                "title":    offer.title,
                "location": offer.town,
                "type":     offer.internship_type,
                "duration": offer.duration,
                "is_paid":  offer.is_paid,
                "salary":   offer.salary if offer.is_paid else None,
            },

            # Convention period
            "start_date": convention.start_date.isoformat() if convention.start_date else None,
            "end_date":   convention.end_date.isoformat()   if convention.end_date   else None,

            # Signature status
            "signatures": {
                "student_signed":  convention.student_signed_at is not None,
                "company_signed":  convention.company_signed_at is not None,
                "admin_validated": convention.admin_signed_at   is not None,
                "student_signed_at": convention.student_signed_at.isoformat() if convention.student_signed_at else None,
                "company_signed_at": convention.company_signed_at.isoformat() if convention.company_signed_at else None,
                "admin_signed_at":   convention.admin_signed_at.isoformat()   if convention.admin_signed_at   else None,
            },

            # PDF download available?
            "pdf_available":    bool(convention.pdf_file),
            "pdf_download_url": f"/api/conventions/{convention.pk}/download/",
        })


class SignConventionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        convention = get_object_or_404(
            Convention.objects.select_related(
                "application", "application__student__user", "application__offer__company__user"
            ),
            pk=pk,
        )
        user = request.user
        app = convention.application
        if user == app.student.user:
            if convention.status != Convention.Status.PENDING_STUDENT:
                return fail(
                    "Convention is not awaiting student signature.",
                    status.HTTP_400_BAD_REQUEST,
                )
            if convention.student_signed_at:
                return fail("Convention already signed by student.", status.HTTP_400_BAD_REQUEST)
            convention.student_signed_at = timezone.now()
            convention.status = Convention.Status.PENDING_COMPANY
            app.stage_state = 'internship_in_progress'
            convention.save(update_fields=['student_signed_at', 'status'])
            app.save(update_fields=['stage_state'])
            Notification.objects.create(
                recipient=app.offer.company.user,
                message=f"Student {app.student.user.full_name} signed convention for '{app.offer.title}'."
            )
            return ok(message="Student signature saved.")

        if user == app.offer.company.user:
            if convention.status != Convention.Status.PENDING_COMPANY:
                return fail(
                    "Convention is not awaiting company signature.",
                    status.HTTP_400_BAD_REQUEST,
                )
            if convention.company_signed_at:
                return fail("Convention already signed by company.", status.HTTP_400_BAD_REQUEST)
            convention.company_signed_at = timezone.now()
            convention.status = Convention.Status.PENDING_ADMIN
            convention.save(update_fields=['company_signed_at', 'status'])
            Notification.objects.create(
                recipient=app.student.user,
                message=f"Company signed your convention for '{app.offer.title}'. Waiting administration validation."
            )
            administration_users = CustomUser.objects.filter(role='administration', is_active=True)
            for admin_user in administration_users:
                Notification.objects.create(
                    recipient=admin_user,
                    message=f"Convention for '{app.offer.title}' is ready for administration validation.",
                )
            return ok(message="Company signature saved.")

        if user.role in ("administration", "admin"):
            if convention.status != Convention.Status.PENDING_ADMIN:
                return fail(
                    "Convention is not awaiting administration validation.",
                    status.HTTP_400_BAD_REQUEST,
                )
            if convention.admin_signed_at:
                return fail("Convention already validated.", status.HTTP_400_BAD_REQUEST)
            convention.admin_signed_at = timezone.now()
            convention.status = Convention.Status.VALIDATED
            convention.save(update_fields=["admin_signed_at", "status"])
            Notification.objects.create(
                recipient=app.student.user,
                message=f"Your convention for '{app.offer.title}' has been validated by the administration.",
            )
            Notification.objects.create(
                recipient=app.offer.company.user,
                message=f"Convention for '{app.offer.title}' has been validated by the administration.",
            )
            return ok(message="Convention validated by administration.")

        return fail("Permission denied.", status.HTTP_403_FORBIDDEN)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_admin_conventions(request):
    user = request.user
    if user.role not in ("administration", "admin"):
        return fail("Administration only.", status.HTTP_403_FORBIDDEN)
    qs = Convention.objects.filter(
        status=Convention.Status.PENDING_ADMIN
    ).select_related(
        "application__student__user",
        "application__offer",
        "application__offer__company__user",
        "application__offer__company",
    ).order_by("-updated_at")

    if user.role == "administration":
        admin_email = user.email or ""
        admin_domain = admin_email.split("@")[1].lower() if "@" in admin_email else ""
        if admin_domain:
            qs = qs.filter(application__student__user__email__iendswith=f"@{admin_domain}")

    data = [{
        "id": c.pk,
        "status": c.status,
        "student_name": c.application.student.user.full_name,
        "student_email": c.application.student.user.email,
        "company_name": c.application.offer.company.company_name or c.application.offer.company.user.full_name,
        "offer_title": c.application.offer.title,
        "offer_town": c.application.offer.town,
        "student_signed_at": c.student_signed_at.isoformat() if c.student_signed_at else None,
        "company_signed_at": c.company_signed_at.isoformat() if c.company_signed_at else None,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    } for c in qs]
    return ok(data=data, message=f"{len(data)} convention(s) pending administration validation.")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_conventions(request):
    """Student gets their own conventions."""
    if request.user.role != 'student':
        return fail("Students only.", status.HTTP_403_FORBIDDEN)

    conventions = Convention.objects.filter(
        application__student=request.user.student
    ).select_related(
        'application__offer',
        'application__offer__company__user',
        'application__offer__company',
    ).order_by('-created_at')

    data = [{
        'id':               c.pk,
        'status':           c.status,
        'application_id':   c.application.pk,
        'offer_title':      c.application.offer.title,
        'company_name':     c.application.offer.company.company_name or c.application.offer.company.user.full_name,
        'start_date':       c.start_date.isoformat() if c.start_date else None,
        'end_date':         c.end_date.isoformat()   if c.end_date   else None,
        'student_signed':   c.student_signed_at is not None,
        'company_signed':   c.company_signed_at is not None,
        'admin_validated':  c.admin_signed_at   is not None,
        'pdf_download_url': f"/api/conventions/{c.pk}/download/",
    } for c in conventions]

    return ok(data=data)