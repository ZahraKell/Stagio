from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import Course
from .serializers import CourseSerializer


def ok(data=None, message="OK"):
    return Response({"error": False, "message": message, "data": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_courses(request):
    courses = Course.objects.all()
    return ok(data=CourseSerializer(courses, many=True).data, message=f"{courses.count()} course(s).")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_courses(request):
    if request.user.role != 'student':
        return ok(data=[], message="Students only.")
    try:
        cv = request.user.student.digital_cv
        skills = list(cv.skills.values_list('name', flat=True))
    except Exception:
        return ok(data=[], message="Complete your CV to get recommendations.")
    
    if not skills:
        return ok(data=[], message="Add skills to your CV to get recommendations.")
    
    import urllib.request, urllib.parse, json
    
    api_key = getattr(settings, 'YOUTUBE_API_KEY', '')
    if not api_key:
        return ok(data=[], message="YouTube API not configured.")
    
    results = []
    for skill in skills[:3]:
        try:
            query = urllib.parse.quote(f"{skill} tutorial course")
            url = (f"https://www.googleapis.com/youtube/v3/search"
                   f"?part=snippet&q={query}&type=video&maxResults=3&key={api_key}")
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                for item in data.get('items', []):
                    results.append({
                        'skill': skill,
                        'title': item['snippet']['title'],
                        'channel': item['snippet']['channelTitle'],
                        'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                        'video_id': item['id']['videoId'],
                        'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    })
        except Exception:
            continue
    return ok(data=results, message=f"{len(results)} course(s) found.")