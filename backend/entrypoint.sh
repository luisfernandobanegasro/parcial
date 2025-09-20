#!/usr/bin/env bash
set -e

python manage.py migrate --noinput

# (Opcional) solo primer despliegue si pones las 3 env vars
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --noinput || true
fi

exec gunicorn mysite.wsgi:application --bind 0.0.0.0:8080 --workers 3 --timeout 120
