
import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME;

// Validate environment variables before using them
if (!MONGODB_URL) {
  throw new Error(" MONGODB_URL is not defined in environment variables");
}

if (!DB_NAME) {
  throw new Error(" DB_NAME is not defined in environment variables");
}

const connectMongoDB = async (): Promise<void> => {
  try {
    const connectionInstance = await mongoose.connect(MONGODB_URL, {
      dbName: DB_NAME,
    });
    console.log(
      `MONGODB connected at host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection failed", error);
    process.exit(1);
  }
};

export default connectMongoDB;