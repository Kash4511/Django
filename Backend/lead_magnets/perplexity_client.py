import os
import json
import requests
import re
from typing import Dict, Any, Optional, List
from datetime import datetime


class PerplexityClient:
    """Client for interacting with Perplexity AI API for lead magnet content generation"""
    
    def __init__(self):
        self.api_key = os.getenv('PERPLEXITY_API_KEY')
        self.base_url = "https://api.perplexity.ai/chat/completions"
        
    def generate_lead_magnet_json(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured JSON content for lead magnet using Perplexity AI.
        No mock/fallback data is used. Errors are raised on failures.
        """
        if not self.api_key:
            print("❌ PERPLEXITY_API_KEY missing")
            raise Exception("PERPLEXITY_API_KEY is not configured; cannot generate AI content")
        
        try:
            print("Generating AI content...")
            response = requests.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "sonar-pro",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert content creator specializing in professional lead magnets. Generate comprehensive, valuable content in strict JSON format. Your response must be valid JSON only, no other text."
                        },
                        {
                            "role": "user",
                            "content": self._create_content_prompt(user_answers, firm_profile)
                        }
                    ],
                    "max_tokens": 4000,
                    "temperature": 0.7
                },
                timeout=25
            )
            print(f"Perplexity response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ Perplexity API error: {response.status_code} - {response.text}")
                raise Exception(f"Perplexity API error: {response.status_code} - {response.text}")
            
            result = response.json()
            message_content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            try:
                content = json.loads(message_content)
                return content
            except json.JSONDecodeError:
                print("❌ Failed to parse JSON from Perplexity response")
                raise Exception("Invalid JSON returned from Perplexity API")
                
        except requests.exceptions.Timeout:
            print("❌ Perplexity API timeout after 25s")
            raise Exception("Perplexity API timeout after 25 seconds")
        except Exception as e:
            print(f"❌ Error calling Perplexity API: {str(e)}")
            raise

    def debug_ai_content(self, ai_content: Dict[str, Any]):
        """Debug function to see what the AI actually returned"""
        try:
            print("🔍 DEBUG AI CONTENT STRUCTURE:")
            print(f"Style: {ai_content.get('style', {})}")
            print(f"Cover: {ai_content.get('cover', {})}")
            print(f"Contents items: {ai_content.get('contents', {}).get('items', [])}")
            sections = ai_content.get('sections', [])
            print(f"Number of sections: {len(sections)}")
            for i, section in enumerate(sections):
                title = section.get('title', 'NO TITLE')
                content = section.get('content', 'NO CONTENT')
                print(f"Section {i}: {title}")
                print(f"  Content: {str(content)[:100]}...")
                print(f"  Subsections: {len(section.get('subsections', []))}")
            print(f"Contact: {ai_content.get('contact', {})}")
        except Exception as e:
            print(f"🔴 DEBUG AI CONTENT ERROR: {e}")

    def _create_content_prompt(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> str:
        """
        Build a strict, dynamic prompt that forces the AI to generate
        complete, content-heavy JSON using the provided firm profile and
        user answers. The AI MUST return valid JSON only.
        """
        # Firm profile inputs
        firm_name = (firm_profile.get('firm_name') or '').strip()
        work_email = (firm_profile.get('work_email') or '').strip()
        phone = (firm_profile.get('phone_number') or '').strip()
        website = (firm_profile.get('firm_website') or '').strip()
        tagline = (firm_profile.get('tagline') or '').strip()
        logo_url = (user_answers.get('brand_logo_url') or firm_profile.get('logo_url') or '').strip()

        # Brand colors: prefer user_answers brand_* then firm_profile brand_*, then generic; no hardcoded defaults
        primary_color = (
            (user_answers.get('brand_primary_color') or '').strip()
            or (firm_profile.get('brand_primary_color') or '').strip()
            or (firm_profile.get('primary_brand_color') or '').strip()
            or (firm_profile.get('primary_color') or '').strip()
        )
        secondary_color = (
            (user_answers.get('brand_secondary_color') or '').strip()
            or (firm_profile.get('brand_secondary_color') or '').strip()
            or (firm_profile.get('secondary_brand_color') or '').strip()
            or (firm_profile.get('secondary_color') or '').strip()
        )
        accent_color = (
            (user_answers.get('brand_accent_color') or '').strip()
            or (firm_profile.get('brand_accent_color') or '').strip()
            or (firm_profile.get('accent_brand_color') or '').strip()
            or (firm_profile.get('accent_color') or '').strip()
        )

        # User-provided context
        main_topic = (user_answers.get('main_topic') or '').strip()
        lead_magnet_type = (user_answers.get('lead_magnet_type') or '').strip()
        desired_outcome = (user_answers.get('desired_outcome') or '').strip()
        audience_pain_points = user_answers.get('audience_pain_points') or []
        call_to_action = (user_answers.get('call_to_action') or '').strip()
        industry = (user_answers.get('industry') or '').strip()

        # AI customization: tone, section count, and colors based on industry
        if industry == "Commercial":
            prompt_style = "Use a sleek, modern color palette and emphasize adaptive reuse."
        else:
            prompt_style = "Use natural tones and focus on sustainable materials."

        # Compose a strict instruction. Model must output ONLY JSON with the exact schema.
        prompt = (
            "You are a senior content strategist. Generate a comprehensive, professional lead magnet in JSON. "
            "Follow ALL requirements. Output MUST be valid JSON ONLY (no Markdown, no prose). "
            "Do not include any test or placeholder text. Use the inputs exactly.\n\n"
            "Style Instructions: " + prompt_style + "\n\n" +
            "Inputs:\n" +
            json.dumps({
                "firm_profile": {
                    "firm_name": firm_name,
                    "work_email": work_email,
                    "phone_number": phone,
                    "firm_website": website,
                    "tagline": tagline,
                    "logo_url": logo_url,
                    "brand_primary_color": primary_color,
                    "brand_secondary_color": secondary_color,
                    "brand_accent_color": accent_color,
                },
                "user_answers": {
                    "main_topic": main_topic,
                    "lead_magnet_type": lead_magnet_type,
                    "desired_outcome": desired_outcome,
                    "audience_pain_points": audience_pain_points,
                    "call_to_action": call_to_action,
                    "industry": industry,
                }
            }, ensure_ascii=False) + "\n\n" +
            "Output Schema (keys must match EXACTLY):\n" +
            json.dumps({
                "style": {
                    "primary_color": "<hex or CSS color, use brand_primary_color>",
                    "secondary_color": "<hex or CSS color, use brand_secondary_color>",
                    "accent_color": "<hex or CSS color, use brand_accent_color>"
                },
                "brand": {
                    "logo_url": "<use provided logo_url if available>"
                },
                "cover": {
                    "title": "<compose from lead_magnet_type + main_topic>",
                    "subtitle": "<use desired_outcome; summarize value proposition>",
                    "company_name": "<firm_name>",
                    "company_tagline": "<tagline>"
                },
                "terms": {
                    "title": "Terms of Use",
                    "summary": "<1 sentence>",
                    "paragraphs": [
                        "<2–3 sentences>",
                        "<2–3 sentences>",
                        "<2–3 sentences>"
                    ]
                },
                "contents": {
                    "items": ["<6 descriptive items for TOC>"]
                },
                "sections": [
                    {
                        "title": "<Section 1 title>",
                        "content": "<1-2 detailed paragraphs with specific examples>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<2-3 detailed sentences with specific information>"},
                            {"title": "<Sub 2>", "content": "<2-3 detailed sentences with specific information>"}
                        ]
                    },
                    {
                        "title": "<Section 2 title>",
                        "content": "<1-2 detailed paragraphs with specific examples>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<2-3 detailed sentences with specific information>"},
                            {"title": "<Sub 2>", "content": "<2-3 detailed sentences with specific information>"}
                        ]
                    },
                    {
                        "title": "<Section 3 title>",
                        "content": "<1-2 detailed paragraphs with specific examples>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<2-3 detailed sentences with specific information>"},
                            {"title": "<Sub 2>", "content": "<2-3 detailed sentences with specific information>"}
                        ]
                    },
                    {
                        "title": "<Section 4 title>",
                        "content": "<1-2 detailed paragraphs with specific examples>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<2-3 detailed sentences with specific information>"},
                            {"title": "<Sub 2>", "content": "<2-3 detailed sentences with specific information>"}
                        ]
                    },
                    {
                        "title": "<Section 5 title>",
                        "content": "<1-2 detailed paragraphs with specific examples>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<2-3 detailed sentences with specific information>"},
                            {"title": "<Sub 2>", "content": "<2-3 detailed sentences with specific information>"}
                        ]
                    }
                ],
                "contact": {
                    "title": "<use call_to_action>",
                    "description": "<3-4 detailed sentences about contacting the firm>",
                    "phone": "<phone_number>",
                    "email": "<work_email>",
                    "website": "<firm_website>",
                    "differentiator_title": "Why Choose " + (firm_name or "Us"),
                    "differentiator": "<3-5 sentences highlighting unique value with specific examples>"
                }
            }, ensure_ascii=False) + "\n\n" +
            "Hard Requirements:\n"
            "- Use firm_name, work_email, phone_number, firm_website, tagline EXACTLY as provided.\n"
            "- Use brand colors EXACTLY as provided (primary, secondary, accent). If any input color is missing, set that field to an empty string rather than inventing a color.\n"
            "- Include logo_url if provided; else set to an empty string.\n"
            "- Generate concise sections: each section has 1 paragraph; each subsection 1–2 sentences.\n"
            "- Terms must include a summary and 3 paragraphs (2–3 sentences each).\n"
            "- Contents.items must have 6 descriptive entries aligned to the sections.\n"
            "- NO extra text outside JSON, NO Markdown, NO comments.\n"
            "- Do NOT use any placeholder like 'TEST DOCUMENT'.\n"
        )

        return prompt
        
    def map_to_template_vars(self, ai_content: Dict[str, Any], firm_profile: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        firm_profile = firm_profile or {}
        style = ai_content.get("style", {})
        cover = ai_content.get("cover", {})
        contents = ai_content.get("contents", {})
        sections = ai_content.get("sections", [])
        contact = ai_content.get("contact", {})
        terms = ai_content.get("terms", {})
        brand = ai_content.get("brand", {})

        # Colors: prefer AI style, fallback to firm_profile brand, then sensible defaults
        primary_color = (
            style.get("primary_color")
            or firm_profile.get("primary_brand_color")
            or firm_profile.get("brand_primary_color")
            or firm_profile.get("primary_color", "")
            or "#8B4513"
        )
        secondary_color = (
            style.get("secondary_color")
            or firm_profile.get("secondary_brand_color")
            or firm_profile.get("brand_secondary_color")
            or firm_profile.get("secondary_color", "")
            or "#D2691E"
        )
        accent_color = (
            style.get("accent_color")
            or firm_profile.get("accent_color")
            or firm_profile.get("brand_accent_color", "")
            or "#F4A460"
        )

        # Firm info: prefer AI cover/contact, fallback to firm_profile
        company_name = cover.get("company_name") or firm_profile.get("firm_name", "")
        company_subtitle = cover.get("company_tagline") or firm_profile.get("tagline", "")
        logo_url = brand.get("logo_url") or firm_profile.get("logo_url", "")
        email = contact.get("email") or firm_profile.get("work_email", "")
        phone = contact.get("phone") or firm_profile.get("phone_number", "")
        website = contact.get("website") or firm_profile.get("firm_website", "")

        # Terms and contents
        terms_title = terms.get("title", "Terms of Use")
        terms_summary = terms.get("summary", "")
        terms_paragraphs = terms.get("paragraphs", [])
        content_items = contents.get("items", [])

        # Helper functions
        def get_section(idx):
            return sections[idx] if idx < len(sections) else {"title": "", "content": "", "subsections": []}

        def get_sub(section_idx, sub_idx):
            sec = get_section(section_idx)
            subs = sec.get("subsections", [])
            return subs[sub_idx] if sub_idx < len(subs) else {"title": "", "content": ""}

        # Content length limiters to prevent overflow
        def truncate_text(text: str, max_chars: int) -> str:
            """Truncate text to prevent page overflow. Always return a string, cutting on word boundaries when possible."""
            if not text:
                return ""
            text = str(text)
            if len(text) <= max_chars:
                return text
            # Find last complete sentence within limit
            truncated = text[:max_chars]
            last_period = truncated.rfind('.')
            last_exclamation = truncated.rfind('!')
            last_question = truncated.rfind('?')
            last_sentence_end = max(last_period, last_exclamation, last_question)

            # Try to end at a sentence boundary if it's reasonably close to our limit
            if last_sentence_end > max_chars * 0.6:
                return text[:last_sentence_end + 1].strip()
                
            # Always cut at word boundaries to avoid mid-word truncation
            last_space = truncated.rfind(' ')
            if last_space > 0:  # Ensure we found a space
                # Try to complete by expanding to the next sentence end within a reasonable buffer
                next_zone = text[max_chars:]
                m = re.search(r"[.!?]", next_zone)
                if m:
                    return text[:max_chars + m.start() + 1].strip()
                # Otherwise, end cleanly at word boundary without ellipsis
                return truncated[:last_space].rstrip()
                
            # Absolute fallback: no ellipsis to avoid abrupt stops
            return truncated.rstrip()

        def truncate_title(text: str) -> str:
            """Limit title length"""
            return truncate_text(text, 60)

        def truncate_content(text: str) -> str:
            """Limit main content to prevent overflow - much shorter for clean pages"""
            return truncate_text(text, 400)

        def truncate_subcontent(text: str) -> str:
            """Limit subcontent/box content - shorter for clean layout"""
            return truncate_text(text, 150)

        def truncate_description(text: str) -> str:
            """Limit description to 1-2 lines (about 80 chars)"""
            return truncate_text(text, 120)

        def clean_subtitle(text: str) -> str:
            """Remove stray dots or punctuation-only subtitles."""
            t = (text or '').strip()
            if not t:
                return ''
            # If too short or only punctuation/dots, drop it
            if len(t) <= 2 or all(c in '.,;:!?-' for c in t) or re.fullmatch(r"[.\s-]+", t):
                return ''
            return t

        now_year = datetime.now().year

        # Build template variables dict
        # Helpers
        def split_sentences(text: str) -> List[str]:
            parts = re.split(r"(?<=[.!?])\s+", (text or '').strip())
            return [p.strip() for p in parts if p.strip()]
        def get_or(items: List[str], idx: int, default: str = '') -> str:
            return items[idx] if idx < len(items) and items[idx] else default
        def step(n: int) -> str:
            return f"STEP {str(n).zfill(2)}"
        def page_hdr(n: int) -> str:
            return f"PAGE {n}"

        # Create enhanced title with firm info - ensure company name is always included
        main_title = cover.get("title", "Professional Guide")
        company_name = company_name or "Your Company"  # Ensure company name is never empty
        
        # Always include company name in the title
        enhanced_title = f"{main_title} by {company_name}" if main_title else company_name
        
        # Build template variables dict comprehensively
        template_vars = {
            # Cover and theme - enhanced with firm info
            "documentTitle": enhanced_title.upper(),
            "mainTitle": enhanced_title,
            "documentSubtitle": clean_subtitle(truncate_description(cover.get("subtitle", ""))),
            "companyName": company_name,
            "companySubtitle": company_subtitle,
            "primaryColor": primary_color,
            "secondaryColor": secondary_color,
            "accentColor": accent_color,
            "logoUrl": logo_url,

            # Contact info (used on cover and contact page)
            "phoneNumber": phone,
            "emailAddress": email,
            "website": website,

            # Header texts per page (step indicators)
            "headerText1": step(1),
            "headerText2": step(2),
            "headerText3": step(3),
            "headerText4": step(4),
            "headerText5": step(5),
            "headerText6": step(6),
            "headerText7": step(7),
            "headerText8": step(8),

            # Section titles used in headers - truncated
            "sectionTitle1": truncate_title(get_section(0).get("title", "")),
            "sectionTitle2": truncate_title(get_section(1).get("title", contents.get("title", "CONTENTS"))),
            "sectionTitle3": truncate_title(get_section(2).get("title", "")),
            "sectionTitle4": truncate_title(get_section(3).get("title", "")),
            "sectionTitle5": truncate_title(get_section(4).get("title", "")),
            "sectionTitle6": truncate_title(get_section(3).get("title", "")),
            "sectionTitle7": truncate_title(get_section(4).get("title", "")),
            "sectionTitle8": truncate_title(contact.get("title", "CONTACT")),

            # Page numbers in headers ("PAGE N") and footers (N)
            "pageNumberHeader2": page_hdr(2),
            "pageNumberHeader3": page_hdr(3),
            "pageNumberHeader4": page_hdr(4),
            "pageNumberHeader5": page_hdr(5),
            "pageNumberHeader6": page_hdr(6),
            "pageNumberHeader7": page_hdr(7),
            "pageNumberHeader8": page_hdr(8),
            "pageNumberHeader9": page_hdr(9),

            "pageNumber2": 2,
            "pageNumber3": 3,
            "pageNumber4": 4,
            "pageNumber5": 5,
            "pageNumber6": 6,
            "pageNumber7": 7,
            "pageNumber8": 8,
            "pageNumber9": 9,

            # Contents page
            "contentsTitle": contents.get("title", "Contents"),
            "contentItem1": truncate_title(get_or(content_items, 0, get_section(0).get("title", ""))),
            "contentItem2": truncate_title(get_or(content_items, 1, get_section(1).get("title", ""))),
            "contentItem3": truncate_title(get_or(content_items, 2, get_section(2).get("title", ""))),
            "contentItem4": truncate_title(get_or(content_items, 3, get_section(3).get("title", ""))),
            "contentItem5": truncate_title(get_or(content_items, 4, get_section(4).get("title", ""))),
            "contentItem6": truncate_title(get_or(content_items, 5, contact.get("title", "Contact & Next Steps"))),

            # Terms
            "termsTitle": terms_title,
            "termsSummary": truncate_content(terms_summary),
            "termsParagraph1": truncate_content(get_or(terms_paragraphs, 0, "")),
            "termsParagraph2": truncate_content(get_or(terms_paragraphs, 1, "")),
            "termsParagraph3": truncate_content(get_or(terms_paragraphs, 2, "")),
            "termsParagraph4": truncate_content(get_or(terms_paragraphs, 3, "")),
            "termsParagraph5": truncate_content(get_or(terms_paragraphs, 4, "")),

            # Footer
            "footerText": f"© {now_year} {company_name}. All rights reserved.",

            # Page 4 (Section 1) - with length limits
            "customTitle1": truncate_title(get_section(0).get("title", "")),
            "customContent1": truncate_content(get_section(0).get("content", "")),
            "subheading1": truncate_title(get_sub(0, 0).get("title", "")),
            "subcontent1": truncate_subcontent(get_sub(0, 0).get("content", "")),
            "boxTitle1": truncate_title(get_sub(0, 1).get("title", "")),
            "boxContent1": truncate_subcontent(get_sub(0, 1).get("content", "")),
            "accentBoxTitle1": truncate_title(get_sub(0, 0).get("title", "")),
            "accentBoxContent1": truncate_subcontent(get_sub(0, 0).get("content", "")),

            # Page 5 (Section 2) - with length limits and quote handling
            "customTitle2": truncate_title(get_section(1).get("title", "")),
            "customContent2": truncate_content(get_section(1).get("content", "")),
            "columnBoxTitle1": truncate_title(get_sub(1, 0).get("title", "")),
            "columnBoxContent1": truncate_subcontent(get_sub(1, 0).get("content", "")),
            "columnBoxTitle2": truncate_title(get_sub(1, 1).get("title", "")),
            "columnBoxContent2": truncate_subcontent(get_sub(1, 1).get("content", "")),
            "subheading2": truncate_title(get_sub(1, 1).get("title", "")),
            "subcontent2": truncate_subcontent(get_sub(1, 1).get("content", "")),
            # Quote: fill only if we have content; otherwise leave empty for template to hide
            "quoteText1": truncate_subcontent(split_sentences(get_section(1).get("content", ""))[0] if split_sentences(get_section(1).get("content", "")) else ""),
            "quoteAuthor1": company_name or "",

            # Page 6 (Section 3) - with length limits
            "customTitle3": truncate_title(get_section(2).get("title", "")),
            "customContent3": truncate_content(get_section(2).get("content", "")),
            "accentBoxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "accentBoxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),
            "subheading3": truncate_title(get_sub(2, 1).get("title", "")),
            "listItem1": truncate_subcontent(get_or(split_sentences(get_section(2).get("content", "")), 0, "")),
            "listItem2": truncate_subcontent(get_or(split_sentences(get_section(2).get("content", "")), 1, "")),
            "listItem3": truncate_subcontent(get_or(split_sentences(get_section(2).get("content", "")), 2, "")),
            "listItem4": truncate_subcontent(get_or(split_sentences(get_section(2).get("content", "")), 3, "")),
            "boxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "boxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),

            # Page 7 (Section 4) - with length limits
            "customTitle4": truncate_title(get_section(3).get("title", "")),
            "customContent4": truncate_content(get_section(3).get("content", "")),
            "columnTitle1": truncate_title(get_sub(3, 0).get("title", "")),
            "columnContent1": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "columnTitle2": truncate_title(get_sub(3, 1).get("title", "")),
            "columnContent2": truncate_subcontent(get_sub(3, 1).get("content", "")),
            "boxTitle3": truncate_title(get_section(3).get("title", "")),
            "boxContent3": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "subheading4": truncate_title(get_sub(3, 1).get("title", "")),
            "subcontent4": truncate_subcontent(get_sub(3, 1).get("content", "")),

            # Page 8 (Section 5) - with length limits
            "customTitle5": truncate_title(get_section(4).get("title", "")),
            "customContent5": truncate_content(get_section(4).get("content", "")),
            "accentBoxTitle3": truncate_title(get_sub(4, 0).get("title", "")),
            "accentBoxContent3": truncate_subcontent(get_sub(4, 0).get("content", "")),
            "subheading5": truncate_title(get_sub(4, 1).get("title", "")),
            "numberedItem1": truncate_subcontent(get_or(split_sentences(get_section(4).get("content", "")), 0, "")),
            "numberedItem2": truncate_subcontent(get_or(split_sentences(get_section(4).get("content", "")), 1, "")),
            "numberedItem3": truncate_subcontent(get_or(split_sentences(get_section(4).get("content", "")), 2, "")),
            "numberedItem4": truncate_subcontent(get_or(split_sentences(get_section(4).get("content", "")), 3, "")),

            # Page 9 (Contact) - with length limits
            "contactTitle": truncate_title(contact.get("title", "Get in Touch")),
            "contactDescription": truncate_content(contact.get("description", "")),
            "differentiatorTitle": truncate_title(contact.get("differentiator_title", f"Why Choose {company_name or 'Us'}")),
            "differentiator": truncate_content(contact.get("differentiator", "")),
        }

        # Debug mapping summary
        print("🔎 MAP VARS: colors", {"primary": primary_color, "secondary": secondary_color, "accent": accent_color})
        print("🔎 MAP VARS: firm", {"name": company_name, "email": email, "phone": phone, "website": website, "logo": bool(logo_url)})
        print("🔎 MAP VARS: counts", {"sections": len(sections), "contentItems": len(content_items), "termsParas": len(terms_paragraphs)})
        print("🔎 MAP VARS: enhanced_title", enhanced_title)

        return template_vars

    def check_available_models(self):
        """Debug method to check what models are available with your API key"""
        if not self.api_key:
            print("❌ PERPLEXITY_API_KEY not configured")
            return
            
        try:
            response = requests.get(
                "https://api.perplexity.ai/models",
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            if response.status_code == 200:
                models = response.json()
                print("✅ Available Perplexity models:")
                for model in models.get('data', []):
                    print(f"  - {model['id']}")
            else:
                print(f"❌ Cannot fetch models: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error checking models: {e}")