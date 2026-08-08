# Phase 16: Deployment & Operations

## 1. Production Architecture Overview

The system is deployed using Docker containers on a cloud provider (e.g., AWS EC2, DigitalOcean, or Render/Railway for managed PaaS).

- **Frontend:** Built via Vite, served by Nginx.
- **Backend API:** Node.js container.
- **Queue Workers:** Node.js + Playwright container (requires specific OS dependencies for browsers).
- **Database:** Managed MongoDB Atlas (recommended) or Dockerized MongoDB.
- **Cache/Queue:** Managed Redis or Dockerized Redis.

## 2. Environment Variables (`.env.example`)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/career_copilot
REDIS_URL=redis://localhost:6379

# AI & Third Party
OPENROUTER_API_KEY=sk-or-v1-...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Security
JWT_SECRET=super_secure_random_string
CORS_ORIGIN=https://app.careercopilot.com
```

## 3. Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./client/dist:/usr/share/nginx/html
    depends_on:
      - api

  api:
    build: 
      context: ./server
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file: .env
    ports:
      - "3000:3000"

  worker:
    build:
      context: ./server
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
    env_file: .env
    # Worker runs headless Playwright, needs IPC and shm tweaks
    shm_size: '1gb'
```

## 4. CI/CD (GitHub Actions)

A standard `.github/workflows/deploy.yml` pipeline:
1. **Trigger:** Push to `main`.
2. **Lint & Test:** Run ESLint, Prettier, and Jest tests.
3. **Build:** Run `npm run build` for frontend and backend.
4. **Dockerize:** Build and push Docker images to GHCR (GitHub Container Registry).
5. **Deploy:** SSH into the production server, pull latest images, and run `docker-compose up -d`.

## 5. Security & Monitoring

- **Security:**
  - Helmet.js for Express headers.
  - Rate limiting on API endpoints to prevent abuse.
  - JWT for secure authentication.
- **Logging:**
  - Winston/Pino logger pushing to Datadog or ELK stack.
- **Monitoring:**
  - PM2 (if not using Docker) or Prometheus/Grafana.
  - Application insights (uptime, memory usage, queue length).

## 6. Deployment Guide
1. Provision a Linux server (Ubuntu 22.04).
2. Install Docker and Docker Compose.
3. Clone repository and setup `.env`.
4. Run `npm run build` locally or let CI handle it.
5. Execute `docker-compose up -d --build`.
6. Configure SSL via Certbot/Let's Encrypt for Nginx.
