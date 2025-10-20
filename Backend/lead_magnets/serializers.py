from rest_framework import serializers
from .models import LeadMagnet, Lead, Download, FirmProfile, LeadMagnetGeneration

from rest_framework import serializers
from .models import LeadMagnet, LeadMagnetGeneration, FirmProfile


# ---- Sub Serializers ----
class FirmProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirmProfile
        fields = "__all__"


class LeadMagnetGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadMagnetGeneration
        fields = [
            "lead_magnet_type",
            "main_topic",
            "target_audience",
            "audience_pain_points",
            "desired_outcome",
            "call_to_action",
            "special_requests",
        ]


# ---- Main Create Serializer ----
class CreateLeadMagnetSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    firm_profile = FirmProfileSerializer(required=False)
    generation_data = LeadMagnetGenerationSerializer()

    def create(self, validated_data):
        generation_data = validated_data.pop("generation_data")
        firm_profile_data = validated_data.pop("firm_profile", None)
        user = self.context["request"].user

        # Optionally update/create firm profile if data provided
        if firm_profile_data:
            existing_profile = FirmProfile.objects.filter(user=user).first()
            if existing_profile:
                fp_serializer = FirmProfileSerializer(existing_profile, data=firm_profile_data, partial=True)
                fp_serializer.is_valid(raise_exception=True)
                fp_serializer.save()
            else:
                # Create only if required fields are present in the payload
                fp_serializer = FirmProfileSerializer(data={**firm_profile_data, "user": user.id})
                fp_serializer.is_valid(raise_exception=True)
                fp_serializer.save()

        # Create LeadMagnet first
        lead_magnet = LeadMagnet.objects.create(
            owner=user,
            title=validated_data["title"],
            description=validated_data.get("description", ""),
            status="draft",
        )

        # Create related generation data
        LeadMagnetGeneration.objects.create(lead_magnet=lead_magnet, **generation_data)

        return lead_magnet


# ---- Read Serializer ----
class LeadMagnetSerializer(serializers.ModelSerializer):
    generation_data = LeadMagnetGenerationSerializer(read_only=True)

    class Meta:
        model = LeadMagnet
        fields = [
            "id",
            "title",
            "description",
            "status",
            "created_at",
            "generation_data",
        ]


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

# class FirmProfileSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = FirmProfile
#         fields = [
#             'id', 'firm_name', 'work_email', 'phone_number', 'firm_website',
#             'firm_size', 'industry_specialties', 'logo', 'primary_brand_color',
#             'secondary_brand_color', 'preferred_font_style', 'branding_guidelines',
#             'preferred_cover_image', 'location', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']

# class LeadMagnetGenerationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LeadMagnetGeneration
#         fields = [
#             'id', 'lead_magnet_type', 'main_topic', 'target_audience',
#             'audience_pain_points', 'desired_outcome', 'call_to_action',
#             'special_requests', 'created_at'
#         ]
#         read_only_fields = ['id', 'created_at']

# class CreateLeadMagnetSerializer(serializers.Serializer):
#     # Firm profile data (if needed)
#     firm_profile = FirmProfileSerializer(required=False)
    
#     # Lead magnet generation data
#     generation_data = LeadMagnetGenerationSerializer()
    
#     # Basic lead magnet info
#     title = serializers.CharField(max_length=255)
#     description = serializers.CharField(required=False, allow_blank=True)