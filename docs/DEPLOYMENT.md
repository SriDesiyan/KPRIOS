# KPYRIOS-ACPIA Deployment Guide

## 1. Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+
- (Optional for bare-metal) Python 3.11+ and Node.js 18+

---

## 2. Quickstart with Docker Compose (Single Command)

```bash
# 1. Clone repository
git clone https://github.com/keralapolice/kpyrios-acpia.git
cd kpyrios-acpia

# 2. Configure environment
cp .env.example .env

# 3. Build and launch services
docker-compose up --build -d

# 4. Check container health
docker-compose ps
```

The system will be accessible at:
- **Investigator UI:** `http://localhost` (or `http://localhost:5173` in local dev)
- **FastAPI Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## 3. Seeding the Demonstration Case

To seed the official demonstration case `CR-KP-ACPIA-2026-001` with synthetic fixtures:

```bash
# Within running backend container:
docker-compose exec backend python -m app.scripts.seed_demo_case

# Or locally during development:
cd backend
python -m app.scripts.seed_demo_case
```

---

## 4. Single Cloud VM Production Deployment (e.g. AWS EC2, GCP Compute, Azure VM)

### A. VM Configuration
- Minimum Spec: 2 vCPU, 4 GB RAM, 40 GB SSD (Ubuntu 22.04 LTS).
- Open inbound ports: `80` (HTTP), `443` (HTTPS), and `22` (SSH).

### B. Launch Production Stack
```bash
# Set production environment variables
export POSTGRES_USER=kpyrios_prod_admin
export POSTGRES_PASSWORD=$(openssl rand -hex 24)
export POSTGRES_DB=kpyrios_acpia_prod
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Start production compose
docker-compose -f docker-compose.prod.yml up -d --build
```

### C. TLS Termination (Let's Encrypt / Certbot)
Configure Nginx reverse proxy on the host VM or configure Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d forensic.cyberdome.kerala.gov.in
```
