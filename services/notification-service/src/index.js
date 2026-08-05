require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
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
 
