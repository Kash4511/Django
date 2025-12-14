from django.http import JsonResponse
from django.conf import settings
import traceback

class CatchAllMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as e:
            data = {"error": "Fatal server error", "details": str(e)}
            if settings.DEBUG:
                data["trace"] = traceback.format_exc()
            return JsonResponse(data, status=500)
