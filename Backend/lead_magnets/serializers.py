from rest_framework import serializers
from .models import LeadMagnet, Lead, Download, FirmProfile, LeadMagnetGeneration

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

class FirmProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirmProfile
        fields = [
            'id', 'firm_name', 'work_email', 'phone_number', 'firm_website',
            'firm_size', 'industry_specialties', 'logo', 'primary_brand_color',
            'secondary_brand_color', 'preferred_font_style', 'branding_guidelines',
            'preferred_cover_image', 'location', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LeadMagnetGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadMagnetGeneration
        fields = [
            'id', 'lead_magnet_type', 'main_topic', 'target_audience',
            'audience_pain_points', 'desired_outcome', 'call_to_action',
            'special_requests', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CreateLeadMagnetSerializer(serializers.Serializer):
    # Firm profile data (if needed)
    firm_profile = FirmProfileSerializer(required=False)
    
    # Lead magnet generation data
    generation_data = LeadMagnetGenerationSerializer()
    
    # Basic lead magnet info
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)