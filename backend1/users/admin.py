from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Student, Company, Admin,
    Administration, DigitalCV, AllowedInstitutionDomain,
    CvEducation, CvExperience, CvSkill, CvLanguage
)

admin.site.register(CustomUser, UserAdmin)
admin.site.register(Student)
admin.site.register(Company)
admin.site.register(Admin)
admin.site.register(Administration)
admin.site.register(DigitalCV)
admin.site.register(AllowedInstitutionDomain)
admin.site.register(CvEducation)
admin.site.register(CvExperience)
admin.site.register(CvSkill)
admin.site.register(CvLanguage)