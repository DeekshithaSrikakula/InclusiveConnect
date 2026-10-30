const mongoose = require('mongoose');

const translationSubSchema = new mongoose.Schema({
  title: { type: String, required: true },
  simplifiedContent: { type: String, required: true },
  originalTranslated: { type: String, default: '' }
}, { _id: false });

const announcementSchema = new mongoose.Schema({
  _id: { type: String },
  organizationId: { type: String, required: true, default: 'org_apex_mfg' },
  title: { type: String, required: true },
  category: {
    type: String,
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Normal', 'Urgent'],
    default: 'Normal'
  },
  targetAudience: {
    type: String,
    default: 'All Employees'
  },
  originalContent: { type: String, required: true },
  simplifiedContent: { type: String, required: true },
  keyActionRequired: { type: String, default: '' },
  translations: {
    hi: { type: translationSubSchema },
    te: { type: translationSubSchema },
    ta: { type: translationSubSchema }
  },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: 'Administrator' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
