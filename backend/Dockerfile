FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Normaliza fin de línea por si clonaste en Windows
RUN sed -i 's/\r$//' /app/entrypoint.sh || true

# Colecta estáticos (no falla si no hay)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8080
CMD ["/app/entrypoint.sh"]
