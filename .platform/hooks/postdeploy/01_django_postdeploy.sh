#!/usr/bin/env bash
set -e

# Activar el venv que crea Elastic Beanstalk
source /var/app/venv/*/bin/activate

echo "[EB postdeploy] migrate..."
python manage.py migrate --noinput

echo "[EB postdeploy] collectstatic..."
python manage.py collectstatic --noinput

echo "[EB postdeploy] done."
