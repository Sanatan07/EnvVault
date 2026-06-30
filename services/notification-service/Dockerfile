FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

FROM base AS development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8005"]

FROM base AS worker
CMD ["celery", "-A", "config", "worker", "-l", "info", "--concurrency=2"]

FROM base AS production
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8005", "--workers", "2"]
