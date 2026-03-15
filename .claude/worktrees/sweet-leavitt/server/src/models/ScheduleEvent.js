const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleEventSchema = new Schema({
  project:   { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title:     { type: String, required: true, trim: true, maxlength: 200 },
  date:      { type: Date, required: true },
  startTime: { type: String, default: '' },
  endTime:   { type: String, default: '' },
  location:  { type: String, default: '', maxlength: 300 },
  notes:     { type: String, default: '', maxlength: 1000 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ScheduleEvent', scheduleEventSchema);
