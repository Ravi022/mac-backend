import dotenv from "dotenv";
import { connectDB } from "./src/db/db.js";
import { app } from "./src/server.js";

dotenv.config({ path: "./.env" });

// Local development: connect DB then listen
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      const port = process.env.PORT || 8000;
      app.listen(port, () => {
        console.log(`server is running at port : ${port}`);
      });
    })
    .catch((error) => {
      console.log("MongoDB connection failed :", error);
      process.exit(1);
    });
}

// Vercel serverless handler — no top-level DB await (avoids FUNCTION_INVOCATION_FAILED)
export default app;
