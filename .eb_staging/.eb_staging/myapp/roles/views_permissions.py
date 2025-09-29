# myapp/roles/views_permissions.py
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import PermissionSerializer

class PermissionListView(APIView):
    """
    GET /api/roles/permisos/?q=&app=&model=
    Lista el catálogo completo de permisos (con filtros).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q     = (request.GET.get("q") or "").strip()
        app   = (request.GET.get("app") or "").strip()
        model = (request.GET.get("model") or "").strip()

        qs = Permission.objects.select_related("content_type").all()

        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(codename__icontains=q))
        if app:
            qs = qs.filter(content_type__app_label=app)
        if model:
            qs = qs.filter(content_type__model=model)

        qs = qs.order_by("content_type__app_label", "content_type__model", "codename")
        return Response(PermissionSerializer(qs, many=True).data, status=200)

class PermissionSyncView(APIView):
    """
    POST /api/roles/permisos/sync/
    Reconstruye catálogo (asegura que existan codenames CRUD para cada modelo).
    *Sólo staff/superuser*.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        created = 0
        defaults = {
            "add":    "Puede crear {model}",
            "change": "Puede cambiar {model}",
            "delete": "Puede eliminar {model}",
            "view":   "Puede ver {model}",
        }

        for ct in ContentType.objects.all():
            # crea los 4 permisos estándar si no existen
            for code, label_tpl in defaults.items():
                codename = f"{code}_{ct.model}"
                if not Permission.objects.filter(codename=codename, content_type=ct).exists():
                    Permission.objects.create(
                        codename=codename,
                        name=label_tpl.format(model=ct.model),
                        content_type=ct
                    )
                    created += 1

        return Response({"ok": True, "created": created}, status=200)

class GroupPermissionsView(APIView):
    """
    GET    /api/roles/<group_id>/permisos/
    POST   /api/roles/<group_id>/permisos/      body: { "permission_id": 123 }
    DELETE /api/roles/<group_id>/permisos/<perm_id>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(pk=group_id)
        perms = group.permissions.select_related("content_type").all()
        return Response(PermissionSerializer(perms, many=True).data, status=200)

    def post(self, request, group_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        perm_id = request.data.get("permission_id")
        if not perm_id:
            return Response({"detail": "permission_id requerido"}, status=400)

        group = Group.objects.get(pk=group_id)
        perm  = Permission.objects.get(pk=perm_id)
        group.permissions.add(perm)
        return Response({"ok": True}, status=201)

    def delete(self, request, group_id, perm_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        group = Group.objects.get(pk=group_id)
        perm  = Permission.objects.get(pk=perm_id)
        group.permissions.remove(perm)
        return Response(status=204)
