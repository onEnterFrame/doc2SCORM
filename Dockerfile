# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app

# Copy backend compiled output
COPY --from=backend-build /app/backend/dist/ ./backend/dist/

# Copy non-TS templates (tsc doesn't copy these)
COPY --from=backend-build /app/backend/src/templates/ ./backend/dist/templates/

# Install production deps only
COPY backend/package.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev
WORKDIR /app

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist/ ./frontend/dist/

# Cloud Run injects PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "backend/dist/index.js"]
