from django.contrib import admin
from django.urls import path, include
from conventions.views import (
    DownloadConventionView,
    ConventionPreviewView,
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('applications/', include('applications.urls')),
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

