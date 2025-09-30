from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

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

class FirmProfile(models.Model):
    FIRM_SIZE_CHOICES = [
        ('1-2', '1–2'),
        ('3-5', '3–5'),
        ('6-10', '6–10'),
        ('11+', '11+'),
    ]
    
    FONT_STYLE_CHOICES = [
        ('modern-sans', 'Modern Sans-Serif'),
        ('classic-serif', 'Classic Serif'),
        ('creative', 'Creative/Display'),
        ('no-preference', 'No Preference'),
    ]
    
    # User relationship - one profile per user
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='firm_profile')
    
    # Basic firm information
    firm_name = models.CharField(max_length=255)
    work_email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)
    firm_website = models.URLField(blank=True)
    firm_size = models.CharField(max_length=10, choices=FIRM_SIZE_CHOICES)
    
    # Industry specialties (stored as JSON array)
    industry_specialties = models.JSONField(default=list, blank=True)
    
    # Branding
    logo = models.FileField(upload_to='firm_logos/', blank=True, null=True)
    primary_brand_color = models.CharField(max_length=7, blank=True)  # hex color
    secondary_brand_color = models.CharField(max_length=7, blank=True)  # hex color
    preferred_font_style = models.CharField(max_length=20, choices=FONT_STYLE_CHOICES, default='no-preference')
    branding_guidelines = models.TextField(blank=True)
    preferred_cover_image = models.FileField(upload_to='cover_images/', blank=True, null=True)
    
    # Location
    location = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.firm_name} - {self.user.email}"
    
    class Meta:
        verbose_name = 'Firm Profile'
        verbose_name_plural = 'Firm Profiles'

class LeadMagnetGeneration(models.Model):
    LEAD_MAGNET_TYPE_CHOICES = [
        ('guide', 'Guide'),
        ('case-study', 'Case Study'),
        ('checklist', 'Checklist'),
        ('roi-calculator', 'ROI Calculator'),
        ('trends-report', 'Trends Report'),
        ('onboarding-flow', 'Client Onboarding Flow'),
        ('design-portfolio', 'Design Portfolio'),
        ('custom', 'Custom'),
    ]
    
    MAIN_TOPIC_CHOICES = [
        ('sustainable-architecture', 'Sustainable Architecture'),
        ('smart-homes', 'Smart Homes'),
        ('adaptive-reuse', 'Adaptive Reuse'),
        ('wellness-biophilic', 'Wellness/Biophilic'),
        ('modular-prefab', 'Modular/Prefab'),
        ('urban-placemaking', 'Urban Placemaking'),
        ('passive-house', 'Passive House/Net-Zero'),
        ('climate-resilient', 'Climate-Resilient'),
        ('project-roi', 'Project ROI'),
        ('branding-differentiation', 'Branding & Differentiation'),
        ('custom', 'Custom'),
    ]
    
    # Link to the generated lead magnet
    lead_magnet = models.OneToOneField(LeadMagnet, on_delete=models.CASCADE, related_name='generation_data')
    
    # Lead magnet configuration
    lead_magnet_type = models.CharField(max_length=30, choices=LEAD_MAGNET_TYPE_CHOICES)
    main_topic = models.CharField(max_length=50, choices=MAIN_TOPIC_CHOICES)
    
    # Target audience (stored as JSON array)
    target_audience = models.JSONField(default=list)
    
    # Audience pain points (stored as JSON array)
    audience_pain_points = models.JSONField(default=list)
    
    # Desired outcome and CTA
    desired_outcome = models.TextField()
    call_to_action = models.CharField(max_length=255)
    
    # Optional fields
    special_requests = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Generation Data: {self.lead_magnet.title}"
    
    class Meta:
        verbose_name = 'Lead Magnet Generation'
        verbose_name_plural = 'Lead Magnet Generations'

class FormaAIConversation(models.Model):
    """Stores Forma AI chat conversations and user answers"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    
    # Chat messages stored as JSON array [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
    messages = models.JSONField(default=list)
    
    # Extracted user answers/requirements
    user_answers = models.JSONField(default=dict, blank=True)
    
    # Linked lead magnet if conversation results in PDF generation
    lead_magnet = models.ForeignKey(LeadMagnet, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_conversations')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"AI Conversation - {self.user.email} - {self.created_at.strftime('%Y-%m-%d')}"
    
    class Meta:
        ordering = ['-created_at']

class TemplateSelection(models.Model):
    """Stores user's template selection from APITemplate.io"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='template_selections')
    lead_magnet = models.OneToOneField(LeadMagnet, on_delete=models.CASCADE, related_name='template_selection')
    
    # APITemplate.io template ID
    template_id = models.CharField(max_length=255)
    template_name = models.CharField(max_length=255)
    template_thumbnail = models.URLField(blank=True)
    
    # User answers that will be used to populate the template
    # Can come from either Create Lead Magnet or Forma AI
    captured_answers = models.JSONField(default=dict)
    
    # Source of the answers
    SOURCE_CHOICES = [
        ('create-lead-magnet', 'Create Lead Magnet'),
        ('forma-ai', 'Forma AI'),
    ]
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    
    # AI-generated content (will be populated later when OpenAI is integrated)
    ai_generated_content = models.JSONField(default=dict, blank=True)
    
    # PDF generation status
    STATUS_CHOICES = [
        ('template-selected', 'Template Selected'),
        ('content-generated', 'Content Generated'),
        ('preview-ready', 'Preview Ready'),
        ('pdf-generated', 'PDF Generated'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='template-selected')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Template: {self.template_name} - {self.lead_magnet.title}"
    
    class Meta:
        ordering = ['-created_at']
