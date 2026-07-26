const express = require('express');
const axios = require('axios');
const CheckIn = require('../models/CheckIn');
const Partnership = require('../models/Partnership');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getTodayStr, getDateNDaysAgo } = require('../utils/dateHelpers');

const router = express.Router();
router.use(requireAuth);

const NOTIFY_URL = process.env.NOTIFY_URL || 'http://notification-service:5001';

async function assertMembership(partnershipId, userId) {
  const partnership = await Partnership.findById(partnershipId);
  if (!partnership) return null;
  const isMember = [partnership.userA.toString(), partnership.userB.toString()].includes(userId);
  return isMember ? partnership : null;
}

// Best-effort notification - a notification-service outage should never
// block a check-in or a review from succeeding.
async function notifyPartner({ toUserId, partnershipId, type, message }) {
  try {
    await axios.post(`${NOTIFY_URL}/notify`, { toUserId, partnershipId, type, message }, { timeout: 4000 });
  } catch (err) {
    console.error('Notification dispatch failed (non-fatal):', err.message);
  }
}

// Create (or toggle off) a check-in for a given date, defaulting to today.
// Always created as "pending" - it does not count toward the streak until
// the partner confirms it. An optional base64 proof image can be attached.
router.post('/', async (req, res) => {
  try {
    const { partnershipId, date, proofImage } = req.body;
    const targetDate = date || getTodayStr();

    const partnership = await assertMembership(partnershipId, req.userId);
    if (!partnership) return res.status(403).json({ error: 'Not a member of this partnership' });

    const existing = await CheckIn.findOne({ partnershipId, userId: req.userId, date: targetDate });

    if (existing) {
      // Toggle off - undo today's check-in entirely.
      await existing.deleteOne();
      return res.json({ date: targetDate, status: null });
    }

    const checkin = await CheckIn.create({
      partnershipId,
      userId: req.userId,
      date: targetDate,
      status: 'pending',
      proofImage: proofImage || null
    });

    const partnerUserId = partnership.userA.toString() === req.userId ? partnership.userB : partnership.userA;
    const checkerUser = await User.findById(req.userId).select('name');

    // Fire-and-forget: tell the partner there's something to review.
    notifyPartner({
      toUserId: partnerUserId,
      partnershipId,
      type: 'confirmation_needed',
      message: `${checkerUser?.name || 'Your partner'} just checked in for "${partnership.goal}" and needs your confirmation.`
    });

    res.status(201).json({
      id: checkin._id,
      date: checkin.date,
      status: checkin.status,
      hasProof: Boolean(checkin.proofImage)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle check-in' });
  }
});

// History for a partnership + user, for calendar rendering.
// Returns status per date (NOT just a plain list) so the frontend can
// distinguish confirmed / pending / disputed days. Proof images are
// intentionally excluded here (hasProof boolean only) to keep this
// endpoint light - use /pending or /:checkinId to fetch a full image.
router.get('/', async (req, res) => {
  try {
    const { partnershipId, userId, days = 90 } = req.query;
    const targetUserId = userId || req.userId;

    const partnership = await assertMembership(partnershipId, req.userId);
    if (!partnership) return res.status(403).json({ error: 'Not a member of this partnership' });

    const since = getDateNDaysAgo(Number(days));
    const checkins = await CheckIn.find({
      partnershipId,
      userId: targetUserId,
      date: { $gte: since }
    }).select('date status proofImage -_id');

    res.json(checkins.map(c => ({
      date: c.date,
      status: c.status,
      hasProof: Boolean(c.proofImage)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load check-ins' });
  }
});

// Check-ins made by the OTHER partner that are awaiting this user's
// confirmation. Includes the full proof image, since this list is small
// and the whole point is to actually look at the evidence.
router.get('/pending', async (req, res) => {
  try {
    const { partnershipId } = req.query;
    const partnership = await assertMembership(partnershipId, req.userId);
    if (!partnership) return res.status(403).json({ error: 'Not a member of this partnership' });

    const partnerUserId = partnership.userA.toString() === req.userId ? partnership.userB : partnership.userA;

    const pending = await CheckIn.find({
      partnershipId,
      userId: partnerUserId,
      status: 'pending'
    }).sort({ date: -1 });

    res.json(pending.map(c => ({
      id: c._id,
      date: c.date,
      proofImage: c.proofImage,
      createdAt: c.createdAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load pending check-ins' });
  }
});

// Confirm or dispute a partner's check-in. Only the OTHER member of the
// partnership can review - you can never confirm your own check-in.
router.post('/:checkinId/review', async (req, res) => {
  try {
    const { action } = req.body; // "confirm" | "dispute"
    if (!['confirm', 'dispute'].includes(action)) {
      return res.status(400).json({ error: 'action must be "confirm" or "dispute"' });
    }

    const checkin = await CheckIn.findById(req.params.checkinId);
    if (!checkin) return res.status(404).json({ error: 'Check-in not found' });

    const partnership = await assertMembership(checkin.partnershipId, req.userId);
    if (!partnership) return res.status(403).json({ error: 'Not a member of this partnership' });

    if (checkin.userId.toString() === req.userId) {
      return res.status(403).json({ error: 'You cannot review your own check-in' });
    }

    checkin.status = action === 'confirm' ? 'confirmed' : 'disputed';
    checkin.reviewedBy = req.userId;
    checkin.reviewedAt = new Date();
    await checkin.save();

    const reviewerUser = await User.findById(req.userId).select('name');
    notifyPartner({
      toUserId: checkin.userId,
      partnershipId: checkin.partnershipId,
      type: action === 'confirm' ? 'checkin_confirmed' : 'checkin_disputed',
      message: action === 'confirm'
        ? `${reviewerUser?.name || 'Your partner'} confirmed your check-in for ${checkin.date}.`
        : `${reviewerUser?.name || 'Your partner'} disputed your check-in for ${checkin.date}.`
    });

    res.json({ id: checkin._id, status: checkin.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to review check-in' });
  }
});

module.exports = router;
