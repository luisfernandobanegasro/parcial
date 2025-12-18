from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from .models import DeviceToken
from .serializers import DeviceTokenSerializer

class DeviceTokenViewSet(viewsets.ModelViewSet):
    queryset = DeviceToken.objects.all()
    serializer_class = DeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # cada usuario sólo ve sus tokens
        return DeviceToken.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # upsert por token
        token = request.data.get("token")
        platform = (request.data.get("platform") or "android").lower()
        if not token:
            return Response({"detail": "Falta token"}, status=400)
        obj, _ = DeviceToken.objects.update_or_create(
            token=token, defaults={"user": request.user, "platform": platform}
        )
        return Response(DeviceTokenSerializer(obj).data, status=201)
