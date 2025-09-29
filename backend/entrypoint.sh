#!/bin/bash
set -e

# Ejecutar migraciones
python manage.py migrate --noinput

# Crear superusuario si las variables existen
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --noinput || true
fi

# Iniciar Gunicorn con tmpdir especial
PORT="${PORT:-8080}"
exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:${PORT} \
  --workers 3 \
  --timeout 120 \
  --worker-tmp-dir /gunicorn-tmp
