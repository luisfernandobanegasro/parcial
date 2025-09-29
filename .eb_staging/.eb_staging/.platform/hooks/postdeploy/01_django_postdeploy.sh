#!/usr/bin/env bash
set -e

# Activa el venv del contenedor si existe
if [ -f /var/app/venv/*/bin/activate ]; then
  source /var/app/venv/*/bin/activate
fi

cd /var/app/current
export PYTHONPATH=/var/app/current

echo "[EB postdeploy] migrate..."
python manage.py migrate --noinput

echo "[EB postdeploy] collectstatic..."
python manage.py collectstatic --noinput || true

echo "[EB postdeploy] done."
