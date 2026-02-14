import os
from pathlib import Path
import json
import requests
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


import time
import math
import logging

logger = logging.getLogger(__name__)

class PerplexityClient:
    """Client for interacting with Perplexity AI API for lead magnet content generation"""
    
    def __init__(self):
        # Ensure .env is loaded in server context
        if load_dotenv:
            env_path = Path(__file__).resolve().parents[1] / '.env'
            try:
                load_dotenv(env_path)
            except Exception:
                pass
        self.api_key = os.getenv('PERPLEXITY_API_KEY')
        self.base_url = "https://api.perplexity.ai/chat/completions"
        print(f"DEBUG: PerplexityClient initialized; key present: {bool(self.api_key)}")
        
    def generate_lead_magnet_json(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            print("❌ PERPLEXITY_API_KEY missing")
            raise Exception("PERPLEXITY_API_KEY is not configured; cannot generate AI content. Please add PERPLEXITY_API_KEY=your_key_here to your Backend/.env file")

        max_retries = int(os.getenv('AI_MAX_RETRIES', 3))
        retry_count = 0
        models_to_try = ["sonar-pro", "sonar"]

        while retry_count <= max_retries:
            model_to_use = models_to_try[1] if retry_count >= 1 else models_to_try[0]
            try:
                if retry_count > 0:
                    # Exponential backoff: 2^retry_count * 1s
                    wait_time = math.pow(2, retry_count)
                    print(f"🔄 Retrying AI content generation (attempt {retry_count + 1}/{max_retries + 1}) in {wait_time}s with model: {model_to_use}...")
                    time.sleep(wait_time)
                else:
                    print(f"Generating AI content with model: {model_to_use}...")

                response = requests.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    json={
                        "model": model_to_use,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are an expert content creator specializing in professional lead magnets. "
                                    "Your response must be STRICTLY valid JSON. Do not include any text, markdown code blocks, "
                                    "or explanations before or after the JSON. The JSON must be parseable by Python's json.loads()."
                                )
                            },
                            {
                                "role": "user",
                                "content": self._create_content_prompt(user_answers, firm_profile)
                            }
                        ],
                        "max_tokens": 4000,
                        "temperature": 0.7
                    },
                    timeout=120
                )

                if response.status_code != 200:
                    print(f"❌ Perplexity API error: {response.status_code} - {response.text}")
                    if retry_count < max_retries:
                        retry_count += 1
                        continue
                    raise Exception(f"Perplexity API error: {response.status_code} - {response.text}")

                result = response.json()
                message_content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                
                # Log message content length and first few chars for debugging
                print(f"DEBUG: AI response content length: {len(message_content)}")
                
                json_content = self._extract_json_from_markdown(message_content)
                try:
                    content = json.loads(json_content)
                    return content
                except json.JSONDecodeError as initial_error:
                    # Try to repair the JSON if first attempt fails
                    print(f"⚠️ Initial JSON parse failed on attempt {retry_count + 1}: {initial_error}")
                    repaired_json = self._repair_json(json_content)
                    try:
                        content = json.loads(repaired_json)
                        print("✅ JSON repaired successfully!")
                        return content
                    except json.JSONDecodeError as repair_error:
                        print(f"❌ Failed to parse JSON even after repair: {repair_error}")
                        
                        # Log the full raw content (first 5KB as requested) for debugging
                        raw_preview = message_content[:5000]
                        logger.error(f"AI JSON Parse Error on attempt {retry_count + 1}")
                        logger.error(f"Raw response (first 5KB): {raw_preview}")
                        logger.error(f"Extracted JSON: {json_content}")
                        logger.error(f"Repaired JSON: {repaired_json}")
                        
                        if retry_count < max_retries:
                            print(f"🔄 Retrying due to malformed JSON...")
                            retry_count += 1
                            continue
                        raise Exception(f"Invalid JSON returned from Perplexity API after {max_retries + 1} attempts. Error: {repair_error}")

            except requests.exceptions.Timeout:
                print(f"⚠️ API timeout on attempt {retry_count + 1}")
                if retry_count < max_retries:
                    retry_count += 1
                    continue
                raise Exception(f"Perplexity API timeout after {max_retries + 1} attempts (120s per attempt).")
            except Exception as e:
                print(f"❌ Error during AI generation (attempt {retry_count + 1}): {str(e)}")
                if retry_count < max_retries:
                    retry_count += 1
                    continue
                raise

        return {} # Should not reach here

    def _repair_json(self, json_str: str) -> str:
        """
        Attempt to repair common JSON errors from AI models.
        """
        if not json_str:
            return ""

        repaired = json_str.strip()
        
        # 1. Handle unescaped newlines within strings
        def fix_newlines(match):
            return match.group(0).replace('\n', '\\n').replace('\r', '\\r')
        
        repaired = re.sub(r'":\s*"[^"]*?"', fix_newlines, repaired, flags=re.DOTALL)

        # 2.5 Fix missing commas between key-value pairs
        # We do this BEFORE fixing unescaped quotes to help the regex identify boundaries
        repaired = re.sub(r'("[^"]*")\s*(")', r'\1, \2', repaired)
        repaired = re.sub(r'("[^"]*")\s*([{])', r'\1, \2', repaired)
        repaired = re.sub(r'([}\]])\s*(")', r'\1, \2', repaired)

        # 2. Fix unescaped double quotes within strings
        def fix_unescaped_quotes(match):
            full_match = match.group(0)
            # Match "key": "value"
            m = re.match(r'("[^"]*")\s*:\s*"(.*)"', full_match, re.DOTALL)
            if not m:
                return full_match
            
            key_part = m.group(1)
            val_content = m.group(2)
            
            # Escape any double quotes that aren't already escaped
            fixed_val = re.sub(r'(?<!\\)"', r'\"', val_content)
            return f'{key_part}: "{fixed_val}"'

        # Target key-value pairs more precisely: "key": "value"
        # The lookahead (?=\s*[,}\]]) ensures we've reached a valid JSON boundary
        repaired = re.sub(r'"[^"]*"\s*:\s*".*?"(?=\s*[,}\]])', fix_unescaped_quotes, repaired, flags=re.DOTALL)

        # 3. Handle trailing commas in objects or arrays
        repaired = re.sub(r',\s*([}\]])', r'\1', repaired)

        # 4. Fix single quotes used for keys or string boundaries
        if repaired.count("'") > repaired.count('"') * 2:
            repaired = re.sub(r"'(.*?)'", r'"\1"', repaired)

        # 5. Ensure balanced braces
        open_braces = repaired.count('{')
        close_braces = repaired.count('}')
        if open_braces > close_braces:
            repaired += '}' * (open_braces - close_braces)
        
        open_brackets = repaired.count('[')
        close_brackets = repaired.count(']')
        if open_brackets > close_brackets:
            repaired += ']' * (open_brackets - close_brackets)
            
        return repaired

    def _extract_json_from_markdown(self, content: str) -> str:
        """
        Extract JSON from markdown code blocks or find the first/last braces.
        """
        if not content:
            return ""

        # Remove leading/trailing whitespace
        content = content.strip()
        
        # 0. Try to find the JSON block if the model included conversational text
        # Look for the first '{' that is followed by a '"' (likely a key)
        first_brace = content.find('{')
        if first_brace != -1:
            # Check if there's text before the brace that should be ignored
            content = content[first_brace:]

        # 1. Try regex for ```json { ... } ``` or ``` { ... } ```
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()

        # 2. Try finding the first '{' and last '}'
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return content[start_idx:end_idx + 1].strip()
        
        # 3. Fallback to original logic if no braces found (though likely to fail json.loads)
        if content.startswith('```'):
            lines = content.split('\n')
            start_line = 0
            end_line = len(lines)
            for i, line in enumerate(lines):
                if line.strip().startswith('```'):
                    start_line = i + 1
                    break
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('```'):
                    end_line = i
                    break
            return '\n'.join(lines[start_line:end_line]).strip()
        
        return content

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

        # Architectural images from user_answers
        architectural_images = user_answers.get('architectural_images', [])
        
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
        target_audience = user_answers.get('target_audience') or []
        desired_outcome = (user_answers.get('desired_outcome') or '').strip()
        audience_pain_points = user_answers.get('audience_pain_points') or []
        call_to_action = (user_answers.get('call_to_action') or '').strip()
        industry = (user_answers.get('industry') or '').strip()

        # AI customization: style should follow the topic unless a specific industry is provided
        if industry:
            if industry == "Commercial":
                prompt_style = "Use a sleek, modern color palette and emphasize adaptive reuse."
            else:
                prompt_style = f"Use a style aligned with the {industry} domain and audience."
        else:
            prompt_style = "Use a style appropriate to the user's main_topic; do not assume architecture or sustainability."

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
                    "target_audience": target_audience,
                    "desired_outcome": desired_outcome,
                    "audience_pain_points": audience_pain_points,
                    "call_to_action": call_to_action,
                    "industry": industry,
                    "architectural_images_count": len(architectural_images) if isinstance(architectural_images, list) else 0
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
                        "content": "<150–220 words. Include 2–3 concrete, actionable insights: what to do, why it matters, and expected outcome. Do NOT repeat the section title inside content. End with a 1-sentence transition to the next topic.>",
                        "subsections": [
                            {"title": "<Sub 1>", "content": "<1 concise, actionable sentence>"},
                            {"title": "<Sub 2>", "content": "<1 concise, actionable sentence>"}
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
            "- Address the target_audience EXCLUSIVELY. All content must be tailored to their specific pain_points and desired_outcomes.\n"
            "- Use firm_name, work_email, phone_number, firm_website, tagline EXACTLY as provided.\n"
            "- Use brand colors EXACTLY as provided (primary, secondary, accent). If any input color is missing, set that field to an empty string.\n"
            "- Include logo_url if provided; else set to an empty string.\n"
            "- Generate 6 complete sections. Each section content is 150–220 words with 2–3 concrete, actionable insights (what, why, outcome) and a short transition. Each subsection is ONE actionable sentence.\n"
            "- Terms must include a summary and 3 paragraphs (1–2 sentences each).\n"
            "- Contents.items must have EXACTLY 6 descriptive entries aligned to the sections.\n"
            "- NO extra text outside JSON, NO Markdown, NO comments.\n"
            "- Do NOT use any placeholder like 'TEST DOCUMENT'. Do NOT repeat section titles inside the content.\n"
            "- JSON Safety: Use double quotes for all keys and string boundaries. Escape any interior double quotes as \\\". Do not include unescaped newlines inside strings.\n"
            "- Final check: Ensure the JSON is complete and ends with a closing brace '}'.\n"
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
        # Rewrite Terms in a professional, legally-neutral structure using firm name
        firm_display = (company_name or "").strip()
        terms_summary = f"Purpose of the Guide — This resource provides general educational information and does not constitute legal, architectural, engineering, or other professional advice."
        terms_structured = [
            "Permitted Use — You may view, download, and share this guide for personal or internal business use. Redistribution for sale or public hosting without prior written permission is prohibited.",
            "No Professional Liability — Use of this guide does not create a client relationship. Decisions should be validated by qualified professionals and applicable codes, standards, and local regulations.",
            f"Intellectual Property — All text, layout, and design remain the property of {firm_display or 'the publisher'}. All trademarks and third‑party marks remain the property of their respective owners.",
            f"Limitation of Liability — {firm_display or 'The publisher'} disclaims liability for direct, indirect, incidental, or consequential losses arising from use of this guide.",
            "Updates & Revisions — Content may be updated without notice. The most current version supersedes all prior versions.",
        ]
        # If AI provided paragraphs, prefer them when they appear sufficiently structured; otherwise use ours
        ai_terms_paragraphs = [p for p in terms.get("paragraphs", []) if isinstance(p, str) and len(p.strip()) > 20]
        terms_paragraphs = ai_terms_paragraphs if len(ai_terms_paragraphs) >= 3 else terms_structured
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
            """Limit title length (~80 chars) but avoid cutting off meaningful phrases"""
            return truncate_text(text, 80)

        def truncate_content(text: str) -> str:
            """Limit main content to prevent overflow - much shorter for clean pages"""
            return truncate_text(text, 400)

        def truncate_subcontent(text: str) -> str:
            """Limit subcontent/box content - shorter for clean layout"""
            return truncate_text(text, 150)

        def truncate_description(text: str) -> str:
            """Allow a longer, richer cover description (~140 chars)."""
            return truncate_text(text, 140)

        def finalize_line(text: str) -> str:
            """Ensure clean sentence endings and one-line fit."""
            t = (text or '').strip()
            if not t:
                return ''
            # Remove trailing connectors without an object
            t = re.sub(r"[\s,\-]+(and|or|with)\s*$", "", t, flags=re.IGNORECASE)
            # Remove incomplete trailing clause like "and stay" / "and improve"
            t = re.sub(r"\s+(and|or|with)\s+[A-Za-z]{1,15}\s*$", "", t, flags=re.IGNORECASE)
            t = re.sub(r"[\s,\-]+$", "", t)
            if not re.search(r"[.!?]$", t):
                t = t + "."
            return t

        # --- Heading/content alignment & terminology normalization helpers ---
        STOPWORDS = set(
            "a an the for and or with of in on to by from at into over under about after before during through across against between toward toward within without".split()
        )

        def keywords_from_title(title: str) -> List[str]:
            t = (title or "").lower()
            # Keep alphanumerics, split on non-letters
            tokens = re.split(r"[^a-z0-9]+", t)
            # Remove short words and stopwords
            return [w for w in tokens if len(w) > 3 and w not in STOPWORDS]

        def contains_any_keyword(text: str, kws: List[str]) -> bool:
            if not text or not kws:
                return False
            t = (text or "").lower()
            return any(re.search(rf"\b{re.escape(k)}\b", t) for k in kws)

        def standardize_sustainable_terms(text: str) -> str:
            t = text or ""
            # Normalize common variants to keep terminology consistent
            t = re.sub(r"\beco[-\s]?friendly\b", "sustainable", t, flags=re.IGNORECASE)
            t = re.sub(r"\bgreen(\s+(home|materials|solutions|upgrades))\b", r"sustainable \1", t, flags=re.IGNORECASE)
            # Collapse redundant repeats like "sustainable, sustainable"
            t = re.sub(r"\b(sustainable)(\s*,\s*\1)+\b", r"\1", t, flags=re.IGNORECASE)
            # Limit frequency without removing meaning: if more than 4 occurrences, reduce extras
            occurrences = [m for m in re.finditer(r"\bsustainable\b", t, flags=re.IGNORECASE)]
            if len(occurrences) > 4:
                # Replace every occurrence beyond the 4th with nothing (keeps grammar generally intact)
                keep = 0
                def repl(m):
                    nonlocal keep
                    keep += 1
                    return m.group(0) if keep <= 4 else ""
                t = re.sub(r"\bsustainable\b", repl, t, flags=re.IGNORECASE)
                # Clean up double spaces from removals
                t = re.sub(r"\s{2,}", " ", t).strip()
            return t

        def derive_title_from_content(content: str) -> str:
            if not content:
                return ""
            first_sentence_match = re.search(r"^(.*?[.!?])\s", content)
            first = first_sentence_match.group(1) if first_sentence_match else content.strip()
            # Keep capitalized words and key nouns/adjectives
            words = re.split(r"\s+", re.sub(r"[^A-Za-z0-9\s]", "", first))
            filtered = [w for w in words if w.lower() not in STOPWORDS]
            phrase = " ".join(filtered[:8]).strip()
            phrase = re.sub(r"\s+", " ", phrase).strip(" -:;")
            return phrase.title() if phrase else "Summary"

        def refine_title_with_content(title: str, content: str) -> str:
            kws = keywords_from_title(title)
            if contains_any_keyword(content, kws):
                return clean_title(title)
            # Mismatch: derive a concise heading from content
            return clean_title(derive_title_from_content(content))

        def harmonize_section(title: str, content: str) -> str:
            # Normalize core content and ensure alignment with heading topic
            norm = normalize_main_content(content, title)
            norm = standardize_sustainable_terms(norm)
            kws = keywords_from_title(title)
            if not contains_any_keyword(norm, kws) and title.strip():
                # Prepend a brief aligning lead
                lead = f"This section focuses on {title.lower()}. "
                norm = lead + norm
            return norm

        def sloganize(text: str) -> str:
            """Create a short slogan from a longer description."""
            t = (text or '').strip()
            if not t:
                return ''
            m = re.search(r"[.!?]", t)
            if m:
                t = t[:m.start()]
            t = re.sub(r"\s+", " ", t).strip(" -:;,")
            t = truncate_description(t)
            return finalize_line(t)

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

        # Quality and completion helpers
        def count_words(t: str) -> int:
            return len(re.findall(r"\b\w+\b", (t or '')))
        
        def normalize_brand_name(name: str) -> str:
            t = (name or '').strip()
            if not t:
                return ''
            t = re.sub(r"\s+", " ", t)
            return t.title()
        
        def normalize_website(url: str) -> str:
            t = (url or '').strip()
            t = re.sub(r"^https?://", "", t, flags=re.IGNORECASE)
            return t.lower()
        
        def normalize_phone(num: str) -> str:
            digits = re.sub(r"\D", "", num or "")
            if len(digits) == 10:
                return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
            if len(digits) == 11 and digits[0] == '1':
                return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:11]}"
            return num or ""

        def ensure_min_sentences(text: str, min_sentences: int = 3, max_sentences: int = 5, topic_hint: Optional[str] = None) -> str:
            sentences = [finalize_line(s) for s in split_sentences(text)]
            # Fallback pool: concise, actionable lines to avoid filler
            th = (topic_hint or 'this topic').strip()
            fallback_pool = [
                finalize_line(f"Define the objective for {th} and set measurable success criteria"),
                finalize_line(f"Prioritize two high-impact actions and assign ownership and timeline"),
                finalize_line(f"Track results against a baseline and iterate based on data"),
                finalize_line(f"Mitigate a common risk with a simple, repeatable control"),
            ]
            i = 0
            while len(sentences) < min_sentences and i < len(fallback_pool):
                sentences.append(finalize_line(fallback_pool[i]))
                i += 1
            # Keep it concise
            sentences = sentences[:max_sentences]
            return " ".join(sentences)

        def ensure_min_words(text: str, min_words: int = 150, max_words: int = 260, topic_hint: Optional[str] = None) -> str:
            t = (text or '').strip()
            if count_words(t) >= min_words:
                return t
            # Add more fallback content until minimum reached
            th = (topic_hint or 'the topic').strip()
            additions = [
                finalize_line(f"Start with a quick assessment checklist for {th} and capture initial metrics"),
                finalize_line(f"Implement a phased approach: plan, pilot, scale; document assumptions and risks"),
                finalize_line(f"Define expected outcomes and how they will be measured weekly"),
                finalize_line(f"Close with a transition to the next topic to maintain narrative flow"),
            ]
            for line in additions:
                if count_words(t) >= min_words:
                    break
                t = (t + " " + finalize_line(line)).strip()
            # Soft cap; final truncation handled by truncate functions downstream
            words = t.split()
            if len(words) > max_words:
                t = " ".join(words[:max_words])
            return t

        def normalize_main_content(text: str, title_hint: str) -> str:
            # Normalize whitespace and complete sentences
            t = re.sub(r"\s+", " ", (text or '').strip())
            t = ensure_min_sentences(t, min_sentences=3, max_sentences=5, topic_hint=title_hint)
            t = ensure_min_words(t, min_words=60, max_words=220, topic_hint=title_hint)
            return t

        # Create a short, professional title for the PDF
        raw_title = (cover.get("title") or "Professional Guide").strip()

        def clean_title(title: str) -> str:
            t = (title or "").strip()
            # Remove common prefixes like "Custom Guide:" or "Guide:"
            t = re.sub(r"^(custom\s+guide\s*:|guide\s*:)", "", t, flags=re.IGNORECASE).strip()

            # Remove explicit trailing "for/by <company_name>" if present
            if company_name:
                cn = company_name.strip()
                if cn:
                    t = re.sub(rf"\s+(for|by)\s+{re.escape(cn)}\b[ .\-]*$", "", t, flags=re.IGNORECASE)

            # Remove generic trailing marketing suffix: "for/by <Proper Noun phrase>"
            # Matches one or more capitalized words at the end
            t = re.sub(r"\s+(for|by)\s+[A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*)*[ .\-]*$", "", t, flags=re.IGNORECASE)

            # Remove trailing prepositions
            t = re.sub(r'\s+(of|in|for)$', '', t, flags=re.IGNORECASE).strip()

            # Remove trailing colon and dangling single-letter articles
            t = re.sub(r"[:\s]+$", "", t).strip()
            t = re.sub(r"[:\-\s]+(A|An|The)$", "", t, flags=re.IGNORECASE).strip()

            # Collapse multiple spaces and trim punctuation
            t = re.sub(r"\s+", " ", t)
            t = t.strip(" -:;.,")
            # Keep it concise
            return truncate_title(t) if 'truncate_title' in locals() else t[:60]

        main_title = clean_title(raw_title)
        # Do NOT append company name to title; keep it short and professional
        enhanced_title = main_title
        
        # Build template variables dict comprehensively
        template_vars = {
            # Cover and theme - enhanced with firm info
            "documentTitle": enhanced_title.upper(),
            "mainTitle": enhanced_title,
            "documentSubtitle": sloganize(cover.get("subtitle", "")),
            "companyName": normalize_brand_name(company_name),
            "companySubtitle": company_subtitle,
            "primaryColor": primary_color,
            "secondaryColor": secondary_color,
            "accentColor": accent_color,
            "logoUrl": logo_url,

            # Contact info (used on cover and contact page)
            "phoneNumber": normalize_phone(phone),
            "emailAddress": (email or '').lower(),
            "website": normalize_website(website),

            # Header texts per page (step indicators)
            "headerText1": step(1),
            "headerText2": step(2),
            "headerText3": step(3),
            "headerText4": step(4),
            "headerText5": step(5),
            "headerText6": step(6),
            "headerText7": step(7),
            "headerText8": step(8),

            # Section titles used in headers - explicitly set for pages 2 and 3
            "sectionTitle1": "Terms of Use",
            "sectionTitle2": "Contents",
            "sectionTitle3": truncate_title(clean_title(get_section(0).get("title", ""))),
            "sectionTitle4": truncate_title(clean_title(get_section(1).get("title", ""))),
            "sectionTitle5": truncate_title(clean_title(get_section(2).get("title", ""))),
            "sectionTitle6": truncate_title(clean_title(get_section(3).get("title", ""))),
            "sectionTitle7": truncate_title(clean_title(get_section(4).get("title", ""))),
            "sectionTitle8": truncate_title(clean_title(get_section(5).get("title", ""))),
            "sectionTitle9": truncate_title(clean_title(get_section(6).get("title", ""))),
            "sectionTitle10": truncate_title(clean_title(get_section(7).get("title", ""))),
            "sectionTitle11": truncate_title(clean_title(get_section(8).get("title", ""))),
            "sectionTitle12": truncate_title(clean_title(get_section(9).get("title", ""))),
            "sectionTitle13": "REACH OUT TO OUR TEAM",

            # Page numbers in headers ("PAGE N") and footers (N)
            "pageNumberHeader2": page_hdr(2),
            "pageNumberHeader3": page_hdr(3),
            "pageNumberHeader4": page_hdr(4),
            "pageNumberHeader5": page_hdr(5),
            "pageNumberHeader6": page_hdr(6),
            "pageNumberHeader7": page_hdr(7),
            "pageNumberHeader8": page_hdr(8),
            "pageNumberHeader9": page_hdr(9),
            "pageNumberHeader10": page_hdr(10),
            "pageNumberHeader11": page_hdr(11),
            "pageNumberHeader12": page_hdr(12),
            "pageNumberHeader13": page_hdr(13),
            "pageNumberHeader14": page_hdr(14),

            "pageNumber2": 2,
            "pageNumber3": 3,
            "pageNumber4": 4,
            "pageNumber5": 5,
            "pageNumber6": 6,
            "pageNumber7": 7,
            "pageNumber8": 8,
            "pageNumber9": 9,
            "pageNumber10": 10,
            "pageNumber11": 11,
            "pageNumber12": 12,
            "pageNumber13": 13,
            "pageNumber14": 14,

            # Contents page
            "contentsTitle": contents.get("title", "Contents"),
            "contentItem1": truncate_title(clean_title(get_or(content_items, 0, get_section(0).get("title", "")))),
            "contentItem2": truncate_title(clean_title(get_or(content_items, 1, get_section(1).get("title", "")))),
            "contentItem3": truncate_title(clean_title(get_or(content_items, 2, get_section(2).get("title", "")))),
            "contentItem4": truncate_title(clean_title(get_or(content_items, 3, get_section(3).get("title", "")))),
            "contentItem5": truncate_title(clean_title(get_or(content_items, 4, get_section(4).get("title", "")))),
            "contentItem6": truncate_title(clean_title(get_or(content_items, 5, get_section(5).get("title", "")))),
            "contentItem7": truncate_title(clean_title(get_or(content_items, 6, get_section(6).get("title", "")))),
            "contentItem8": truncate_title(clean_title(get_or(content_items, 7, get_section(7).get("title", "")))),
            "contentItem9": truncate_title(clean_title(get_or(content_items, 8, get_section(8).get("title", "")))),
            "contentItem10": truncate_title(clean_title(get_or(content_items, 9, get_section(9).get("title", "")))),

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
            "customTitle1": truncate_title(clean_title(get_section(0).get("title", ""))),
            "customContent1": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(0).get("content", ""), get_section(0).get("title", "Section 1")))),
            "subheading1": truncate_title(get_sub(0, 0).get("title", "")),
            "subcontent1": truncate_subcontent(get_sub(0, 0).get("content", "")),
            "boxTitle1": truncate_title(get_sub(0, 1).get("title", "")),
            "boxContent1": truncate_subcontent(get_sub(0, 1).get("content", "")),
            "accentBoxTitle1": truncate_title(get_sub(0, 0).get("title", "")),
            "accentBoxContent1": truncate_subcontent(get_sub(0, 0).get("content", "")),

            # Page 5 (Section 2) - with length limits and quote handling
            "customTitle2": truncate_title(clean_title(get_section(1).get("title", ""))),
            "customContent2": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(1).get("content", ""), get_section(1).get("title", "Section 2")))),
            "subheading2": truncate_title(get_sub(1, 0).get("title", "")),
            "subcontent2": truncate_subcontent(get_sub(1, 0).get("content", "")),
            "listItem1": finalize_line(truncate_text(get_or(split_sentences(get_section(1).get("content", "")), 0, ""), 90)),
            "listItem2": finalize_line(truncate_text(get_or(split_sentences(get_section(1).get("content", "")), 1, ""), 90)),
            "listItem3": finalize_line(truncate_text(get_or(split_sentences(get_section(1).get("content", "")), 2, ""), 90)),
            "listItem4": finalize_line(truncate_text(get_or(split_sentences(get_section(1).get("content", "")), 3, ""), 90)),
            # Quote: fill only if we have content; otherwise leave empty for template to hide
            "quoteText1": truncate_subcontent(split_sentences(get_section(1).get("content", ""))[0] if split_sentences(get_section(1).get("content", "")) else ""),
            "quoteAuthor1": company_name or "",

            # Page 6 (Section 3) - with length limits
            "customTitle3": truncate_title(clean_title(get_section(2).get("title", ""))),
            "customContent3": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(2).get("content", ""), get_section(2).get("title", "Section 3")))),
            "accentBoxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "accentBoxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),
            "subheading3": truncate_title(get_sub(2, 1).get("title", "")),
            "subcontent3": truncate_subcontent(get_sub(2, 1).get("content", "")),
            "boxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "boxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),

            # Page 7 (Section 4) - with length limits
            "customTitle4": truncate_title(clean_title(get_section(3).get("title", ""))),
            "customContent4": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(3).get("content", ""), get_section(3).get("title", "Section 4")))),
            "columnBoxTitle1": truncate_title(get_sub(3, 0).get("title", "")),
            "columnBoxContent1": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "columnTitle2": truncate_title(get_sub(3, 1).get("title", "")),
            "columnContent2": truncate_subcontent(get_sub(3, 1).get("content", "")),
            "boxTitle3": truncate_title(get_section(3).get("title", "")),
            "boxContent3": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "subheading4": truncate_title(get_sub(3, 1).get("title", "")),
            "subcontent4": truncate_subcontent(get_sub(3, 1).get("content", "")),

            # Page 8 (Section 5) - with length limits
            "customTitle5": truncate_title(clean_title(get_section(4).get("title", ""))),
            "customContent5": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(4).get("content", ""), get_section(4).get("title", "Section 5")))),
            "accentBoxTitle3": truncate_title(get_sub(4, 0).get("title", "")),
            "accentBoxContent3": truncate_subcontent(get_sub(4, 0).get("content", "")),
            "subheading5": truncate_title(get_sub(4, 1).get("title", "")),
            "numberedItem1": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 0, ""), 90)),
            "numberedItem2": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 1, ""), 90)),
            "numberedItem3": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 2, ""), 90)),
            "numberedItem4": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 3, ""), 90)),
            "quoteText2": truncate_subcontent(split_sentences(get_section(4).get("content", ""))[0] if split_sentences(get_section(4).get("content", "")) else ""),
            "quoteAuthor2": company_name or "",

            # Page 9 (Section 6)
            "customTitle6": truncate_title(clean_title(get_section(5).get("title", ""))),
            "customContent6": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(5).get("content", ""), get_section(5).get("title", "Section 6")))),
            "subheading6": truncate_title(get_sub(5, 0).get("title", "")),
            "subcontent6": truncate_subcontent(get_sub(5, 0).get("content", "")),
            "boxTitle3": truncate_title(get_sub(5, 1).get("title", "")),
            "boxContent3": truncate_subcontent(get_sub(5, 1).get("content", "")),

            # Page 10 (Section 7)
            "customTitle7": truncate_title(clean_title(get_section(6).get("title", ""))),
            "customContent7": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(6).get("content", ""), get_section(6).get("title", "Section 7")))),
            "subheading7": truncate_title(get_sub(6, 0).get("title", "")),
            "subcontent7": truncate_subcontent(get_sub(6, 0).get("content", "")),
            "listItem5": finalize_line(truncate_text(get_or(split_sentences(get_section(6).get("content", "")), 0, ""), 90)),
            "listItem6": finalize_line(truncate_text(get_or(split_sentences(get_section(6).get("content", "")), 1, ""), 90)),
            "listItem7": finalize_line(truncate_text(get_or(split_sentences(get_section(6).get("content", "")), 2, ""), 90)),

            # Page 11 (Section 8)
            "customTitle8": truncate_title(clean_title(get_section(7).get("title", ""))),
            "customContent8": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(7).get("content", ""), get_section(7).get("title", "Section 8")))),
            "subheading8": truncate_title(get_sub(7, 0).get("title", "")),
            "subcontent8": truncate_subcontent(get_sub(7, 0).get("content", "")),
            "accentBoxTitle4": truncate_title(get_sub(7, 1).get("title", "")),
            "accentBoxContent4": truncate_subcontent(get_sub(7, 1).get("content", "")),

            # Page 12 (Section 9)
            "customTitle9": truncate_title(clean_title(get_section(8).get("title", ""))),
            "customContent9": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(8).get("content", ""), get_section(8).get("title", "Section 9")))),
            "subheading9": truncate_title(get_sub(8, 0).get("title", "")),
            "subcontent9": truncate_subcontent(get_sub(8, 0).get("content", "")),
            "listItem8": finalize_line(truncate_text(get_or(split_sentences(get_section(8).get("content", "")), 0, ""), 90)),
            "listItem9": finalize_line(truncate_text(get_or(split_sentences(get_section(8).get("content", "")), 1, ""), 90)),
            "listItem10": finalize_line(truncate_text(get_or(split_sentences(get_section(8).get("content", "")), 2, ""), 90)),

            # Page 13 (Section 10)
            "customTitle10": truncate_title(clean_title(get_section(9).get("title", ""))),
            "customContent10": truncate_content(standardize_sustainable_terms(normalize_main_content(get_section(9).get("content", ""), get_section(9).get("title", "Section 10")))),
            "subheading10": truncate_title(get_sub(9, 0).get("title", "")),
            "subcontent10": truncate_subcontent(get_sub(9, 0).get("content", "")),
            "boxTitle4": truncate_title(get_sub(9, 1).get("title", "")),
            "boxContent4": truncate_subcontent(get_sub(9, 1).get("content", "")),

            # Page 14 (Contact) - with length limits
            "contactTitle": "Contact Us",
            "contactDescription": truncate_content(normalize_main_content(contact.get("description", ""), contact.get("title", "Contact"))),
            "differentiatorTitle": "Contact us",
            "differentiator": finalize_line(truncate_text(contact.get("differentiator", ""), 180)),
            "ctaText": finalize_line(
                ("Book your consultation at " + (normalize_website(website) if website else "")).strip() +
                ((" or email " + (email or "")).strip() if email else "") +
                ((" or call " + (normalize_phone(phone) or "")).strip() if phone else "")
            ),
            "valueBullet1": "Custom sustainability roadmap aligned to your budget",
            "valueBullet2": "Clear ROI with measurable milestones",
            "valueBullet3": "Hands-on implementation support",
            # Quality metrics
            "qualityWarnings": "",
            "qualityHasWarnings": False,
        }
        
        # Derive Problem/Solution/Why/Outcome/Actions for first six sections
        def pswoa(section_idx: int):
            sec = get_section(section_idx)
            title_hint = sec.get("title", f"Section {section_idx+1}")
            base = normalize_main_content(sec.get("content", ""), title_hint)
            sents = split_sentences(base)
            subs = sec.get("subsections", [])
            problem = finalize_line(get_or(sents, 0, f"The key challenge is unclear for {title_hint.lower()}"))
            solution = finalize_line(get_or(sents, 1, f"Adopt a practical approach to address {title_hint.lower()} with clear steps"))
            why = finalize_line(get_or(sents, 2, f"This improves outcomes, reduces risk, and aligns stakeholders"))
            outcome = finalize_line(get_or(sents, 3, f"Expect measurable improvements within a defined timeframe"))
            actions: List[str] = []
            for sub in subs[:3]:
                t = (sub.get("title") or "").strip()
                c = (sub.get("content") or "").strip()
                if t and c:
                    actions.append(finalize_line(f"{t}: {truncate_text(c, 120)}"))
                elif t:
                    actions.append(finalize_line(t))
            if len(actions) < 2:
                for s in sents[4:7]:
                    if len(actions) >= 3:
                        break
                    actions.append(finalize_line(s))
            while len(actions) < 2:
                actions.append(finalize_line(f"Complete a quick checklist and assign owners"))
            # De-duplicate and limit to three concise actions
            seen = set()
            uniq = []
            for a in actions:
                if a not in seen:
                    uniq.append(a)
                    seen.add(a)
                if len(uniq) >= 3:
                    break
            return problem, solution, why, outcome, uniq[:3]
        
        for idx in range(6):
            p, s, w, o, acts = pswoa(idx)
            n = idx + 1
            template_vars[f"s{n}Problem"] = p
            template_vars[f"s{n}Solution"] = s
            template_vars[f"s{n}Why"] = w
            template_vars[f"s{n}Outcome"] = o
            for i, a in enumerate(acts, start=1):
                template_vars[f"s{n}Action{i}"] = a
            # Hook paragraph: 2–3 sentences + transition
            sec = get_section(idx)
            base = normalize_main_content(sec.get("content", ""), sec.get("title", f"Section {n}"))
            sents = split_sentences(base)
            hook = " ".join(sents[:2]) if len(sents) >= 2 else get_or(sents, 0, "")
            next_map = {
                1: "Next: accelerate delivery speed.",
                2: "Next: build competitive advantage.",
                3: "Next: increase operational efficiency.",
                4: "Next: scale delivery without sacrificing quality.",
                5: "Next: convert qualified leads into clients.",
            }
            hook_full = (hook + " " + next_map.get(n, "")).strip()
            template_vars[f"s{n}Hook"] = finalize_line(hook_full)

        # Build basic quality warnings for client-side display
        warnings: List[str] = []
        # Incomplete titles (dangling punctuation or single-letter endings)
        title_samples = [
            template_vars["sectionTitle1"],
            template_vars["sectionTitle2"],
            template_vars["sectionTitle3"],
            template_vars["sectionTitle4"],
            template_vars["sectionTitle5"],
        ]
        if any(re.search(r"[:\-]\s*$", t) or re.search(r"\b(A|An|The)$", t, flags=re.IGNORECASE) for t in title_samples if t):
            warnings.append("Some section titles appear incomplete (e.g., trailing colon/article).")

        # Content completeness: ensure minimum sentences/words
        content_samples = [
            template_vars["customContent1"],
            template_vars["customContent2"],
            template_vars["customContent3"],
            template_vars["customContent4"],
            template_vars["customContent5"],
        ]
        if any(len(split_sentences(c)) < 3 or count_words(c) < 60 for c in content_samples if c):
            warnings.append("Some sections may be too brief; expanded to improve coherence.")

        # Tone checks: excessive exclamation or ALL CAPS streaks
        if any(c.count("!") > 1 or re.search(r"\b[A-Z]{6,}\b", c) for c in content_samples if c):
            warnings.append("Detected informal tone or emphasis; adjusted toward professional style.")

        if warnings:
            template_vars["qualityWarnings"] = " • ".join(warnings)
            template_vars["qualityHasWarnings"] = True

        # Debug mapping summary
        print("🔎 MAP VARS: colors", {"primary": primary_color, "secondary": secondary_color, "accent": accent_color})
        print("🔎 MAP VARS: firm", {"name": company_name, "email": email, "phone": phone, "website": website, "logo": bool(logo_url)})
        print("🔎 MAP VARS: counts", {"sections": len(sections), "contentItems": len(content_items), "termsParas": len(terms_paragraphs)})
        print("🔎 MAP VARS: enhanced_title", enhanced_title)

        return template_vars

    def _create_slogan_prompt(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> str:
        return f"""
        Generate a short, catchy slogan for an architecture firm.
        Firm Name: {firm_profile.get('firm_name', 'An Architecture Firm')}
        Specialization: {user_answers.get('lead_magnet_type', 'General Architecture')}
        Target Audience: {user_answers.get('target_audience', 'General Clients')}
        Pain Points: {user_answers.get('pain_points', 'Finding good design')}
        Desired Outcome: {user_answers.get('desired_outcome', 'A beautiful, functional space')}
        
        Based on the above, create a slogan that is less than 10 words.
        """

    def generate_slogan(self, user_answers: Dict[str, Any], firm_profile: Dict[str, Any]) -> str:
        """Generates a slogan using Perplexity AI."""
        prompt = self._create_slogan_prompt(user_answers, firm_profile)
        
        try:
            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3-sonar-large-32k-online",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 30,
                },
                timeout=15
            )
            response.raise_for_status()
            slogan = response.json()['choices'][0]['message']['content'].strip()
            return slogan
        except requests.exceptions.Timeout as e:
            print(f"❌ Error calling Perplexity API for slogan: {e}")
            return ""
        except requests.exceptions.RequestException as e:
            print(f"❌ Error calling Perplexity API for slogan: {e}")
            return ""

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
