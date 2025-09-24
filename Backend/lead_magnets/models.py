from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FirmProfile(models.Model):
    """One-time firm profile/branding information (reusable)"""
    
    FIRM_SIZE_CHOICES = [
        ('1-2', '1–2'),
        ('3-5', '3–5'),
        ('6-10', '6–10'),
        ('11+', '11+'),
    ]
    
    INDUSTRY_SPECIALTY_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('mixed_practice', 'Mixed Practice'),
        ('sustainable_green', 'Sustainable/Green'),
        ('educational_civic', 'Educational/Civic'),
        ('hospitality', 'Hospitality'),
        ('healthcare', 'Healthcare'),
        ('interiors', 'Interiors'),
        ('urban_design', 'Urban Design'),
        ('other', 'Other'),
    ]
    
    FONT_STYLE_CHOICES = [
        ('modern_sans_serif', 'Modern Sans-Serif'),
        ('classic_serif', 'Classic Serif'),
        ('creative_display', 'Creative/Display'),
        ('no_preference', 'No Preference'),
    ]
    
    # Link to user
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='firm_profile')
    
    # Basic Information
    firm_name = models.CharField(max_length=255)
    work_email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)
    firm_website = models.URLField(blank=True)
    firm_size = models.CharField(max_length=10, choices=FIRM_SIZE_CHOICES)
    
    # Industry (stored as comma-separated values for multi-select)
    industry_specialty = models.TextField(help_text="Comma-separated industry specialties")
    
    # Branding
    logo = models.FileField(upload_to='firm_logos/', blank=True, null=True)
    primary_brand_color = models.CharField(max_length=7, help_text="Hex color code")
    secondary_brand_color = models.CharField(max_length=7, blank=True, help_text="Hex color code")
    preferred_font_style = models.CharField(max_length=20, choices=FONT_STYLE_CHOICES)
    additional_branding_guidelines = models.TextField(blank=True)
    branding_file = models.FileField(upload_to='branding_files/', blank=True, null=True)
    preferred_cover_image = models.FileField(upload_to='cover_images/', blank=True, null=True)
    location_country = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.firm_name} - {self.user.email}"
    
    class Meta:
        verbose_name = "Firm Profile"
        verbose_name_plural = "Firm Profiles"

class LeadMagnetGeneration(models.Model):
    """Per-lead magnet PDF generation data (collected every time)"""
    
    LEAD_MAGNET_TYPE_CHOICES = [
        ('guide', 'Guide'),
        ('case_study', 'Case Study'),
        ('checklist', 'Checklist'),
        ('roi_calculator', 'ROI Calculator'),
        ('trends_report', 'Trends Report'),
        ('client_onboarding_flow', 'Client Onboarding Flow'),
        ('design_portfolio', 'Design Portfolio'),
        ('custom', 'Custom'),
    ]
    
    MAIN_TOPIC_CHOICES = [
        ('sustainable_architecture', 'Sustainable Architecture'),
        ('smart_homes', 'Smart Homes'),
        ('adaptive_reuse', 'Adaptive Reuse'),
        ('wellness_biophilic', 'Wellness/Biophilic'),
        ('modular_prefab', 'Modular/Prefab'),
        ('urban_placemaking', 'Urban Placemaking'),
        ('passive_house_net_zero', 'Passive House/Net-Zero'),
        ('climate_resilient', 'Climate-Resilient'),
        ('project_roi', 'Project ROI'),
        ('branding_differentiation', 'Branding & Differentiation'),
        ('custom', 'Custom'),
    ]
    
    TARGET_AUDIENCE_CHOICES = [
        ('homeowners', 'Homeowners'),
        ('developers', 'Developers'),
        ('commercial_clients', 'Commercial Clients'),
        ('government', 'Government'),
        ('architects_peers', 'Architects/Peers'),
        ('contractors', 'Contractors'),
        ('real_estate_agents', 'Real Estate Agents'),
        ('nonprofits', 'Nonprofits'),
        ('facility_managers', 'Facility Managers'),
        ('other', 'Other'),
    ]
    
    PAIN_POINTS_CHOICES = [
        ('high_costs', 'High costs'),
        ('roi_uncertainty', 'ROI uncertainty'),
        ('compliance_issues', 'Compliance issues'),
        ('sustainability_demands', 'Sustainability demands'),
        ('risk_management', 'Risk management'),
        ('long_timelines', 'Long timelines'),
        ('tech_complexity', 'Tech complexity'),
        ('poor_communication', 'Poor communication'),
        ('competition', 'Competition'),
        ('approvals', 'Approvals'),
        ('energy_efficiency', 'Energy efficiency'),
        ('health_wellness', 'Health/Wellness'),
        ('vendor_reliability', 'Vendor reliability'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in-progress', 'In Progress'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    # Link to user and firm profile
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lead_magnet_generations')
    firm_profile = models.ForeignKey(FirmProfile, on_delete=models.CASCADE, related_name='lead_magnets')
    
    # Lead Magnet Details
    lead_magnet_type = models.CharField(max_length=30, choices=LEAD_MAGNET_TYPE_CHOICES)
    main_topic = models.CharField(max_length=30, choices=MAIN_TOPIC_CHOICES)
    custom_topic = models.CharField(max_length=255, blank=True, help_text="Used when main_topic is 'custom'")
    
    # Audience (stored as comma-separated values for multi-select)
    target_audience = models.TextField(help_text="Comma-separated target audiences")
    audience_pain_points = models.TextField(help_text="Comma-separated pain points")
    
    # Content
    desired_outcome = models.TextField(help_text="Short text describing desired outcome/solution")
    call_to_action = models.CharField(max_length=255, help_text="e.g. Schedule Consultation, Download Portfolio")
    special_requests = models.TextField(blank=True, help_text="Optional additional sections or requests")
    preferred_layout_template = models.CharField(max_length=100, blank=True, help_text="Future feature")
    
    # Generation Status and Results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    generated_pdf = models.FileField(upload_to='generated_lead_magnets/', blank=True, null=True)
    generation_error = models.TextField(blank=True, help_text="Error message if generation failed")
    
    # Tracking
    title = models.CharField(max_length=255, help_text="Auto-generated or user-provided title")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Lead Magnet Generation"
        verbose_name_plural = "Lead Magnet Generations"

# Keep existing models for backward compatibility
class LeadMagnet(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lead_magnets')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # PDF file storage (for future implementation)
    pdf_file = models.FileField(upload_to='lead_magnets/', blank=True, null=True)
    
    def __str__(self):
        return str(self.title)
    
    class Meta:
        ordering = ['-created_at']

class Lead(models.Model):
    lead_magnet = models.ForeignKey(LeadMagnet, on_delete=models.CASCADE, related_name='leads')
    email = models.EmailField()
    name = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.email} - {self.lead_magnet.title}"
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['lead_magnet', 'email']

class Download(models.Model):
    lead_magnet = models.ForeignKey(LeadMagnet, on_delete=models.CASCADE, related_name='downloads')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='downloads')
    
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        return f"Download: {self.lead_magnet.title} by {self.lead.email}"
    
    class Meta:
        ordering = ['-downloaded_at']
