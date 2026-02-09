
import sys
import os
import json
from lead_magnets.perplexity_client import PerplexityClient

def test_mapping():
    # Mock AI content with 5 sections
    ai_content = {
        "style": {},
        "cover": {"title": "Test Guide", "subtitle": "Subtitle"},
        "contents": {"items": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Contact"]},
        "sections": [
            {"title": "Section 1 Title", "content": "Content 1"},
            {"title": "Section 2 Title", "content": "Content 2"},
            {"title": "Section 3 Title", "content": "Content 3"},
            {"title": "Section 4 Title", "content": "Content 4"},
            {"title": "Section 5 Title", "content": "Content 5"},
        ],
        "contact": {},
        "terms": {},
        "brand": {}
    }

    client = PerplexityClient()
    # Skip API key check for this test since we are only testing mapping
    client.api_key = "dummy" 
    
    vars = client.map_to_template_vars(ai_content)

    print("--- Checking Section Title Mapping ---")
    
    # Expected:
    # Page 4 (Section 1) -> sectionTitle3
    # Page 5 (Section 2) -> sectionTitle4
    # Page 6 (Section 3) -> sectionTitle5
    # Page 7 (Section 4) -> sectionTitle6
    # Page 8 (Section 5) -> sectionTitle7

    mapping_check = [
        ("sectionTitle3", "Section 1 Title"),
        ("sectionTitle4", "Section 2 Title"),
        ("sectionTitle5", "Section 3 Title"),
        ("sectionTitle6", "Section 4 Title"),
        ("sectionTitle7", "Section 5 Title"),
    ]

    failed = False
    for key, expected_val in mapping_check:
        actual_val = vars.get(key)
        if actual_val != expected_val:
            print(f"FAIL: {key} expected '{expected_val}', got '{actual_val}'")
            failed = True
        else:
            print(f"PASS: {key} == '{actual_val}'")

    if not failed:
        print("\nSUCCESS: All section titles mapped correctly.")
    else:
        print("\nFAILURE: Mapping errors found.")

if __name__ == "__main__":
    test_mapping()
