const express = require('express');
const { requireInternalSecret } = require('../middleware/auth');
const { findMissedCheckins } = require('../services/missedCheckinService');
const NudgeLog = require('../models/NudgeLog');

const router = express.Router();

// Called by the CronJob once daily. Never exposed to the frontend.
router.get('/missed-checkins', requireInternalSecret, async (req, res) => {
  try {
    const missed = await findMissedCheckins();
    res.json(missed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute missed check-ins' });
  }
});

// Called by the CronJob after it successfully notifies someone, purely for
// an auditable history of nudges sent.
router.post('/nudge-log', requireInternalSecret, async (req, res) => {
  try {
    const { partnershipId, toUserId, missedUserId, missedDays } = req.body;
    const log = await NudgeLog.create({ partnershipId, toUserId, missedUserId, missedDays });
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record nudge log' });
  }
});

module.exports = router;
