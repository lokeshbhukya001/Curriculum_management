from django.db import models
from django.conf import settings
from apps.curriculum.models import Course
from apps.users.models import Institute

class Schedule(models.Model):
    """Class schedule for a course"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teaching_schedules')
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, related_name='schedules', null=True, blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.title} on {self.date}"
