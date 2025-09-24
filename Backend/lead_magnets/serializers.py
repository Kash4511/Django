from rest_framework import serializers
from .models import LeadMagnet, Lead, Download

class LeadMagnetSerializer(serializers.ModelSerializer):
    leads_count = serializers.SerializerMethodField()
    downloads_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LeadMagnet
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at', 'leads_count', 'downloads_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'leads_count', 'downloads_count']
    
    def get_leads_count(self, obj):
        return obj.leads.count()
    
    def get_downloads_count(self, obj):
        return obj.downloads.count()

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'email', 'name', 'company', 'created_at']
        read_only_fields = ['id', 'created_at']

class DashboardStatsSerializer(serializers.Serializer):
    total_lead_magnets = serializers.IntegerField()
    active_lead_magnets = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    leads_generated = serializers.IntegerField()