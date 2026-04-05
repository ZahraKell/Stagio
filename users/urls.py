from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.login),
    path('me/', views.me),
    path('token/refresh/', TokenRefreshView.as_view()),

   
    path('student-only/', views.student_only),
    path('company-only/', views.company_only),
    path('admin-only/', views.admin_only),
]