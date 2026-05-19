from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.curriculum.models import Program, Course, Module, Topic
from .models import AuditLog
import json

def log_change(sender, instance, created, **kwargs):
    action = "CREATE" if created else "UPDATE"
    
    # Capture institute from the instance if it exists
    institute = getattr(instance, 'institute', None)
    
    # Capture user from instance fields
    user = getattr(instance, 'created_by', None) or getattr(instance, 'uploaded_by', None)
    
    AuditLog.objects.create(
        user=user,
        institute=institute,
        action=action,
        table_name=sender.__name__,
        details=getattr(instance, 'title', str(instance)),
        new_data={'id': instance.id, 'title': getattr(instance, 'title', str(instance))}
    )

@receiver(post_delete, sender=Program)
@receiver(post_delete, sender=Course)
@receiver(post_delete, sender=Module)
@receiver(post_delete, sender=Topic)
def log_delete(sender, instance, **kwargs):
    institute = getattr(instance, 'institute', None)
    
    AuditLog.objects.create(
        institute=institute,
        action="DELETE",
        table_name=sender.__name__,
        details=getattr(instance, 'title', str(instance)),
        old_data={'id': instance.id, 'title': getattr(instance, 'title', str(instance))}
    )

# Connect signals for creation/update
for model in [Program, Course, Module, Topic]:
    post_save.connect(log_change, sender=model)
