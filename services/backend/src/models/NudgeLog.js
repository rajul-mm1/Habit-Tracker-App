const mongoose = require('mongoose');

const nudgeLogSchema = new mongoose.Schema({
  partnershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partnership', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  missedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  missedDays: { type: Number, required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NudgeLog', nudgeLogSchema);
