from django.urls import path
from . import administration_views

urlpatterns = [
    path("students/", administration_views.list_scoped_students),
    path("companies/", administration_views.list_scoped_companies),
]
