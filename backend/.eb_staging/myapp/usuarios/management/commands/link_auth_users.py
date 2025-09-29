from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from myapp.usuarios.models import Usuarios

class Command(BaseCommand):
    help = "Vincula Usuarios.auth_user con django.contrib.auth.User; crea si no existe"

    def handle(self, *args, **opts):
        creados, vinculados = 0, 0
        for u in Usuarios.objects.all():
            if u.auth_user:
                vinculados += 1
                continue

            au = None
            if u.usuario:
                au = User.objects.filter(username=u.usuario).first()
            if not au and u.correo:
                au = User.objects.filter(email=u.correo).first()

            if not au:
                username = u.usuario or (u.correo.split("@")[0] if u.correo else f"user_{u.pk}")
                au = User.objects.create_user(
                    username=username,
                    email=u.correo or "",
                    password=User.objects.make_random_password(),
                    first_name=(u.nombre_completo or "").split(" ")[0][:30],
                    last_name="",
                    is_active=True,
                )
                creados += 1

            u.auth_user = au
            u.save(update_fields=["auth_user"])

        self.stdout.write(self.style.SUCCESS(
            f"Vinculados existentes: {vinculados}, auth_user creados: {creados}"
        ))
