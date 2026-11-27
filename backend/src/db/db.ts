// src/db/db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models/schema.ts";
import appError from "../utils/appError.ts";

if (!process.env.DATABASE_URL) {
  throw new appError("DATABASE_URL is not set in environment variables", 400);
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });

export async function connectDb(): Promise<void> {
  try {
    await client`SELECT 1`;
    console.log("✅ Connected to Supabase PostgreSQL for anyBlog");
  } catch (error) {
    console.error("❌ Postgres connection failed:", error);
    throw new appError("Postgres connection failed for anyBlog", 500);
  }
}