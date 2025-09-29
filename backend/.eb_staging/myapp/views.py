from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

# ============================================================
#  MODELOS Y TOKENS
# ============================================================
User = get_user_model()
token_generator = PasswordResetTokenGenerator()

# ============================================================
#  VISTAS EXISTENTES
# ============================================================
def home(request):
    return JsonResponse({"status": "ok", "service": "api"})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        groups_qs = u.groups.all().values("id", "name")
        groups = [g["name"] for g in groups_qs]

        # Si no quieres enviar permisos, elimina esta línea:
        permissions = sorted(list(u.get_all_permissions()))

        data = {
            "id": u.id,                           # id de auth_user
            "username": u.get_username(),
            "email": u.email or "",
            "auth": {
                "is_superuser": u.is_superuser,
                "is_staff": u.is_staff,
                "is_active": u.is_active,
                "groups": groups,                 # ← el front usa estos NOMBRES
                "groups_detail": list(groups_qs), # opcional: por si necesitas id
                "permissions": permissions,       # opcional
            },
        }
        return Response(data)


# ============================================================
#  NUEVAS VISTAS: RESTABLECER CONTRASEÑA
# ============================================================

class PasswordForgotView(APIView):
    """
    POST /api/auth/password/forgot/
    body: { "email": "user@example.com" }

    - En dev: el email se imprime en consola
    - En prod: se envía por SMTP (ej. Gmail)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # No revelar si existe o no: devolvemos éxito igualmente
            return Response({"detail": "Si el email existe, se enviará un enlace de restablecimiento."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # URL de frontend (React/Flutter web)
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
        reset_url = f"{frontend_base}/reset-password?uid={uid}&token={token}"

        subject = "Restablecer contraseña - SmartCondominium"
        message = (
            f"Hola {user.get_username()},\n\n"
            f"Para restablecer tu contraseña, haz clic en el siguiente enlace:\n\n"
            f"{reset_url}\n\n"
            f"Si tú no solicitaste este cambio, ignora este mensaje."
        )

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)

        return Response({
            "detail": "Si el email existe, se enviará un enlace de restablecimiento.",
            "debug": {"uid": uid, "token": token} if settings.DEBUG else None
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password/reset/
    body: { "uid": "...", "token": "...", "new_password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response({"detail": "uid, token y new_password son requeridos."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "UID inválido."}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({"detail": "Token inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)

        # Guardar nueva contraseña
        user.set_password(new_password)
        user.save()

        return Response({"detail": "Contraseña actualizada correctamente."})


class PasswordChangeView(APIView):
    """
    POST /api/auth/password/change/
    body: { "old_password": "...", "new_password": "..." }
    Requiere JWT (IsAuthenticated).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password") or ""
        new_password = request.data.get("new_password") or ""
        user = request.user

        # 1) Verifica contraseña actual
        if not user.check_password(old_password):
            return Response({"detail": "La contraseña actual no es correcta."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 2) Valida nueva contraseña con validadores de Django (fuerza mínima, etc.)
        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"detail": "Contraseña inválida.", "errors": e.messages},
                            status=status.HTTP_400_BAD_REQUEST)

        # 3) Guarda nueva contraseña
        user.set_password(new_password)
        user.save()

        return Response({"detail": "Contraseña actualizada correctamente."})
# ============================================================
