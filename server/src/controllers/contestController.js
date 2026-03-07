const Contest      = require('../models/Contest');
const User         = require('../models/User');
const Notification = require('../models/Notification');

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

    // Notify winners
    for (const w of winners) {
      await Notification.create({
        recipient: w.userId, sender: req.user._id, type: 'contest_announcement',
        title: `🏆 You placed #${w.placement} in "${contest.title}"!`,
        message: w.note || `Congratulations on your placement in the contest.`,
        link: '/films',
      });
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

module.exports = { getContests, getContest, createContest, updateContest, endContest, setWinners, deleteContest };
