# === make-deploy.ps1 (ejecútalo desde la RAÍZ del repo) ===
param(
  [string]$Project = "mysite"   # paquete donde están settings.py y wsgi.py
)

$ErrorActionPreference = "Stop"

$SRC   = ".\backend"            # fuente (tu proyecto Django está dentro de backend/)
$STAGE = ".\.eb_staging"        # carpeta temporal

# 1) Preparar staging
if (Test-Path $STAGE) { Remove-Item $STAGE -Recurse -Force }
New-Item -ItemType Directory -Path $STAGE | Out-Null
Copy-Item -Path (Join-Path $SRC "*") -Recurse -Force -Destination $STAGE

# 2) Archivos requeridos
$ebdir   = Join-Path $STAGE ".ebextensions"
$hookDir = Join-Path $STAGE ".platform/hooks/postdeploy"
New-Item -ItemType Directory -Path $ebdir   -Force | Out-Null
New-Item -ItemType Directory -Path $hookDir -Force | Out-Null

# 2.a) python.config -> indica a EB dónde está el WSGI (path de archivo, con / y .py)
$pythonConfig = @"
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: $Project/wsgi.py
"@
[IO.File]::WriteAllText((Join-Path $ebdir "python.config"), ($pythonConfig -replace "`r?`n","`n"))

# 2.b) Procfile -> forzamos a usar el módulo con PUNTO (.) para evitar 'mysite/wsgi'
$proc = "web: gunicorn $Project.wsgi:application --bind 127.0.0.1:8000 --workers 2 --threads 2"
[IO.File]::WriteAllText((Join-Path $STAGE "Procfile"), $proc)

# 2.c) Hook postdeploy -> migrate + collectstatic
$postDeploy = @"
#!/usr/bin/env bash
set -e
if [ -f /var/app/venv/*/bin/activate ]; then
  source /var/app/venv/*/bin/activate
fi
cd /var/app/current
export PYTHONPATH=/var/app/current
echo ""[EB postdeploy] migrate...""; python manage.py migrate --noinput
echo ""[EB postdeploy] collectstatic...""; python manage.py collectstatic --noinput || true
echo ""[EB postdeploy] done.""
"@
$hookPath = Join-Path $hookDir "01_django_postdeploy.sh"
[IO.File]::WriteAllText($hookPath, ($postDeploy -replace "`r?`n","`n"))

# 3) Limpiar restos que rompen
# 3.a) hooks viejos que corren manage.py dentro de 'backend/'
$badHook1 = Join-Path $hookDir "01_django.sh"
if (Test-Path $badHook1) { Remove-Item $badHook1 -Force }

# 3.b) Procfiles malos en subcarpetas
Get-ChildItem -Path $STAGE -Filter "Procfile" -Recurse | Where-Object { $_.FullName -ne (Join-Path $STAGE "Procfile") } | Remove-Item -Force -ErrorAction SilentlyContinue

# 4) Excluir basura
$toDelete = @(".git",".venv","venv","ENV","node_modules","frontend","mobile","__pycache__","staticfiles","media")
foreach ($d in $toDelete) {
  Get-ChildItem -Path $STAGE -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.PSIsContainer -and $_.Name -eq $d } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Get-ChildItem -Path $STAGE -Recurse -Force -Include *.pyc,*.pyo,*.pyd,*.log,*.sqlite3,*.zip,.env,.env.* |
  Remove-Item -Force -ErrorAction SilentlyContinue

# 5) Empaquetar (ZIP queda en la raíz)
if (Test-Path .\deploy.zip) { Remove-Item .\deploy.zip -Force }
Compress-Archive -Path "$STAGE\*" -DestinationPath .\deploy.zip -Force
Write-Host "✅ deploy.zip creado en $(Resolve-Path .\deploy.zip)"
