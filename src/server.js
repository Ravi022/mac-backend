import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MAX_LIMIT_OF_DATA, STORE_STATIC_DATA } from "./constant.js";
import dotenv from "dotenv";
import { connectDB } from "./db/db.js";
import userRouter from "./routes/user.js";
import macGeneratorRouter from "./routes/macGenerator.js";

dotenv.config();

const app = express();

const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOrigin =
  !corsOriginEnv || corsOriginEnv === "*"
    ? true
    : corsOriginEnv.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: `${MAX_LIMIT_OF_DATA}` }));
app.use(express.urlencoded({ extended: true, limit: `${MAX_LIMIT_OF_DATA}` }));
app.use(express.static(`${STORE_STATIC_DATA}`));
app.use(cookieParser());

// Health check — does not require DB
app.get(["/", "/api", "/api/"], (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mac-generator-api",
    timestamp: new Date().toISOString(),
  });
});

// Connect DB lazily for API routes (safe for Vercel cold starts)
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB middleware error:", error);
    res.status(500).json({
      error: "Database connection failed",
      details: error.message,
    });
  }
});

app.use("/users", userRouter);
app.use("/macGenerator", macGeneratorRouter);

export { app };
export default app;
