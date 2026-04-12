from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer

# ── REGISTER ──────────────────────────────
# AllowAny = anyone can call this (no token needed)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {'message': 'Account created successfully!'},
            status=201
        )
    return Response(serializer.errors, status=400)


# ── LOGIN ──────────────────────────────────
# AllowAny = anyone can call this (no token needed)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),   # short-lived token
            'refresh': str(refresh),               # long-lived token
            'role': user.role                      # student/company/admin
        })
    return Response(
        {'error': 'Wrong username or password'},
        status=401
    )


# ── ME (who am i) ──────────────────────────
# IsAuthenticated = must send token to access
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ── STUDENT ONLY ───────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_only(request):
    if request.user.role != 'student':
        return Response(
            {'error': 'Students only!'},
            status=403
        )
    return Response({'message': f'Hello student {request.user.full_name}!'})


# ── COMPANY ONLY ───────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_only(request):
    if request.user.role != 'company':
        return Response(
            {'error': 'Companies only!'},
            status=403
        )
    return Response({'message': f'Hello company {request.user.full_name}!'})


# ── ADMIN ONLY ─────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_only(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admins only!'},
            status=403
        )
    return Response({'message': f'Hello admin {request.user.full_name}!'})
