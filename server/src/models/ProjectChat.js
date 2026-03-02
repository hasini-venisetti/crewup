const mongoose = require('mongoose');

/**
 * ProjectChat — group chat room auto-created when a project's first
 * member is accepted. All accepted team members are added as members.
 */
const projectChatSchema = new mongoose.Schema(
  {
    project: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Project',
      required: true,
      unique:   true,   // one chat room per project
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectChat', projectChatSchema);
