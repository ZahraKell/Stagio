from django.urls import path
from .views import (
    ApplicationListCreateView,
    MyApplicationsView,
    ApplicationDetailView,
    OfferApplicationsView,
    ReviewApplicationView,
    AdminAllApplicationsView,
)

urlpatterns = [
    path("", ApplicationListCreateView.as_view()),
    path("my-applications/", MyApplicationsView.as_view()),
    path("admin/all/", AdminAllApplicationsView.as_view()),
    path("offer/<int:offer_id>/", OfferApplicationsView.as_view()),
    path("<int:pk>/", ApplicationDetailView.as_view()),
    path("<int:pk>/review/", ReviewApplicationView.as_view()),
]