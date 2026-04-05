from django.db import models
from apps.users.models import Company

class InternshipOffer(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('filled', 'Filled'),
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='offers')
    title = models.CharField(max_length=200)
    description = models.TextField()
    town = models.CharField(max_length=100)
    tech_stack = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    date_posted = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    duration = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.company.user.full_name}"