import unittest
import json
from unittest.mock import patch, MagicMock
from lead_magnets.perplexity_client import PerplexityClient

class TestPerplexityClientResilience(unittest.TestCase):
    def setUp(self):
        self.client = PerplexityClient()
        self.client.api_key = "test_key"
        self.user_answers = {"main_topic": "Smart Homes"}
        self.firm_profile = {"firm_name": "Test Firm"}

    @patch('requests.post')
    def test_repair_broken_json(self, mock_post):
        # Broken JSON with missing comma and unescaped quote
        broken_json = '{"title": "Smart Home Guide" "desc": "This is a "smart" guide"}'
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{'message': {'content': broken_json}}]
        }
        mock_post.return_value = mock_response

        # The repair logic should fix it
        result = self.client.generate_lead_magnet_json(self.user_answers, self.firm_profile)
        self.assertEqual(result['title'], "Smart Home Guide")
        self.assertIn("smart", result['desc'])

    @patch('requests.post')
    @patch('time.sleep') # To speed up tests
    def test_retry_on_invalid_json(self, mock_sleep, mock_post):
        # First 2 responses are unrecoverably broken, 3rd is valid
        broken_response = MagicMock()
        broken_response.status_code = 200
        broken_response.json.return_value = {
            'choices': [{'message': {'content': 'This is not JSON at all'}}]
        }

        valid_response = MagicMock()
        valid_response.status_code = 200
        valid_response.json.return_value = {
            'choices': [{'message': {'content': '{"status": "ok"}'}}]
        }

        mock_post.side_effect = [broken_response, broken_response, valid_response]

        result = self.client.generate_lead_magnet_json(self.user_answers, self.firm_profile)
        self.assertEqual(result['status'], "ok")
        self.assertEqual(mock_post.call_count, 3)

    @patch('requests.post')
    @patch('time.sleep')
    def test_exponential_backoff(self, mock_sleep, mock_post):
        # Fail 3 times with timeout, then succeed
        timeout_resp = MagicMock()
        timeout_resp.status_code = 504 # Gateway timeout
        
        valid_resp = MagicMock()
        valid_resp.status_code = 200
        valid_resp.json.return_value = {
            'choices': [{'message': {'content': '{"status": "success"}'}}]
        }
        
        mock_post.side_effect = [timeout_resp, timeout_resp, valid_resp]
        
        self.client.generate_lead_magnet_json(self.user_answers, self.firm_profile)
        
        # Check if sleep was called with exponential values: 2^1=2, 2^2=4
        self.assertEqual(mock_sleep.call_count, 2)
        mock_sleep.assert_any_call(2.0)
        mock_sleep.assert_any_call(4.0)

if __name__ == '__main__':
    unittest.main()
