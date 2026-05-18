from django.shortcuts import get_object_or_404
from django.db        import IntegrityError
from django.db.models import Count, Avg
from django.utils     import timezone
from django.core.files.base import ContentFile
from django.conf import settings
import os
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework             import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators  import api_view, permission_classes

from .models       import Application, CompanyRating
from .serializers  import (
    ApplicationListSerializer, ApplicationDetailSerializer,
    ApplicationWriteSerializer, ApplicationReviewSerializer,
)
from .permissions  import IsStudent, IsAdmin, IsApplicationOwner, IsOfferOwnerOrAdmin
from notifications.models import Notification
from conventions.models import Convention


def ok(data=None, message="OK", http_status=status.HTTP_200_OK):
    return Response({"error": False, "message": message, "data": data}, status=http_status)

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)


def ensure_company_is_approved(user):
    if user.role != "company":
        return None
    company = getattr(user, "company", None)
    if not company:
        return fail("Company profile not found.", status.HTTP_404_NOT_FOUND)
    if not company.is_approved:
        return fail(
            "Your company account is pending admin approval. You cannot modify data yet.",
            status.HTTP_403_FORBIDDEN
        )
    return None
def _get_convention(application):
    try:
        return application.convention
    except Exception:
        return None


# ── VIEW 1: SUBMIT APPLICATION ─────────────────────────────────────────────────
class ApplicationListCreateView(APIView):
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = ApplicationWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": True, "message": "Validation failed.", "errors": serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        offer   = serializer.validated_data['offer']
        student = request.user.student

        # Idea A: Deadline check
        if offer.deadline and timezone.now().date() > offer.deadline:
            return fail(
                f"The application deadline for this offer was {offer.deadline.strftime('%d/%m/%Y')}.",
                status.HTTP_400_BAD_REQUEST
            )

        # Idea 2: Paid internship only for Master degree students
        if offer.is_paid:
            grade = (student.grade or '').lower()
            if 'master' not in grade:
                return fail(
                    "This is a paid internship. Only students with a Master degree can apply.",
                    status.HTTP_403_FORBIDDEN
                )

        try:
            application = serializer.save(student=student, status=Application.Status.PENDING)
        except IntegrityError:
            return fail("You have already applied to this offer.", status.HTTP_409_CONFLICT)
        Notification.objects.create(
            recipient=offer.company.user,
            message=f"New application received from {student.user.full_name} for '{offer.title}'."
        )

        return ok(data={"id": application.pk},
                  message="Application submitted successfully.",
                  http_status=status.HTTP_201_CREATED)


# ── VIEW 2: MY APPLICATIONS ────────────────────────────────────────────────────
class MyApplicationsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        filter_status = request.query_params.get("status")
        applications  = Application.objects.filter(
            student=request.user.student
        ).select_related("offer", "offer__company").order_by("-application_date")
        if filter_status:
            applications = applications.filter(status=filter_status.lower())
        serializer = ApplicationListSerializer(applications, many=True)
        return ok(data=serializer.data)


