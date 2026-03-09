const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Drop any stale unique index on LaunchWaitlist.name — only email should be unique
    try {
      const db = conn.connection.db;
      const indexes = await db.collection('launchwaitlists').indexes();
      for (const idx of indexes) {
        const fields = Object.keys(idx.key || {});
        if (fields.includes('name') && idx.unique) {
          await db.collection('launchwaitlists').dropIndex(idx.name);
          console.log(`🔧 Dropped stale unique index "${idx.name}" on launchwaitlists.name`);
        }
      }
    } catch (_) {
      // Collection may not exist yet on first run — that's fine
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
