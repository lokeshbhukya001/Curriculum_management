from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Role, User, Program, Course, Module, Topic, Enrollment,
    FileUpload, CurriculumVersion, AuditLog
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_verified', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'institution_id', 'phone', 'is_verified')}),
    )


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at', 'version']
    list_filter = ['created_at', 'institution_id']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'version']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'program', 'teacher', 'is_active', 'created_at']
    list_filter = ['is_active', 'program', 'created_at']
    search_fields = ['name', 'description', 'teacher__username']
    readonly_fields = ['created_at', 'updated_at', 'version']


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'order', 'created_at']
    list_filter = ['course', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'version']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'module', 'order', 'created_at']
    list_filter = ['module__course', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'version']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'enrolled_at']
    list_filter = ['status', 'course', 'enrolled_at']
    search_fields = ['student__username', 'course__name']
    readonly_fields = ['enrolled_at']


@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'file_type', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'course', 'uploaded_at']
    search_fields = ['title', 'description']
    readonly_fields = ['uploaded_at', 'file_size']


@admin.register(CurriculumVersion)
class CurriculumVersionAdmin(admin.ModelAdmin):
    list_display = ['course', 'version_number', 'changed_by', 'created_at']
    list_filter = ['course', 'created_at']
    search_fields = ['course__name', 'change_description']
    readonly_fields = ['created_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'created_at']
    list_filter = ['action', 'model_name', 'created_at']
    search_fields = ['user__username', 'description', 'model_name']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
