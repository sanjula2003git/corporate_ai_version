# =====================================================================
# Dockerfile — the "recipe" that packages the FastAPI backend into a
# portable container image. Build once, run identically anywhere
# (your laptop, GCP Cloud Run, AWS, a teammate's machine).
#
# TEACHING FLOW:
#   docker build -t corporate-ai-backend .      # bake the image (the box)
#   docker run -p 8080:8080 corporate-ai-backend # run a container from it
#   open http://localhost:8080/docs              # it works — in a box!
# =====================================================================

# 1) BASE IMAGE — start from an official, slim Python. The image brings
#    its OWN Python, so the host machine's Python version doesn't matter.
FROM python:3.12-slim

# 2) ENV — sensible defaults for running Python in a container:
#    no .pyc clutter, and unbuffered logs so output shows up live in
#    Cloud Run's log viewer.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3) WORKDIR — the folder inside the box where our app will live.
WORKDIR /app

# 4) DEPENDENCIES FIRST — copy ONLY requirements.txt, then install.
#    Docker caches this layer, so re-builds are fast unless deps change.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5) APP CODE — copy the rest of the backend into the box.
COPY . .

# 6) PORT — Cloud Run sends web traffic to the port in $PORT (default 8080).
#    We must listen on it. EXPOSE documents the port for humans/tools.
ENV PORT=8080
EXPOSE 8080

# 7) START COMMAND — launch the API server. Shell form lets $PORT expand
#    at runtime (Cloud Run overrides it). 0.0.0.0 = listen on all interfaces
#    (required inside a container; 127.0.0.1 would be unreachable from outside).
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
