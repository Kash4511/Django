from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import LeadMagnet, Lead, Download, FirmProfile, LeadMagnetGeneration
from .serializers import (
    LeadMagnetSerializer, LeadSerializer, DashboardStatsSerializer,
    FirmProfileSerializer, LeadMagnetGenerationSerializer
)

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

class FirmProfileView(APIView):
    """Get or create/update firm profile for the authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            firm_profile = FirmProfile.objects.get(user=request.user)
            serializer = FirmProfileSerializer(firm_profile)
            return Response(serializer.data)
        except FirmProfile.DoesNotExist:
            return Response({'detail': 'Firm profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request):
        # Create new firm profile
        try:
            existing_profile = FirmProfile.objects.get(user=request.user)
            return Response(
                {'detail': 'Firm profile already exists. Use PUT to update.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except FirmProfile.DoesNotExist:
            pass
        
        serializer = FirmProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        # Update existing firm profile
        try:
            firm_profile = FirmProfile.objects.get(user=request.user)
        except FirmProfile.DoesNotExist:
            return Response({'detail': 'Firm profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = FirmProfileSerializer(firm_profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeadMagnetGenerationListCreateView(generics.ListCreateAPIView):
    """List user's lead magnet generations and create new ones"""
    serializer_class = LeadMagnetGenerationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnetGeneration.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Get or require firm profile
        try:
            firm_profile = FirmProfile.objects.get(user=self.request.user)
        except FirmProfile.DoesNotExist:
            raise serializers.ValidationError("Firm profile must be created before generating lead magnets")
        
        # Auto-generate title if not provided
        title = self.request.data.get('title')
        if not title:
            lead_magnet_type = self.request.data.get('lead_magnet_type', 'guide')
            main_topic = self.request.data.get('main_topic', 'custom')
            title = f"{lead_magnet_type.replace('_', ' ').title()} - {main_topic.replace('_', ' ').title()}"
        
        serializer.save(user=self.request.user, firm_profile=firm_profile, title=title)

class LeadMagnetGenerationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific lead magnet generation"""
    serializer_class = LeadMagnetGenerationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnetGeneration.objects.filter(user=self.request.user)
