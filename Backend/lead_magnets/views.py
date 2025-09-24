from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import LeadMagnet, Lead, Download
from .serializers import LeadMagnetSerializer, LeadSerializer, DashboardStatsSerializer

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's lead magnets
        user_lead_magnets = LeadMagnet.objects.filter(owner=user)
        
        # Calculate stats
        total_lead_magnets = user_lead_magnets.count()
        active_lead_magnets = user_lead_magnets.filter(
            Q(status='completed') | Q(status='in-progress')
        ).count()
        
        # Get total downloads for user's lead magnets
        total_downloads = Download.objects.filter(
            lead_magnet__owner=user
        ).count()
        
        # Get total leads generated for user's lead magnets
        leads_generated = Lead.objects.filter(
            lead_magnet__owner=user
        ).count()
        
        stats = {
            'total_lead_magnets': total_lead_magnets,
            'active_lead_magnets': active_lead_magnets,
            'total_downloads': total_downloads,
            'leads_generated': leads_generated
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

class LeadMagnetListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadMagnetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class LeadMagnetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeadMagnetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnet.objects.filter(owner=self.request.user)
