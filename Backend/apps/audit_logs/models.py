from django.db import models
from django.conf import settings
from apps.users.models import Institute

class AuditLog(models.Model):
    """System audit logs with multi-tenancy support"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=100)
    table_name = models.CharField(max_length=100)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} on {self.table_name} ({self.institute.name if self.institute else 'Global'})"
