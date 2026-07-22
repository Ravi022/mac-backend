import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_DB}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST :${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection error :", error);
    // Don't kill the process on Vercel serverless — throw so the request fails cleanly
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};
