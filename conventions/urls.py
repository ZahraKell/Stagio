from django.urls import path
from .views import DownloadConventionView, ConventionPreviewView, SignConventionView

urlpatterns = [
    path('<int:pk>/download/', DownloadConventionView.as_view(), name='convention-download'),
    path('<int:pk>/preview/',  ConventionPreviewView.as_view(), name='convention-preview'),
    path('<int:pk>/sign/',    SignConventionView.as_view(), name='convention-sign'),
]