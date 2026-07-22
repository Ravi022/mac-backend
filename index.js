import dotenv from "dotenv";
import { connectDB } from "./src/db/db.js";
import { app } from "./src/server.js";

dotenv.config({ path: "./.env" });

// Connect DB before handling requests (needed for Vercel cold starts)
await connectDB();

// Local / non-Vercel: start a normal HTTP server
if (!process.env.VERCEL) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`server is running at port : ${port}`);
  });
}

// Vercel serverless: export the Express app as the handler
export default app;
