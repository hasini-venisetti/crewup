const mongoose = require('mongoose');

// Activity types:
// - project_created   : user created a project
// - film_uploaded     : user uploaded a film
// - project_joined    : user joined a project (accepted application)
// - role_filled       : a role was filled on a project
// - user_followed     : user A followed user B
// - contest_entered   : user submitted a film to contest
// - review_received   : user received a review/rating

const activitySchema = new mongoose.Schema(
  {
    // Who did the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'project_created',
        'film_uploaded',
        'project_joined',
        'role_filled',
        'user_followed',
        'contest_entered',
        'review_received',
      ],
      required: true,
    },

    // Human-readable description (pre-built for fast feed rendering)
    title: { type: String, required: true },

    // Optional extra detail
    body: { type: String, default: '' },

    // Deep link on client (e.g. /projects/:id, /profile/:id)
    link: { type: String, default: '' },

    // Optional referenced docs
    projectRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    userRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null },
  },
  { timestamps: true }
);

// TTL index — auto-delete activities older than 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Activity', activitySchema);
