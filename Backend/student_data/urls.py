from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'programs', views.ProgramViewSet, basename='program')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'modules', views.ModuleViewSet, basename='module')
router.register(r'topics', views.TopicViewSet, basename='topic')
router.register(r'files', views.FileUploadViewSet, basename='file')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')

urlpatterns = [
    # Authentication
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/signup/', views.UserSignupView.as_view(), name='signup'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Dashboard
    path('stats/', views.DashboardStatsView.as_view(), name='stats'),
    
    # ViewSets
    path('', include(router.urls)),
]
