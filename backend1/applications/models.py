from django.db import models
from users.models import Student
from offers.models import InternshipOffer


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        REVIEWED  = 'reviewed',  'Reviewed'
        ACCEPTED  = 'accepted',  'Accepted'
        REFUSED   = 'refused',   'Refused'
        VALIDATED = 'validated', 'Validated'

    student          = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='applications')
    offer            = models.ForeignKey(InternshipOffer, on_delete=models.CASCADE, related_name='applications')
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    stage_state      = models.CharField(max_length=30, default='convention_to_sign')
    application_date = models.DateTimeField(auto_now_add=True)
    cover_letter     = models.TextField(blank=True, null=True)
    report_file      = models.FileField(upload_to='reports/', blank=True, null=True)
    report_submitted_at = models.DateTimeField(null=True, blank=True)
    report_validated_at = models.DateTimeField(null=True, blank=True)
    attestation_file = models.FileField(upload_to='attestations/', blank=True, null=True)
    attestation_issued_at = models.DateTimeField(null=True, blank=True)
    uploaded_convention_file = models.FileField(
        upload_to='conventions/student_uploads/', blank=True, null=True
    )
    student_attestation_upload = models.FileField(
        upload_to='attestations/student_uploads/', blank=True, null=True
    )

    class Meta:
        unique_together = ('student', 'offer')

    def __str__(self):
        return f"{self.student.user.full_name} → {self.offer.title} ({self.status})"


class CompanyRating(models.Model):
    """
    Idea B: After internship is validated, student can rate the company.
    Visible to other students as an average rating on the offer listing.
    """
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='rating')
    rating      = models.IntegerField()       # 1 to 5 stars
    comment     = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.application.student.user.full_name} rated {self.application.offer.company} — {self.rating}/5"