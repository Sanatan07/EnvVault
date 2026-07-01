from pathlib import Path

# pyrefly: ignore [missing-import]
import dj_database_url
# pyrefly: ignore [missing-import]
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = ["*"] if DEBUG else config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "secrets_app",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "secrets_app.authentication.ServiceAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "utils.pagination.StandardResultsPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "EXCEPTION_HANDLER": "utils.exceptions.custom_exception_handler",
}

REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/1")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "secrets",
    }
}

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

INTERNAL_SERVICE_TOKEN = config("INTERNAL_SERVICE_TOKEN", default="dev-internal-token")
AUTH_SERVICE_URL = config("AUTH_SERVICE_URL", default="http://localhost:8001")
AUDIT_SERVICE_URL = config("AUDIT_SERVICE_URL", default="http://localhost:8003")
BILLING_SERVICE_URL = config("BILLING_SERVICE_URL", default="http://localhost:8004")

ORG_KEY_DEFAULT = config("ORG_KEY_DEFAULT", default="")
AWS_KMS_KEY_ARN = config("AWS_KMS_KEY_ARN", default="")

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000",
).split(",")
