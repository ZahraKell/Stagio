from rest_framework.test import APITestCase
from users.models import CustomUser, Company, Student
from offers.models import InternshipOffer
from applications.models import Application


class CompanyDashboardTests(APITestCase):
    def setUp(self):
        self.company_user = CustomUser.objects.create_user(
            username="comp1",
            password="StrongPass123!",
            email="comp1@example.com",
            role="company",
            is_active=True,
        )
        self.company = Company.objects.create(user=self.company_user, is_approved=True, company_name="Comp1")
        self.student_user = CustomUser.objects.create_user(
            username="stud1",
            password="StrongPass123!",
            email="stud1@esi.edu.dz",
            role="student",
        )
        self.student = Student.objects.create(user=self.student_user, student_number="STU0001")
        self.offer = InternshipOffer.objects.create(
            company=self.company,
            title="Backend Intern",
            description="Django intern",
            town="Algiers",
            status="open",
        )
        self.application = Application.objects.create(student=self.student, offer=self.offer, status="pending")

    def test_company_stats_endpoint(self):
        self.client.force_authenticate(user=self.company_user)
        response = self.client.get("/api/applications/company-stats/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["error"], False)
        self.assertEqual(response.data["data"]["total_applications"], 1)
