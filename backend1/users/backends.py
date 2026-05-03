from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameBackend(ModelBackend):
    """
    Allows login with either email or username.
    Frontend sends email → this backend finds the user by email first,
    falls back to username if not found.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None
        # Try email first
        user = User.objects.filter(email__iexact=username).first()
        # Fall back to username
        if not user:
            user = User.objects.filter(username__iexact=username).first()
        if user and user.check_password(password):
            return user
        return None