# ── VIEW 3: DETAIL / EDIT / WITHDRAW ──────────────────────────────────────────
class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(
            Application.objects.select_related("student", "student__user", "offer", "offer__company"),
            pk=pk,
        )

    def get(self, request, pk):
        application = self.get_object(pk)
        user        = request.user
        is_owner    = (application.student.user == user)
        is_company  = (user.role == "company" and application.offer.company.user == user)
        is_admin    = (user.role in ["admin", "administration"])
        if not (is_owner or is_company or is_admin):
            return fail("Permission denied.", status.HTTP_403_FORBIDDEN)
        return ok(data=ApplicationDetailSerializer(application).data)

    def patch(self, request, pk):
        application = self.get_object(pk)
        if not IsApplicationOwner().has_object_permission(request, self, application):
            return fail("You can only edit your own applications.", status.HTTP_403_FORBIDDEN)
        if application.status != Application.Status.PENDING:
            return fail("You can only edit pending applications.", status.HTTP_403_FORBIDDEN)
        serializer = ApplicationWriteSerializer(application, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"error": True, "message": "Validation failed.", "errors": serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return ok(message="Application updated.")

    def delete(self, request, pk):
        application = self.get_object(pk)
        if not IsApplicationOwner().has_object_permission(request, self, application):
            return fail("You can only withdraw your own applications.", status.HTTP_403_FORBIDDEN)
        if application.status in [Application.Status.ACCEPTED, Application.Status.REFUSED]:
            return fail("Cannot withdraw an application that has already been decided.", status.HTTP_403_FORBIDDEN)
        application.delete()
        return ok(message="Application withdrawn.")


# ── VIEW 4: COMPANY LISTS APPLICANTS FOR AN OFFER ─────────────────────────────
class OfferApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, offer_id):
        from offers.models import InternshipOffer
        offer = get_object_or_404(InternshipOffer, pk=offer_id)
        user  = request.user
        if not (user.role == "admin" or offer.company.user == user):
            return fail("Permission denied.", status.HTTP_403_FORBIDDEN)
        filter_status = request.query_params.get("status")
        applications  = Application.objects.filter(offer=offer).select_related(
            "student", "student__user", "offer"
            ).prefetch_related(
        "student__digital_cv",
        "student__digital_cv__skills",
        "student__digital_cv__educations",
        "student__digital_cv__experiences",
        "student__digital_cv__languages",
        ).order_by("-application_date")
        if filter_status:
            applications = applications.filter(status=filter_status.lower())
        return ok(data={
            "offer_id":     offer.pk,
            "offer_title":  offer.title,
            "count":        applications.count(),
            "applications": ApplicationListSerializer(applications, many=True).data,
        })


