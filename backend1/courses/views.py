from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Course
from .serializers import CourseSerializer


def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_courses(request):
    courses = Course.objects.all()
    return ok(data=CourseSerializer(courses, many=True).data, message=f"{courses.count()} course(s).")
