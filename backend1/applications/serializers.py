from rest_framework import serializers
from .models import Application

class ApplicationListSerializer(serializers.ModelSerializer):
    offer_title = serializers.CharField(source="offer.title", read_only=True)
    offer_location = serializers.CharField(source="offer.town", read_only=True)
    offer_company_name = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True)
    student_id = serializers.IntegerField(source="student.pk", read_only=True)
    cv_score = serializers.SerializerMethodField()  # ← THIS LINE must be here

    class Meta:
        model = Application
        fields = [
            "id", "offer", "offer_title", "offer_location", "offer_company_name",
            "student_name", "student_email", "student_id",
            "cv_score",  # ← and here
            "status", "stage_state", "application_date",
            "report_submitted_at", "report_validated_at", "attestation_issued_at",
        ]

    def get_offer_company_name(self, obj):
        try:
            c = obj.offer.company
            return c.company_name or c.user.full_name
        except Exception:
            return None

    def get_cv_score(self, obj):  # ← AND this method must be here
        try:
            s = obj.student
            cv = s.digital_cv
            score = 0
            if s.user.full_name: score += 10
            if s.user.pnum:      score += 5
            if s.institution:    score += 10
            if s.grade:          score += 5
            if cv.github or cv.linkedin or cv.portfolio: score += 10
            if cv.description:   score += 5
            if cv.educations.count() > 0:  score += 15
            if cv.experiences.count() > 0: score += 15
            skill_count = cv.skills.count()
            if skill_count >= 3:   score += 20
            elif skill_count > 0:  score += 10
            if cv.languages.count() > 0: score += 5
            return min(score, 100)
        except Exception:
            return 0

class ApplicationDetailSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_email = serializers.EmailField(source="student.user.email", read_only=True)

    offer_title = serializers.CharField(source="offer.title", read_only=True)
    offer_company = serializers.CharField(source="offer.company.user.full_name", read_only=True)
    offer_location = serializers.CharField(source="offer.town", read_only=True)
    convention_id = serializers.SerializerMethodField()

    def get_convention_id(self, obj):
        # safely returns the convention ID or None if not created yet
        try:
            return obj.convention.pk
        except Exception:
            return None
        
    class Meta:
        model = Application
        fields = [
            "id",
            "offer",
            "offer_title",
            "offer_company",
            "offer_location",
            "student_name",
            "student_email",
            "cover_letter",
            "status",
            "stage_state",
            "application_date",
            "convention_id",
        ]

class ApplicationWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Application
        fields = [
            "offer",
            "cover_letter",
        ]

    def validate_offer(self, offer):
        if offer.status != "open":
            raise serializers.ValidationError(
                "This offer is not accepting applications."
            )
        return offer
    
class ApplicationReviewSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=["reviewed", "accepted", "refused"]
    )

    def validate_status(self, value):
        application = self.context.get("application")

        if application and application.status in ["accepted", "refused"]:
            raise serializers.ValidationError(
                "Cannot change finalized application."
            )

        return value