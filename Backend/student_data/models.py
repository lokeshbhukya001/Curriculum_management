from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import bcrypt

class Role(models.Model):
    """Role model for RBAC"""
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)
    
    def __str__(self):
        return self.get_name_display()
    
    class Meta:
        verbose_name_plural = "Roles"


class User(AbstractUser):
    """Custom User model with role-based access"""
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"


class Program(models.Model):
    """Program/Course Structure"""
    name = models.CharField(max_length=255)
    description = models.TextField()
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='programs_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Course(models.Model):
    """Course model"""
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255)
    description = models.TextField()
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses_taught')
    credits = models.IntegerField(default=3)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Module(models.Model):
    """Module within a course"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    name = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField(default=0)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.course.name} - {self.name}"


class Topic(models.Model):
    """Topic within a module"""
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=255)
    description = models.TextField()
    content = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.module.course.name} - {self.module.name} - {self.name}"


class Enrollment(models.Model):
    """Student enrollment in courses"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ], default='active')
    
    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-enrolled_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.name}"


class FileUpload(models.Model):
    """File uploads for courses/materials"""
    ALLOWED_TYPES = (
        ('pdf', 'PDF'),
        ('docx', 'Word Document'),
        ('pptx', 'PowerPoint'),
        ('xlsx', 'Excel'),
        ('txt', 'Text'),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_files')
    file = models.FileField(upload_to='course_materials/%Y/%m/%d/')
    file_type = models.CharField(max_length=10, choices=ALLOWED_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.title} - {self.course.name}"


class CurriculumVersion(models.Model):
    """Track curriculum changes/versions"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='curriculum_changes')
    change_description = models.TextField()
    old_data = models.JSONField()
    new_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.course.name} - v{self.version_number}"


class AuditLog(models.Model):
    """Audit log for tracking all system changes"""
    ACTION_CHOICES = (
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('download', 'Download'),
        ('upload', 'Upload'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    institution_id = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action} - {self.model_name}"
