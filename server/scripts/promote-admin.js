require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/UserModel');

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run admin:promote -- <registered-email>');
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Configure MONGODB_URI in server/.env before promoting an account.');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'capstone_portfolio' });
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true, runValidators: true });
  if (!user) throw new Error('No registered account was found with that email.');
  console.log(`Administrator role granted to ${user.username}.`);
}

main()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
