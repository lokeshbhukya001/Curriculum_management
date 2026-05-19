# Dynamic CMS Frontend Setup Guide

## Overview
Your React frontend has been converted from static data to fully dynamic, ready to connect with your Django backend.

## What Changed

### Frontend Structure
```
src/
├── pages/
│   ├── Dashboard.jsx      # Fetches stats dynamically
│   ├── Programs.jsx       # CRUD operations
│   ├── Courses.jsx        # CRUD operations
│   ├── Modules.jsx        # CRUD operations
│   ├── Schedule.jsx       # Placeholder
│   ├── AIAnalysis.jsx     # Placeholder
│   └── Login.jsx          # Authentication
├── components/
│   ├── Navbar.jsx         # Dynamic navbar
│   └── Sidebar.jsx        # Dynamic navigation menu
├── services/
│   └── api.js            # Centralized API service
└── App.jsx               # Complete routing setup
```

## API Service Layer

The `src/services/api.js` file provides all API methods:

### Available Methods
```javascript
// Import the API service
import { getStats, getPrograms, getCourses, getModules, getTopics } from '../services/api'

// Fetch methods
await getStats()           // Get dashboard statistics
await getPrograms()        // List all programs
await getCourses()         // List all courses
await getModules()         // List all modules
await getTopics()          // List all topics

// Create methods
await createProgram(data)  // Create new program
await createCourse(data)   // Create new course
await createModule(data)   // Create new module
await createTopic(data)    // Create new topic
```

## Backend Setup Requirements

### 1. Django Models
Create these models in your Django app:

```python
from django.db import models

class Program(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Course(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Topic(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. Django REST Framework Setup
```bash
pip install djangorestframework django-cors-headers
```

### 3. settings.py Configuration
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'your_app_name',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}
```

### 4. API URLs (urls.py)
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'programs', views.ProgramViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'modules', views.ModuleViewSet)
router.register(r'topics', views.TopicViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/stats/', views.StatsView.as_view()),
]
```

### 5. API Views (views.py)
```python
from rest_framework import viewsets, views, response, status
from rest_framework.decorators import action
from .models import Program, Course, Module, Topic
from .serializers import ProgramSerializer, CourseSerializer, ModuleSerializer, TopicSerializer

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer

class StatsView(views.APIView):
    def get(self, request):
        return response.Response({
            'programs': Program.objects.count(),
            'courses': Course.objects.count(),
            'modules': Module.objects.count(),
            'topics': Topic.objects.count(),
        })
```

## Running the Application

### Frontend
```bash
cd Frontend/frontend
npm run dev
```
Access at: http://localhost:5175

### Backend
```bash
cd Backend
python manage.py runserver
```
Server at: http://localhost:8000

## Configuration

### Environment Variables
Create a `.env.local` file in `Frontend/frontend/`:
```
VITE_API_URL=http://localhost:8000/api
```

## Features Implemented

✅ Dynamic Dashboard Stats
✅ Programs CRUD (with mock API fallback)
✅ Courses CRUD (with mock API fallback)
✅ Modules CRUD (with mock API fallback)
✅ Login Page
✅ Responsive Design
✅ Error Handling
✅ Loading States
✅ Navigation with React Router

## Next Steps

1. Set up Django models and serializers
2. Configure CORS in Django
3. Create REST API endpoints
4. Test API connections
5. Implement authentication
6. Add validation and error handling
