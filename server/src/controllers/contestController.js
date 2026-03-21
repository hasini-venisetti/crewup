const Contest            = require('../models/Contest');
const User               = require('../models/User');
const Notification       = require('../models/Notification');
const ContestSubmission  = require('../models/ContestSubmission');
const Project            = require('../models/Project');

// GET /api/contests
const getContests = async (req, res, next) => {
  try {
    const contests = await Contest.find().populate('createdBy', 'name username').populate('winners.user', 'name username profileImage').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: contests });
  } catch (e) { next(e); }
};

// GET /api/contests/:id
const getContest = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('winners.user', 'name username profileImage')
      .lean();
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    res.json({ success: true, data: contest });
  } catch (e) { next(e); }
};

// POST /api/contests  (admin)
const createContest = async (req, res, next) => {
  try {
    const { title, description, prizeAmount, prizeDescription, submissionDeadline } = req.body;
    const contest = await Contest.create({ title, description, prizeAmount, prizeDescription, submissionDeadline, createdBy: req.user._id });

    // Notify all users
    const users = await User.find({ isSuspended: false }).select('_id').lean();
    await Notification.insertMany(
      users.map((u) => ({
        recipient: u._id, sender: req.user._id, type: 'contest_announcement',
        title: `🏆 New Contest: ${title}`,
        message: `A new contest has been announced. Prize: ${prizeDescription || `$${prizeAmount}`}. Deadline: ${new Date(submissionDeadline).toLocaleDateString()}.`,
        link: '/films',
      })),
      { ordered: false }
    );

    res.status(201).json({ success: true, data: contest });
  } catch (e) { next(e); }
};

// PUT /api/contests/:id  (admin)
const updateContest = async (req, res, next) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    res.json({ success: true, data: contest });
  } catch (e) { next(e); }
};

// PATCH /api/contests/:id/end  (admin)
const endContest = async (req, res, next) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, { status: 'ended' }, { new: true });
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    res.json({ success: true, data: contest });
  } catch (e) { next(e); }
};

// PATCH /api/contests/:id/winners  (admin)
const setWinners = async (req, res, next) => {
  try {
    const { winners } = req.body;  // [{ userId, placement, note }]
    if (!Array.isArray(winners)) return res.status(400).json({ success: false, message: 'winners must be an array' });

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    contest.winners = winners.map((w) => ({ user: w.userId, placement: w.placement, note: w.note || '' }));
    contest.status  = 'ended';
    await contest.save();

    // Notify winners + their full team
    for (const w of winners) {
      // 1. Notify the winner directly
      await Notification.create({
        recipient: w.userId, sender: req.user._id, type: 'contest_announcement',
        title: `🏆 You placed #${w.placement} in "${contest.title}"!`,
        message: w.note || `Congratulations on your placement in the contest!`,
        link: '/films',
      });

      // 2. Find the submission to get the linked project
      const submission = await ContestSubmission.findOne({ contest: contest._id, submittedBy: w.userId });
      if (submission?.project) {
        const project = await Project.findById(submission.project).populate('teamMembers.user', '_id');

        if (project) {
          // Collect all team member IDs (excluding the winner who already got notified)
          const teamMemberIds = project.teamMembers
            .map((m) => m.user?._id?.toString())
            .filter((id) => id && id !== w.userId.toString());

          // 3. Notify each team member
          for (const memberId of teamMemberIds) {
            await Notification.create({
              recipient: memberId, sender: req.user._id, type: 'contest_announcement',
              title: `🏆 Your team won #${w.placement} in "${contest.title}"!`,
              message: `Your project "${project.title}" has been announced as a winner! Congratulations to the whole team.`,
              link: '/films',
            });
          }

          // 4. Special payment notification to the project owner (createdBy)
          const ownerId = project.createdBy?.toString();
          if (ownerId) {
            await Notification.create({
              recipient: ownerId, sender: req.user._id, type: 'contest_announcement',
              title: `💰 Submit Your Payment Details — "${contest.title}"`,
              message: `Congratulations! Your team placed #${w.placement}. Click here to securely submit your payment details (phone, UPI ID, bank info) to receive your prize.`,
              link: `/prize-claim/${contest._id}`,
            });
          }
        }
      }
    }

    await contest.populate('winners.user', 'name username profileImage');
    res.json({ success: true, data: contest });
  } catch (e) { next(e); }
};

// DELETE /api/contests/:id  (admin)
const deleteContest = async (req, res, next) => {
  try {
    await Contest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Contest deleted' });
  } catch (e) { next(e); }
};

// POST /api/contests/:id/prize-claim  (winner submits payment details)
const submitPrizeClaim = async (req, res, next) => {
  try {
    const { fullName, phone, upiId, bankDetails, notes } = req.body;
    if (!fullName || !phone || !upiId) {
      return res.status(400).json({ success: false, message: 'Full name, phone, and UPI ID are required.' });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    // Check the user is actually a winner
    const isWinner = contest.winners?.some((w) => w.user?.toString() === req.user._id.toString());
    if (!isWinner) return res.status(403).json({ success: false, message: 'You are not a winner of this contest.' });

    // Notify all admins with the submitted details
    const admins = await User.find({ role: 'admin' }).select('_id');
    const detailsMessage = `Winner: ${req.user.name} (@${req.user.username})\nPhone: ${phone}\nUPI ID: ${upiId}\nBank Details: ${bankDetails || 'Not provided'}\nNotes: ${notes || 'None'}`;

    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: 'contest_announcement',
        title: `💰 Prize Claim — ${req.user.name} for "${contest.title}"`,
        message: detailsMessage,
        link: '/admin?tab=contests',
      });
    }

    res.json({ success: true, message: 'Your payment details have been submitted. We will process your prize soon!' });
  } catch (e) { next(e); }
};

module.exports = { getContests, getContest, createContest, updateContest, endContest, setWinners, deleteContest, submitPrizeClaim };
