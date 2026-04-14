from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_offers),
    path('create/', views.create_offer),
    path('mine/', views.my_offers),
    path('filter/', views.filter_offers),
    path('<int:id>/', views.get_offer),
    path('<int:id>/update/', views.update_offer),
    path('<int:id>/delete/', views.delete_offer),
]