from django.db import models
from django.contrib.auth.models import AbstractUser

class Institute(models.Model):
    name = models.CharField(max_length=255, unique=True) # e.g., "CMRCET"
    subdomain = models.SlugField(unique=True, blank=True, null=True) # e.g., "cmrcet"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """Custom User model with role-based access and multi-tenancy"""
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    # Link every user to a specific institute
    institute = models.ForeignKey(Institute, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.institute.name if self.institute else 'No Institute'}"
