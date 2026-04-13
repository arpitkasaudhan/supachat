# SupaChat — Conversational Analytics

A full-stack conversational analytics app that lets you query a **blog analytics PostgreSQL database** in natural language. Built with Next.js, FastAPI, Supabase, and the Grok AI API (MCP tool-use pattern).

> Built as part of the analytos.ai AI DevOps Engineer task. Live at http://13.233.224.220  
> AI tools used: **Claude Code** (code generation, scaffolding, DevOps config), **Groq API / LLaMA 3.3-70b** (NL→SQL via MCP tool-use pattern, DevOps Agent)

---

## Architecture

```
Browser
  └─> Nginx :80
        ├─> /          → Next.js frontend :3000
        └─> /api       → FastAPI backend  :8000
                              └─> Claude API (NL→SQL)
                              └─> Supabase PostgreSQL
```

**Monitoring stack** (separate compose overlay):
```
Prometheus → scrapes FastAPI /metrics, node-exporter, cAdvisor
Grafana    → dashboards: HTTP latency, CPU/memory, container health
Loki       → aggregates all container logs via Promtail
```

---

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14, React, Tailwind CSS, Recharts |
| Backend    | FastAPI, uvicorn, psycopg2        |
| AI / MCP   | Claude claude-sonnet-4-6 with tool_use (MCP pattern) |
| Database   | Supabase PostgreSQL               |
| Proxy      | Nginx (gzip, caching, WebSocket)  |
| Container  | Docker + docker-compose           |
| CI/CD      | GitHub Actions → EC2 SSH deploy   |
| Monitoring | Prometheus, Grafana, Loki, Promtail, cAdvisor |
| Bonus      | DevOps Agent (`/api/devops/*`)    |

---

## Local Setup

### 1. Prerequisites

- Docker + Docker Compose
- Node.js 20+ (frontend dev only)
- Python 3.12+ (backend dev only)

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL and ANTHROPIC_API_KEY
```

### 3. Seed the database

In **Supabase SQL Editor**, run:

```sql
-- paste contents of database/seed.sql
```

### 4. Run with Docker Compose

```bash
docker compose up -d
```

App is at **http://localhost**

### 5. Run monitoring stack

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

| Service    | URL                        |
|------------|---------------------------|
| App        | http://localhost           |
| Grafana    | http://localhost:3001  (admin / changeme123) |
| Prometheus | http://localhost:9090      |

---

## Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

---

## Deployment (AWS EC2)

### One-time server setup

```bash
# On EC2 (Ubuntu 22.04)
export REPO_URL=https://github.com/YOUR_USERNAME/supachat.git
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/supachat/main/scripts/setup_ec2.sh | bash
```

Then edit `/opt/supachat/.env` and:

```bash
cd /opt/supachat
docker compose up -d
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### CI/CD — GitHub Actions

Every push to `main`:
1. Builds Docker images → pushes to GHCR
2. SSH into EC2 → pulls new images
3. Rolling restart (backend → health check → frontend → nginx)
4. Verifies `/health` endpoint before marking deploy complete

**GitHub Secrets required:**

| Secret                  | Value                                   |
|-------------------------|-----------------------------------------|
| `EC2_HOST`              | EC2 public IP or hostname               |
| `EC2_USER`              | `ubuntu`                                |
| `EC2_SSH_KEY`           | Private SSH key (PEM contents)          |
| `NEXT_PUBLIC_API_URL`   | `http://<EC2-IP>`                       |

---

## API Reference

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/health`             | Backend + Supabase health check    |
| POST   | `/api/query`          | NL query → SQL → formatted result  |
| GET    | `/api/schema`         | Database schema info               |
| POST   | `/api/devops/analyze-logs` | AI log summarization + RCA    |
| GET    | `/api/devops/health-diagnostics` | Container health AI summary |
| POST   | `/api/devops/explain-failure`    | CI/CD failure explanation   |
| GET    | `/metrics`            | Prometheus metrics                 |

### Example query request

```json
POST /api/query
{
  "query": "Show top trending topics in last 30 days",
  "history": []
}
```

```json
{
  "message": "Here are the results. Found 5 records.",
  "sql": "SELECT a.topic, COUNT(*) AS views FROM article_views av JOIN articles a ...",
  "columns": ["topic", "views"],
  "rows": [{"topic": "AI", "views": 142}, ...],
  "chart": {"type": "bar", "x_key": "topic", "y_keys": ["views"]},
  "row_count": 5,
  "latency_ms": 820
}
```

---

## Monitoring Dashboards

Import `monitoring/grafana/dashboards/supachat.json` in Grafana or it's auto-provisioned.

Panels:
- **HTTP Request Rate** — requests/sec by route
- **Request Latency p95** — 95th percentile response time
- **Container CPU/Memory** — per-container resource usage
- **Application Logs** — live log stream via Loki
- **Error Logs** — filtered ERROR level logs

---

## DevOps Agent (Bonus)

The backend exposes `/api/devops/*` endpoints powered by Claude for:

- **Log analysis + RCA** — paste failed logs, get root cause + fix steps
- **Health diagnostics** — AI summary of container health
- **CI/CD failure explanation** — plain-English failure explanations

---

## AI Tools Used

- **Claude Code** — used to scaffold and generate the entire project: frontend, backend, Docker, Nginx, CI/CD pipeline, and monitoring configs
- **Groq API (LLaMA 3.3-70b)** — powers NL→SQL translation via MCP tool-use pattern, and the DevOps Agent (log analysis, RCA, CI/CD failure explanation)
