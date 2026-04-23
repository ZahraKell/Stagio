from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student',        'Student'),
        ('company',        'Company'),
        ('admin',          'Admin'),
        ('administration', 'Administration'),
    )
    full_name = models.CharField(max_length=100, blank=True)
    town      = models.CharField(max_length=100, blank=True, null=True)
    pnum      = models.CharField(max_length=20,  blank=True, null=True)
    role      = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username} ({self.role})"


class AllowedInstitutionDomain(models.Model):
    """
    Stores the EXACT email address allowed to register as administration.

    The admin registers one specific email per university administration account.
    Example: admin adds email='chef.stage@ummto.dz', institution='UMMTO'
    Only that exact email can register with role='administration'.
    Students from ummto.dz are still identified by the domain part of this email
    when scoping statistics — extracted via the domain property below.

    This prevents any student with an @ummto.dz address from signing up as
    administration — only the specific pre-approved email can do so.
    """
    email       = models.EmailField(max_length=254, unique=True, default='')
    institution = models.CharField(max_length=200, blank=True)
    added_by    = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='added_domains'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    @property
    def domain(self):
        """Extract the domain part: 'chef.stage@ummto.dz' -> 'ummto.dz'."""
        return self.email.split('@')[1].lower() if '@' in self.email else ''

    def __str__(self):
        return f"{self.email} ({self.institution})"


class Student(models.Model):
    user           = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student')
    student_number = models.CharField(max_length=50, unique=True)
    average_mark   = models.FloatField(blank=True, null=True)
    speciality     = models.CharField(max_length=100, blank=True, null=True)
    institution    = models.CharField(max_length=200, blank=True, null=True)
    field          = models.CharField(max_length=100, blank=True, null=True)
    # grade examples: "Licence 1", "Licence 3", "Master 1", "Master 2"
    grade          = models.CharField(max_length=50,  blank=True, null=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.student_number}"


class Company(models.Model):
    user            = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='company')
    logo            = models.ImageField(upload_to='logos/', blank=True, null=True)
    description     = models.TextField(blank=True, null=True)
    town            = models.CharField(max_length=100, blank=True, null=True)
    company_name    = models.CharField(max_length=200, blank=True, null=True)
    company_sector  = models.CharField(max_length=100, blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    # Geo-coordinates for the map feature (Idea 5)
    latitude        = models.FloatField(null=True, blank=True)
    longitude       = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.company_name or self.user.full_name


class Admin(models.Model):
    user        = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    salary      = models.FloatField(blank=True, null=True)
    permissions = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Admin: {self.user.full_name}"


class Administration(models.Model):
    user       = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='administration')
    salary     = models.FloatField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Administration: {self.user.full_name}"


# ── EUROPASS-STYLE DIGITAL CV ─────────────────────────────────────────────────
# Instead of one big text field, the CV is split into proper relational tables.
# Each table = one section of the CV. Student can add as many entries as they want.

class DigitalCV(models.Model):
    """Root CV object. One per student. Contains general/contact info."""
    student     = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='digital_cv')
    github      = models.URLField(blank=True, null=True)
    linkedin    = models.URLField(blank=True, null=True)
    portfolio   = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)   # personal summary
    update_date = models.DateField(auto_now=True)

    def __str__(self):
        return f"CV of {self.student.user.full_name}"


class CvEducation(models.Model):
    """One education entry: degree, school, years. Student can have many."""
    cv          = models.ForeignKey(DigitalCV, on_delete=models.CASCADE, related_name='educations')
    degree      = models.CharField(max_length=200)       # e.g. "Licence 3 Informatique"
    institution = models.CharField(max_length=200)       # e.g. "USTHB"
    field       = models.CharField(max_length=200, blank=True, null=True)
    start_year  = models.IntegerField()
    end_year    = models.IntegerField(null=True, blank=True)
    is_current  = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-start_year']

    def __str__(self):
        return f"{self.degree} at {self.institution}"


class CvExperience(models.Model):
    """One work/internship experience entry. Student can have many."""
    cv          = models.ForeignKey(DigitalCV, on_delete=models.CASCADE, related_name='experiences')
    job_title   = models.CharField(max_length=200)
    company     = models.CharField(max_length=200)
    location    = models.CharField(max_length=200, blank=True, null=True)
    start_date  = models.DateField()
    end_date    = models.DateField(null=True, blank=True)
    is_current  = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.job_title} at {self.company}"


class CvSkill(models.Model):
    """One technical skill entry with a proficiency level."""
    LEVEL_CHOICES = (
        ('beginner',     'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced',     'Advanced'),
        ('expert',       'Expert'),
    )
    cv    = models.ForeignKey(DigitalCV, on_delete=models.CASCADE, related_name='skills')
    name  = models.CharField(max_length=100)    # e.g. "Python", "Django", "React"
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='intermediate')

    class Meta:
        ordering        = ['name']
        unique_together = ('cv', 'name')   # no duplicate skills on same CV

    def __str__(self):
        return f"{self.name} ({self.level})"


class CvLanguage(models.Model):
    """One language entry with CEFR level (like Europass)."""
    LEVEL_CHOICES = (
        ('A1',     'A1 — Beginner'),
        ('A2',     'A2 — Elementary'),
        ('B1',     'B1 — Intermediate'),
        ('B2',     'B2 — Upper Intermediate'),
        ('C1',     'C1 — Advanced'),
        ('C2',     'C2 — Mastery'),
        ('native', 'Native'),
    )
    cv    = models.ForeignKey(DigitalCV, on_delete=models.CASCADE, related_name='languages')
    name  = models.CharField(max_length=100)    # e.g. "Arabic", "English", "French"
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)

    class Meta:
        ordering        = ['name']
        unique_together = ('cv', 'name')

    def __str__(self):
        return f"{self.name} ({self.level})"