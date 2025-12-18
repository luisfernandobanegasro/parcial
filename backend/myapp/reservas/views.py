# myapp/reservas/views.py
from django.utils.dateparse import parse_datetime
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import AreaComun, Reserva
from .serializers import AreaComunSerializer, ReservaSerializer

from django.utils import timezone   

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrStaff(permissions.BasePermission):
    """Solo el dueño (solicitante) o staff pueden modificar/cancelar."""
    def has_object_permission(self, request, view, obj: Reserva):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        if request.user and request.user.is_authenticated:
            # comparar contra el auth_user ligado al perfil
            return request.user.is_staff or obj.solicitante.auth_user_id == request.user.id
        return False


class AreaComunViewSet(ModelViewSet):
    queryset = AreaComun.objects.all()
    serializer_class = AreaComunSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["get"], url_path="disponibilidad")
    def disponibilidad(self, request, pk=None):
        """
        Devuelve SOLO las reservas que se SOLAPAN con [start, end)
        Parámetros: ?start=ISO&end=ISO (ej: 2025-10-09T11:00:00Z)
        """
        area = self.get_object()
        start = request.query_params.get("start")
        end = request.query_params.get("end")

        start_dt = parse_datetime(start) if start else None
        end_dt = parse_datetime(end) if end else None
        if not start_dt or not end_dt or end_dt <= start_dt:
            return Response({"detail": "Parámetros start/end inválidos (ISO)."}, status=400)

        # Asegurar zona/aware
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        if timezone.is_naive(end_dt):
            end_dt = timezone.make_aware(end_dt)

        # Solapamiento: inicio < end  y  fin > start
        ocupadas = (
            Reserva.objects
            .filter(area=area)
            .exclude(estado__in=["CANCELADA", "RECHAZADA"])
            .filter(inicio__lt=end_dt, fin__gt=start_dt)
            .select_related("area", "solicitante")
            .order_by("inicio")
        )
        data = ReservaSerializer(ocupadas, many=True, context={"request": request}).data
        return Response({"ocupadas": data, "count": len(data)})

class ReservaViewSet(ModelViewSet):
    queryset = Reserva.objects.select_related("area", "solicitante", "solicitante__auth_user").order_by("-inicio", "-id")
    serializer_class = ReservaSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()

        area = self.request.query_params.get("area")
        estado = self.request.query_params.get("estado")
        vigente = self.request.query_params.get("vigente")   # yes|no
        solo_mias = self.request.query_params.get("mias")     # yes

        if area:
            qs = qs.filter(area_id=area)
        if estado:
            qs = qs.filter(estado=estado)

        if vigente in ("yes", "true", "1"):
            from django.utils import timezone
            now = timezone.now()
            qs = qs.filter(estado__in=["PENDIENTE", "CONFIRMADA"], fin__gt=now)

        if solo_mias in ("yes", "true", "1"):
            # filtra por el auth_user actual
            qs = qs.filter(solicitante__auth_user=self.request.user)

        return qs

    # --- Acciones de estado ---

    @action(detail=True, methods=["patch"], url_path="confirmar")
    def confirmar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores pueden confirmar."}, status=403)
        res = self.get_object()
        if res.estado in ("CANCELADA", "RECHAZADA"):
            return Response({"detail": "No se puede confirmar una reserva cancelada/rechazada."}, status=400)
        res.estado = "CONFIRMADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)

    @action(detail=True, methods=["patch"], url_path="rechazar")
    def rechazar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores pueden rechazar."}, status=403)
        res = self.get_object()
        if res.estado == "CANCELADA":
            return Response({"detail": "Ya está cancelada."}, status=400)
        res.estado = "RECHAZADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)

    @action(detail=True, methods=["patch"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        res = self.get_object()
        if res.estado in ("CANCELADA", "RECHAZADA"):
            return Response({"detail": "Ya se encuentra cancelada/rechazada."}, status=400)
        res.estado = "CANCELADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)
