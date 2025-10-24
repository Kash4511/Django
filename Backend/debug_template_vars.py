from lead_magnets.models import TemplateSelection, FirmProfile
from lead_magnets.perplexity_client import PerplexityClient
import json

# Get the latest template selection and firm profile
ts = TemplateSelection.objects.last()
fp = FirmProfile.objects.filter(user=ts.user).first() if ts else None

if ts and ts.ai_generated_content:
    client = PerplexityClient()
    firm_profile_dict = {
        'firm_name': fp.firm_name if fp else '',
        'work_email': fp.work_email if fp else '',
        'phone_number': fp.phone_number if fp else '',
        'firm_website': fp.firm_website if fp else '',
        'tagline': fp.tagline if fp else '',
    } if fp else {}
    
    template_vars = client.map_to_template_vars(ts.ai_generated_content, firm_profile_dict)
    
    print('🔍 Template Variables Summary:')
    print(f'Total variables: {len(template_vars)}')
    
    # Check key content variables
    content_vars = ['customContent1', 'customContent2', 'customContent3', 'customContent4', 'customContent5']
    for var in content_vars:
        value = template_vars.get(var, '')
        preview = value[:50] + '...' if len(value) > 50 else value
        print(f'{var}: {len(value)} chars - "{preview}"')
    
    # Check section titles
    title_vars = ['customTitle1', 'customTitle2', 'customTitle3', 'customTitle4', 'customTitle5']
    for var in title_vars:
        value = template_vars.get(var, '')
        print(f'{var}: "{value}"')
        
    # Check main title and subtitle
    print(f'mainTitle: "{template_vars.get("mainTitle", "")}"')
    print(f'documentSubtitle: "{template_vars.get("documentSubtitle", "")}"')
    
    # Check if any content is actually there
    non_empty_content = {k: v for k, v in template_vars.items() if v and str(v).strip()}
    print(f'\n✅ Non-empty variables: {len(non_empty_content)}')
    
    # Show some non-empty variables
    for k, v in list(non_empty_content.items())[:10]:
        preview = str(v)[:30] + '...' if len(str(v)) > 30 else str(v)
        print(f'  {k}: "{preview}"')
        
else:
    print('❌ No template selection or AI content found!')