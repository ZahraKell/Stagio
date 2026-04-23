from django.urls import path
from . import views

urlpatterns = [
    path('',                          views.ApplicationListCreateView.as_view()),
    path('my-applications/',          views.MyApplicationsView.as_view()),
    path('admin/all/',                views.AdminAllApplicationsView.as_view()),
    path('offer/<int:offer_id>/',     views.OfferApplicationsView.as_view()),
    path('<int:pk>/',                 views.ApplicationDetailView.as_view()),
    path('<int:pk>/review/',          views.ReviewApplicationView.as_view()),

    # Administration workflow
    path('pending-validation/',       views.pending_validation_list,  name='pending-validation'),
    path('stats/',                    views.stats,                    name='application-stats'),

    # Company ratings (Idea B)
    path('company-rating/<int:company_id>/', views.company_rating,   name='company-rating'),

    # These MUST come after the string paths above so Django doesn't
    # try to match "stats" or "pending-validation" as an integer pk
    path('<int:pk>/validate/',        views.validate_internship,      name='validate-internship'),
    path('<int:pk>/reject/',          views.reject_internship,        name='reject-internship'),
    path('<int:pk>/rate/',            views.rate_company,             name='rate-company'),
]