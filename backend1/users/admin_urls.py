from django.urls import path
from . import admin_views
from offers.views import admin_list_offers, admin_patch_offer_status

urlpatterns = [
    # ── User management ───────────────────────────────────────────────────────
    path('users/',                 admin_views.list_users,   name='admin-list-users'),
    path('users/<int:pk>/',        admin_views.get_user,     name='admin-get-user'),
    path('users/<int:pk>/update/', admin_views.update_user,  name='admin-update-user'),
    path('users/<int:pk>/delete/', admin_views.delete_user,  name='admin-delete-user'),

    # ── Administration email whitelist ────────────────────────────────────────
    # Admin registers the exact email of each university's administration officer.
    # Only that specific email can then register with role='administration'.
    path('administration-emails/', admin_views.list_administration_emails,
         name='admin-list-admin-emails'),

    path('administration-emails/add/',
         admin_views.add_administration_email,
         ),

    path('administration-emails/<int:pk>/delete/',
         admin_views.delete_administration_email,
         name='admin-delete-admin-email'),
    path('companies/pending/', admin_views.pending_companies),
    path('companies/<int:pk>/', admin_views.get_company),
    path('companies/<int:pk>/approve/', admin_views.approve_company),
    path('companies/<int:pk>/reject/', admin_views.reject_company),

    path('offers/', admin_list_offers),
    path('offers/<int:id>/status/', admin_patch_offer_status),
]