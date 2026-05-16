from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, cv_views, profile_views

urlpatterns = [
    # ── Authentication ────────────────────────────────────────────────────────
    path('register/',      views.register),
    path('verify-otp/',    views.verify_signup_otp),
    path('resend-otp/',    views.resend_signup_otp),
    path('login/',         views.login),
    path('me/',            views.me),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('logout/',        views.logout),
    path('auth/google/', views.google_login),
    path('forgot-password/', views.forgot_password),
    path('reset-password/',  views.reset_password),

    # ── Profile (GET + PATCH for all roles) ───────────────────────────────────
    path('profile/',        profile_views.profile_me),
    path('profile/update/', profile_views.update_profile),
    path('company/complete-profile/', profile_views.complete_company_profile),

    # ── CV root (general info + score) ───────────────────────────────────────
    path('cv/',        cv_views.get_my_cv),
    path('cv/update/', cv_views.update_cv_info),
    path('cv/score/',  cv_views.cv_score),

    # ── Education entries ─────────────────────────────────────────────────────
    path('cv/education/',                 cv_views.add_education),
    path('cv/education/<int:pk>/',        cv_views.update_education),
    path('cv/education/<int:pk>/delete/', cv_views.delete_education),

    # ── Experience entries ────────────────────────────────────────────────────
    path('cv/experience/',                 cv_views.add_experience),
    path('cv/experience/<int:pk>/',        cv_views.update_experience),
    path('cv/experience/<int:pk>/delete/', cv_views.delete_experience),

    # ── Skills ────────────────────────────────────────────────────────────────
    path('cv/skill/',                 cv_views.add_skill),
    path('cv/skill/<int:pk>/',        cv_views.update_skill),
    path('cv/skill/<int:pk>/delete/', cv_views.delete_skill),

    # ── Languages ─────────────────────────────────────────────────────────────
    path('cv/language/',                 cv_views.add_language),
    path('cv/language/<int:pk>/',        cv_views.update_language),
    path('cv/language/<int:pk>/delete/', cv_views.delete_language),

    # ── Role test endpoints ───────────────────────────────────────────────────
    path('student-only/', views.student_only),
    path('company-only/', views.company_only),
    path('admin-only/',   views.admin_only),
]
