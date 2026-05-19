from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramViewSet, CourseViewSet, ModuleViewSet, 
    TopicViewSet, LearningObjectiveViewSet, MaterialViewSet
)

router = DefaultRouter()
router.register(r'programs', ProgramViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'learning-objectives', LearningObjectiveViewSet)
router.register(r'materials', MaterialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
