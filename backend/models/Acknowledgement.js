const mongoose = require('mongoose');

const acknowledgementSchema = new mongoose.Schema({
  _id: { type: String },
  organizationId: { type: String, required: true, default: 'org_apex_mfg' },
  announcementId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  employeeId: { type: String, required: true },
  department: { type: String, default: 'Operations' },
  languageViewed: { type: String, enum: ['en', 'hi', 'te', 'ta'], default: 'en' },
  modeViewed: { type: String, enum: ['simplified', 'original', 'side-by-side'], default: 'simplified' },
  usedAudio: { type: Boolean, default: false },
  acknowledgedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACKNOWLEDGED'], default: 'ACKNOWLEDGED' }
});

acknowledgementSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Acknowledgement', acknowledgementSchema);
