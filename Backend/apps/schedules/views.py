from rest_framework import viewsets, permissions
from .models import Schedule
from .serializers import ScheduleSerializer
from apps.users.utils import MultiTenantViewSetMixin
from student_data.permissions import IsAdminOrTeacherOrReadOnly


class ScheduleViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user, institute=self.request.user.institute)

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if hasattr(user, 'role') and user.role:
            if user.role == 'student':
                return queryset.filter(course__enrollments__student=user).order_by('date', 'start_time')
            elif user.role == 'teacher':
                return queryset.filter(teacher=user).order_by('date', 'start_time')
                
        return queryset.order_by('date', 'start_time')

