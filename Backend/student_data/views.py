from rest_framework import viewsets, status, views, permissions
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

from .models import (
    Role, Program, Course, Module, Topic, Enrollment, 
    FileUpload, CurriculumVersion, AuditLog
)
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer, UserSignupSerializer,
    RoleSerializer, ProgramSerializer, CourseSerializer, CourseDetailSerializer,
    ModuleSerializer, TopicSerializer, EnrollmentSerializer, FileUploadSerializer,
    CurriculumVersionSerializer, AuditLogSerializer, StatsSerializer
)
from .permissions import IsAdmin, IsTeacher, IsStudent, IsAdminOrReadOnly

User = get_user_model()


# ============ Authentication Views ============

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login endpoint"""
    serializer_class = CustomTokenObtainPairSerializer


class UserSignupView(views.APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log signup
            self._log_action(user, 'create', 'User', user.id, f'User {user.username} signed up')
            
            # Return tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User created successfully',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def _log_action(user, action, model_name, object_id, description):
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            description=description,
            ip_address=None,
        )


class UserLogoutView(views.APIView):
    """Logout endpoint - blacklist token"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Log logout
            AuditLog.objects.create(
                user=request.user,
                action='logout',
                model_name='User',
                object_id=request.user.id,
                description=f'User {request.user.username} logged out',
                ip_address=self._get_client_ip(request),
            )
            
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# ============ User Management Views ============

class UserViewSet(viewsets.ModelViewSet):
    """User management viewset"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role and user.role.name == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'destroy':
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_role(self, request, pk=None):
        """Assign role to user (admin only)"""
        user = self.get_object()
        role_name = request.data.get('role')
        
        try:
            role = Role.objects.get(name=role_name)
            user.role = role
            user.save()
            
            # Log action
            AuditLog.objects.create(
                user=request.user,
                action='update',
                model_name='User',
                object_id=user.id,
                description=f'Role changed to {role_name}',
                ip_address=self._get_client_ip(request),
            )
            
            return Response(UserSerializer(user).data)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# ============ Program Views ============

class ProgramViewSet(viewsets.ModelViewSet):
    """Program management"""
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Program',
            object_id=serializer.instance.id,
            description=f'Program created: {serializer.instance.name}',
        )
    
    def perform_update(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='Program',
            object_id=serializer.instance.id,
            description=f'Program updated: {serializer.instance.name}',
        )


# ============ Course Views ============

class CourseViewSet(viewsets.ModelViewSet):
    """Course management with role-based access"""
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Course',
            object_id=serializer.instance.id,
            description=f'Course created: {serializer.instance.name}',
        )
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll student in course"""
        course = self.get_object()
        student = request.user
        
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={'status': 'active'}
        )
        
        if created:
            AuditLog.objects.create(
                user=student,
                action='create',
                model_name='Enrollment',
                object_id=enrollment.id,
                description=f'Student {student.username} enrolled in {course.name}',
            )
            return Response(
                {'message': 'Enrolled successfully'},
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'message': 'Already enrolled'},
                status=status.HTTP_200_OK
            )
    
    @action(detail=True, methods=['post'])
    def unenroll(self, request, pk=None):
        """Unenroll student from course"""
        course = self.get_object()
        student = request.user
        
        try:
            enrollment = Enrollment.objects.get(student=student, course=course)
            enrollment.status = 'dropped'
            enrollment.save()
            
            AuditLog.objects.create(
                user=student,
                action='update',
                model_name='Enrollment',
                object_id=enrollment.id,
                description=f'Student {student.username} unenrolled from {course.name}',
            )
            
            return Response({'message': 'Unenrolled successfully'})
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Not enrolled'},
                status=status.HTTP_404_NOT_FOUND
            )


# ============ Module Views ============

class ModuleViewSet(viewsets.ModelViewSet):
    """Module management"""
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Module',
            object_id=serializer.instance.id,
            description=f'Module created: {serializer.instance.name}',
        )


# ============ Topic Views ============

class TopicViewSet(viewsets.ModelViewSet):
    """Topic management"""
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Topic',
            object_id=serializer.instance.id,
            description=f'Topic created: {serializer.instance.name}',
        )


# ============ File Upload Views ============

class FileUploadViewSet(viewsets.ModelViewSet):
    """Secure file upload handling"""
    queryset = FileUpload.objects.all()
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    ALLOWED_FILE_TYPES = {'pdf', 'docx', 'pptx', 'xlsx', 'txt'}
    MAX_FILE_SIZE = 10485760  # 10MB
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        
        # Validate file
        if not self._validate_file(file_obj):
            raise serializers.ValidationError('Invalid file')
        
        serializer.save(
            uploaded_by=self.request.user,
            file_size=file_obj.size
        )
        
        AuditLog.objects.create(
            user=self.request.user,
            action='upload',
            model_name='FileUpload',
            object_id=serializer.instance.id,
            description=f'File uploaded: {serializer.instance.title}',
        )
    
    def _validate_file(self, file_obj):
        if file_obj.size > self.MAX_FILE_SIZE:
            return False
        
        file_ext = os.path.splitext(file_obj.name)[1].lower().lstrip('.')
        if file_ext not in self.ALLOWED_FILE_TYPES:
            return False
        
        return True


# ============ Dashboard Views ============

class DashboardStatsView(views.APIView):
    """Dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        stats = {
            'programs': Program.objects.count(),
            'courses': Course.objects.count(),
            'modules': Module.objects.count(),
            'topics': Topic.objects.count(),
            'active_students': User.objects.filter(role__name='student', is_active=True).count(),
            'total_teachers': User.objects.filter(role__name='teacher').count(),
        }
        
        serializer = StatsSerializer(stats)
        return Response(serializer.data)


# ============ Audit Log Views ============

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """View audit logs (admin only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    
    @action(detail=False, methods=['get'])
    def my_activity(self, request):
        """Get current user's activity"""
        logs = AuditLog.objects.filter(user=request.user)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
