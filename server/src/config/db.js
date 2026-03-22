const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool — keep 5–10 connections ready instead of opening/closing each request
      maxPoolSize:     10,
      minPoolSize:     2,
      // Drop unresponsive connections faster (ms)
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS:          45_000,
      // Retry writes so a brief blip doesn't fail a user's request
      retryWrites: true,
    });
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

    // Drop ALL non-_id unique indexes on the follows collection so Mongoose
    // recreates only the correct { follower, following } sparse unique index.
    // This handles the old requester/recipient index that silently blocks inserts.
    try {
      const Follow = require('../models/Follow');
      const followIndexes = await db.collection('follows').indexes();
      for (const idx of followIndexes) {
        if (idx.name === '_id_') continue; // never drop _id index
        const fields = Object.keys(idx.key || {});
        // Drop ANY non-_id index (old requester/recipient, old follower/following, everything)
        await db.collection('follows').dropIndex(idx.name);
        console.log(`🔧 Dropped old follow index "${idx.name}" (fields: ${fields.join(',')})`);
      }
      // Let Mongoose sync (create) the correct indexes as defined in the schema
      await Follow.syncIndexes();
      console.log('✅ Follow indexes synced to current schema');
    } catch (syncErr) {
      console.warn('⚠️  Follow index sync warning:', syncErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
