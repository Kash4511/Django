import os
import django
import sys
from pathlib import Path

# Setup Django environment
# Add the backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from lead_magnets.services import DocRaptorService

def test_rendering():
    service = DocRaptorService()
    
    # Comprehensive dummy variables mapping all 14 pages
    variables = {
        # Cover (Page 1)
        "documentTitle": "TESTING 10-PAGE LAYOUT",
        "mainTitle": "Testing 10-Page Layout",
        "documentSubtitle": "Verification of extended template pages",
        "companyName": "Test Architecture Firm",
        "companySubtitle": "Innovative Designs",
        "primaryColor": "#2c3e50",
        "secondaryColor": "#34495e",
        "accentColor": "#e67e22",
        "logoUrl": "",
        "phoneNumber": "123-456-7890",
        "emailAddress": "test@example.com",
        "website": "www.testfirm.com",
        "logoPlaceholder": "T",

        # Headers/Footers
        "headerText1": "Step 1", "headerText2": "Step 2", "headerText3": "Step 3", "headerText4": "Step 4",
        "headerText5": "Step 5", "headerText6": "Step 6", "headerText7": "Step 7", "headerText8": "Step 8",
        "footerText": "© 2026 Test Architecture Firm. All rights reserved.",

        # Page Titles & Numbers
        "sectionTitle1": "Terms of Use", "sectionTitle2": "Contents",
        "sectionTitle3": "Section 1 Title", "sectionTitle4": "Section 2 Title",
        "sectionTitle5": "Section 3 Title", "sectionTitle6": "Section 4 Title",
        "sectionTitle7": "Section 5 Title", "sectionTitle8": "Section 6 Title",
        "sectionTitle9": "Section 7 Title", "sectionTitle10": "Section 8 Title",
        "sectionTitle11": "Section 9 Title", "sectionTitle12": "Section 10 Title",
        "sectionTitle13": "REACH OUT TO OUR TEAM",
        
        "pageNumberHeader2": "PAGE 2", "pageNumberHeader3": "PAGE 3", "pageNumberHeader4": "PAGE 4",
        "pageNumberHeader5": "PAGE 5", "pageNumberHeader6": "PAGE 6", "pageNumberHeader7": "PAGE 7",
        "pageNumberHeader8": "PAGE 8", "pageNumberHeader9": "PAGE 9", "pageNumberHeader10": "PAGE 10",
        "pageNumberHeader11": "PAGE 11", "pageNumberHeader12": "PAGE 12", "pageNumberHeader13": "PAGE 13",
        "pageNumberHeader14": "PAGE 14",

        "pageNumber2": 2, "pageNumber3": 3, "pageNumber4": 4, "pageNumber5": 5, "pageNumber6": 6,
        "pageNumber7": 7, "pageNumber8": 8, "pageNumber9": 9, "pageNumber10": 10, "pageNumber11": 11,
        "pageNumber12": 12, "pageNumber13": 13, "pageNumber14": 14,

        # Contents (Page 3)
        "contentsTitle": "Table of Contents",
        "contentItem1": "Section 1 Overview", "contentItem2": "Section 2 Checklist",
        "contentItem3": "Section 3 Analysis", "contentItem4": "Section 4 Details",
        "contentItem5": "Section 5 Summary", "contentItem6": "Section 6 Extended",
        "contentItem7": "Section 7 Additional", "contentItem8": "Section 8 Supplemental",
        "contentItem9": "Section 9 Conclusion", "contentItem10": "Section 10 Final Thoughts",

        # Terms (Page 2)
        "termsTitle": "Agreement", "termsSummary": "Summary of terms",
        "termsParagraph1": "Para 1 content", "termsParagraph2": "Para 2 content",
        "termsParagraph3": "Para 3 content", "termsParagraph4": "Para 4 content",
        "termsParagraph5": "Para 5 content",

        # Page 4 (Section 1)
        "customTitle1": "Section 1: The Beginning",
        "customContent1": "This is the content for the first section of our guide.",
        "subheading1": "A Subheading", "subcontent1": "Subcontent details for section 1.",
        "boxTitle1": "Key Insight", "boxContent1": "A very important insight here.",
        "architecturalImageCaption1": "Figure 1: Initial Design",

        # Page 5 (Section 2)
        "customTitle2": "Section 2: Checklist",
        "customContent2": "Make sure you follow these steps carefully.",
        "subheading2": "Required Steps",
        "listItem1": "First step to take", "listItem2": "Second step to take",
        "listItem3": "Third step to take", "listItem4": "Fourth step to take",

        # Page 6 (Section 3)
        "customTitle3": "Section 3: Visuals",
        "customContent3": "Visualizing the architectural concepts is key.",
        "subheading3": "Visual Analysis", "subcontent3": "More details about visuals.",
        "boxTitle2": "Pro Tip", "boxContent2": "Use high-quality images.",
        "architecturalImageCaption2": "Figure 2: Site Plan",

        # Page 7 (Section 4)
        "customTitle4": "Section 4: Column Layout",
        "customContent4": "Exploring different layouts for our architectural guide.",
        "subheading4": "Detail Analysis", "subcontent4": "In-depth look at column data.",
        "columnBoxTitle1": "Column A", "columnBoxContent1": "Data for column A.",
        "architecturalImageCaption3": "Figure 3: Detail View",

        # Page 8 (Section 5)
        "customTitle5": "Section 5: Summary",
        "customContent5": "Concluding the first half of our architectural exploration.",
        "subheading5": "Key Takeaways",
        "numberedItem1": "Point one summary", "numberedItem2": "Point two summary",
        "numberedItem3": "Point three summary", "numberedItem4": "Point four summary",
        "accentBoxTitle3": "Critical Note", "accentBoxContent3": "Don't forget this part.",
        "quoteText2": "Architecture is frozen music.", "quoteAuthor2": "Goethe",
        "quoteAuthor2": "Goethe",

        # Page 9 (Section 6)
        "customTitle6": "Section 6: New Page 1",
        "customContent6": "This is the first of our five new extended pages.",
        "subheading6": "Extended Insight", "subcontent6": "Deep dive into new concepts.",
        "boxTitle3": "Focus Area", "boxContent3": "Focus on sustainable materials.",

        # Page 10 (Section 7)
        "customTitle7": "Section 7: New Page 2",
        "customContent7": "Continuing our deep dive into the extended content.",
        "subheading7": "Checklist Extension",
        "listItem5": "Fifth step for success", "listItem6": "Sixth step for success",
        "listItem7": "Seventh step for success",

        # Page 11 (Section 8)
        "customTitle8": "Section 8: New Page 3",
        "customContent8": "Expanding on the core architectural principles.",
        "subheading8": "Principal Study", "subcontent8": "Details on core principles.",
        "accentBoxTitle4": "Expert Advice", "accentBoxContent4": "Consult with experts early.",

        # Page 12 (Section 9)
        "customTitle9": "Section 9: New Page 4",
        "customContent9": "Almost at the end of our comprehensive guide.",
        "subheading9": "Final Review Checklist",
        "listItem8": "Review step 1", "listItem9": "Review step 2", "listItem10": "Review step 3",

        # Page 13 (Section 10)
        "customTitle10": "Section 10: New Page 5",
        "customContent10": "Final section of the content before the contact page.",
        "subheading10": "Closing Thoughts", "subcontent10": "Concluding remarks for section 10.",
        "boxTitle4": "Final Box", "boxContent4": "Final summary box content.",

        # Page 14 (Contact)
        "contactTitle": "Get In Touch",
        "contactDescription": "We are ready to help you with your next project.",
        "differentiatorTitle": "Why Work With Us?",
        "differentiator": "We bring 20 years of experience and a passion for sustainable design.",
        "ctaText": "Book your free consultation today!",
    }

    print("🚀 Starting render test...")
    html = service.render_template_with_vars('modern-guide', variables)
    print(f"✅ Rendered HTML length: {len(html)}")
    from django.conf import settings
    print(f"📄 Debug output saved to: {os.path.join(settings.BASE_DIR, 'debug_output.html')}")

if __name__ == "__main__":
    test_rendering()
