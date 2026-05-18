import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.core.mail import get_connection, send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .serializers import RegisterSerializer, UserSerializer
from .models import SignupOTP, Company
from notifications.models import Notification
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

User = get_user_model()
logger = logging.getLogger(__name__)


def _otp_from_email():
    """Gmail requires From to match the authenticated account."""
    return settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL


def _send_otp_email(user, otp):
    """
    Send signup OTP synchronously so Gunicorn does not drop a daemon thread
    before SMTP finishes. Errors are logged to Railway/Vercel backend logs.
    """
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        logger.error(
            'Signup OTP not sent: EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is missing.'
        )
        return False

    subject = '[Stag.io] Confirmation code'
    message = (
        f"Hello {user.full_name or user.username},\n\n"
        f"Your confirmation code is: {otp.code}\n"
        f"It expires at: {otp.expires_at.isoformat()}\n\n"
        'If you did not request this account, ignore this message.'
    )

    try:
        connection = get_connection(
            fail_silently=False,
            timeout=getattr(settings, 'EMAIL_TIMEOUT', 15),
        )
        send_mail(
            subject,
            message,
            _otp_from_email(),
            [user.email],
            fail_silently=False,
            connection=connection,
        )
        logger.info('Signup OTP email sent to %s', user.email)
        return True
    except Exception:
        logger.exception('Signup OTP email failed for %s', user.email)
        return False



@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    with transaction.atomic():
        user = serializer.save()
        otp = user.signup_otps.first()
        if not otp:
            raise ValueError('Signup OTP was not created.')
        if user.role == 'company':
            admin_users = User.objects.filter(role='admin', is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    message=f"New company registration submitted by {user.email}.",
                )

    # Send email after DB commit so SMTP slowness does not hold the transaction
    # or exceed Gunicorn's default 30s worker timeout on Railway.
    if not _send_otp_email(user, otp):
        user.delete()
        return Response(
            {
                'error': (
                    'Account could not be created because the confirmation email '
                    'could not be sent. Check server email settings (Gmail app password) '
                    'or try again later.'
                ),
            },
            status=503,
        )

    return Response(
        {
            'message': 'Account created successfully. Please confirm your email using the OTP code.',
            'username': user.username,
            'requires_email_verification': True,
            'email_sent': True,
        },
        status=201,
    )



@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Use email if provided, otherwise use username
    login_credential = email or username

    user = authenticate(username=login_credential, password=password)

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
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'User not found.'}, status=404)
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
    if not _send_otp_email(user, otp):
        return Response(
            {
                'error': (
                    'Could not send the confirmation email. '
                    'Check server email settings or try again later.'
                ),
            },
            status=503,
        )
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
            submitted_at=timezone.now(),   # ← ADD: marks it as submitted
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

# ── FORGOT PASSWORD ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    User submits their email.
    Backend sends a 6-digit OTP code to that email.
    Body: { "email": "ahmed@esi.edu.dz" }
    """
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'email is required.'}, status=400)

    # We don't reveal if the email exists or not — security best practice
    # If email doesn't exist, we still return success to prevent user enumeration
    try:
        user = User.objects.get(email__iexact=email)
        otp = SignupOTP.create_for_user(user, minutes=15)
        subject = "[Stag.io] Password reset code"
        message = (
            f"Hello {user.full_name or user.username},\n\n"
            f"Your password reset code is: {otp.code}\n"
            f"It expires in 15 minutes.\n\n"
            f"If you did not request this, ignore this email.\n"
            f"L'équipe Stag.io"
        )
        try:
            send_mail(
                subject, message,
                _otp_from_email(),
                [user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception('Password reset email failed for %s', user.email)
    except User.DoesNotExist:
        pass  # Silent — don't tell attacker the email doesn't exist

    return Response({
        'message': 'If this email exists, a reset code has been sent.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    User submits email + OTP code + new password.
    Body: {
        "email": "ahmed@esi.edu.dz",
        "code": "123456",
        "new_password": "NewPass123!",
        "confirm_password": "NewPass123!"
    }
    """
    email            = (request.data.get('email') or '').strip().lower()
    code             = (request.data.get('code') or '').strip()
    new_password     = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    # Validate all fields present
    if not email:
        return Response({'error': 'email is required.'}, status=400)
    if not code:
        return Response({'error': 'code is required.'}, status=400)
    if not new_password:
        return Response({'error': 'new_password is required.'}, status=400)
    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match.'}, status=400)
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=400)

    # Find user
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid code or email.'}, status=400)

    # Find valid OTP
    otp = user.signup_otps.filter(
        code=code,
        is_used=False
    ).order_by('-created_at').first()

    if not otp or not otp.is_valid():
        return Response({'error': 'Invalid or expired code.'}, status=400)

    # Mark OTP as used
    otp.is_used = True
    otp.save(update_fields=['is_used'])

    # Set new password
    user.set_password(new_password)
    user.save(update_fields=['password'])

    return Response({'message': 'Password reset successfully. You can now log in.'})
      