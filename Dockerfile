# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-9fa9c7b57012 \
    GOOGLE_CLOUD_LOCATION=us-central1 \
    GOOGLE_GENAI_USE_VERTEXAI=True \
    PORT=8080

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agent/ ./agent/
COPY api/ ./api/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["sh", "-c", "exec python3 -m uvicorn api.server:app --host 0.0.0.0 --port ${PORT}"]
