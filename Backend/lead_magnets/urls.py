from django.urls import path
from .views import DashboardStatsView, LeadMagnetListCreateView, LeadMagnetDetailView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lead-magnets/', LeadMagnetListCreateView.as_view(), name='lead-magnet-list'),
    path('lead-magnets/<int:pk>/', LeadMagnetDetailView.as_view(), name='lead-magnet-detail'),
]