import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('[SEED] MONGO_URI is not set in server/.env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[SEED] Connected to MongoDB');

    const email = (process.env.ADMIN_EMAIL || 'admin@icgla.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const name = process.env.ADMIN_NAME || 'System Admin';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`[SEED] Admin already exists: ${email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    await User.create({
      fullName: name,
      email,
      password,
      role: 'admin',
      isApproved: true,
      emailVerified: true,
      isActive: true,
    });

    console.log(`[SEED] Admin created: ${email}`);
    console.log(`[SEED] You can now log in with ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
