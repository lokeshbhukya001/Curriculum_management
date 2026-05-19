from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admin users can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role == 'admin'
        )


class IsTeacher(permissions.BasePermission):
    """Only teacher users can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role == 'teacher'
        )


class IsStudent(permissions.BasePermission):
    """Only student users can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role == 'student'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything, others only read"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role == 'admin'
        )


class IsAdminOrTeacher(permissions.BasePermission):
    """Admin or teacher can access"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role in ['admin', 'teacher']
        )


class IsAdminOrTeacherOrReadOnly(permissions.BasePermission):
    """Admin or teacher can edit, others only read"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role in ['admin', 'teacher']
        )


