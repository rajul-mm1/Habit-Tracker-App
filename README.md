# Habit Accountability Partner App

A full-stack habit-tracking app where two people pair up on a shared goal, check in daily, and keep each other accountable. If one partner goes quiet for a few days, the other gets notified so they can send a nudge.

Built as a hands-on project to demonstrate real-world Kubernetes patterns: multi-service orchestration, pod-to-pod communication, scheduled background jobs, and a CI/CD pipeline — not just a "hello world" deployment.

## Why this project

Most habit trackers are single-player. The interesting engineering problem here is the **accountability loop**: a scheduled job has to reason about two users' state, decide who needs a nudge, and hand off to a completely separate notification service — a good excuse to build a genuinely multi-service system instead of a single monolith.

## Architecture

```
                    ┌─────────────────┐
   Browser  ──────▶ │  Ingress        │
                    │  (single host)  │
                    └────────┬────────┘
                 ┌───────────┴───────────┐
                 ▼                       ▼
        ┌─────────────────┐    ┌──────────────────┐
        │  Frontend (React)│   │  Backend API      │
        │  served by nginx │   │  (Node/Express)   │
        └─────────────────┘    └─────────┬─────────┘
                                          │
                          ┌───────────────┼──────────────────┐
                          ▼               ▼                  ▼
                  ┌───────────────┐ ┌─────────────┐  ┌───────────────────┐
                  │   MongoDB     │ │  CronJob     │  │ Notification       │
                  │  (PVC-backed) │ │ (daily scan) │─▶│ Service (separate  │
                  └───────────────┘ └─────────────┘  │  pod, decoupled)    │
                                                       └───────────────────┘
```

**Four independently deployable services:**

| Service | Role |
|---|---|
| `frontend` | React SPA — dashboard, partner view, streak heatmaps |
| `backend` | Express API — auth, partnerships, check-ins, streak calculation |
| `notification-service` | Standalone microservice that dispatches nudges — decoupled so a notification-provider outage never blocks check-ins |
| `cron-checker` | Run-once script triggered by a Kubernetes CronJob; scans for partners who've missed 3+ days and hands off to the notification service |

## Tech stack

- **Frontend:** React, React Router, Axios — plain CSS (no framework) with responsive breakpoints for mobile and desktop
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
- **Infra:** Docker (multi-stage builds), Kubernetes (Deployments, Services, PVC, Secrets, Ingress, CronJob), GitHub Actions

## Anti-cheating: partner verification + proof photos

Self-reported habit trackers are easy to game — nothing stops someone from marking a habit "done" without doing it. To address this directly:

- **Every check-in starts as `pending`** and does not count toward the streak until the accountability partner reviews it
- **The partner can Confirm or Dispute** a check-in from a dedicated review panel
- **An optional proof photo** can be attached to a check-in for the partner to inspect before confirming
- **Missed-day detection only counts confirmed check-ins** — a pending, unconfirmed check-in doesn't reset the "days since last activity" clock

This turns the "accountability partner" concept from a UI label into an actual verification mechanism.

## Kubernetes concepts demonstrated

- **CronJob** for the daily missed-check-in scan — a scheduling pattern most beginner projects never touch
- **Pod-to-pod communication** via internal Service DNS (backend → notification-service)
- **PersistentVolumeClaim** for MongoDB so data survives pod restarts
- **Secrets** for credentials, kept out of image and out of git
- **Ingress** for single-hostname routing between frontend and backend, avoiding CORS and cluster-internal-DNS issues in the browser
- **Runtime environment injection** for the frontend container (see `frontend/docker-entrypoint.sh`) — the same built image works across dev/staging/prod without a rebuild, unlike typical React apps that bake `REACT_APP_*` vars in at build time
- **Liveness/readiness probes** and resource requests/limits on every Deployment
- **Prometheus & Grafana** (via `kube-prometheus-stack`) - every service exposes `/metrics`, each Helm chart ships a `ServiceMonitor` + `PrometheusRule`, and `infra/grafana-dashboards` auto-provisions a dashboard covering request rate, error rate, p95 latency, and pod restarts

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci-cd.yaml`) runs on every push/PR:
1. Installs dependencies and sanity-checks each Node.js service
2. On merge to `main`, builds and pushes Docker images for all four services, tagged with both `latest` and the commit SHA
3. Includes a commented-out deploy stage for rolling the new images out to a live cluster via `kubectl`

## Project structure

```
.
├── services/
│   ├── backend/                # Express API + its Helm chart (services/backend/chart)
│   ├── frontend/                # React app + nginx + runtime env injection + its Helm chart
│   ├── notification-service/    # Standalone notification microservice + its Helm chart
│   └── cron-checker/             # Script run by the Kubernetes CronJob + its Helm chart
├── infra/
│   ├── mongodb/chart/            # PVC-backed MongoDB StatefulSet (Helm chart)
│   └── grafana-dashboards/chart/ # Grafana dashboard ConfigMap, auto-imported by kube-prometheus-stack
├── argocd/                       # AppProject + one Application per chart above
├── terraform/                    # VPC, EKS (Auto Mode), ECR, ArgoCD, ingress-nginx, kube-prometheus-stack
├── docker-compose.yml             # Local dev - all services in one command
└── .github/workflows/              # CI/CD pipeline
```

Each service (and `infra/mongodb`, `infra/grafana-dashboards`) is deployed as its own Helm chart via its own ArgoCD `Application` in `argocd/applications/` - there is no single `k8s/` manifests directory.

## Running it locally

The fastest way to try the whole stack is Docker Compose:

```bash
docker compose up --build
```

Then visit `http://localhost:3000`.

For Kubernetes deployment steps, manifest ordering, and required secrets, see the setup guide referenced in this repo's contribution docs (kept out of version control since it contains environment-specific values).

