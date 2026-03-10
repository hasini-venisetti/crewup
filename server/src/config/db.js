const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    const db = conn.connection.db;

    // Drop any stale unique index on LaunchWaitlist.name — only email should be unique
    try {
      const indexes = await db.collection('launchwaitlists').indexes();
      for (const idx of indexes) {
        const fields = Object.keys(idx.key || {});
        if (fields.includes('name') && idx.unique) {
          await db.collection('launchwaitlists').dropIndex(idx.name);
          console.log(`🔧 Dropped stale unique index "${idx.name}" on launchwaitlists.name`);
        }
      }
    } catch (_) {}

    // Remove old-schema Follow docs (missing follower/following fields) that
    // can violate the unique index and silently block new follows
    try {
      const result = await db.collection('follows').deleteMany({
        $or: [
          { follower:  { $exists: false } },
          { following: { $exists: false } },
        ],
      });
      if (result.deletedCount > 0) {
        console.log(`🔧 Cleaned ${result.deletedCount} stale Follow doc(s) (old requester/recipient schema)`);
      }
    } catch (_) {}

    // Drop the old non-sparse unique index on follows so Mongoose recreates
    // it as sparse — null-value docs no longer block new inserts
    try {
      const followIndexes = await db.collection('follows').indexes();
      for (const idx of followIndexes) {
        const fields = Object.keys(idx.key || {});
        if (fields.includes('follower') && fields.includes('following') && idx.unique && !idx.sparse) {
          await db.collection('follows').dropIndex(idx.name);
          console.log(`🔧 Dropped non-sparse follow index — will be recreated as sparse on next start`);
        }
      }
    } catch (_) {}
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
