from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.curriculum.views import (
    ProgramViewSet, CourseViewSet, ModuleViewSet, 
    TopicViewSet, LearningObjectiveViewSet, MaterialViewSet
)
from apps.assignments.views import AssignmentViewSet, SubmissionViewSet
from apps.audit_logs.views import AuditLogViewSet
from apps.schedules.views import ScheduleViewSet

# Single Master Router
router = DefaultRouter()

# Curriculum (Prefixed)
router.register(r'curriculum/programs', ProgramViewSet, basename='programs')
router.register(r'curriculum/courses', CourseViewSet, basename='courses')
router.register(r'curriculum/modules', ModuleViewSet, basename='modules')
router.register(r'curriculum/topics', TopicViewSet, basename='topics')
router.register(r'curriculum/materials', MaterialViewSet, basename='materials')
router.register(r'curriculum/learning-objectives', LearningObjectiveViewSet, basename='objectives')

# Assignments (Prefixed)
router.register(r'assignments/assignments', AssignmentViewSet, basename='assignments')
router.register(r'assignments/submissions', SubmissionViewSet, basename='submissions')

# Others
router.register(r'schedules', ScheduleViewSet, basename='schedules')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

from apps.curriculum.search_views import GlobalSearchView

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ai/', include('apps.ai_engine.urls')),
    path('api/search/', GlobalSearchView.as_view(), name='global-search'),
    
    # Master API entry point
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
