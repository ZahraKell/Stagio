from django.urls import path
from . import views


urlpatterns = [
    path("", views.ApplicationListCreateView.as_view()),
    path("my-applications/", views.MyApplicationsView.as_view()),
    path("admin/all/", views.AdminAllApplicationsView.as_view()),
    path("offer/<int:offer_id>/", views.OfferApplicationsView.as_view()),
    path("<int:pk>/", views.ApplicationDetailView.as_view()),
    path("<int:pk>/review/", views.ReviewApplicationView.as_view()),
    path('pending-validation/',      views.pending_validation_list, name='pending-validation'),
    path('<int:pk>/validate/',       views.validate_internship,     name='validate-internship'),
    path('<int:pk>/reject/',         views.reject_internship,       name='reject-internship'),

]