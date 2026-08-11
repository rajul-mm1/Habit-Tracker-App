require('dotenv').config();
const express = require('express');
const promClient = require('prom-client');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Prometheus metrics setup ───────────────────────────────────────────────
// Mirrors services/backend/src/server.js so both services expose the same
// shape of metrics for the shared Grafana dashboards / alert rules.
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Notifications dispatched, labelled by type (confirmation_needed,
// checkin_confirmed, checkin_disputed, missed_checkin) - lets Grafana show
// nudge volume without parsing logs.
const notificationsSent = new promClient.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications dispatched, by type',
  labelNames: ['type'],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
});
// ──────────────────────────────────────────────────────────────────────────

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

// Prometheus scrape endpoint — consumed by the ServiceMonitor in the Helm chart
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Receives a request to notify a user. Decoupled from the main API so an
// email/push provider outage never blocks check-ins or streak reads.
app.post('/notify', async (req, res) => {
  try {
    const { toUserId, toEmail, partnershipId, type, message } = req.body;

    if (!toUserId && !toEmail) {
      return res.status(400).json({ error: 'toUserId or toEmail is required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    await sendNotification({ toUserId, toEmail, partnershipId, type, message });
    notificationsSent.inc({ type: type || 'unknown' });

    res.json({ status: 'sent', toUserId, toEmail, type });
  } catch (err) {
    console.error('Failed to send notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// -----------------------------------------------------------------------
// Provider integration point. Currently logs to stdout so the whole system
// is testable/demoable without a real email account. Swap the body of this
// function for a real provider (Resend, SendGrid, etc.) when you're ready.
// -----------------------------------------------------------------------
async function sendNotification({ toUserId, toEmail, partnershipId, type, message }) {
  console.log('--- NOTIFICATION ---');
  console.log(`To: ${toEmail || toUserId}`);
  console.log(`Type: ${type}`);
  console.log(`Partnership: ${partnershipId}`);
  console.log(`Message: ${message}`);
  console.log('--------------------');

  // Example real integration (uncomment and configure to go live):
  //
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Habit Tracker <notifications@yourdomain.com>',
  //   to: toEmail,
  //   subject: 'Your accountability partner needs a nudge!',
  //   text: message
  // });
}

app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
});
 
 
 
 
 
 
 
