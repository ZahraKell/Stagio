from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',          include('users.urls')),
    path('api/users/',         include('users.public_urls')),
    path('api/admin/',         include('users.admin_urls')),
    path('api/offers/',        include('offers.urls')),
    path('api/applications/',  include('applications.urls')),
    path('api/conventions/',   include('conventions.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/administration/', include('users.administration_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)