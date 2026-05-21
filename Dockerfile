FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
ENV NEXT_OUTPUT=export
ENV NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_WS_URL=
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY log.csv ./log.csv
COPY --from=frontend /app/frontend/out ./frontend-out

ENV CSV_PATH=/app/log.csv
ENV FRONTEND_DIST=/app/frontend-out

EXPOSE 8000
CMD ["sh", "-c", "cd /app/backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
