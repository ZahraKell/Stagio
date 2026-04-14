from rest_framework import serializers
from .models import InternshipOffer


class OfferSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(
        source='company.user.full_name',
        read_only=True
    )
    company_town = serializers.CharField(
        source='company.town',
        read_only=True
    )

    class Meta:
        model = InternshipOffer
        fields = [
            'id',
            'company_name',
            'company_town',
            'title',
            'description',
            'town',
            'tech_stack',
            'status',
            'date_posted',
            'start_date',
            'end_date',
            'duration',
        ]


class CreateOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipOffer
        fields = [
            'title',
            'description',
            'town',
            'tech_stack',
            'start_date',
            'end_date',
            'duration',
        ]

