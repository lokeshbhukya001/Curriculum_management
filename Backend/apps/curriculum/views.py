from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Program, Course, Module, Topic, LearningObjective, Material
from .serializers import (
    ProgramSerializer, CourseSerializer, ModuleSerializer, 
    TopicSerializer, LearningObjectiveSerializer, MaterialSerializer
)
from apps.users.utils import MultiTenantViewSetMixin
from student_data.permissions import IsAdmin, IsTeacher, IsStudent, IsAdminOrReadOnly, IsAdminOrTeacherOrReadOnly


class ProgramViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, institute=self.request.user.institute)

class CourseViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return super().get_queryset()




class ModuleViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def get_queryset(self):
        return super().get_queryset()



    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        for item in orders:
            Module.objects.filter(id=item['id'], institute=request.user.institute).update(order_number=item['order_number'])
        return Response({'status': 'reordered'}, status=status.HTTP_200_OK)


class TopicViewSet(MultiTenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def get_queryset(self):
        return super().get_queryset()



    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        for item in orders:
            Topic.objects.filter(id=item['id'], institute=request.user.institute).update(order_number=item['order_number'])
        return Response({'status': 'reordered'}, status=status.HTTP_200_OK)


class LearningObjectiveViewSet(viewsets.ModelViewSet):
    queryset = LearningObjective.objects.all()
    serializer_class = LearningObjectiveSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Objectives belong to topics, topics belong to institute
        return self.queryset.filter(topic__institute=self.request.user.institute)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminOrTeacherOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_authenticated and hasattr(user, 'institute') and user.institute:
            return queryset.filter(topic__institute=user.institute)
        return queryset.none()



    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

