from django.urls import path
from . import views

urlpatterns = [
    # GET  /api/notifications/               → list all my notifications
    path('',               views.my_notifications, name='my-notifications'),

    # GET  /api/notifications/unread-count/  → count unread (for navbar badge)
    path('unread-count/',  views.unread_count,     name='unread-count'),

    # PATCH /api/notifications/read-all/     → mark every notification as read
    path('read-all/',      views.mark_all_as_read, name='mark-all-read'),

    # PATCH /api/notifications/<pk>/read/    → mark one notification as read
    # NOTE: this must come AFTER 'read-all/' so Django doesn't match "read-all" as a <pk>
    path('<int:pk>/read/', views.mark_as_read,     name='mark-as-read'),
]