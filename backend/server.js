require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const partnershipRoutes = require('./routes/partnerships');
const checkinRoutes = require('./routes/checkins');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Raised from the default 100kb since check-ins can include a base64
// proof image (see models/CheckIn.js). 6mb comfortably covers a compressed
// photo while still guarding against abusive payloads.
app.use(express.json({ limit: '6mb' }));

// Liveness/readiness target for Kubernetes probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
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
