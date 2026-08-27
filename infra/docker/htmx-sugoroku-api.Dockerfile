FROM python:3.13-slim
WORKDIR /app
RUN pip install --no-cache-dir uv

COPY python_backend python_backend
COPY apps/htmx_sugoroku apps/htmx_sugoroku
COPY cdn_resources cdn_resources

WORKDIR /app/python_backend
RUN uv sync --package htmx_sugoroku_server

EXPOSE 5000
CMD ["uv", "run", "--package", "htmx_sugoroku_server", "gunicorn", "-b", "0.0.0.0:5000", "htmx_sugoroku_server.main:app"]
