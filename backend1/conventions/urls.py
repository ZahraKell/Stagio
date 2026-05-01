from django.urls import path
from .views import DownloadConventionView, ConventionPreviewView, SignConventionView, my_conventions, pending_admin_conventions

urlpatterns = [
    path('mine/',          my_conventions,              name='convention-mine'),
    path('pending-admin/', pending_admin_conventions, name='convention-pending-admin'),
    path('<int:pk>/download/', DownloadConventionView.as_view(), name='convention-download'),
    path('<int:pk>/preview/',  ConventionPreviewView.as_view(), name='convention-preview'),
    path('<int:pk>/sign/',  SignConventionView.as_view(), name='convention-sign'),
]