# ── VIEW 5: COMPANY REVIEWS APPLICATION ───────────────────────────────────────
class ReviewApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        application = get_object_or_404(
            Application.objects.select_related("offer", "offer__company", "student", "student__user"),
            pk=pk,
        )
        company_gate = ensure_company_is_approved(request.user)
        if company_gate:
            return company_gate
        if not IsOfferOwnerOrAdmin().has_object_permission(request, self, application):
            return fail("Permission denied.", status.HTTP_403_FORBIDDEN)

        serializer = ApplicationReviewSerializer(data=request.data, context={"application": application})
        if not serializer.is_valid():
            return Response({"error": True, "message": "Validation failed.", "errors": serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        new_status        = serializer.validated_data["status"]
        application.status = new_status
        application.save(update_fields=["status"])

        # Idea 4: Suggest YouTube courses when student is refused
        if new_status == Application.Status.REFUSED:
            tech_topic = application.offer.tech_stack or application.offer.title
            course_msg = _get_course_suggestions(tech_topic)
            Notification.objects.create(
                recipient=application.student.user,
                message=(
                    f"Votre candidature pour '{application.offer.title}' a été refusée.\n"
                    + course_msg
                )
            )
        elif new_status == Application.Status.ACCEPTED:
            application.stage_state = 'convention_to_sign'
            application.save(update_fields=['stage_state'])
            Notification.objects.create(
                recipient=application.student.user,
                message=f"Your application for '{application.offer.title}' was accepted. Please sign the convention."
            )

        messages = {
            Application.Status.REVIEWED: "Application marked as under review.",
            Application.Status.ACCEPTED: "Application accepted. A convention will be created.",
            Application.Status.REFUSED:  "Application refused.",
        }
        return ok(data={"id": application.pk, "status": application.status},
                  message=messages.get(new_status, "Status updated."))


def _get_course_suggestions(tech_topic):
    """
    Idea 4: Calls the YouTube Data API to find relevant free courses.
    Returns a formatted string of course links to add to the notification.
    If the API call fails (e.g. no API key configured), returns a generic message.
    """
    import os
    import urllib.request
    import urllib.parse
    import json

    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    if not api_key:
        return (
            "Pour améliorer votre profil, cherchez des cours sur YouTube ou Coursera "
            f"sur : {tech_topic}"
        )

    try:
        query  = urllib.parse.quote(f"{tech_topic} tutorial course")
        url    = (
            f"https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&q={query}&type=video&maxResults=3&key={api_key}"
        )
        req    = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data  = json.loads(resp.read())
            items = data.get('items', [])

        if not items:
            return f"Cherchez des cours sur : {tech_topic}"

        lines = ["Cours recommandés pour améliorer vos compétences :"]
        for item in items:
            title   = item['snippet']['title']
            video_id = item['id']['videoId']
            link    = f"https://www.youtube.com/watch?v={video_id}"
            lines.append(f"• {title} → {link}")
        return "\n".join(lines)

    except Exception:
        return f"Cherchez des cours sur : {tech_topic}"


# ── APPLICATIONS SCOPED TO UNIVERSITY (administration role) ─────────────────
class AdministrationApplicationsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "administration":
            return fail("Administration only.", status.HTTP_403_FORBIDDEN)
        admin_email = request.user.email or ""
        admin_domain = admin_email.split("@")[1].lower() if "@" in admin_email else ""
        if not admin_domain:
            return fail(
                "Could not determine institution scope from your email.",
                status.HTTP_400_BAD_REQUEST,
            )
        from users.models import Student

        scoped_ids = Student.objects.filter(
            user__email__iendswith=f"@{admin_domain}"
        ).values_list("id", flat=True)
        applications = Application.objects.filter(student_id__in=scoped_ids).select_related(
            "student", "student__user", "offer", "offer__company", "offer__company__user"
        ).order_by("-application_date")
        return ok(data=ApplicationListSerializer(applications, many=True).data)


# ── VIEW 6: ADMIN LISTS ALL APPLICATIONS ──────────────────────────────────────
class AdminAllApplicationsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        filter_status   = request.query_params.get("status")
        filter_offer_id = request.query_params.get("offer_id")
        applications    = Application.objects.select_related(
            "student", "student__user", "offer", "offer__company"
        ).order_by("-application_date")
        if filter_status:
            applications = applications.filter(status=filter_status.lower())
        if filter_offer_id:
            applications = applications.filter(offer_id=filter_offer_id)
        return ok(data=ApplicationListSerializer(applications, many=True).data)


# ── VIEW 7: PENDING VALIDATION LIST ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_validation_list(request):
    """
    Returns accepted applications that still need administration validation.
    - admin role        → sees ALL accepted applications
    - administration    → sees only accepted applications from their own university
                         (students whose email domain matches the admin's domain)
    """
    user = request.user
    if user.role not in ['administration', 'admin']:
        return Response({'error': 'Administration only.'}, status=403)

    applications = Application.objects.filter(
        status=Application.Status.ACCEPTED
    ).select_related('student__user', 'offer__company__user')

    # Scope to university if the caller is an administration user (not platform admin)
    if user.role == 'administration':
        admin_email  = user.email or ''
        admin_domain = admin_email.split('@')[1].lower() if '@' in admin_email else ''
        if admin_domain:
            applications = applications.filter(
                student__user__email__iendswith=f'@{admin_domain}'
            )

    data = [
        {
            'application_id':   app.pk,
            'student_name':     app.student.user.full_name,
            'student_number':   app.student.student_number,
            'speciality':       app.student.speciality,
            'offer_title':      app.offer.title,
            'company_name':     app.offer.company.user.full_name,
            'offer_town':       app.offer.town,
            'application_date': app.application_date,
        }
        for app in applications
    ]
    return Response({'pending_validations': data})


# ── VIEW 8: VALIDATE INTERNSHIP ────────────────────────────────────────────────
@api_view(['PUT', 'POST'])  # accept both verbs for flexibility
@permission_classes([IsAuthenticated])
def validate_internship(request, pk):
    # Role check FIRST — anyone who is not administration gets 403
    # regardless of the application status. This ensures permission
    # tests work correctly even when the application is still pending.
    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)
    application = get_object_or_404(
        Application.objects.select_related('student__user', 'offer__company__user',
                                           'offer__company', 'student'),
        pk=pk
    )
    if application.status != Application.Status.ACCEPTED:
        return Response({'error': f"Status must be 'accepted'. Current: '{application.status}'."}, status=400)

    application.status = Application.Status.VALIDATED
    application.stage_state = 'validated'  
    application.save(update_fields=['status', 'stage_state'])  
    # Keep Convention and Application workflow aligned.
    try:
        from conventions.models import Convention
        convention = _get_convention(application)
        if convention:
            convention.status = Convention.Status.VALIDATED
            convention.admin_signed_at = timezone.now()
            if not convention.start_date:
                convention.start_date = application.offer.start_date
            if not convention.end_date:
                convention.end_date = application.offer.end_date
            convention.save(update_fields=['status', 'admin_signed_at', 'start_date', 'end_date'])
    except Exception:
        pass

    # Idea 1: Auto-add internship to student's CV experience section
    try:
        from users.models import DigitalCV, CvExperience
        cv, _ = DigitalCV.objects.get_or_create(student=application.student)
        CvExperience.objects.create(
            cv          = cv,
            job_title   = application.offer.title,
            company     = (application.offer.company.company_name
                           or application.offer.company.user.full_name),
            location    = application.offer.town,
            start_date  = (application.offer.start_date
                           or application.application_date.date()),
            end_date    = application.offer.end_date,
            is_current  = False,
            description = (
                f"Stage validé via Stag.io. "
                f"Durée : {application.offer.duration or 'non précisée'}. "
                f"Technologies : {application.offer.tech_stack or 'non précisées'}."
            ),
        )
    except Exception:
        # Never let CV auto-update break the validation itself
        pass

    # Idea 6: Send PDF by email
    _send_validation_email(application)

    Notification.objects.create(
        recipient=application.student.user,
        message=(
            f"Félicitations ! Votre stage '{application.offer.title}' "
            f"chez {application.offer.company.user.full_name} a été validé. "
            f"Consultez la convention sur la plateforme."
        )
    )
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=(
            f"Le stage de {application.student.user.full_name} "
            f"pour '{application.offer.title}' a été validé par l'administration."
        )
    )
    return Response({
        'message':        'Internship validated successfully.',
        'application_id': application.pk,
        'student':        application.student.user.full_name,
        'offer':          application.offer.title,
        'new_status':     application.status,
    })


