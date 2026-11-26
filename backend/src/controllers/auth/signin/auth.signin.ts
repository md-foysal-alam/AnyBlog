// Copyright 2026 Foysal Alam Rohan

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import crypto from"crypto";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";

import appError from "../../../utils/appError.ts";

import {db} from "../../../db/db.ts";
import { accounts, credentials, sessions } from "../../../models/schema.ts";
import type { signinInput } from "../../../types/types.ts";

class AuthSignin {

    private hashToken(rawToken: string): string {
        return crypto.createHash("sha256").update(rawToken).digest("hex");
    }

    public async AuthSignin (input: signinInput) {

    const identifier = String(input.identifier ?? "").trim().toLowerCase();
    const password   = String(input.password ?? "");

    if (!identifier || !password) 
    throw new appError("identifier and password are required.", 400);

    const [account] = await db
      .select({
        id            : accounts.id,
        email         : accounts.email,
        username      : accounts.username,
        displayName   : accounts.displayName,
        avatarUrl     : accounts.avatarUrl,
        bio           : accounts.bio,
        emailVerified : accounts.emailVerified,
      })
      .from(accounts)
      .where(or(eq(accounts.email, identifier), eq(accounts.username, identifier)))
      .limit(1);

    if (!account) 
    throw new appError("Invalid credentials.", 401);  

    const [cred] = await db
    .select({passwordHash: credentials.passwordHash})
    .from(credentials)
    .where(eq(credentials.accountId, account.id))
    .limit(1);

    if (!cred) 
    throw new appError("Invalid credentials.", 401);

    const isValid = await bcrypt.compare(password, cred.passwordHash);

    if (!isValid) 
    throw new appError("Invalid credentials.", 401);

    const rawToken  = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [session] = await db
      .insert(sessions)
      .values({
        accountId : account.id,
        tokenHash,
        userAgent : input.userAgent || null,
        ipAddress : input.ipAddress || null,
        expiresAt,
      })
      .returning({
        id        : sessions.id,
        expiresAt : sessions.expiresAt,
      });

    return {
      token   : rawToken,
      session,
      account,
    };

    }

}

export default new AuthSignin();