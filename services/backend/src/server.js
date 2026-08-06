require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const promClient = require('prom-client');

const authRoutes = require('./routes/auth');
const partnershipRoutes = require('./routes/partnerships');
const checkinRoutes = require('./routes/checkins');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Prometheus metrics setup ───────────────────────────────────────────────
// Collect default Node.js metrics (event loop lag, heap, GC, etc.)
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// HTTP request duration histogram — labelled by method, route, status code
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Total HTTP requests counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Middleware: start timer and track active connections on every request
app.use((req, res, next) => {
  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();
  });

  next();
});
// ──────────────────────────────────────────────────────────────────────────

app.use(cors());
// Raised from the default 100kb since check-ins can include a base64
// proof image (see models/CheckIn.js). 6mb comfortably covers a compressed
// photo while still guarding against abusive payloads.
app.use(express.json({ limit: '6mb' }));

// Liveness/readiness target for Kubernetes probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

// Prometheus scrape endpoint — consumed by the ServiceMonitor in the Helm chart
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/internal', internalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Backend API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
 
 
 
 
 
