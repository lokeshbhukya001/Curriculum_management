from rest_framework import viewsets, permissions
from .models import Assignment, Submission
from .serializers import AssignmentSerializer, SubmissionSerializer
from student_data.permissions import IsAdminOrTeacherOrReadOnly


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if hasattr(user, 'role') and user.role:
            if user.role == 'student':
                return queryset.filter(course__enrollments__student=user)
            elif user.role == 'teacher':
                return queryset.filter(course__teacher=user)
                
        return queryset

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if hasattr(user, 'role') and user.role:
            if user.role == 'student':
                return queryset.filter(student=user)
            elif user.role == 'teacher':
                return queryset.filter(assignment__course__teacher=user)
                
        return queryset

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

