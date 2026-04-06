from django.urls import path
from . import views

urlpatterns = [
    path('pending-validation/',      views.pending_validation_list, name='pending-validation'),
    path('<int:pk>/validate/',       views.validate_internship,     name='validate-internship'),
    path('<int:pk>/reject/',         views.reject_internship,       name='reject-internship'),
]