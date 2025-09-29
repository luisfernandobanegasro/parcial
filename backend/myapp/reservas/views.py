# myapp/reservas/views.py
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import AreaComun, Reserva
from .serializers import AreaComunSerializer, ReservaSerializer


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
            return request.user.is_staff or obj.solicitante_id == request.user.id
        return False


class AreaComunViewSet(ModelViewSet):
    queryset = AreaComun.objects.all()
    serializer_class = AreaComunSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["get"], url_path="disponibilidad")
    def disponibilidad(self, request, pk=None):
        """
        Devuelve reservas solapadas con [start, end)
        ?start=ISO&end=ISO
        """
        area = self.get_object()
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        try:
            start_dt = parse_datetime(start) if start else None
            end_dt = parse_datetime(end) if end else None
        except Exception:
            start_dt = end_dt = None

        if not start_dt or not end_dt or end_dt <= start_dt:
            return Response({"detail": "Parámetros start/end inválidos (ISO)."}, status=400)

        ocupadas = (
            Reserva.objects
            .filter(area=area)
            .exclude(estado__in=["CANCELADA", "RECHAZADA"])
            .order_by("inicio")
        )
        data = ReservaSerializer(ocupadas, many=True, context={"request": request}).data
        return Response({"ocupadas": data})


class ReservaViewSet(ModelViewSet):
    queryset = (
        Reserva.objects
        .select_related("area", "solicitante")
        .order_by("-inicio", "-id")
    )
    serializer_class = ReservaSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()

        area = self.request.query_params.get("area")
        estado = self.request.query_params.get("estado")      # PENDIENTE|CONFIRMADA|CANCELADA|RECHAZADA
        vigente = self.request.query_params.get("vigente")    # yes|no
        solo_mias = self.request.query_params.get("mias")     # yes

        if area:
            qs = qs.filter(area_id=area)
        if estado:
            qs = qs.filter(estado=estado)

        if vigente in ("yes", "true", "1"):
            from django.utils import timezone
            now = timezone.now()
            qs = qs.filter(
                estado__in=["PENDIENTE", "CONFIRMADA"],
                fin__gt=now
            )
        if solo_mias in ("yes", "true", "1"):
            qs = qs.filter(solicitante=self.request.user)

        return qs

    # --- Acciones de estado ---

    @action(detail=True, methods=["patch"], url_path="confirmar")
    def confirmar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores pueden confirmar."}, status=403)
        res = self.get_object()
        if res.estado in (Reserva.Estado.CANCELADA, Reserva.Estado.RECHAZADA):
            return Response({"detail": "No se puede confirmar una reserva cancelada/rechazada."}, status=400)
        res.estado = "CONFIRMADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)

    @action(detail=True, methods=["patch"], url_path="rechazar")
    def rechazar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores pueden rechazar."}, status=403)
        res = self.get_object()
        if res.estado == Reserva.Estado.CANCELADA:
            return Response({"detail": "Ya está cancelada."}, status=400)
        res.estado = "RECHAZADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)

    @action(detail=True, methods=["patch"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        res = self.get_object()
        if res.estado in (Reserva.Estado.CANCELADA, Reserva.Estado.RECHAZADA):
            return Response({"detail": "Ya se encuentra cancelada/rechazada."}, status=400)
        res.estado = "CANCELADA"
        res.save(update_fields=["estado"])
        return Response(self.get_serializer(res).data)
