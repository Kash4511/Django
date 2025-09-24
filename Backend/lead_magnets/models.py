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
