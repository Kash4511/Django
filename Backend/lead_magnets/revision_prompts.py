def build_revision_request(existing_content, revision_payload, firm_profile):
    return {
        "existing_content": existing_content,
        "revision": {
            "type": revision_payload.get("revision_type"),
            "target_section": revision_payload.get("target_section"),
            "section_index": revision_payload.get("section_index"),
            "tone": revision_payload.get("tone"),
            "instructions": revision_payload.get("instructions"),
            "focus_audience": revision_payload.get("focus_audience"),
            "strengthen_conversion": revision_payload.get("strengthen_conversion", False),
            "title_alternatives": revision_payload.get("title_alternatives", False),
        },
        "firm_profile": firm_profile,
    }

