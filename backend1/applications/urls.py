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
    path(
        'administration/scope/applications/',
        views.AdministrationApplicationsListView.as_view(),
        name='administration-scoped-applications',
    ),
    path('stats/',                    views.stats,                    name='application-stats'),
    path('company-stats/',            views.company_stats),
    path('company-recent/',           views.company_recent),
    path('company-actions/',          views.company_actions),
    path('my-interns/',               views.my_interns),

    # Company ratings (Idea B)
    path('company-rating/<int:company_id>/', views.company_rating,   name='company-rating'),

    # These MUST come after the string paths above so Django doesn't
    # try to match "stats" or "pending-validation" as an integer pk
    path('<int:pk>/validate/',        views.validate_internship,      name='validate-internship'),
    path('<int:pk>/reject/',          views.reject_internship,        name='reject-internship'),
    path('<int:pk>/rate/',            views.rate_company,             name='rate-company'),
    path('<int:pk>/submit-report/',   views.submit_report),
    path('<int:pk>/validate-report/', views.validate_report),
    path('<int:pk>/issue-attestation/', views.issue_attestation),
]