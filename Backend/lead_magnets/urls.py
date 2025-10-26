from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lead-magnets/', views.LeadMagnetListCreateView.as_view(), name='lead-magnet-list-create'),
    path('lead-magnets/<int:pk>/', views.LeadMagnetDetailView.as_view(), name='lead-magnet-detail'),
    path('firm-profile/', views.FirmProfileView.as_view(), name='firm-profile'),
    path('create-lead-magnet/', views.CreateLeadMagnetView.as_view(), name='create-lead-magnet'),
    
    # Template management
    path('templates/', views.ListTemplatesView.as_view(), name='list-templates'),
    path('select-template/', views.SelectTemplateView.as_view(), name='select-template'),
    path('generate-pdf/', views.GeneratePDFView.as_view(), name='generate-pdf'),
    path('preview-template/', views.PreviewTemplateView.as_view(), name='preview-template'),
    path('generate-document-preview/', views.GenerateDocumentPreviewView.as_view(), name='generate-document-preview'),
    
    # AI Conversation
    path('ai-conversation/', views.FormaAIConversationView.as_view(), name='ai-conversation'),
]