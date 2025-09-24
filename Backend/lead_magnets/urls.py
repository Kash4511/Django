from django.urls import path
from .views import (
    DashboardStatsView, LeadMagnetListCreateView, LeadMagnetDetailView,
    FirmProfileView, LeadMagnetGenerationListCreateView, LeadMagnetGenerationDetailView
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lead-magnets/', LeadMagnetListCreateView.as_view(), name='lead-magnet-list'),
    path('lead-magnets/<int:pk>/', LeadMagnetDetailView.as_view(), name='lead-magnet-detail'),
    
    # New endpoints for lead magnet generation system
    path('firm-profile/', FirmProfileView.as_view(), name='firm-profile'),
    path('generations/', LeadMagnetGenerationListCreateView.as_view(), name='lead-magnet-generation-list'),
    path('generations/<int:pk>/', LeadMagnetGenerationDetailView.as_view(), name='lead-magnet-generation-detail'),
]