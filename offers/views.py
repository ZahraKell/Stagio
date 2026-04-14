from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import InternshipOffer
from .serializers import OfferSerializer, CreateOfferSerializer
from users.models import Company


def get_company_profile(user):
    try:
        return Company.objects.get(user=user)
    except Company.DoesNotExist:
        return None

@api_view(['GET'])
@permission_classes([AllowAny])
def list_offers(request):
    offers = InternshipOffer.objects.filter(status='open')
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_offer(request, id):
    try:
        offer = InternshipOffer.objects.get(id=id)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)
    except InternshipOffer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_offer(request):

    #  only companies can create offers
    if request.user.role != 'company':
        return Response(
            {'error': 'Only companies can create offers'},
            status=status.HTTP_403_FORBIDDEN
        )

    # get the company profile of this user
    company = get_company_profile(request.user)
    if not company:
        return Response(
            {'error': 'Company profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    #  validate the data sent by the company
    serializer = CreateOfferSerializer(data=request.data)
    if serializer.is_valid():
        # save with company linked automatically
        serializer.save(company=company, status='open')
        return Response(
            {'message': 'Offer created successfully!'},
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_offer(request, id):

    if request.user.role != 'company':
        return Response(
            {'error': 'Only companies can update offers'},
            status=status.HTTP_403_FORBIDDEN
        )

    company = get_company_profile(request.user)
    if not company:
        return Response(
            {'error': 'Company profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        offer = InternshipOffer.objects.get(
            id=id,
            company=company
        )
    except InternshipOffer.DoesNotExist:
        return Response(
            {'error': 'Offer not found or you do not own this offer'},
            status=status.HTTP_404_NOT_FOUND
        )

    
    serializer = CreateOfferSerializer(
        instance=offer,
        data=request.data
    )
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'message': 'Offer updated successfully!'}
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_offer(request, id):

    if request.user.role != 'company':
        return Response(
            {'error': 'Only companies can delete offers'},
            status=status.HTTP_403_FORBIDDEN
        )

    company = get_company_profile(request.user)
    if not company:
        return Response(
            {'error': 'Company profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        offer = InternshipOffer.objects.get(
            id=id,
            company=company
        )
        offer.delete()
        return Response(
            {'message': 'Offer deleted successfully!'}
        )
    except InternshipOffer.DoesNotExist:
        return Response(
            {'error': 'Offer not found or you do not own this offer'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_offers(request):

    if request.user.role != 'company':
        return Response(
            {'error': 'Only companies can access this'},
            status=status.HTTP_403_FORBIDDEN
        )

    company = get_company_profile(request.user)
    if not company:
        return Response(
            {'error': 'Company profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    offers = InternshipOffer.objects.filter(company=company)
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def filter_offers(request):

    
    offers = InternshipOffer.objects.filter(status='open')

  
    town = request.query_params.get('town')
    tech = request.query_params.get('tech')

    if town:
        offers = offers.filter(town__icontains=town)
    if tech:
        offers = offers.filter(tech_stack__icontains=tech)

    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)

