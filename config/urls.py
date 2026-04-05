from django.contrib import admin
from django.urls import path, include
from apps.conventions.views import (
    DownloadConventionView,
    ConventionPreviewView,
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('applications/', include('apps.applications.urls')),
     path(
        "<int:pk>/download/",
        DownloadConventionView.as_view(),
        name="convention-download",
    ),
    path(
        "<int:pk>/preview/",
        ConventionPreviewView.as_view(),
        name="convention-preview",
    ),
]

