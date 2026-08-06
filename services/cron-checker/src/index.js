require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend-service:5000';
const NOTIFY_URL = process.env.NOTIFY_URL || 'http://notification-service:5001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

async function run() {
  console.log(`[${new Date().toISOString()}] Starting missed check-in scan...`);

  const { data: missed } = await axios.get(`${BACKEND_URL}/api/internal/missed-checkins`, {
    headers: { 'x-internal-secret': INTERNAL_SECRET }
  });

  console.log(`Found ${missed.length} partner(s) who need a nudge sent.`);

  for (const item of missed) {
    try {
      await axios.post(`${NOTIFY_URL}/notify`, {
        toUserId: item.partnerUserId,
        partnershipId: item.partnershipId,
        type: 'missed_checkin',
        message: `Your accountability partner has missed ${item.missedDays} day(s) in a row. Send them a nudge!`
      });

      await axios.post(
        `${BACKEND_URL}/api/internal/nudge-log`,
        {
          partnershipId: item.partnershipId,
          toUserId: item.partnerUserId,
          missedUserId: item.missedUserId,
          missedDays: item.missedDays
        },
        { headers: { 'x-internal-secret': INTERNAL_SECRET } }
      );

      console.log(`Notified user ${item.partnerUserId} about partner ${item.missedUserId} (${item.missedDays} days missed).`);
    } catch (err) {
      // Don't let one failed notification stop the rest of the batch.
      console.error(`Failed to notify for partnership ${item.partnershipId}:`, err.message);
    }
  }

  console.log('Missed check-in scan complete.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cron checker failed:', err.message);
    process.exit(1);
  });
 
 
 
 
 
 
