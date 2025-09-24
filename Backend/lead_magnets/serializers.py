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

class FirmProfileSerializer(serializers.ModelSerializer):
    industry_specialty_list = serializers.SerializerMethodField()
    
    class Meta:
        model = FirmProfile
        fields = [
            'id', 'firm_name', 'work_email', 'phone_number', 'firm_website', 
            'firm_size', 'industry_specialty', 'industry_specialty_list',
            'logo', 'primary_brand_color', 'secondary_brand_color', 
            'preferred_font_style', 'additional_branding_guidelines', 
            'branding_file', 'preferred_cover_image', 'location_country',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_industry_specialty_list(self, obj):
        """Convert comma-separated string to list for frontend"""
        if obj.industry_specialty:
            return [item.strip() for item in obj.industry_specialty.split(',') if item.strip()]
        return []
    
    def validate_industry_specialty(self, value):
        """Validate that industry specialties are from allowed choices"""
        if value:
            specialties = [item.strip() for item in value.split(',') if item.strip()]
            valid_choices = [choice[0] for choice in FirmProfile.INDUSTRY_SPECIALTY_CHOICES]
            for specialty in specialties:
                if specialty not in valid_choices:
                    raise serializers.ValidationError(f"'{specialty}' is not a valid industry specialty.")
        return value

class LeadMagnetGenerationSerializer(serializers.ModelSerializer):
    target_audience_list = serializers.SerializerMethodField()
    audience_pain_points_list = serializers.SerializerMethodField()
    firm_profile_data = FirmProfileSerializer(source='firm_profile', read_only=True)
    
    class Meta:
        model = LeadMagnetGeneration
        fields = [
            'id', 'lead_magnet_type', 'main_topic', 'custom_topic',
            'target_audience', 'target_audience_list', 'audience_pain_points', 
            'audience_pain_points_list', 'desired_outcome', 'call_to_action',
            'special_requests', 'preferred_layout_template', 'status',
            'generated_pdf', 'generation_error', 'title', 'firm_profile_data',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'generated_pdf', 'generation_error', 'created_at', 
            'updated_at', 'completed_at', 'firm_profile_data'
        ]
    
    def get_target_audience_list(self, obj):
        """Convert comma-separated string to list for frontend"""
        if obj.target_audience:
            return [item.strip() for item in obj.target_audience.split(',') if item.strip()]
        return []
    
    def get_audience_pain_points_list(self, obj):
        """Convert comma-separated string to list for frontend"""
        if obj.audience_pain_points:
            return [item.strip() for item in obj.audience_pain_points.split(',') if item.strip()]
        return []
    
    def validate_target_audience(self, value):
        """Validate that target audiences are from allowed choices"""
        if value:
            audiences = [item.strip() for item in value.split(',') if item.strip()]
            valid_choices = [choice[0] for choice in LeadMagnetGeneration.TARGET_AUDIENCE_CHOICES]
            for audience in audiences:
                if audience not in valid_choices:
                    raise serializers.ValidationError(f"'{audience}' is not a valid target audience.")
        return value
    
    def validate_audience_pain_points(self, value):
        """Validate that pain points are from allowed choices"""
        if value:
            pain_points = [item.strip() for item in value.split(',') if item.strip()]
            valid_choices = [choice[0] for choice in LeadMagnetGeneration.PAIN_POINTS_CHOICES]
            for pain_point in pain_points:
                if pain_point not in valid_choices:
                    raise serializers.ValidationError(f"'{pain_point}' is not a valid pain point.")
        return value

class DashboardStatsSerializer(serializers.Serializer):
    total_lead_magnets = serializers.IntegerField()
    active_lead_magnets = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    leads_generated = serializers.IntegerField()