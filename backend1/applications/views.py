from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Application
from notifications.models import Notification

from rest_framework.views       import APIView # type: ignore 
from rest_framework             import status # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from django.db                  import IntegrityError   # type: ignore
from .serializers  import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationWriteSerializer,
    ApplicationReviewSerializer,
)
from .permissions  import (
    IsStudent,
    IsCompany,
    IsAdmin,
    IsApplicationOwner,
    IsOfferOwnerOrAdmin,
)
#───────────────────────────────────

def ok(data=None, message="OK", http_status=status.HTTP_200_OK):
    return Response({"error": False, "message": message, "data": data}, status=http_status)

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)

# ─────────────────────────────────────────────
#  VIEW 1 — SUBMIT AN APPLICATION
class ApplicationListCreateView(APIView):
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = ApplicationWriteSerializer(data=request.data)

        if not serializer.is_valid():
            # Return all validation errors at once (not just the first one)
            return Response(
                {"error": True, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            application = serializer.save(
                student=request.user.student,
                status=Application.Status.PENDING,
            )
        except IntegrityError:
            # unique_together (offer, student) was violated
            # Flask equivalent: existing = Submission.query.filter_by(...).first()
            #                   if existing: return ok(message="Already registered")
            return fail(
                "You have already applied to this offer.",
                status.HTTP_409_CONFLICT,
            )

        return ok(
            data={"id": application.pk},
            message="Application submitted successfully.",
            http_status=status.HTTP_201_CREATED,
        )

# ─────────────────────────────────────────────
#  VIEW 2 — MY APPLICATIONS (student dashboard)
class MyApplicationsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        # Optional filter by status: ?status=PENDING
        filter_status = request.query_params.get("status")

        applications = Application.objects.filter(
            student=request.user.student
        ).select_related("offer", "offer__company").order_by("-application_date")

        if filter_status:
            applications = applications.filter(status=filter_status.lower())

        serializer = ApplicationListSerializer(applications, many=True)
        return ok(data=serializer.data)

# ─────────────────────────────────────────────
#  VIEW 3 — DETAIL, UPDATE, DELETE (student)
class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(
            Application.objects.select_related(
                "student", "offer", "offer__company"
            ),
            pk=pk,
        )
    
    def get(self, request, pk):
        application = self.get_object(pk)

        # Access control — student sees own, company sees theirs, admin sees all
        user = request.user
        is_owner   = (application.student == user)
        is_company = (user.role == "company" and application.offer.created_by == user)
        is_admin   = (user.role == "admin")

        if not (is_owner or is_company or is_admin):
            return fail("You do not have permission to view this application.", status.HTTP_403_FORBIDDEN)

        serializer = ApplicationDetailSerializer(application)
        return ok(data=serializer.data)

    def patch(self, request, pk):
        application = self.get_object(pk)

        # Only the student who applied can edit
        perm = IsApplicationOwner()
        if not perm.has_object_permission(request, self, application):
            return fail("You can only edit your own applications.", status.HTTP_403_FORBIDDEN)

        # Cannot edit after it has been reviewed
        if application.status != Application.Status.PENDING:
            return fail(
                "You can only edit applications that are still pending.",
                status.HTTP_403_FORBIDDEN,
            )

        serializer = ApplicationWriteSerializer(
            application,
            data=request.data,
            partial=True,   # PATCH = only send the fields you want to change
        )

        if not serializer.is_valid():
            return Response(
                {"error": True, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return ok(message="Application updated successfully.")

    def delete(self, request, pk):
        application = self.get_object(pk)

        # Only the owner can withdraw
        perm = IsApplicationOwner()
        if not perm.has_object_permission(request, self, application):
            return fail("You can only withdraw your own applications.", status.HTTP_403_FORBIDDEN)

        # Cannot withdraw after decision has been made
        if application.status in [Application.Status.ACCEPTED, Application.Status.REJECTED]:
            return fail(
                "Cannot withdraw an application that has already been decided.",
                status.HTTP_403_FORBIDDEN,
            )

        application.delete()
        return ok(message="Application withdrawn successfully.")
# ─────────────────────────────────────────────
#  VIEW 4 — COMPANY: LIST ALL APPLICANTS FOR AN OFFER
class OfferApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, offer_id):
        from offers.models import InternshipOffer  # local import to avoid circular imports

        offer = get_object_or_404(InternshipOffer, pk=offer_id)

        # Only the company that owns the offer, or admin, can see applicants
        user = request.user
        if not (user.role == "admin" or offer.company.user == user):
            return fail(
                "Only the offer owner or an admin can view applicants.",
                status.HTTP_403_FORBIDDEN,
            )
        # Optional status filter: ?status=PENDING
        filter_status = request.query_params.get("status")
        applications  = Application.objects.filter(
            offer=offer
        ).select_related("student", "offer").order_by("-application_date")

        if filter_status:
            applications = applications.filter(status=filter_status.lower())

        serializer = ApplicationListSerializer(applications, many=True)
        return ok(
            data={
                "offer_id":    offer.pk,
                "offer_title": offer.title,
                "count":       applications.count(),
                "applications": serializer.data,
            }
        )
# ─────────────────────────────────────────────
#  VIEW 5 — COMPANY: REVIEW AN APPLICATION

class ReviewApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        application = get_object_or_404(
            Application.objects.select_related("offer", "offer__company"),
            pk=pk,
        )

        # Only the company that owns the offer (or admin) can review
        perm = IsOfferOwnerOrAdmin()
        if not perm.has_object_permission(request, self, application):
            return fail(
                "Only the offer owner or an admin can review applications.",
                status.HTTP_403_FORBIDDEN,
            )

        serializer = ApplicationReviewSerializer(
            data=request.data,
            context={"application": application},
        )

        if not serializer.is_valid():
            return Response(
                {"error": True, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = serializer.validated_data["status"]
        application.status = new_status
        application.save(update_fields=["status"])

        # Status messages mirror Flask's ok("Approved") / ok("Suspended")
        messages = {
            Application.Status.REVIEWED: "Application marked as under review.",
            Application.Status.ACCEPTED: "Application accepted. A convention will be created.",
            Application.Status.REFUSED: "Application rejected.",
        }

        return ok(
            data={"id": application.pk, "status": application.status},
            message=messages.get(new_status, "Status updated."),
        )

# ─────────────────────────────────────────────
#  VIEW 6 — ADMIN: LIST ALL APPLICATIONS
class AdminAllApplicationsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filter_status   = request.query_params.get("status")
        filter_offer_id = request.query_params.get("offer_id")

        applications = Application.objects.select_related(
            "student", "offer", "offer__company"
        ).order_by("-application_date")

        if filter_status:
            applications = applications.filter(status=filter_status.lower())

        if filter_offer_id:
            applications = applications.filter(offer_id=filter_offer_id)

        serializer = ApplicationListSerializer(applications, many=True)
        return ok(data=serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_validation_list(request):

    # Only administration role can access this
    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)
    
    applications = Application.objects.filter(
        status=Application.Status.ACCEPTED
    ).select_related(
        'student__user',
        'offer__company__user',
    )

    data = []
    for app in applications:
        data.append({
            'application_id':   app.pk,
            'student_name':     app.student.user.full_name,
            'student_number':   app.student.student_number,
            'speciality':       app.student.speciality,
            'offer_title':      app.offer.title,
            'company_name':     app.offer.company.user.full_name,
            'offer_town':       app.offer.town,
            'application_date': app.application_date,
        })

    return Response({'pending_validations': data})



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def validate_internship(request, pk):

    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)

    
    application = get_object_or_404(
        Application.objects.select_related(
            'student__user',
            'offer__company__user',
        ),
        pk=pk
    )

  
    if application.status != 'accepted':
        return Response(
            {'error': f"Cannot validate. Current status is '{application.status}'. Must be 'accepted' first."},
            status=400
        )

  
    application.status = Application.Status.VALIDATED
    application.save(update_fields=['status'])

    # Notify the student
    Notification.objects.create(
        recipient=application.student.user,
        message=(
            f"Félicitations ! Votre stage '{application.offer.title}' "
            f"chez {application.offer.company.user.full_name} "
            f"a été validé par l'administration universitaire."
        )
    )

    # Notify the company
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=(
            f"Le stage de {application.student.user.full_name} "
            f"pour l'offre '{application.offer.title}' "
            f"a été validé par l'administration universitaire."
        )
    )

    return Response({
        'message':        'Internship validated successfully.',
        'application_id': application.pk,
        'student':        application.student.user.full_name,
        'offer':          application.offer.title,
        'new_status':     application.status,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reject_internship(request, pk):

    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)

    application = get_object_or_404(
        Application.objects.select_related(
            'student__user',
            'offer__company__user',
        ),
        pk=pk
    )

   
    if application.status != Application.Status.ACCEPTED:
        return Response(
            {'error': f"Cannot reject. Current status is '{application.status}'. Must be 'accepted' first."},
            status=400
        )

   
    reason = request.data.get('reason', 'No reason provided.')

    
    application.status = Application.Status.PENDING
    application.save(update_fields=['status'])

    # Notify the student
    Notification.objects.create(
        recipient=application.student.user,
        message=(
            f"Votre candidature pour le stage '{application.offer.title}' "
            f"a été rejetée par l'administration universitaire. "
            f"Motif : {reason}"
        )
    )

    # Notify the company
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=(
            f"Le stage de {application.student.user.full_name} "
            f"pour l'offre '{application.offer.title}' "
            f"a été rejeté par l'administration. "
            f"Motif : {reason}"
        )
    )

    return Response({
        'message':        'Internship rejected.',
        'application_id': application.pk,
        'student':        application.student.user.full_name,
        'offer':          application.offer.title,
        'new_status':     application.status,
        'reason':         reason,
    })