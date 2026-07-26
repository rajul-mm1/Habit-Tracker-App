const express = require('express');
const Partnership = require('../models/Partnership');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { calculateStreaks } = require('../services/streakService');

const router = express.Router();
router.use(requireAuth);

// Create a partnership by inviting another user via email
router.post('/', async (req, res) => {
  try {
    const { partnerEmail, goal } = req.body;
    if (!partnerEmail || !goal) {
      return res.status(400).json({ error: 'partnerEmail and goal are required' });
    }

    const partner = await User.findOne({ email: partnerEmail.toLowerCase() });
    if (!partner) {
      return res.status(404).json({ error: 'No user found with that email' });
    }
    if (partner._id.toString() === req.userId) {
      return res.status(400).json({ error: 'You cannot partner with yourself' });
    }

    const partnership = await Partnership.create({
      userA: req.userId,
      userB: partner._id,
      goal
    });

    res.status(201).json(partnership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create partnership' });
  }
});

// List all partnerships the logged-in user belongs to
router.get('/', async (req, res) => {
  try {
    const partnerships = await Partnership.find({
      active: true,
      $or: [{ userA: req.userId }, { userB: req.userId }]
    }).populate('userA userB', 'name email');

    res.json(partnerships);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load partnerships' });
  }
});

// Get one partnership with both users' streaks
router.get('/:id', async (req, res) => {
  try {
    const partnership = await Partnership.findById(req.params.id).populate('userA userB', 'name email');
    if (!partnership) return res.status(404).json({ error: 'Partnership not found' });

    const isMember = [partnership.userA._id.toString(), partnership.userB._id.toString()].includes(req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member of this partnership' });

    const [streaksA, streaksB] = await Promise.all([
      calculateStreaks(partnership._id, partnership.userA._id),
      calculateStreaks(partnership._id, partnership.userB._id)
    ]);

    res.json({
      partnership,
      streaks: {
        [partnership.userA._id]: streaksA,
        [partnership.userB._id]: streaksB
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load partnership' });
  }
});

module.exports = router;
