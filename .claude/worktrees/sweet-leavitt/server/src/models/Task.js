const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title:    { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status:   { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate:  { type: Date, default: null },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
