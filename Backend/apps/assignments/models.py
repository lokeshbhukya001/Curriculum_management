from django.db import models
from django.conf import settings
from apps.curriculum.models import Course

class Assignment(models.Model):
    """Assignment for a course"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    topic = models.ForeignKey('curriculum.Topic', on_delete=models.CASCADE, related_name='assignments', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Submission(models.Model):
    """Submission for an assignment"""
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"
