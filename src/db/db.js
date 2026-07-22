import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

let connectionPromise = null;

export const connectDB = async () => {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGO_DB;
  if (!mongoUri) {
    throw new Error(
      "MONGO_DB environment variable is missing. Set it in Vercel Project Settings → Environment Variables."
    );
  }

  const uri = mongoUri.includes(DB_NAME)
    ? mongoUri
    : `${mongoUri.replace(/\/$/, "")}/${DB_NAME}`;

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    })
    .then((connectionInstance) => {
      console.log(
        `\n MongoDB connected !! DB HOST :${connectionInstance.connection.host}`
      );
      return connectionInstance.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.log("MongoDB connection error :", error);
      throw error;
    });

  return connectionPromise;
};
