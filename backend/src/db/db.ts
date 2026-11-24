// Copyright 2026 Foysal Alam Rohan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the specific language governing permissions and
// limitations under the License.

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/schema.ts";
import appError from "../utils/appError.ts"

if (!process.env.DATABASE_URL) {
  throw new appError("DATABASE_URL is not set in environment variables", 400);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool, schema });

export async function connectDb(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to Supabase PostgreSQL for anyBlog");
  } catch (error) {
    throw new appError("❌ Postgres connection failed of anyBlog:", 500);
  }
}