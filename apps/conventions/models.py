from django.db import models

class Convention(models.Model):
    ID_AGR = models.AutoField(primary_key=True)

    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='conventions'
    )

    administration = models.ForeignKey(
        'users.Administration',
        on_delete=models.SET_NULL,
        null=True,
        related_name='conventions',
    )

    agreement_date = models.DateField()

    student_agreement = models.BooleanField(default=False)
    company_agreement = models.BooleanField(default=False)

    validation_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Convention {self.ID_AGR}"