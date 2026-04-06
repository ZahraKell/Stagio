from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Application
from notifications.models import Notification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_validation_list(request):

    # Only administration role can access this
    if request.user.role != 'administration':
        return Response({'error': 'Administration only.'}, status=403)
    
    applications = Application.objects.filter(
        status='accepted'
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

  
    application.status = 'validated'
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

   
    if application.status != 'accepted':
        return Response(
            {'error': f"Cannot reject. Current status is '{application.status}'. Must be 'accepted' first."},
            status=400
        )

   
    reason = request.data.get('reason', 'No reason provided.')

    
    application.status = 'pending'
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