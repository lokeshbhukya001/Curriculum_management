from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from .models import Program, Course, Module, Topic
from .serializers import ProgramSerializer, CourseSerializer, ModuleSerializer, TopicSerializer

class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        institute = request.user.institute
        
        if not query or not institute:
            return Response({'programs': [], 'courses': [], 'modules': [], 'topics': []})

        # Filter all search results by the user's institute
        programs = Program.objects.filter(institute=institute).filter(Q(title__icontains=query) | Q(description__icontains=query))
        courses = Course.objects.filter(institute=institute).filter(Q(title__icontains=query) | Q(description__icontains=query))
        modules = Module.objects.filter(institute=institute).filter(Q(title__icontains=query))
        topics = Topic.objects.filter(institute=institute).filter(Q(title__icontains=query) | Q(content__icontains=query))

        return Response({
            'programs': ProgramSerializer(programs, many=True).data,
            'courses': CourseSerializer(courses, many=True).data,
            'modules': ModuleSerializer(modules, many=True).data,
            'topics': TopicSerializer(topics, many=True).data,
        })
