import os
import unittest
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from lead_magnets.services import DocRaptorService


class TestDocRaptorService(unittest.TestCase):
    def setUp(self):
        self.service = DocRaptorService()

    def test_generate_pdf_empty_variables(self):
        result = self.service.generate_pdf('modern-guide', {})
        assert result.get('success') is False
        assert result.get('error') == 'Empty template variables'

    def test_generate_pdf_missing_api_key(self):
        # Provide minimal variables to pass the empty-vars check
        vars = {'companyName': 'Test Co', 'mainTitle': 'Title'}
        result = self.service.generate_pdf('modern-guide', vars)
        if not self.service.api_key:
            assert result.get('success') is False
            assert 'DocRaptor API key missing' in result.get('error', '') or 'DocRaptor' in result.get('error', '')


if __name__ == '__main__':
    unittest.main()
