from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.curriculum.models import Program, Course, Module, Topic

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        institute = user.institute
        
        if not institute:
            # If for some reason user has no institute, return zeros
            return Response({
                'programs': 0,
                'courses': 0,
                'modules': 0,
                'topics': 0,
            })

        # Filter counts by the user's institute
        data = {
            'programs': Program.objects.filter(institute=institute).count(),
            'courses': Course.objects.filter(institute=institute).count(),
            'modules': Module.objects.filter(institute=institute).count(),
            'topics': Topic.objects.filter(institute=institute).count(),
        }
        return Response(data)
