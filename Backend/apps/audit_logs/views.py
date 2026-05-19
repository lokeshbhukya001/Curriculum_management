from rest_framework import viewsets, permissions
from .models import AuditLog
from rest_framework import serializers

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = AuditLog
        fields = '__all__'

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only allow if user role is admin
        if getattr(user, 'role', '').lower() == 'admin':
            # Filter logs by the admin's institute
            return self.queryset.filter(institute=user.institute)
        return AuditLog.objects.none()
