const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  orgCode: { type: String, required: true, unique: true },
  industry: {
    type: String,
    default: 'General Enterprise'
  },
  departments: {
    type: [String],
    default: ['Operations', 'HR', 'Administration', 'General']
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', organizationSchema);
