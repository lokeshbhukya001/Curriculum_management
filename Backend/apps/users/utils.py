class MultiTenantViewSetMixin:
    """Mixin to filter querysets and auto-assign institute based on logged-in user"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.institute:
            # Filter by the user's institute
            return queryset.filter(institute=user.institute)
        # If user has no institute (superadmin/etc), return empty or full based on need
        # For now, let's return empty to enforce multi-tenancy
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.institute:
            serializer.save(institute=user.institute)
        else:
            serializer.save()
