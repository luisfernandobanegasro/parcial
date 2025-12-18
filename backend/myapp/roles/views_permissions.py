# myapp/roles/views_permissions.py
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers
from django.shortcuts import get_object_or_404

from .models import Roles  # tu tabla propia

# ---- Serializer para exponer permisos ----
class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model     = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model  = Permission
        fields = ("id", "name", "codename", "app_label", "model")

# ---- Helpers ----
def resolve_group_from_any_id(group_or_role_id: int) -> Group:
    """
    Si existe un Group con ese id => lo usamos.
    Si no, probamos si es id de tu tabla 'roles' y mapeamos por nombre:
       Group.name == Roles.nombre
    Si no existe, lo creamos (para poder asignar permisos).
    """
    grp = Group.objects.filter(id=group_or_role_id).first()
    if grp:
        return grp

    role = Roles.objects.filter(id=group_or_role_id).first()
    if not role:
        raise serializers.ValidationError("No existe Group ni Roles con ese id")

    grp, _ = Group.objects.get_or_create(name=role.nombre)
    return grp

# ---- 1) Listado de permisos ----
class PermissionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Permission.objects.select_related("content_type").order_by("content_type__app_label", "codename")
        data = PermissionSerializer(qs, many=True).data
        return Response(data)

    # crear permiso manual (opcional)
    def post(self, request):
        name      = request.data.get("name", "").strip()
        codename  = request.data.get("codename", "").strip()
        app_label = request.data.get("app_label", "").strip()
        model     = request.data.get("model", "").strip()

        if not all([name, codename, app_label, model]):
            return Response({"detail": "Faltan campos"}, status=400)

        ct = ContentType.objects.filter(app_label=app_label, model=model).first()
        if not ct:
            return Response({"detail": "ContentType no existe (app/model)"}, status=400)

        if Permission.objects.filter(codename=codename, content_type=ct).exists():
            return Response({"detail": "Ya existe ese codename para ese content_type"}, status=400)

        perm = Permission.objects.create(name=name, codename=codename, content_type=ct)
        return Response(PermissionSerializer(perm).data, status=201)

# ---- 2) Borrado individual de permiso ----
class PermissionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk: int):
        perm = get_object_or_404(Permission, pk=pk)
        perm.delete()
        return Response(status=204)

# ---- 3) Sync del catálogo (reconstruye permisos default de Django) ----
class PermissionSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Fuerza a regenerar permisos de modelos
        from django.core.management import call_command
        call_command("makemigrations", interactive=False, check=True)  # no crea archivos si no hay cambios
        call_command("migrate", interactive=False)
        # Django crea/actualiza permisos en la señal post_migrate
        return Response({"status": "ok"})

# ---- 4) Permisos por grupo ----
class GroupPermissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id: int):
        grp = resolve_group_from_any_id(group_id)
        perms = grp.permissions.select_related("content_type").all().order_by("content_type__app_label", "codename")
        return Response(PermissionSerializer(perms, many=True).data)

    def post(self, request, group_id: int, perm_id: int):
        grp  = resolve_group_from_any_id(group_id)
        perm = get_object_or_404(Permission, pk=perm_id)
        grp.permissions.add(perm)
        return Response({"status": "added"}, status=201)

    def delete(self, request, group_id: int, perm_id: int):
        grp  = resolve_group_from_any_id(group_id)
        perm = get_object_or_404(Permission, pk=perm_id)
        grp.permissions.remove(perm)
        return Response(status=204)
