from django.db import models
from django.conf import settings
from apps.users.models import Institute

class Program(models.Model):
    """Top-level curriculum structure"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, related_name='programs', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='programs_created')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.institute.name if self.institute else 'No Inst'}"

class Course(models.Model):
    """Course within a program"""
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField()
    semester = models.CharField(max_length=50, blank=True)
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, related_name='courses', null=True, blank=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses_taught')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Module(models.Model):
    """Module within a course"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    order_number = models.IntegerField(default=0)
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, related_name='modules', null=True, blank=True)

    class Meta:
        ordering = ['order_number']

    def __str__(self):
        return self.title

class Topic(models.Model):
    """Topic within a module"""
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    order_number = models.IntegerField(default=0)
    prerequisite_topic = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, related_name='topics', null=True, blank=True)

    class Meta:
        ordering = ['order_number']

    def __str__(self):
        return self.title

class LearningObjective(models.Model):
    """Objective for a topic"""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='objectives')
    objective = models.TextField()

    def __str__(self):
        return self.objective[:50]

class Material(models.Model):
    """Study material for a topic"""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255, default="Material")
    file = models.FileField(upload_to='materials/', null=True, blank=True)
    file_url = models.URLField(max_length=500, blank=True, null=True) 
    file_type = models.CharField(max_length=50, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.topic.title}"

class Enrollment(models.Model):
    """Student enrollment in courses"""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} - {self.course.title}"
