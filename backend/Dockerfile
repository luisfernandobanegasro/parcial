
# Imagen base
FROM python:3.13-slim

# Variables de entorno base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PATH="/app/.venv/bin:$PATH"

# Directorio de trabajo
WORKDIR /app

# Paquetes del sistema necesarios (psycopg, compilación)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para cachear
COPY requirements.txt /app/requirements.txt

# Crear virtualenv e instalar dependencias
RUN python -m venv /app/.venv \
 && . /app/.venv/bin/activate \
 && pip install --upgrade pip \
 && pip install -r /app/requirements.txt

# Copiar el resto del proyecto
COPY . /app

# Normalizar salto de línea de entrypoint.sh (Windows -> Linux)
RUN sed -i 's/\r$//' /app/entrypoint.sh \
 && chmod +x /app/entrypoint.sh

# Puerto lógico (EB pasará PORT igualmente)
EXPOSE 8080

RUN mkdir -p /gunicorn-tmp && chmod 1777 /gunicorn-tmp

# Comando de arranque
CMD ["/app/entrypoint.sh"]
