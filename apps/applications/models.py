from django.db import models
from apps.users.models import Student
from apps.offers.models import InternshipOffer

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('refused', 'Refused'),
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='applications')
    offer = models.ForeignKey(InternshipOffer, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    application_date = models.DateTimeField(auto_now_add=True)
    cover_letter = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('student', 'offer')

    def __str__(self):
        return f"{self.student.user.full_name} → {self.offer.title} ({self.status})"
    

