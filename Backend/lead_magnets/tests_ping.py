from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def ping(request):
    return Response({"ok": True}, status=status.HTTP_200_OK)