def _send_validation_email(application):
    """
    Idea 6: Send validation confirmation email to both student and company.
    Uses Django's built-in email support.
    Requires EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD in settings.py.
    """
    from django.core.mail import EmailMessage
    from conventions.models import Convention
    from conventions.pdf_generator import generate_convention_pdf

    student_email = application.student.user.email
    company_email = application.offer.company.user.email
    offer_title   = application.offer.title

    if not student_email:
        return  # No email address, skip silently

    try:
        # Email to student
        msg = EmailMessage(
            subject=f"[Stag.io] Votre stage '{offer_title}' a été validé",
            body=(
                f"Bonjour {application.student.user.full_name},\n\n"
                f"Votre stage '{offer_title}' chez "
                f"{application.offer.company.user.full_name} a été validé "
                f"par l'administration universitaire.\n\n"
                f"Connectez-vous à la plateforme Stag.io pour télécharger "
                f"votre convention de stage.\n\n"
                f"Bonne continuation !\n"
                f"L'équipe Stag.io"
            ),
            to=[student_email],
        )
        # Generate and attach Convention PDF if available.
        convention = _get_convention(application)
        if convention:
            rel_path = generate_convention_pdf(convention)
            abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            if os.path.exists(abs_path):
                with open(abs_path, "rb") as pdf_file:
                    msg.attach(
                        f"convention_{application.pk}.pdf",
                        pdf_file.read(),
                        "application/pdf",
                    )
        msg.send()

        # Email to company
        if company_email:
            msg2 = EmailMessage(
                subject=f"[Stag.io] Convention de stage validée — {application.student.user.full_name}",
                body=(
                    f"Bonjour,\n\n"
                    f"Le stage de {application.student.user.full_name} "
                    f"pour le poste '{offer_title}' a été validé.\n\n"
                    f"La convention de stage est disponible sur Stag.io.\n\n"
                    f"L'équipe Stag.io"
                ),
                to=[company_email],
            )
            if convention:
                rel_path = generate_convention_pdf(convention)
                abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
                if os.path.exists(abs_path):
                    with open(abs_path, "rb") as pdf_file:
                        msg2.attach(
                            f"convention_{application.pk}.pdf",
                            pdf_file.read(),
                            "application/pdf",
                        )
            msg2.send()
    except Exception:
        # Email failure must never break the validation flow
        pass


