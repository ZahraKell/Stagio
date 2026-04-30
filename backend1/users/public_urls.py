from django.urls import path
from . import cv_views

urlpatterns = [
    path('students/cvs/', cv_views.list_student_cvs),
    path('students/<int:id>/cv/', cv_views.get_student_cv),
]
