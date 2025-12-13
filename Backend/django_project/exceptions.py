import logging
import traceback
from typing import Any
from django.conf import settings
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)

    # Log full traceback for server visibility
    try:
        logger.error("Unhandled exception in view", exc_info=exc)
    except Exception:
        # Fallback logging if exc_info fails
        logger.error(f"Unhandled exception: {exc}")

    if response is not None:
        # Normalize DRF-generated error responses to a consistent shape
        details = response.data
        payload = {
            'error': 'Request failed',
            'details': details,
        }
        if settings.DEBUG:
            payload['trace'] = traceback.format_exc()
        response.data = payload
        return response

    # Non-DRF exceptions (e.g., Django/unknown) — convert to JSON
    payload = {
        'error': 'Internal server error',
        'details': str(exc),
    }
    if settings.DEBUG:
        payload['trace'] = traceback.format_exc()

    return Response(payload, status=500)

