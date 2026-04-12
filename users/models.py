from django.contrib.auth.models import AbstractUser 
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('company', 'Company'),
        ('admin', 'Admin'),
        ('administration', 'Administration'),
    )
    full_name = models.CharField(max_length=100, blank=True)
    town = models.CharField(max_length=100, blank=True, null=True)
    pnum = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username} ({self.role})"


class Student(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student')
    student_number = models.CharField(max_length=50, unique=True)
    average_mark = models.FloatField(blank=True, null=True)
    speciality = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.student_number}"


class Company(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='company')
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    town = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.user.full_name


class Admin(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    salary = models.FloatField(blank=True, null=True)
    permissions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Admin: {self.user.full_name}"


class Administration(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='administration')
    salary = models.FloatField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Administration: {self.user.full_name}"
    

class DigitalCV(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='digital_cv')
    techskills = models.TextField(blank=True, null=True)
    languages = models.TextField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    experiences = models.TextField(blank=True, null=True)
    update_date = models.DateField(auto_now=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"CV of {self.student.user.full_name}"