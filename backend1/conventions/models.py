from django.db import models

class Convention(models.Model):

    class Status(models.TextChoices):
        DRAFT           = 'DRAFT',           'Draft'
        PENDING_STUDENT = 'PENDING_STUDENT', 'Pending Student Signature'
        PENDING_COMPANY = 'PENDING_COMPANY', 'Pending Company Signature'
        PENDING_ADMIN   = 'PENDING_ADMIN',   'Pending Admin Validation'
        VALIDATED       = 'VALIDATED',       'Validated'
        REJECTED        = 'REJECTED',        'Rejected'

    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='conventions',
    )
    administration = models.ForeignKey(
        'users.Administration',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conventions',
    )

    status     = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    start_date = models.DateField(null=True, blank=True)
    end_date   = models.DateField(null=True, blank=True)

    student_signed_at = models.DateTimeField(null=True, blank=True)
    company_signed_at = models.DateTimeField(null=True, blank=True)
    admin_signed_at   = models.DateTimeField(null=True, blank=True)

    pdf_file = models.FileField(upload_to='conventions/pdfs/', null=True, blank=True)

    # kept for reference
    agreement_date    = models.DateField(null=True, blank=True)
    student_agreement = models.BooleanField(default=False)
    company_agreement = models.BooleanField(default=False)
    validation_date   = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Convention {self.pk} — {self.status}"