import os
from django.http              import FileResponse, Http404
from django.shortcuts         import get_object_or_404
from django.conf              import settings
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
    if user.role == "ADMIN":
        return True

    student = convention.application.student
    company = convention.application.offer.created_by

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
                "application__student",
                "application__offer",
                "application__offer__created_by",
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
        student_name = convention.application.student.full_name.replace(" ", "_")
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
                "application__student",
                "application__offer",
                "application__offer__created_by",
            ),
            pk=pk,
        )

        if not _can_access_convention(request.user, convention):
            return fail(
                "You do not have permission to view this convention.",
                status.HTTP_403_FORBIDDEN,
            )

        student = convention.application.student
        company = convention.application.offer.created_by
        offer   = convention.application.offer

        return ok(data={
            "id":     convention.pk,
            "status": convention.status,
            "ref":    f"CONV-{convention.pk:04d}",

            # Parties
            "student": {
                "name":        student.full_name,
                "email":       student.email,
                "institution": student.institution,
                "grade":       student.grade,
            },
            "company": {
                "name":   company.company_name or company.full_name,
                "email":  company.email,
                "sector": company.company_sector,
            },

            # Internship details
            "offer": {
                "title":    offer.title,
                "location": offer.location,
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