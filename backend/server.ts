// Copyright 2026 Foysal Alam Rohan
// ... (license header, with the last line corrected)

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import router from "./src/routes/router.ts";
import { connectDb } from "./src/db/db.ts";
import { errorHandler } from "./src/middlewares/errorHandler.ts";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === "production";

if (isProd) app.set("trust proxy", 1);

app.use(helmet());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use("/anyblog", router);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler); // must stay last

async function startServer() {
  await connectDb();

  const server = app.listen(PORT, () => {
    console.log(`🚀 anyBlog Server running at http://localhost:${PORT} ✔`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("Failed to start anyBlog server:", err);
  process.exit(1);
});