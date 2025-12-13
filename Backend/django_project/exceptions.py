import logging
import traceback
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        try:
            data = response.data
            if isinstance(data, dict) and 'error' not in data:
                response.data = {
                    'error': data.get('detail') or 'Request error',
                    'details': data,
                }
        except Exception:
            pass
        return response

    logging.error(
        "Unhandled exception in view %s: %s\n%s",
        context.get('view'),
        exc,
        traceback.format_exc(),
    )
    return Response(
        {
            'error': 'Internal server error',
            'details': str(exc),
            'trace': traceback.format_exc(),
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

