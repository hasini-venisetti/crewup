const mongoose = require('mongoose');

const prizeClaimSchema = new mongoose.Schema({
  contest:     { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:    { type: String, required: true },
  phone:       { type: String, required: true },
  upiId:       { type: String, required: true },
  bankDetails: { type: String, default: '' },
  notes:       { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'processed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('PrizeClaim', prizeClaimSchema);
