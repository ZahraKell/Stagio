from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Administration, Student, Company

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'full_name', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'student'),
        )

        if user.role == 'student':
            Student.objects.create(
                user=user,
                student_number=f"STU{user.id:04d}"
            )
        elif user.role == 'company':
            Company.objects.create(user=user)
        elif user.role == 'administration':
            Administration.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role']


