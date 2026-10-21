FROM python:3.12-slim

WORKDIR /app

# The workshop server uses the Python standard library only.
COPY portable/server.py portable/server.py
COPY portable/default-workspace.json portable/default-workspace.json
COPY webapp webapp
COPY public public

RUN mkdir -p /data

EXPOSE 8080

VOLUME ["/data"]

CMD ["python3", "portable/server.py", "--host", "0.0.0.0", "--port", "8080", "--data-dir", "/data"]
