const Partnership = require('../models/Partnership');
const CheckIn = require('../models/CheckIn');
const { getTodayStr } = require('../utils/dateHelpers');

const MISS_THRESHOLD = 3;

async function findMissedCheckins() {
  const activePartnerships = await Partnership.find({ active: true });
  const results = [];

  for (const partnership of activePartnerships) {
    const users = [partnership.userA, partnership.userB];

    for (const userId of users) {
      const missedDays = await countRecentMissedDays(partnership._id, userId);

      if (missedDays >= MISS_THRESHOLD) {
        const partnerUserId = users.find(u => u.toString() !== userId.toString());

        results.push({
          partnershipId: partnership._id,
          missedUserId: userId,   // who is slacking
          partnerUserId,          // who should be notified to nudge them
          missedDays
        });
      }
    }
  }

  return results;
}

// Days since this user's most recent CONFIRMED check-in for this
// partnership. A pending (not-yet-reviewed-by-partner) check-in doesn't
// reset the missed-day clock - only a confirmed one proves real activity.
async function countRecentMissedDays(partnershipId, userId) {
  const lastCheckin = await CheckIn.findOne({ partnershipId, userId, status: 'confirmed' })
    .sort({ date: -1 })
    .select('date -_id');

  if (!lastCheckin) {
    // Never checked in — cap at threshold so brand-new partnerships don't
    // immediately look like a 999-day miss.
    return MISS_THRESHOLD;
  }

  const lastDate = new Date(lastCheckin.date);
  const today = new Date(getTodayStr());
  return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
}

module.exports = { findMissedCheckins, MISS_THRESHOLD };
