import os
import json
import requests
from typing import Dict, Any, Optional
from datetime import datetime


class PerplexityClient:
    """Client for interacting with Perplexity AI API for lead magnet content generation"""
    
    def __init__(self):
        self.api_key = os.getenv('PERPLEXITY_API_KEY')
        self.base_url = "https://api.perplexity.ai/chat/completions"
        
    def generate_lead_magnet_json(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured JSON content for lead magnet using Perplexity AI
        """
        if not self.api_key:
            # Return mock data if no API key is configured
            return self._generate_mock_content(user_answers, firm_profile)
        
        # Create a comprehensive prompt for content generation
        prompt = self._create_content_prompt(user_answers, firm_profile)
        
        try:
            response = requests.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-sonar-small-128k-online",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert content creator specializing in professional lead magnets. Generate comprehensive, valuable content in strict JSON format."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 4000,
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = json.loads(result['choices'][0]['message']['content'])
                return content
            else:
                print(f"Perplexity API error: {response.status_code} - {response.text}")
                return self._generate_mock_content(user_answers, firm_profile)
                
        except Exception as e:
            print(f"Error calling Perplexity API: {str(e)}")
            return self._generate_mock_content(user_answers, firm_profile)

    def _create_content_prompt(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> str:
        """
        Create a detailed prompt for AI content generation based on user inputs and firm profile
        """
        firm_name = firm_profile.get('firm_name', 'Your Company')
        industry = firm_profile.get('industry', 'Professional Services')
        target_audience = user_answers.get('target_audience', 'Business Professionals')
        main_topic = user_answers.get('main_topic', 'Industry Best Practices')
        lead_magnet_type = user_answers.get('lead_magnet_type', 'Guide')
        
        prompt = f"""
        Create a professional {lead_magnet_type} about "{main_topic}" tailored for {target_audience} in the {industry} sector.
        Company: {firm_name}
        
        Structure the response as valid JSON with these keys:
        - style: colors (primary_color, secondary_color, accent_color)
        - cover: title, subtitle, company_name, company_tagline
        - terms: summary (short paragraph)
        - contents: items (list of 6 short items)
        - sections: list of 6 sections. Each section has: title, content (2-3 paragraphs), subsections (array of 2-3 short titled items with content)
        - contact: title, description, phone, email, website, differentiator (one sentence)
        
        Keep tone authoritative yet friendly. Avoid placeholders. Use specific, real-sounding content.
        """
        return prompt

    def _generate_mock_content(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate mock content when API key is not available
        """
        firm_name = firm_profile.get('firm_name', 'Your Company')
        website = firm_profile.get('firm_website', 'https://www.example.com')
        email = firm_profile.get('work_email', 'contact@example.com')
        phone = firm_profile.get('phone_number', '+1 (555) 123-4567')
        main_topic = user_answers.get('main_topic', 'Industry Best Practices')
        lead_magnet_type = user_answers.get('lead_magnet_type', 'Guide')
        
        return {
            "style": {
                "primary_color": "#2563eb",
                "secondary_color": "#ea580c",
                "accent_color": "#16a34a"
            },
            "cover": {
                "title": f"{lead_magnet_type}: {main_topic}",
                "subtitle": "Actionable strategies to accelerate results",
                "company_name": firm_name,
                "company_tagline": "Trusted expertise, measurable outcomes"
            },
            "terms": {
                "summary": "This guide provides expert insights for educational purposes. Implement strategies with professional judgment."
            },
            "contents": {
                "items": [
                    "Getting Started",
                    "Core Principles",
                    "Key Strategies",
                    "Implementation",
                    "Best Practices",
                    "Next Steps"
                ]
            },
            "sections": [
                {
                    "title": "Getting Started",
                    "content": "Begin with clear objectives and stakeholder alignment. Establish metrics and define success criteria to guide execution.",
                    "subsections": [
                        {
                            "title": "Define Goals",
                            "content": "Clarify measurable outcomes that matter to your audience."
                        },
                        {
                            "title": "Assess Readiness",
                            "content": "Map current capabilities and gaps before initiating change."
                        },
                        {
                            "title": "Build Momentum",
                            "content": "Secure quick wins to demonstrate value early."
                        }
                    ]
                },
                {
                    "title": "Core Principles",
                    "content": "Adopt evidence-based practices. Standardize processes and reinforce accountability through transparent reporting.",
                    "subsections": [
                        {
                            "title": "Consistency",
                            "content": "Ensure repeatable methods to reduce variability."
                        },
                        {
                            "title": "Focus",
                            "content": "Prioritize high-leverage activities over noise."
                        }
                    ]
                },
                {
                    "title": "Key Strategies",
                    "content": "Combine strategic planning with disciplined execution. Iterate based on data and feedback loops.",
                    "subsections": [
                        {
                            "title": "Plan",
                            "content": "Set quarterly objectives and initiatives."
                        },
                        {
                            "title": "Execute",
                            "content": "Drive initiatives with clear owners and timelines."
                        }
                    ]
                },
                {
                    "title": "Implementation",
                    "content": "Translate strategy into action through sprints and checkpoints. Remove blockers and refine scope proactively.",
                    "subsections": [
                        {
                            "title": "Sprints",
                            "content": "Use short cycles to ship value frequently."
                        },
                        {
                            "title": "Review",
                            "content": "Hold regular reviews to adapt and improve."
                        }
                    ]
                },
                {
                    "title": "Best Practices",
                    "content": "Document what works, capture lessons learned, and share patterns to raise the baseline across teams.",
                    "subsections": [
                        {
                            "title": "Documentation",
                            "content": "Maintain living artifacts that support onboarding and reuse."
                        },
                        {
                            "title": "Enablement",
                            "content": "Train teams on the essentials and give them tools."
                        }
                    ]
                },
                {
                    "title": "Next Steps",
                    "content": "Outline immediate actions and set expectations for follow-up. Provide pathways for continued engagement.",
                    "subsections": [
                        {
                            "title": "Immediate Actions",
                            "content": "Identify 3 tasks to accomplish in the next week."
                        },
                        {
                            "title": "Engage",
                            "content": "Invite stakeholders to a working session."
                        }
                    ]
                }
            ],
            "contact": {
                "title": "Let’s get to work",
                "description": "Ready to accelerate results? Reach out to start a conversation.",
                "phone": phone,
                "email": email,
                "website": website,
                "differentiator": "Dedicated partnership focused on measurable outcomes."
            }
        }

    def map_to_template_vars(self, ai_content: Dict[str, Any], firm_profile: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Map AI content to Template.html placeholders (camelCase keys)
        """
        firm_profile = firm_profile or {}
        style = ai_content.get("style", {})
        cover = ai_content.get("cover", {})
        contents = ai_content.get("contents", {})
        sections = ai_content.get("sections", [])
        contact = ai_content.get("contact", {})

        # Firm details fallback
        company_name = firm_profile.get("firm_name") or cover.get("company_name") or "Your Company"
        company_tagline = cover.get("company_tagline") or firm_profile.get("tagline") or "Trusted expertise, measurable outcomes"
        phone = firm_profile.get("phone_number") or contact.get("phone") or "+1 (555) 123-4567"
        email = firm_profile.get("work_email") or contact.get("email") or "contact@example.com"
        website = firm_profile.get("firm_website") or contact.get("website") or "https://www.example.com"

        # Header/section labels
        def get_title(idx: int, default: str) -> str:
            if 0 <= idx < len(sections):
                return sections[idx].get("title", default)
            return default

        # Contents items
        content_items = contents.get("items", [])
        while len(content_items) < 6:
            content_items.append(f"Section {len(content_items)+1}")

        # Helper to get subsection
        def get_sub(section_idx: int, sub_idx: int) -> Dict[str, str]:
            sec = sections[section_idx] if section_idx < len(sections) else {}
            subs = sec.get("subsections", []) if isinstance(sec, dict) else []
            return subs[sub_idx] if sub_idx < len(subs) else {"title": "Key Insight", "content": "Detailed insight to support your execution."}

        # Helper to get section content
        def get_content(section_idx: int, default: str = "") -> str:
            sec = sections[section_idx] if section_idx < len(sections) else {}
            return sec.get("content", default) if isinstance(sec, dict) else default

        now_year = str(datetime.now().year)

        template_vars: Dict[str, str] = {
            # Style variables
            "primaryColor": style.get("primary_color", "#8B4513"),
            "secondaryColor": style.get("secondary_color", "#D2691E"),
            "accentColor": style.get("accent_color", "#F4A460"),

            # Cover
            "documentTitle": cover.get("title", "Professional Guide"),
            "companyName": company_name,
            "companySubtitle": company_tagline,
            "mainTitle": cover.get("title", "PROFESSIONAL GUIDE").upper(),
            "documentSubtitle": cover.get("subtitle", "Expert insights and strategies"),
            "phoneNumber": phone,
            "emailAddress": email,
            "website": website,

            # Headers & section titles
            "headerText1": "Important Info",
            "sectionTitle1": "Terms of Use",
            "headerText2": "Overview",
            "sectionTitle2": "Contents",
            "headerText3": "Section 1",
            "sectionTitle3": get_title(0, "Section 1"),
            "headerText4": "Section 2",
            "sectionTitle4": get_title(1, "Section 2"),
            "headerText5": "Section 3",
            "sectionTitle5": get_title(2, "Section 3"),
            "headerText6": "Section 4",
            "sectionTitle6": get_title(3, "Section 4"),
            "headerText7": "Section 5",
            "sectionTitle7": get_title(4, "Section 5"),
            "headerText8": "Next Steps",
            "sectionTitle8": "Contact & Next Steps",

            # Contents page items
            "contentItem1": content_items[0],
            "contentItem2": content_items[1],
            "contentItem3": content_items[2],
            "contentItem4": content_items[3],
            "contentItem5": content_items[4],
            "contentItem6": content_items[5],

            # Page 4
            "customTitle1": get_title(0, "Introduction"),
            "customContent1": get_content(0, ""),
            "boxTitle1": get_sub(0, 0).get("title", "Key Insight"),
            "boxContent1": get_sub(0, 0).get("content", ""),
            "subheading1": get_sub(0, 1).get("title", "Key Point"),
            "subcontent1": get_sub(0, 1).get("content", ""),
            "accentBoxTitle1": get_sub(0, 2).get("title", "Quick Win"),
            "accentBoxContent1": get_sub(0, 2).get("content", ""),

            # Page 5
            "customTitle2": get_title(1, "Core Principles"),
            "customContent2": get_content(1, ""),
            "columnBoxTitle1": get_sub(1, 0).get("title", "Principle A"),
            "columnBoxContent1": get_sub(1, 0).get("content", ""),
            "columnBoxTitle2": get_sub(1, 1).get("title", "Principle B"),
            "columnBoxContent2": get_sub(1, 1).get("content", ""),
            "subheading2": get_sub(1, 2).get("title", "Focus Area"),
            "subcontent2": get_sub(1, 2).get("content", ""),
            "quoteText1": "Execution without clarity creates noise.",
            "quoteAuthor1": company_name,

            # Page 6
            "customTitle3": get_title(2, "Key Strategies"),
            "customContent3": get_content(2, ""),
            "accentBoxTitle2": get_sub(2, 0).get("title", "Strategy"),
            "accentBoxContent2": get_sub(2, 0).get("content", ""),
            "subheading3": get_sub(2, 1).get("title", "Tactic"),
            "listItem1": get_sub(2, 1).get("content", "Define measurable outcomes"),
            "listItem2": content_items[1],
            "listItem3": content_items[2],
            "listItem4": content_items[3],
            "boxTitle2": get_sub(2, 2).get("title", "Pro Tip"),
            "boxContent2": get_sub(2, 2).get("content", ""),

            # Page 7
            "customTitle4": get_title(3, "Implementation"),
            "customContent4": get_content(3, ""),
            "columnTitle1": get_sub(3, 0).get("title", "Sprint"),
            "columnContent1": get_sub(3, 0).get("content", ""),
            "columnTitle2": get_sub(3, 1).get("title", "Review"),
            "columnContent2": get_sub(3, 1).get("content", ""),
            "boxTitle3": get_sub(3, 2).get("title", "Checkpoint"),
            "boxContent3": get_sub(3, 2).get("content", ""),
            "subheading4": "Key Takeaway",
            "subcontent4": "Document lessons and share patterns to raise the baseline.",

            # Page 8
            "customTitle5": get_title(4, "Best Practices"),
            "customContent5": get_content(4, ""),
            "accentBoxTitle3": get_sub(4, 0).get("title", "Pattern"),
            "accentBoxContent3": get_sub(4, 0).get("content", ""),
            "subheading5": get_sub(4, 1).get("title", "Checklist"),
            "numberedItem1": "Establish standards",
            "numberedItem2": "Enable teams",
            "numberedItem3": "Measure outcomes",
            "numberedItem4": "Iterate and improve",
            "quoteText2": "Discipline turns strategy into results.",
            "quoteAuthor2": company_name,

            # Contact & footer
            "contactTitle": contact.get("title", "Let’s get to work"),
            "contactDescription": contact.get("description", "Ready to accelerate results? Reach out to start a conversation."),
            "differentiatorTitle": "Why Choose Us",
            "differentiator": contact.get("differentiator", "Dedicated partnership focused on measurable outcomes."),
            "footerText": f"© {now_year} {company_name}. All rights reserved.",
            "currentYear": now_year,
        }

        # Ensure all keys exist with defaults used in the template
        default_vars = {
            "documentSubtitle": "Expert insights and strategies",
        }
        for k, v in default_vars.items():
            template_vars.setdefault(k, v)

        return template_vars