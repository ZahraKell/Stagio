from django.urls import path
from . import views

urlpatterns = [
    path("", views.list_courses, name="courses-list"),
    path('recommended/', views.recommended_courses, name='recommended-courses'),
]
