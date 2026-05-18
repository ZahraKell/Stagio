from django.test import override_settings
from rest_framework.test import APITestCase
from users.models import CustomUser, Company, SignupOTP

LOC_MEM_EMAIL = {'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend'}


@override_settings(**LOC_MEM_EMAIL)
class RegistrationWorkflowTests(APITestCase):
    def test_username_is_auto_generated_from_email(self):
        payload = {
            "email": "ahmed@esi.edu.dz",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "role": "student",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        user = CustomUser.objects.get(email="ahmed@esi.edu.dz")
        self.assertTrue(user.username.startswith("ahmed"))

    def test_company_signup_creates_inactive_account_with_otp(self):
        payload = {
            "email": "company@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "role": "company",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        user = CustomUser.objects.get(email="company@example.com")
        company = Company.objects.get(user=user)
        self.assertFalse(user.is_active)
        self.assertFalse(company.is_approved)
        self.assertTrue(SignupOTP.objects.filter(user=user).exists())
