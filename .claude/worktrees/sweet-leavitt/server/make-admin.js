/**
 * Run once to grant admin access:
 *   node make-admin.js your@email.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./src/models/User');

const email = process.argv[2];
if (!email) { console.error('Usage: node make-admin.js <email>'); process.exit(1); }

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { isAdmin: true } },
    { new: true }
  );
  if (!user) { console.log('❌ No user found with that email.'); }
  else       { console.log(`✅ ${user.name} (${user.email}) is now an admin.`); }
  process.exit(0);
}).catch((err) => { console.error(err); process.exit(1); });
