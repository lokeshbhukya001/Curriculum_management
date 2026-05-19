from django.urls import path
from .views import AISequenceView, AIGapAnalysisView, AIGeneratorView, AIBenchmarkView

urlpatterns = [
    path('sequence/', AISequenceView.as_view(), name='ai-sequence'),
    path('gap-analysis/', AIGapAnalysisView.as_view(), name='ai-gap-analysis'),
    path('generate/', AIGeneratorView.as_view(), name='ai-generate'),
    path('benchmark/', AIBenchmarkView.as_view(), name='ai-benchmark'),
]