# ── VIEW 9: REJECT INTERNSHIP ──────────────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reject_internship(request, pk):
    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)
    application = get_object_or_404(
        Application.objects.select_related('student__user', 'offer__company__user'), pk=pk
    )
    if application.status != Application.Status.ACCEPTED:
        return Response({'error': f"Status must be 'accepted'. Current: '{application.status}'."}, status=400)

    reason             = request.data.get('reason', 'No reason provided.')
    application.status = Application.Status.REFUSED
    application.save(update_fields=['status'])

    Notification.objects.create(
        recipient=application.student.user,
        message=(f"Votre candidature pour '{application.offer.title}' a été rejetée. Motif : {reason}")
    )
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=(f"Le stage de {application.student.user.full_name} pour "
                 f"'{application.offer.title}' a été rejeté. Motif : {reason}")
    )
    return Response({
        'message':        'Internship rejected.',
        'application_id': application.pk,
        'new_status':     application.status,
        'reason':         reason,
    })


# ── VIEW 10: STATISTICS (Idea C — with date filters) ──────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    """
    GET /api/applications/stats/
    Supports: ?year=2025  ?month=6  ?year=2025&month=6

    Access rules:
      - admin role        → sees ALL students across ALL universities
      - administration role → sees ONLY students from their own university
                             (matched by the email domain they registered with)
    """
    user = request.user

    if user.role not in ['admin', 'administration']:
        return Response({'error': True, 'message': 'Access denied.'}, status=403)

    year  = request.query_params.get('year')
    month = request.query_params.get('month')

    from users.models  import Student, Company, AllowedInstitutionDomain
    from offers.models import InternshipOffer

    # ── Scope: what students can this user see? ───────────────────────────────
    if user.role == 'admin':
        # Admin sees everyone — no filter
        scoped_students = Student.objects.all()
        institution_label = "All universities"

    else:
        # Administration sees only students from their own university.
        # The administration user's own email was pre-registered in AllowedInstitutionDomain.
        # We extract the domain from that email to scope the student list.
        # e.g. chef.stage@ummto.dz was registered → domain = "ummto.dz"
        # → all students whose email ends with "@ummto.dz" belong to this university.
        admin_email  = user.email or ''
        admin_domain = admin_email.split('@')[1].lower() if '@' in admin_email else ''

        # Get institution name from the whitelist entry for a nice label
        institution_label = admin_domain
        try:
            entry = AllowedInstitutionDomain.objects.get(email__iexact=admin_email)
            institution_label = entry.institution or admin_domain
        except AllowedInstitutionDomain.DoesNotExist:
            pass   # fallback to domain string if not found

        # Filter students by their email domain
        scoped_students = Student.objects.filter(
            user__email__iendswith=f'@{admin_domain}'
        )

    # ── Applications scoped to these students ────────────────────────────────
    scoped_student_ids = scoped_students.values_list('id', flat=True)
    applications = Application.objects.filter(student_id__in=scoped_student_ids)

    # Apply optional date filters
    if year:
        try:
            applications = applications.filter(application_date__year=int(year))
        except ValueError:
            return Response({'error': True, 'message': 'Invalid year.'}, status=400)
    if month:
        try:
            applications = applications.filter(application_date__month=int(month))
        except ValueError:
            return Response({'error': True, 'message': 'Invalid month.'}, status=400)

    # ── Count applications by status ──────────────────────────────────────────
    status_qs = applications.values('status').annotate(count=Count('id'))
    counts    = {row['status']: row['count'] for row in status_qs}

    # ── Placed vs unplaced ────────────────────────────────────────────────────
    # "Placed" = student has at least one VALIDATED application
    placed_ids   = applications.filter(
        status='validated'
    ).values_list('student_id', flat=True).distinct()
    total_students = scoped_students.count()
    placed_count   = placed_ids.count()

    # ── Top offers for this scope ─────────────────────────────────────────────
    top_offers = (
        applications.values('offer__title')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    # ── Period label ──────────────────────────────────────────────────────────
    period = "All time"
    if year and month:
        period = f"{month}/{year}"
    elif year:
        period = str(year)

    return Response({'error': False, 'data': {
        'period':       period,
        'institution':  institution_label,   # shows which university this data is for
        'students': {
            'total':    total_students,
            'placed':   placed_count,         # validated internship
            'unplaced': total_students - placed_count,
        },
        # Admin gets global company/offer counts; administration gets scoped ones
        'companies': {
            'total': Company.objects.count() if user.role == 'admin' else None,
        },
        'offers': {
            'total': InternshipOffer.objects.count() if user.role == 'admin'
                     else InternshipOffer.objects.filter(status='open').count(),
            'open':  InternshipOffer.objects.filter(status='open').count(),
        },
        'applications': {
            'total':     applications.count(),
            'pending':   counts.get('pending',   0),
            'reviewed':  counts.get('reviewed',  0),
            'accepted':  counts.get('accepted',  0),
            'refused':   counts.get('refused',   0),
            'validated': counts.get('validated', 0),
        },
        'top_offers': [
            {'title': o['offer__title'], 'applications': o['count']}
            for o in top_offers
        ],
    }})


# ── VIEW 11: RATE COMPANY (Idea B) ────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_company(request, pk):
    if request.user.role != 'student':
        return Response({'error': 'Only students can rate companies.'}, status=403)
    application = get_object_or_404(
        Application.objects.select_related('student__user', 'offer__company'), pk=pk
    )
    if application.student.user != request.user:
        return Response({'error': 'You can only rate your own internships.'}, status=403)
    if application.status != Application.Status.VALIDATED:
        return Response({'error': 'Only validated internships can be rated.'}, status=400)
    if hasattr(application, 'rating'):
        return Response({'error': 'You have already rated this internship.'}, status=400)
    try:
        rating_value = int(request.data.get('rating', 0))
    except (ValueError, TypeError):
        return Response({'error': "'rating' must be a number."}, status=400)
    if not (1 <= rating_value <= 5):
        return Response({'error': 'Rating must be between 1 and 5.'}, status=400)
    CompanyRating.objects.create(
        application=application,
        rating=rating_value,
        comment=request.data.get('comment', ''),
    )
    return Response({'error': False, 'message': 'Thank you for your rating!',
                     'data': {'company': application.offer.company.company_name,
                              'rating': rating_value}})


# ── VIEW 12: GET COMPANY AVERAGE RATING (Idea B) ──────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def company_rating(request, company_id):
    from users.models import Company
    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found.'}, status=404)
    ratings = CompanyRating.objects.filter(application__offer__company=company)
    if not ratings.exists():
        return Response({'error': False, 'data': {
            'company': company.company_name, 'average_rating': None,
            'total_ratings': 0, 'ratings': []
        }})
    avg = ratings.aggregate(average=Avg('rating'))['average']
    return Response({'error': False, 'data': {
        'company':        company.company_name or company.user.full_name,
        'average_rating': round(avg, 1),
        'total_ratings':  ratings.count(),
        'ratings': [
            {'rating': r.rating, 'comment': r.comment,
             'created_at': r.created_at.isoformat()}
            for r in ratings.order_by('-created_at')
        ],
    }})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_stats(request):
    if request.user.role != 'company':
        return fail("Companies only.", status.HTTP_403_FORBIDDEN)
    company = request.user.company
    apps = Application.objects.filter(offer__company=company)
    return ok(data={
        'total_applications': apps.count(),
        'pending': apps.filter(status=Application.Status.PENDING).count(),
        'reviewed': apps.filter(status=Application.Status.REVIEWED).count(),
        'accepted': apps.filter(status=Application.Status.ACCEPTED).count(),
        'refused': apps.filter(status=Application.Status.REFUSED).count(),
        'validated': apps.filter(status=Application.Status.VALIDATED).count(),
    })

def _compute_cv_score(student):
    """Compute CV score dynamically — mirrors cv_score view logic."""
    score = 0
    if student.user.full_name: score += 10
    if student.user.pnum:      score += 5
    if student.institution:    score += 10
    if student.grade:          score += 5
    try:
        cv = student.digital_cv
        if cv.github or cv.linkedin or cv.portfolio: score += 10
        if cv.description:   score += 5
        if cv.educations.count() > 0:  score += 15
        if cv.experiences.count() > 0: score += 15
        skill_count = cv.skills.count()
        if skill_count >= 3:   score += 20
        elif skill_count > 0:  score += 10
        if cv.languages.count() > 0: score += 5
    except Exception:
        pass
    return min(score, 100)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_recent(request):
    if request.user.role != 'company':
        return fail("Companies only.", status.HTTP_403_FORBIDDEN)
    company = request.user.company
    recent = Application.objects.filter(
        offer__company=company
    ).select_related(
        'student__user', 'offer',
        'student__digital_cv',        # ← prefetch CV
    ).prefetch_related(
        'student__digital_cv__skills',      # ← prefetch skills count
        'student__digital_cv__educations',  # ← prefetch edu count
        'student__digital_cv__experiences', # ← prefetch exp count
        'student__digital_cv__languages',   # ← prefetch lang count
    ).order_by('-application_date')[:10]

    data = [{
        'application_id':   a.pk,
        'student_name':     a.student.user.full_name,
        'offer_title':      a.offer.title,
        'status':           a.status,
        'stage_state':      a.stage_state,
        'application_date': a.application_date.isoformat(),
        'cv_score':         _compute_cv_score(a.student),  # ← computed live
    } for a in recent]
    return ok(data=data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_actions(request):
    if request.user.role != 'company':
        return fail("Companies only.", status.HTTP_403_FORBIDDEN)
    company = request.user.company
    pending_review = Application.objects.filter(
        offer__company=company, status=Application.Status.PENDING
    ).count()
    pending_reports = Application.objects.filter(
        offer__company=company, stage_state='report_to_validate'
    ).count()
    pending_admin = Application.objects.filter(
        offer__company=company, status=Application.Status.ACCEPTED
    ).count()
    return ok(data={
        'pending_candidate_reviews': pending_review,
        'pending_report_validation': pending_reports,
        'pending_administration_validation': pending_admin,
    })


def _company_intern_ui_stage(application, convention):
    """Keys expected by the company My Interns UI."""
    if application.stage_state == "completed":
        return "completed"
    if convention:
        if (
            convention.status == Convention.Status.PENDING_COMPANY
            and not convention.company_signed_at
        ):
            return "convention_to_sign"
        if convention.status == Convention.Status.PENDING_STUDENT:
            return "pending_convention"
        if convention.status == Convention.Status.PENDING_ADMIN:
            return "convention_pending"
        if convention.status == Convention.Status.VALIDATED:
            return "ongoing"
    if application.stage_state in (
        "internship_in_progress",
        "report_to_validate",
        "report_validated",
    ):
        return "ongoing"
    if application.status == Application.Status.VALIDATED:
        return "ongoing"
    return "pending_convention"


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_interns(request):
    if request.user.role != 'company':
        return fail("Companies only.", status.HTTP_403_FORBIDDEN)
    company = request.user.company
    interns = Application.objects.filter(
        offer__company=company,
        status__in=[Application.Status.ACCEPTED, Application.Status.VALIDATED]
    ).select_related('student__user', 'offer').order_by('-application_date')
    data = []
    for a in interns:
        conv = Convention.objects.filter(application=a).first()
        data.append({
            'application_id': a.pk,
            'student_id': a.student_id,
            'student_name': a.student.user.full_name,
            'student_email': a.student.user.email,
            'offer_title': a.offer.title,
            'application_date': a.application_date.isoformat(),
            'status': a.status,
            'stage_state': a.stage_state,
            'stage': _company_intern_ui_stage(a, conv),
            'convention_id': conv.pk if conv else None,
            'convention_status': conv.status if conv else None,
            'report_file': a.report_file.url if a.report_file else None,
        })
    return ok(data=data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_report(request, pk):
    if request.user.role != 'student':
        return fail("Students only.", status.HTTP_403_FORBIDDEN)
    application = get_object_or_404(
        Application.objects.select_related('student__user', 'offer__company__user'),
        pk=pk,
        student=request.user.student,
    )
    report_file = request.FILES.get('report_file')
    if not report_file:
        return fail("'report_file' is required.")
    application.report_file = report_file
    application.report_submitted_at = timezone.now()
    application.stage_state = 'report_to_validate'
    application.save(update_fields=['report_file', 'report_submitted_at', 'stage_state'])
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=f"New internship report submitted by {application.student.user.full_name} for '{application.offer.title}'."
    )
    return ok(message="Report submitted successfully.")


def _issue_attestation(application):
    from io import BytesIO
    from reportlab.pdfgen import canvas
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(70, 800, "ATTESTATION DE STAGE")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(70, 760, f"Etudiant: {application.student.user.full_name}")
    pdf.drawString(70, 735, f"Entreprise: {application.offer.company.company_name or application.offer.company.user.full_name}")
    pdf.drawString(70, 710, f"Offre: {application.offer.title}")
    pdf.drawString(70, 685, f"Date d'emission: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.drawString(70, 640, "Ce document certifie la realisation du stage via Stag.io.")
    pdf.showPage()
    pdf.save()
    filename = f"attestation_{application.pk}.pdf"
    application.attestation_file.save(filename, ContentFile(buffer.getvalue()), save=False)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_report(request, pk):
    if request.user.role != 'company':
        return fail("Companies only.", status.HTTP_403_FORBIDDEN)
    company_gate = ensure_company_is_approved(request.user)
    if company_gate:
        return company_gate
    application = get_object_or_404(
        Application.objects.select_related('offer__company__user', 'student__user'),
        pk=pk,
        offer__company=request.user.company,
    )
    if not application.report_file:
        return fail("No report uploaded yet.")
    application.report_validated_at = timezone.now()
    application.stage_state = 'report_validated'
    application.save(update_fields=['report_validated_at', 'stage_state'])
    from users.models import CustomUser
    for admin_user in CustomUser.objects.filter(role='administration', is_active=True):
        Notification.objects.create(
            recipient=admin_user,
            message=f"Company validated report for {application.student.user.full_name} on '{application.offer.title}'.",
        )
    Notification.objects.create(
        recipient=application.student.user,
        message=f"Your report was validated by company and sent to administration for final attestation."
    )
    return ok(message="Report validated by company and sent to administration.")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_attestation(request, pk):
    if request.user.role != 'administration':
        return fail("Administration only.", status.HTTP_403_FORBIDDEN)
    application = get_object_or_404(
        Application.objects.select_related('offer__company__user', 'student__user'),
        pk=pk,
    )
    if not application.report_file or not application.report_validated_at:
        return fail("Company validation is required before issuing attestation.")
    _issue_attestation(application)
    application.attestation_issued_at = timezone.now()
    application.stage_state = 'completed'
    application.save(update_fields=['attestation_file', 'attestation_issued_at', 'stage_state'])
    Notification.objects.create(
        recipient=application.student.user,
        message=f"Administration issued your internship attestation for '{application.offer.title}'."
    )
    Notification.objects.create(
        recipient=application.offer.company.user,
        message=f"Administration issued attestation for intern {application.student.user.full_name}."
    )
    _send_attestation_email(application)
    return ok(message="Attestation issued successfully.")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_attestation(request, pk):
    if request.user.role != 'student':
        return fail("Students only.", status.HTTP_403_FORBIDDEN)
    application = get_object_or_404(
        Application.objects.select_related('student__user'),
        pk=pk,
        student=request.user.student,
    )
    if not application.attestation_file:
        return fail("Attestation not yet issued.", status.HTTP_404_NOT_FOUND)

    abs_path = application.attestation_file.path
    if not os.path.exists(abs_path):
        return fail("Attestation file not found on server.", status.HTTP_404_NOT_FOUND)

    from django.http import FileResponse
    return FileResponse(
        open(abs_path, "rb"),
        content_type="application/pdf",
        as_attachment=True,
        filename=f"attestation_{pk}.pdf",
    )
def _send_attestation_email(application):
    from django.core.mail import EmailMessage
    student_email = application.student.user.email
    if not student_email:
        return
    try:
        msg = EmailMessage(
            subject=f"[Stag.io] Attestation de stage — {application.offer.title}",
            body=(
                f"Bonjour {application.student.user.full_name},\n\n"
                f"Votre attestation de stage pour le poste '{application.offer.title}' "
                f"chez {application.offer.company.company_name or application.offer.company.user.full_name} "
                f"a été émise par l'administration universitaire.\n\n"
                f"Vous pouvez la télécharger depuis la plateforme Stag.io.\n\n"
                f"Félicitations !\n"
                f"L'équipe Stag.io"
            ),
            to=[student_email],
        )
        if application.attestation_file:
            abs_path = application.attestation_file.path
            if os.path.exists(abs_path):
                with open(abs_path, "rb") as f:
                    msg.attach(
                        f"attestation_{application.pk}.pdf",
                        f.read(),
                        "application/pdf",
                    )
        msg.send()
    except Exception:
        pass  # never break the flow