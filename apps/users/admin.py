from django.contrib import admin # type: ignore
from django.contrib.auth.admin import UserAdmin # type: ignore
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Role', {'fields': ('role', 'phone')}),
    )