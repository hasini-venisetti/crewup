const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'application_received',   // project owner gets this
        'application_accepted',   // applicant gets this
        'application_declined',   // applicant gets this
        'role_filled',            // team gets this when a role is marked filled
        'new_message',
        'follow_request',         // recipient gets this when someone sends a follow request
        'follow_accepted',        // requester gets this when their request is accepted
        'project_invite',           // user is invited to join a project
        'message_request',          // user wants to start a chat
        'message_request_accepted', // message request was accepted
        'mentorship_request',       // user wants mentorship
        'booking_requested',        // mentor gets this when a session is booked
        'booking_confirmed',        // mentee gets this when mentor confirms
        'booking_cancelled',        // either party gets this on cancel
        'booking_completed',        // mentee gets this when session is marked done
        'booking_message',          // new chat message on a booking
        'contest_announcement',     // admin announces a contest
        'contest_submission',       // contest submission approved / rejected
        'platform_update',          // admin broadcasts a platform update
        'general',                  // generic project notifications (member removed, member left)
        'report_submitted',         // confirmation back to the reporter
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: '' },  // frontend route to navigate to
    data:    { type: mongoose.Schema.Types.Mixed, default: {} }, // extra metadata (e.g. requestId)
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

// Push new notifications to the recipient's socket room in real-time
notificationSchema.post('save', function (doc) {
  try {
    const io = global._io;
    if (io) io.to(`user:${doc.recipient}`).emit('newNotification', doc.toObject());
  } catch (_) {}
});

module.exports = mongoose.model('Notification', notificationSchema);
