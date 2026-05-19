from rest_framework import serializers
from .models import Program, Course, Module, Topic, LearningObjective, Material

class LearningObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningObjective
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'
        read_only_fields = ('uploaded_by',)

class TopicSerializer(serializers.ModelSerializer):
    objectives = LearningObjectiveSerializer(many=True, read_only=True)
    materials = MaterialSerializer(many=True, read_only=True)
    
    class Meta:
        model = Topic
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Module
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ('created_by',)
