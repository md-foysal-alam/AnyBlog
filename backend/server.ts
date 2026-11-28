import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import "dotenv/config";

// Import Routers
import authRouter from "./src/routes/auth.routes.ts";
import postRouter from "./src/routes/post.routes.ts";
import uploadRouter from "./src/routes/upload.routes.ts";
import profileRouter from "./src/routes/profile.routes.ts"

import { connectDb } from "./src/db/db.ts";
import { errorHandler } from "./src/middlewares/errorHandler.ts";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// 🟢 MOUNT ROUTES
app.use("/anyblog", authRouter);                  // Auth routes (/signup, /signin, etc)
app.use("/anyblog/posts", postRouter);            // Post & Comment routes
app.use("/anyblog/upload", uploadRouter);  
app.use("/anyblog/profile", profileRouter);       // Cloudinary Upload route

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

async function startServer() {
  await connectDb();
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}
startServer();