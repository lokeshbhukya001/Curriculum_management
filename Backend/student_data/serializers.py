from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Role, Program, Course, Module, Topic, Enrollment, 
    FileUpload, CurriculumVersion, AuditLog
)
import bcrypt

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role.name if user.role else None
        
        return token
    
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        if username and '@' in username:
            try:
                user = User.objects.get(email__iexact=username)
                attrs[self.username_field] = user.get_username()
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        
        # Add user data to response
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name if user.role else None,
            'is_verified': user.is_verified,
        }
        
        return data


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 
                  'role', 'institution_id', 'is_verified', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 
                  'last_name', 'phone', 'institution_id']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'Username already exists'})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'Email already exists'})
        
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            institution_id=validated_data.get('institution_id', ''),
        )
        user.set_password(validated_data['password'])
        
        # Assign default student role
        try:
            student_role = Role.objects.get(name='student')
            user.role = student_role
        except Role.DoesNotExist:
            pass
        
        user.save()
        return user


class ProgramSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Program
        fields = ['id', 'name', 'description', 'institution_id', 'created_by', 
                  'created_by_username', 'created_at', 'updated_at', 'version']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'version']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'module', 'name', 'description', 'content', 'order', 
                  'created_at', 'updated_at', 'version']
        read_only_fields = ['id', 'created_at', 'updated_at', 'version']


class ModuleSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'course', 'name', 'description', 'order', 'topics',
                  'created_at', 'updated_at', 'version']
        read_only_fields = ['id', 'created_at', 'updated_at', 'version']


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'program', 'name', 'description', 'teacher', 'teacher_name',
                  'credits', 'is_active', 'modules', 'created_at', 'updated_at', 'version']
        read_only_fields = ['id', 'created_at', 'updated_at', 'version']


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed course view with all relations"""
    teacher = UserSerializer(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    enrollments = serializers.SerializerMethodField()
    
    def get_enrollments(self, obj):
        count = obj.enrollments.filter(status='active').count()
        return count
    
    class Meta:
        model = Course
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_name', 
                  'enrolled_at', 'status']
        read_only_fields = ['id', 'enrolled_at', 'student']


class FileUploadSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = FileUpload
        fields = ['id', 'course', 'uploaded_by', 'uploaded_by_username', 'file',
                  'file_type', 'title', 'description', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_size', 'uploaded_by']


class CurriculumVersionSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = CurriculumVersion
        fields = ['id', 'course', 'version_number', 'changed_by', 'changed_by_username',
                  'change_description', 'old_data', 'new_data', 'created_at']
        read_only_fields = ['id', 'created_at', 'version_number']


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_username', 'action', 'model_name', 'object_id',
                  'description', 'old_values', 'new_values', 'ip_address', 
                  'user_agent', 'created_at', 'institution_id']
        read_only_fields = ['id', 'created_at']


class StatsSerializer(serializers.Serializer):
    """Dashboard statistics"""
    programs = serializers.IntegerField()
    courses = serializers.IntegerField()
    modules = serializers.IntegerField()
    topics = serializers.IntegerField()
    active_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
