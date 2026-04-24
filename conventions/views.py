import os
from django.http              import FileResponse, Http404
from django.shortcuts         import get_object_or_404
from django.conf              import settings
from django.utils             import timezone
from rest_framework.views     import APIView
from rest_framework.response  import Response
from rest_framework           import status
from rest_framework.permissions import IsAuthenticated
from .models          import Convention
from .pdf_generator   import generate_convention_pdf

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

        student = convention.application.student
        company = convention.application.offer.company
        offer   = convention.application.offer

        return ok(data={
            "id":     convention.pk,
            "status": convention.status,
            "ref":    f"CONV-{convention.pk:04d}",

            # Parties
            "student": {
                "name":        student.user.full_name,
                "email":       student.user.email,
                "institution": student.institution,
                "grade":       student.grade,
            },
            "company": {
                "name":   company.company_name or company.user.full_name,
                "email":  company.user.email,
                "sector": company.company_sector,
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

# ─────────────────────────────────────────────────────────────────────────────
#  VIEW 3 — SIGN / VALIDATE A CONVENTION
class SignConventionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        convention = get_object_or_404(
            Convention.objects.select_related(
                "application",
                "application__student__user",
                "application__offer__company__user",
            ),
            pk=pk,
        )

        user = request.user
        now  = timezone.now()    # current timestamp — used for signed_at fields

        # ── STUDENT SIGNS ─────────────────────────────────────────────────────
        if user.role == 'student':
            # Security: make sure this student owns this convention
            if convention.application.student.user != user:
                return fail("This is not your convention.", status.HTTP_403_FORBIDDEN)

            if convention.status != Convention.Status.PENDING_STUDENT:
                return fail(
                    f"Cannot sign now. Current status is '{convention.status}'. "
                    f"Expected: '{Convention.Status.PENDING_STUDENT}'.",
                    status.HTTP_400_BAD_REQUEST,
                )

            convention.student_signed_at = now
            convention.status = Convention.Status.PENDING_COMPANY   # advance to next step
            convention.save(update_fields=['student_signed_at', 'status'])

            return ok(message="Convention signed by student. Waiting for company signature.")

        # ── COMPANY SIGNS ─────────────────────────────────────────────────────
        elif user.role == 'company':
            if convention.application.offer.company.user != user:
                return fail("This is not your convention.", status.HTTP_403_FORBIDDEN)

            if convention.status != Convention.Status.PENDING_COMPANY:
                return fail(
                    f"Cannot sign now. Current status is '{convention.status}'. "
                    f"Expected: '{Convention.Status.PENDING_COMPANY}'.",
                    status.HTTP_400_BAD_REQUEST,
                )

            convention.company_signed_at = now
            convention.status = Convention.Status.PENDING_ADMIN     # advance to next step
            convention.save(update_fields=['company_signed_at', 'status'])

            return ok(message="Convention signed by company. Waiting for administration validation.")

        # ── ADMINISTRATION / ADMIN VALIDATES ──────────────────────────────────
        elif user.role in ['admin', 'administration']:
            if convention.status != Convention.Status.PENDING_ADMIN:
                return fail(
                    f"Cannot validate now. Current status is '{convention.status}'. "
                    f"Expected: '{Convention.Status.PENDING_ADMIN}'.",
                    status.HTTP_400_BAD_REQUEST,
                )

            convention.admin_signed_at = now
            convention.status = Convention.Status.VALIDATED          # final step
            convention.save(update_fields=['admin_signed_at', 'status'])

            # Notify both parties that the convention is fully validated
            from notifications.models import Notification

            Notification.objects.create(
                recipient=convention.application.student.user,
                message=(
                    f"Votre convention de stage CONV-{convention.pk:04d} "
                    f"a été validée par l'administration. "
                    f"Vous pouvez la télécharger depuis la plateforme."
                )
            )
            Notification.objects.create(
                recipient=convention.application.offer.company.user,
                message=(
                    f"La convention de stage CONV-{convention.pk:04d} "
                    f"a été validée par l'administration universitaire."
                )
            )

            return ok(message="Convention fully validated. Both parties have been notified.")

        else:
            return fail("You are not allowed to sign conventions.", status.HTTP_403_FORBIDDEN)