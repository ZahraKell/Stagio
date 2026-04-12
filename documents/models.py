from django.db import models
from applications.models import Application
from users.models import Administration

class Agreement(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='agreement')
    administration = models.ForeignKey(Administration, on_delete=models.CASCADE, related_name='agreements')
    agreement_date = models.DateField(blank=True, null=True)
    student_agreement = models.FileField(upload_to='agreements/students/', blank=True, null=True)
    company_agreement = models.FileField(upload_to='agreements/companies/', blank=True, null=True)
    validation_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Agreement for {self.application}"