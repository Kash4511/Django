from django.urls import path
from .views import (
    DashboardStatsView, LeadMagnetListCreateView, LeadMagnetDetailView,
    FirmProfileView, CreateLeadMagnetView
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lead-magnets/', LeadMagnetListCreateView.as_view(), name='lead-magnet-list'),
    path('lead-magnets/<int:pk>/', LeadMagnetDetailView.as_view(), name='lead-magnet-detail'),
    path('firm-profile/', FirmProfileView.as_view(), name='firm-profile'),
    path('create-lead-magnet/', CreateLeadMagnetView.as_view(), name='create-lead-magnet'),
]