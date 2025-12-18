"""
Django settings for mysite project.
Consolidado para usar .env, RDS y desarrollo local.
"""

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv  # pip install python-dotenv

# ======================================
# BASE
# ======================================
BASE_DIR = Path(__file__).resolve().parent.parent
# Carga variables del archivo .env que va en la carpeta backend/
load_dotenv(BASE_DIR / ".env")

# Nombre de sitio (se usa en PDFs, correos, etc.)
SITE_NAME = os.getenv("SITE_NAME", "Condominio")

# ======================================
# Seguridad básica
# ======================================
# (En prod sobreescribe con DJANGO_SECRET_KEY en .env)
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-0&18!rp#l)@6i##lfum!h&+!-0n4k=-o96e7pa^-ru1x==4ct8"
)
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"

# Detrás de proxy/ELB: respeta HTTPS del balanceador
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 0  # súbelo (p.ej. 31536000) cuando tengas HTTPS estable
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Por defecto abierto en dev; en prod usa DJANGO_ALLOWED_HOSTS=dom1,dom2
_env_hosts = os.getenv("DJANGO_ALLOWED_HOSTS")
ALLOWED_HOSTS = (
    [h.strip() for h in _env_hosts.split(",") if h.strip()]
    if _env_hosts
    else [
        'condominio-env.eba-ibwb3pvj.us-east-1.elasticbeanstalk.com',
        'main.d2uzerihejwi44.amplifyapp.com',
        "*", "127.0.0.1", "localhost"
    ]
)

# ======================================
# APPS
# ======================================
INSTALLED_APPS = [
    # Core Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3ros
    "django_filters",
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",

    # Local
    "myapp.usuarios",
    "myapp.roles",
    "myapp.propiedades",
    "myapp.residentes",
    "myapp.finanzas",
    "myapp.comunicacion",
    "myapp.reservas",
    "myapp.seguridad",
    "myapp.mantenimiento",
    "myapp.push",
]

# ======================================
# MIDDLEWARE (CORS primero; WhiteNoise después de Security)
# ======================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # CORS debe ir arriba
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # servir estáticos en prod
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mysite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # Si quisieras plantillas globales: BASE_DIR / "templates"
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.debug",
            ],
        },
    },
]

WSGI_APPLICATION = "mysite.wsgi.application"

# ======================================
# DATABASE (desde .env; defaults útiles para dev)
# ======================================
DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("DB_NAME", "condominio"),
        "USER": os.getenv("DB_USER", "adminp1"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "OPTIONS": (
            {"sslmode": os.getenv("DB_SSLMODE")} if os.getenv("DB_SSLMODE") else {}
        ),
    }
}

# ======================================
# AUTH
# ======================================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
# Si usas usuario custom en myapp.usuarios, define esto ANTES de migrar:
#AUTH_USER_MODEL = "usuarios.Usuario"

# ======================================
# I18N / TZ
# ======================================
LANGUAGE_CODE = "es"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True

# ======================================
# STATIC & MEDIA
# ======================================
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ======================================
# CORS / CSRF
# ======================================
from corsheaders.defaults import default_headers, default_methods

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers)
CORS_ALLOW_METHODS = list(default_methods)

# En dev puedes habilitar todo con CORS_ALLOW_ALL_ORIGINS=true en .env
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "false").lower() == "true"

_env_cors = os.getenv("CORS_ALLOWED_ORIGINS")
if _env_cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _env_cors.split(",") if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.0.200:8000",
        "https://main.d2uzerihejwi44.amplifyapp.com",
    ]

# Busca esta parte al final de tu settings.py y déjala así:
_env_csrf = os.getenv("CSRF_TRUSTED_ORIGINS")
if _env_csrf:
    CSRF_TRUSTED_ORIGINS = [u.strip() for u in _env_csrf.split(",") if u.strip()]
else:
    # Agrega tu URL de Amplify por defecto aquí
    CSRF_TRUSTED_ORIGINS = [
        "https://main.d2uzerihejwi44.amplifyapp.com",
    ]
# ======================================
# DRF + SimpleJWT
# ======================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ======================================
# Email (Dev)
# ======================================
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@condominio.local")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# ======================================
# Logging básico
# ======================================
LOG_LEVEL = "DEBUG" if DEBUG else "INFO"
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
}

# ======================================
# Pagos: Merchant/Cuenta destino (para QR y futura pasarela)
# ======================================
PAYMENT_MERCHANT = {
    # Global por ahora; si luego guardas por condominio, léelo de DB.
    "nombre": os.getenv("PAY_MERCHANT_NAME", "Condominio X"),
    "banco": os.getenv("PAY_MERCHANT_BANK", "Banco Mercantil Santa Cruz"),
    "tipo_cuenta": os.getenv("PAY_MERCHANT_TIPO", "CA"),
    "numero_cuenta": os.getenv("PAY_MERCHANT_NUM", "123-4567890"),
    "moneda": os.getenv("PAY_MERCHANT_CCY", "BOB"),
    "ciudad": os.getenv("PAY_MERCHANT_CITY", "Santa Cruz"),
    "categoria": os.getenv("PAY_MERCHANT_CAT", "Servicios"),
    "merchant_id": os.getenv("PAY_MERCHANT_ID", ""),  # si luego te lo asigna el banco
}

# ======================================
BNB_CFG = {
    "ACCOUNT_ID": os.getenv("BNB_ACCOUNT_ID"),
    "AUTHORIZATION_ID": os.getenv("BNB_AUTHORIZATION_ID"),
    "AUTH_BASE": os.getenv("BNB_AUTH_BASE"),
    "QR_BASE": os.getenv("BNB_QR_BASE"),
    "ACCOUNT_BASE": os.getenv("BNB_ACCOUNT_BASE"),
    "ENTERPRISE_BASE": os.getenv("BNB_ENTERPRISE_BASE"),
    "TIMEOUT": int(os.getenv("BNB_TIMEOUT", "15")),
}
# ======================================

