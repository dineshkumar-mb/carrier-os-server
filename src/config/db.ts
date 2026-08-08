import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/carrier-os';
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`[db.ts] MongoDB connection notice: ${error.message}. Running with in-memory state engine.`);
  }
};

export default connectDB;
