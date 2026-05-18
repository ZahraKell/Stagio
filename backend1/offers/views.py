from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response   import Response
from rest_framework            import status
from .models     import InternshipOffer
from .serializers import OfferSerializer, CreateOfferSerializer
from users.models import Company


def get_company_profile(user):
    try:
        return Company.objects.get(user=user)
    except Company.DoesNotExist:
        return None


def _is_platform_admin(user):
    return user.is_authenticated and getattr(user, "role", None) == "admin"


# GET /api/admin/offers/  (via users.admin_urls)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_offers(request):
    if not _is_platform_admin(request.user):
        return Response({"error": "Admins only"}, status=403)
    offers = InternshipOffer.objects.all().select_related(
        "company", "company__user"
    ).order_by("-date_posted")
    return Response(OfferSerializer(offers, many=True).data)


# PATCH /api/admin/offers/<id>/status/  body: {"status": "open"|"closed"|"filled"}
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_patch_offer_status(request, id):
    if not _is_platform_admin(request.user):
        return Response({"error": "Admins only"}, status=403)
    new_status = request.data.get("status")
    if new_status not in ("open", "closed", "filled"):
        return Response({"error": "Invalid status"}, status=400)
    try:
        offer = InternshipOffer.objects.select_related(
            "company", "company__user"
        ).get(pk=id)
    except InternshipOffer.DoesNotExist:
        return Response({"error": "Offer not found"}, status=404)
    offer.status = new_status
    offer.save(update_fields=["status"])
    return Response(OfferSerializer(offer).data)


# GET /api/offers/
@api_view(['GET'])
@permission_classes([AllowAny])
def list_offers(request):
    from django.utils import timezone
    # Auto-close expired offers
    InternshipOffer.objects.filter(
        status='open',
        deadline__lt=timezone.now().date()
    ).update(status='closed')
    
    offers = InternshipOffer.objects.filter(status='open').select_related('company', 'company__user').order_by('-date_posted')
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)


# GET /api/offers/<id>/
@api_view(['GET'])
@permission_classes([AllowAny])
def get_offer(request, id):
    try:
        offer      = InternshipOffer.objects.select_related('company', 'company__user').get(id=id)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)
    except InternshipOffer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)


# POST /api/offers/create/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_offer(request):
    if request.user.role != 'company':
        return Response({'error': 'Only companies can create offers'}, status=403)
    company = get_company_profile(request.user)
    if not company:
        return Response({'error': 'Company profile not found'}, status=404)
    if not company.is_approved:
        return Response({'error': 'Company account must be approved before creating offers.'}, status=403)
    serializer = CreateOfferSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(company=company, status='open')
        return Response({'message': 'Offer created successfully!'}, status=201)
    return Response(serializer.errors, status=400)


# PUT /api/offers/<id>/update/
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_offer(request, id):
    if request.user.role != 'company':
        return Response({'error': 'Only companies can update offers'}, status=403)
    company = get_company_profile(request.user)
    if not company:
        return Response({'error': 'Company profile not found'}, status=404)
    if not company.is_approved:
        return Response({'error': 'Company account must be approved before updating offers.'}, status=403)
    try:
        offer = InternshipOffer.objects.get(id=id, company=company)
    except InternshipOffer.DoesNotExist:
        return Response({'error': 'Offer not found or not yours'}, status=404)
    serializer = CreateOfferSerializer(instance=offer, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Offer updated successfully!'})
    return Response(serializer.errors, status=400)


# DELETE /api/offers/<id>/delete/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_offer(request, id):
    if request.user.role != 'company':
        return Response({'error': 'Only companies can delete offers'}, status=403)
    company = get_company_profile(request.user)
    if not company:
        return Response({'error': 'Company profile not found'}, status=404)
    if not company.is_approved:
        return Response({'error': 'Company account must be approved before deleting offers.'}, status=403)
    try:
        offer = InternshipOffer.objects.get(id=id, company=company)
        offer.delete()
        return Response({'message': 'Offer deleted successfully!'})
    except InternshipOffer.DoesNotExist:
        return Response({'error': 'Offer not found or not yours'}, status=404)


# GET /api/offers/mine/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_offers(request):
    if request.user.role != 'company':
        return Response({'error': 'Only companies can access this'}, status=403)
    company = get_company_profile(request.user)
    if not company:
        return Response({'error': 'Company profile not found'}, status=404)
    offers     = InternshipOffer.objects.filter(company=company)
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)


# GET /api/offers/filter/?town=&tech=&type=&field=&duration=
@api_view(['GET'])
@permission_classes([AllowAny])
def filter_offers(request):
    offers = InternshipOffer.objects.filter(status='open')
    town            = request.query_params.get('town')
    tech            = request.query_params.get('tech')
    internship_type = request.query_params.get('type')
    field           = request.query_params.get('field')
    duration        = request.query_params.get('duration')
    if town:
        offers = offers.filter(town__icontains=town)
    if tech:
        offers = offers.filter(tech_stack__icontains=tech)
    if internship_type:
        offers = offers.filter(internship_type=internship_type.upper())
    if field:
        offers = offers.filter(field__icontains=field)
    if duration:
        offers = offers.filter(duration__icontains=duration)
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)


# Idea D — Offer recommendation system
# GET /api/offers/recommended/
# Matches open offers against the student's skills in their CV.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_offers(request):
    if request.user.role != 'student':
        return Response({'error': False, 'message': 'Only students can get recommendations.', 'data': []})
    try:
        student    = request.user.student
        cv         = student.digital_cv
        skill_names = list(cv.skills.values_list('name', flat=True))
    except Exception:
        return Response({'error': False, 'message': 'Complete your CV first to get recommendations.', 'data': []})

    if not skill_names:
        return Response({'error': False, 'message': 'Add skills to your CV to get recommendations.', 'data': []})

    offers        = InternshipOffer.objects.filter(status='open').select_related('company', 'company__user')
    scored_offers = []
    for offer in offers:
        # Combine tech_stack and skills fields into one searchable string
        offer_text = ((offer.tech_stack or '') + ' ' + (offer.skills or '')).lower()
        score      = 0
        matched    = []
        for skill in skill_names:
            if skill.lower() in offer_text:
                score += 1
                matched.append(skill)
        if score > 0:
            scored_offers.append({'score': score, 'matched': matched, 'offer': offer})

    # Sort by how many skills matched — best match first
    scored_offers.sort(key=lambda x: x['score'], reverse=True)

    data = []
    for item in scored_offers[:10]:   # top 10 matches
        o = item['offer']
        data.append({
            'id':              o.pk,
            'title':           o.title,
            'company':         o.company.company_name or o.company.user.full_name,
            'town':            o.town,
            'tech_stack':      o.tech_stack,
            'duration':        o.duration,
            'internship_type': o.internship_type,
            'is_paid':         o.is_paid,
            'deadline':        o.deadline.isoformat() if o.deadline else None,
            'match_score':     item['score'],
            'matched_skills':  item['matched'],
        })

    return Response({'error': False, 'message': f"{len(data)} offers match your skills.", 'data': data})


# Idea 5 — Company locations for map
# GET /api/offers/company-locations/
@api_view(['GET'])
@permission_classes([AllowAny])
def company_locations(request):
    companies = Company.objects.filter(
        latitude__isnull=False, longitude__isnull=False
    ).select_related('user')
    data = [
        {
            'name':      c.company_name or c.user.full_name,
            'sector':    c.company_sector,
            'town':      c.town,
            'latitude':  c.latitude,
            'longitude': c.longitude,
            'website':   c.company_website,
        }
        for c in companies
    ]
    return Response({'error': False, 'data': data})