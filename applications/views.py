from django.shortcuts import get_object_or_404
from django.db        import IntegrityError
from django.db.models import Count, Avg
from django.utils     import timezone
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


def ok(data=None, message="OK", http_status=status.HTTP_200_OK):
    return Response({"error": False, "message": message, "data": data}, status=http_status)

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)


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
    application.save(update_fields=['status'])

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
    import os
    from django.core.mail import EmailMessage

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
    application.status = Application.Status.PENDING
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