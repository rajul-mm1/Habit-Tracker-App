const mongoose = require('mongoose');

// One document per user per day they completed the habit.
// Absence of a document for a given date = missed day.
//
// Verification model (Option 1 + Option 2 from the anti-cheating discussion):
// - Every check-in starts as "pending" until the ACCOUNTABILITY PARTNER
//   confirms or disputes it. Streak calculations only count "confirmed"
//   check-ins - see services/streakService.js.
// - proofImage is optional: a base64 data URI (e.g. "data:image/jpeg;base64,...")
//   attached by the checker-in as evidence for their partner to review.
//   Stored inline in Mongo to avoid needing a separate object-storage
//   service (S3/Minio) for a project this size. For a larger-scale version,
//   swap this for an object storage URL instead of inline base64.
const checkInSchema = new mongoose.Schema({
  partnershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partnership', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'disputed'],
    default: 'pending'
  },
  proofImage: { type: String, default: null }, // base64 data URI, optional

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

checkInSchema.index({ partnershipId: 1, userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
