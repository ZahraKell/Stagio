from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer
from .models import SignupOTP, Company
from notifications.models import Notification
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
User = get_user_model()


def _send_otp_email(user, otp):
    subject = "[Stag.io] Confirmation code"
    message = (
        f"Hello {user.full_name or user.username},\n\n"
        f"Your confirmation code is: {otp.code}\n"
        f"It expires at: {otp.expires_at.isoformat()}\n\n"
        "If you did not request this account, ignore this message."
    )
    try:
        send_mail(subject, message, getattr(settings, "DEFAULT_FROM_EMAIL", None), [user.email], fail_silently=True)
    except Exception:
        pass


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        otp = user.signup_otps.first()
        if otp:
            _send_otp_email(user, otp)
        if user.role == 'company':
            admin_users = User.objects.filter(role='admin', is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    message=f"New company registration submitted by {user.email}.",
                )
        return Response(
            {
                'message': 'Account created successfully. Please confirm your email using the OTP code.',
                'username': user.username,
                'requires_email_verification': True,
            },
            status=201
        )
    return Response(serializer.errors, status=400)



@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        if not user.is_active:
            return Response(
                {'error': 'Your account is not active yet. Verify your email OTP first.'},
                status=403
            )
        company_status = None
        if user.role == 'company':
            try:
                company = user.company
                if company.is_approved:
                    company_status = "approved"
                elif company.is_rejected:
                    company_status = "rejected"
                else:
                    company_status = "pending_approval"
            except Company.DoesNotExist:
                return Response({'error': 'Company profile missing.'}, status=403)
        refresh = RefreshToken.for_user(user)
        data = {
            'access': str(refresh.access_token),   
            'refresh': str(refresh),               
            'role': user.role,
        }
        if company_status:
            data['company_status'] = company_status
            if company_status == "rejected":
                data['rejection_reason'] = company.rejection_reason
        return Response(data)
    return Response(
        {'error': 'Wrong username or password'},
        status=401
    )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_only(request):
    if request.user.role != 'student':
        return Response(
            {'error': 'Students only!'},
            status=403
        )
    return Response({'message': f'Hello student {request.user.full_name}!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_only(request):
    if request.user.role != 'company':
        return Response(
            {'error': 'Companies only!'},
            status=403
        )
    return Response({'message': f'Hello company {request.user.full_name}!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_only(request):
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admins only!'},
            status=403
        )
    return Response({'message': f'Hello admin {request.user.full_name}!'})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_signup_otp(request):
    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    if not email or not code:
        return Response({'error': 'email and code are required.'}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    otp = user.signup_otps.filter(code=code, is_used=False).order_by('-created_at').first()
    if not otp or not otp.is_valid():
        return Response({'error': 'Invalid or expired code.'}, status=400)

    otp.is_used = True
    otp.save(update_fields=['is_used'])
    user.is_active = True
    user.save(update_fields=['is_active'])
    return Response({'message': 'Email verified successfully. You can now log in.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_signup_otp(request):
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'email is required.'}, status=400)
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    otp = SignupOTP.create_for_user(user)
    _send_otp_email(user, otp)
    return Response({'message': 'A new confirmation code was sent.'})
# views.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logged out successfully."})
    except TokenError:
        return Response({"error": "Invalid token."}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Frontend sends the Google ID token it received after the user
    clicked "Sign in with Google". We verify it, then either:
      - Find the existing user and return JWT tokens (login)
      - Create a new user automatically and return JWT tokens (signup)
    
    Body: { "token": "<google_id_token>", "role": "student" }
    role is only used when creating a NEW account.
    """
    google_token = request.data.get('token')
    role         = request.data.get('role', 'student')  # default to student

    if not google_token:
        return Response({'error': 'Google token is required.'}, status=400)

    # ── Step 1: Verify the token with Google ──────────────────────────────────
    # This contacts Google's servers to confirm the token is real and not faked.
    try:
        google_data = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        # Token is invalid, expired, or not meant for our app
        return Response({'error': f'Invalid Google token: {str(e)}'}, status=400)

    # ── Step 2: Extract user info from the verified token ─────────────────────
    email     = google_data.get('email', '').lower()
    full_name = google_data.get('name', '')
    google_id = google_data.get('sub')   # unique Google user ID, never changes

    if not email:
        return Response({'error': 'Could not get email from Google.'}, status=400)

    # ── Step 3: Find existing user OR create new one ───────────────────────────
    user = User.objects.filter(email__iexact=email).first()

    if user:
        # ── EXISTING USER — just log them in ──────────────────────────────────
        # Make sure the account is active
        if not user.is_active:
            # Google verified their email so we can safely activate them
            user.is_active = True
            user.save(update_fields=['is_active'])

    else:
        # ── NEW USER — register them automatically ────────────────────────────

        # Role validation
        if role not in ['student', 'company']:
            return Response(
                {'error': "role must be 'student' or 'company'."},
                status=400
            )

        # Students must use a university email
        if role == 'student':
            hardcoded_domains = [
                '.edu.dz', 'usthb.dz', 'esi.dz',
                'univ-setif.dz', 'univ-alger.dz',
                'univ-constantine.dz', 'univ-oran.dz',
                'univ-tlemcen.dz', 'univ-bejaia.dz',
                'univ-annaba.dz', 'univ-blida.dz',
                'univ-batna.dz', 'univ-msila.dz',
                'univ-biskra.dz', 'univ-tiaret.dz',
                'univ-bouira.dz', 'ifa.dz',
            ]
            from .models import AllowedInstitutionDomain
            db_domains = [
                e.split('@')[1].lower()
                for e in AllowedInstitutionDomain.objects.values_list('email', flat=True)
                if '@' in e
            ]
            all_domains = hardcoded_domains + db_domains
            if not any(email.endswith(d) for d in all_domains):
                return Response(
                    {'error': 'Students must use a university email address.'},
                    status=400
                )

        # Administration role not allowed via Google
        if role == 'administration':
            return Response(
                {'error': 'Administration accounts cannot use Google login.'},
                status=400
            )

        # Generate a clean username from their name or email
        import random
        base = full_name.replace(' ', '').lower() or email.split('@')[0]
        username = f"{base}{random.randint(1000, 9999)}"
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base}{random.randint(1000, 9999)}"

        # Create the user — no password needed for Google users
        # set_unusable_password() means they can never log in with
        # a regular password, only via Google
        user = User.objects.create(
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            is_active=True,  # Google already verified their email
        )
        user.set_unusable_password()
        user.save()

        # Create role-specific profile
        if role == 'student':
            from .models import Student
            Student.objects.create(
                user=user,
                student_number=f"STU{user.id:04d}"
            )
        elif role == 'company':
            from .models import Company
            Company.objects.create(
                user=user,
                is_approved=False,
                is_rejected=False,
            )
            # Notify admins about new company
            admin_users = User.objects.filter(role='admin', is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    message=f"New company registration via Google: {email}",
                )

    # ── Step 4: Generate JWT tokens and return them ───────────────────────────
    refresh = RefreshToken.for_user(user)

    response_data = {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'role':    user.role,
        'is_new_user': not bool(user.date_joined),  # hint for frontend
    }

    # If company, include approval status so frontend knows what screen to show
    if user.role == 'company':
        try:
            company = user.company
            if company.is_approved:
                response_data['company_status'] = 'approved'
            elif company.is_rejected:
                response_data['company_status'] = 'rejected'
                response_data['rejection_reason'] = company.rejection_reason
            else:
                response_data['company_status'] = 'pending_approval'
        except Exception:
            pass

    return Response(response_data)       