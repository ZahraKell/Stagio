from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Administration, Student, Company

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'password', 'email', 'full_name', 'role']

    def validate_email(self, value):
        """
        Called automatically by DRF for the 'email' field before anything else.
        self.initial_data gives us the raw request data including 'role'.

        Two rules:
          1. Students → email must match one of the known Algerian university domains.
          2. Administration → email domain must be pre-registered by the admin
             in the AllowedInstitutionDomain table.
        """
        role        = self.initial_data.get('role', '')
        email_lower = value.lower()

        # ── Rule 1: Student university email ──────────────────────────────────
        if role == 'student':
            # Hard-coded well-known Algerian university domains.
            # The admin can also add new domains via AllowedInstitutionDomain,
            # which are checked dynamically below — so both lists are combined.
            hardcoded_domains = [
                '.edu.dz',           # generic Algerian university suffix — covers most universities
                'univ-setif.dz',     # Université Ferhat Abbas Sétif
                'univ-alger.dz',     # Université d'Alger
                'usthb.dz',          # USTHB Alger
                'univ-constantine.dz',
                'univ-oran.dz',
                'univ-tlemcen.dz',
                'univ-bejaia.dz',
                'univ-annaba.dz',
                'univ-blida.dz',
                'univ-batna.dz',
                'univ-msila.dz',
                'univ-biskra.dz',
                'univ-tiaret.dz',
                'univ-bouira.dz',
                'ifa.dz',            # Institut de Formation en Administration
                'esi.dz',            # École nationale Supérieure d'Informatique
                # ← add more hardcoded ones here if needed
            ]

            # Also load any extra domains the admin added through the dashboard.
            # 'domain' is a @property (not a DB column), so we fetch the emails
            # and extract the domain part in Python.
            from .models import AllowedInstitutionDomain
            db_domains = [
                entry.split('@')[1].lower()
                for entry in AllowedInstitutionDomain.objects.values_list('email', flat=True)
                if '@' in entry
            ]

            # Combine both lists — student email must end with at least one of them
            all_valid_domains = hardcoded_domains + db_domains

            is_valid = any(email_lower.endswith(domain) for domain in all_valid_domains)

            if not is_valid:
                raise serializers.ValidationError(
                    "Students must use a university email address "
                    "(e.g. ending with .edu.dz or your university's domain like univ-setif.dz). "
                    "If your university domain is not accepted, ask the platform admin to add it."
                )

        # ── Rule 2: Administration — exact email must be pre-approved ───────────
        # The admin registers the EXACT email of each administration account.
        # e.g. admin adds "chef.stage@ummto.dz" → only that specific email
        # can sign up with role='administration'.
        # This closes the security hole where any student with an @ummto.dz
        # address could pick the administration role.
        if role == 'administration':
            from .models import AllowedInstitutionDomain
            if '@' not in value:
                raise serializers.ValidationError("Invalid email address.")
            # Exact match on the full email address (case-insensitive)
            if not AllowedInstitutionDomain.objects.filter(
                email__iexact=value
            ).exists():
                raise serializers.ValidationError(
                    "This email address is not approved for administration accounts. "
                    "The platform admin must register your exact email address first."
                )

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'student'),
        )
        if user.role == 'student':
            Student.objects.create(user=user, student_number=f"STU{user.id:04d}")
        elif user.role == 'company':
            Company.objects.create(user=user)
        elif user.role == 'administration':
            Administration.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'full_name', 'role']