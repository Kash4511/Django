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

        max_retries = 2
        retry_count = 0
        models_to_try = ["sonar-pro", "sonar"]

        while retry_count <= max_retries:
            model_to_use = models_to_try[1] if retry_count == max_retries else models_to_try[0]
            try:
                if retry_count > 0:
                    print(f"🔄 Retrying AI content generation (attempt {retry_count + 1}/{max_retries + 1}) with model: {model_to_use}...")
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
                    timeout=20
                )
                break
            except requests.exceptions.Timeout:
                retry_count += 1
                if retry_count > max_retries:
                    print("❌ Perplexity API timeout after multiple attempts")
                    raise Exception("Perplexity API timeout after multiple attempts (20s each)")
                else:
                    print(f"⚠️ API timeout on attempt {retry_count}, retrying...")
                    continue
            except requests.exceptions.RequestException as e:
                print(f"❌ Perplexity API request error: {e}")
                raise Exception(f"Perplexity API request error: {e}")
            except Exception as e:
                print(f"❌ Error calling Perplexity API: {str(e)}")
                raise

        print(f"Perplexity response status: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ Perplexity API error: {response.status_code} - {response.text}")
            raise Exception(f"Perplexity API error: {response.status_code} - {response.text}")

        result = response.json()
        message_content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        json_content = self._extract_json_from_markdown(message_content)
        try:
            content = json.loads(json_content)
            return content
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON from Perplexity response: {e}")
            print(f"Raw content: {repr(message_content)}")
            print(f"Extracted JSON: {repr(json_content)}")
            raise Exception("Invalid JSON returned from Perplexity API")

    def _extract_json_from_markdown(self, content: str) -> str:
        """
        Extract JSON from markdown code blocks.
        Handles formats like:
        ```json
        { ... }
        ```
        or just plain JSON
        """
        # Remove leading/trailing whitespace
        content = content.strip()
        
        # Check if content is wrapped in markdown code blocks
        if content.startswith('```'):
            # Find the start and end of the code block
            lines = content.split('\n')
            start_idx = 0
            end_idx = len(lines)
            
            # Find the first line that starts with ```
            for i, line in enumerate(lines):
                if line.strip().startswith('```'):
                    start_idx = i + 1
                    break
            
            # Find the last line that starts with ```
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('```'):
                    end_idx = i
                    break
            
            # Extract content between code blocks
            json_lines = lines[start_idx:end_idx]
            return '\n'.join(json_lines)
        
        # If not wrapped in code blocks, return as-is
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
            "- Address the target_audience EXCLUSIVELY. All content must be tailored to their specific pain_points and desired_outcomes.\n"
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

        def ensure_min_sentences(text: str, min_sentences: int = 3, max_sentences: int = 5, topic_hint: Optional[str] = None) -> str:
            sentences = [finalize_line(s) for s in split_sentences(text)]
            # Fallback pool of professional, neutral sentences
            th = (topic_hint or 'this topic').strip()
            fallback_pool = [
                f"This section provides clear guidance on {th}.",
                "It outlines benefits, trade-offs, and common pitfalls to avoid.",
                "Recommendations and steps help readers take confident action.",
                "Examples illustrate how to apply ideas in real-world scenarios.",
            ]
            i = 0
            while len(sentences) < min_sentences and i < len(fallback_pool):
                sentences.append(finalize_line(fallback_pool[i]))
                i += 1
            # Keep it concise
            sentences = sentences[:max_sentences]
            return " ".join(sentences)

        def ensure_min_words(text: str, min_words: int = 60, max_words: int = 220, topic_hint: Optional[str] = None) -> str:
            t = (text or '').strip()
            if count_words(t) >= min_words:
                return t
            # Add more fallback content until minimum reached
            th = (topic_hint or 'the topic').strip()
            additions = [
                f"The discussion focuses on key considerations for {th}.",
                "It balances practicality with strategic outcomes and long-term value.",
                "Readers gain clarity on next steps and measurable results.",
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

            # Section titles used in headers - explicitly set for pages 2 and 3
            "sectionTitle1": "Terms of Use",
            "sectionTitle2": "Contents",
            "sectionTitle3": truncate_title(clean_title(get_section(2).get("title", ""))),
            "sectionTitle4": truncate_title(clean_title(get_section(3).get("title", ""))),
            "sectionTitle5": truncate_title(clean_title(get_section(4).get("title", ""))),
            "sectionTitle6": truncate_title(clean_title(get_section(3).get("title", ""))),
            "sectionTitle7": truncate_title(clean_title(get_section(4).get("title", ""))),
            "sectionTitle8": "REACH OUT TO OUR TEAM",

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
            "contentItem1": truncate_title(clean_title(get_or(content_items, 0, get_section(0).get("title", "")))),
            "contentItem2": truncate_title(clean_title(get_or(content_items, 1, get_section(1).get("title", "")))),
            "contentItem3": truncate_title(clean_title(get_or(content_items, 2, get_section(2).get("title", "")))),
            "contentItem4": truncate_title(clean_title(get_or(content_items, 3, get_section(3).get("title", "")))),
            "contentItem5": truncate_title(clean_title(get_or(content_items, 4, get_section(4).get("title", "")))),
            "contentItem6": truncate_title(clean_title(get_or(content_items, 5, contact.get("title", "Contact & Next Steps")))),

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
            "customTitle1": truncate_title(refine_title_with_content(get_section(0).get("title", ""), get_section(0).get("content", ""))),
            "customContent1": truncate_content(harmonize_section(get_section(0).get("title", "Section 1"), get_section(0).get("content", ""))),
            "subheading1": truncate_title(get_sub(0, 0).get("title", "")),
            "subcontent1": truncate_subcontent(get_sub(0, 0).get("content", "")),
            "boxTitle1": truncate_title(get_sub(0, 1).get("title", "")),
            "boxContent1": truncate_subcontent(get_sub(0, 1).get("content", "")),
            "accentBoxTitle1": truncate_title(get_sub(0, 0).get("title", "")),
            "accentBoxContent1": truncate_subcontent(get_sub(0, 0).get("content", "")),

            # Page 5 (Section 2) - with length limits and quote handling
            "customTitle2": truncate_title(refine_title_with_content(get_section(1).get("title", ""), get_section(1).get("content", ""))),
            "customContent2": truncate_content(harmonize_section(get_section(1).get("title", "Section 2"), get_section(1).get("content", ""))),
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
            "customTitle3": truncate_title(refine_title_with_content(get_section(2).get("title", ""), get_section(2).get("content", ""))),
            "customContent3": truncate_content(harmonize_section(get_section(2).get("title", "Section 3"), get_section(2).get("content", ""))),
            "accentBoxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "accentBoxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),
            "subheading3": truncate_title(get_sub(2, 1).get("title", "")),
            "listItem1": finalize_line(truncate_text(get_or(split_sentences(get_section(2).get("content", "")), 0, ""), 90)),
            "listItem2": finalize_line(truncate_text(get_or(split_sentences(get_section(2).get("content", "")), 1, ""), 90)),
            "listItem3": finalize_line(truncate_text(get_or(split_sentences(get_section(2).get("content", "")), 2, ""), 90)),
            "listItem4": finalize_line(truncate_text(get_or(split_sentences(get_section(2).get("content", "")), 3, ""), 90)),
            "boxTitle2": truncate_title(get_sub(2, 0).get("title", "")),
            "boxContent2": truncate_subcontent(get_sub(2, 0).get("content", "")),

            # Page 7 (Section 4) - with length limits
            "customTitle4": truncate_title(refine_title_with_content(get_section(3).get("title", ""), get_section(3).get("content", ""))),
            "customContent4": truncate_content(harmonize_section(get_section(3).get("title", "Section 4"), get_section(3).get("content", ""))),
            "columnTitle1": truncate_title(get_sub(3, 0).get("title", "")),
            "columnContent1": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "columnTitle2": truncate_title(get_sub(3, 1).get("title", "")),
            "columnContent2": truncate_subcontent(get_sub(3, 1).get("content", "")),
            "boxTitle3": truncate_title(get_section(3).get("title", "")),
            "boxContent3": truncate_subcontent(get_sub(3, 0).get("content", "")),
            "subheading4": truncate_title(get_sub(3, 1).get("title", "")),
            "subcontent4": truncate_subcontent(get_sub(3, 1).get("content", "")),

            # Page 8 (Section 5) - with length limits
            "customTitle5": truncate_title(refine_title_with_content(get_section(4).get("title", ""), get_section(4).get("content", ""))),
            "customContent5": truncate_content(harmonize_section(get_section(4).get("title", "Section 5"), get_section(4).get("content", ""))),
            "accentBoxTitle3": truncate_title(get_sub(4, 0).get("title", "")),
            "accentBoxContent3": truncate_subcontent(get_sub(4, 0).get("content", "")),
            "subheading5": truncate_title(get_sub(4, 1).get("title", "")),
            "numberedItem1": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 0, ""), 90)),
            "numberedItem2": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 1, ""), 90)),
            "numberedItem3": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 2, ""), 90)),
            "numberedItem4": finalize_line(truncate_text(get_or(split_sentences(get_section(4).get("content", "")), 3, ""), 90)),

            # Page 9 (Contact) - with length limits
            "contactTitle": "Contact Us",
            "contactDescription": truncate_content(normalize_main_content(contact.get("description", ""), contact.get("title", "Contact"))),
            "differentiatorTitle": "Contact us",
            "differentiator": finalize_line(truncate_text(contact.get("differentiator", ""), 180)),
            # Quality metrics
            "qualityWarnings": "",
            "qualityHasWarnings": False,
        }

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
