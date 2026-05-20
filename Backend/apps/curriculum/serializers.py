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
    # objectives and materials are small enough to keep if needed, but we can remove them if not used.
    # We will keep them for now since a Topic is the leaf node.
    objectives = LearningObjectiveSerializer(many=True, read_only=True)
    materials = MaterialSerializer(many=True, read_only=True)
    course_id = serializers.ReadOnlyField(source='module.course.id')
    
    class Meta:
        model = Topic
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ('created_by',)
