require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');

const connectDB            = require('./config/db');
const errorHandler         = require('./middleware/errorHandler');
const authRoutes           = require('./routes/authRoutes');
const profileRoutes        = require('./routes/profileRoutes');
const projectRoutes        = require('./routes/projectRoutes');
const applicationRoutes    = require('./routes/applicationRoutes');
const conversationRoutes   = require('./routes/conversationRoutes');
const notificationRoutes   = require('./routes/notificationRoutes');
const searchRoutes         = require('./routes/searchRoutes');
const leaderboardRoutes    = require('./routes/leaderboardRoutes');
const exploreRoutes        = require('./routes/exploreRoutes');
const timelineRoutes       = require('./routes/timelineRoutes');
const mapRoutes            = require('./routes/mapRoutes');
const taskRoutes           = require('./routes/taskRoutes');
const teamFileRoutes       = require('./routes/teamFileRoutes');
const reviewRoutes         = require('./routes/reviewRoutes');
const scheduleRoutes       = require('./routes/scheduleRoutes');
const waitlistRoutes       = require('./routes/waitlistRoutes');
const mentorRoutes         = require('./routes/mentorRoutes');
const followRoutes         = require('./routes/followRoutes');
const crewMatchRoutes         = require('./routes/crewMatchRoutes');
const filmInteractionRoutes   = require('./routes/filmInteractionRoutes');
const adminRoutes             = require('./routes/adminRoutes');
const contestRoutes           = require('./routes/contestRoutes');
const launchWaitlistRoutes    = require('./routes/launchWaitlistRoutes');
const activityRoutes          = require('./routes/activityRoutes');
const socketHandler        = require('./socket/socketHandler');

// Connect to MongoDB
connectDB();

const app    = express();
const server = http.createServer(app);         // HTTP server (wraps express)

// ── Allowed origins (supports comma-separated list in CLIENT_URL) ─────────
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

// Auto-add www <-> non-www variants so both always work
const expandedOrigins = new Set(allowedOrigins);
for (const origin of allowedOrigins) {
  try {
    const url = new URL(origin);
    if (url.hostname.startsWith('www.')) {
      expandedOrigins.add(`${url.protocol}//${url.hostname.slice(4)}${url.port ? ':' + url.port : ''}`);
    } else {
      expandedOrigins.add(`${url.protocol}//www.${url.hostname}${url.port ? ':' + url.port : ''}`);
    }
  } catch (_) { /* ignore malformed entries */ }
}

const corsOrigin = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, Postman, etc.)
  if (!origin) return callback(null, true);
  if (expandedOrigins.has(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};

// ── Socket.io setup ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      corsOrigin,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

// Attach all socket event handlers
socketHandler(io);

// ── Express middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:      corsOrigin,
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CREWUP API is running 🎬',
    socketConnections: io.engine.clientsCount,
  });
});

// ── REST Routes ──────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/profile',      profileRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api',              applicationRoutes);
app.use('/api',              conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search',       searchRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/explore',      exploreRoutes);
app.use('/api/projects',     timelineRoutes);
app.use('/api/map',          mapRoutes);
app.use('/api/projects/:id/tasks',     taskRoutes);
app.use('/api/projects/:id/files',     teamFileRoutes);
app.use('/api/reviews',                reviewRoutes);
app.use('/api/projects/:id/schedule',  scheduleRoutes);
app.use('/api/projects/:id/waitlist',  waitlistRoutes);
app.use('/api/mentors',                mentorRoutes);
app.use('/api/follow',                 followRoutes);
app.use('/api/projects/:id',           crewMatchRoutes);
app.use('/api/films',                  filmInteractionRoutes);
app.use('/api/admin',                  adminRoutes);
app.use('/api/contests',               contestRoutes);
app.use('/api/launch-waitlist',        launchWaitlistRoutes);
app.use('/api/activity',               activityRoutes);

// ── 404 + global error handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 CREWUP Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`🔌 Socket.io ready`);
});

module.exports = { app, server, io };
