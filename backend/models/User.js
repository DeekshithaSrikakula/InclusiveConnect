const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String },
  organizationId: { type: String, required: true, default: 'org_apex_mfg' },
  orgCode: { type: String, default: 'APEX-101' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  employeeId: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'EMPLOYEE'], default: 'EMPLOYEE' },
  department: { type: String, default: 'Operations' },
  designation: { type: String, default: 'Associate' },
  preferredLanguage: { type: String, enum: ['en', 'hi', 'te', 'ta'], default: 'en' },
  accessibilityNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
