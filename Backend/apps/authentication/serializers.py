from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.users.models import Institute

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    institute_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password_confirm', 'email', 'first_name', 'last_name', 'role', 'institute_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Enforce "One Admin Per Institute" rule
        role = attrs.get('role')
        institute_name = attrs.get('institute_name')
        
        if role == 'admin':
            # Check if an institute with this name exists and already has an admin
            try:
                institute = Institute.objects.get(name=institute_name)
                admin_exists = User.objects.filter(institute=institute, role='admin').exists()
                if admin_exists:
                    raise serializers.ValidationError({
                        "role": f"The institute '{institute_name}' already has an Administrator. Only one Admin is allowed per college."
                    })
            except Institute.DoesNotExist:
                # If institute doesn't exist yet, this first admin registration will create it
                pass

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        institute_name = validated_data.pop('institute_name')
        
        # Get or create institute
        institute, created = Institute.objects.get_or_create(
            name=institute_name,
            defaults={'subdomain': institute_name.lower().replace(' ', '')}
        )
        
        user = User.objects.create_user(institute=institute, **validated_data)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    uid = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
