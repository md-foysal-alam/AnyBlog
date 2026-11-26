// Copyright 2026 Foysal Alam Rohan

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the specific language governing permissions and
// limitations under the License.

import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";

import appError from "../../../utils/appError.ts";

import { db } from "../../../db/db.ts";
import { accounts, credentials, emailVerifications } from "../../../models/schema.ts";
import type { SignupInput } from "../../../types/types.ts";

class AuthSignup {

    private hashToken(rawToken: string): string {
        return crypto.createHash("sha256").update(rawToken).digest("hex");
    }

    public async AuthSignup (input: SignupInput) {

        const email         = String(input.email ?? "").trim().toLowerCase();
        const username      = String(input.username ?? "").trim().toLowerCase();
        const password      = String(input.password ?? "");
        const displayName   = input.displayName?.trim() || null;

        if (!email || !username || password.length < 8) 
        throw new appError("email, username, and password (min 8 chars) are required.", 400);

        const existing = await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(or(eq(accounts.email, email), eq(accounts.username, username)))
            .limit(1);

        if (existing.length > 0) 
        throw new appError("Email or username already exists.", 409);

        const passwordHash   = await bcrypt.hash(password, 12);
        const rawVerifyToken = crypto.randomBytes(32).toString("hex");
        const verifyHash     = this.hashToken(rawVerifyToken);
        const verifyExpires  = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        try {

            const created = await db.transaction(async (tx) => {
                const [account] = await tx
                .insert(accounts)
                .values({
                    email, username, displayName
                })
                .returning({
                    id            : accounts.id,
                    email         : accounts.email,
                    username      : accounts.username,
                    displayName   : accounts.displayName,
                    avatarUrl     : accounts.avatarUrl,
                    bio           : accounts.bio,
                    emailVerified : accounts.emailVerified,
                    createdAt     : accounts.createdAt,
                });

                await tx
                .insert(credentials)
                .values({
                    accountId    : account.id,
                    passwordHash,
                })
                .returning({ id: credentials.id });

                await tx
                .insert(emailVerifications)
                .values({
                    accountId : account.id,
                    tokenHash : verifyHash,
                    expiresAt : verifyExpires,
                })
                .returning({ id: emailVerifications.id });

                return account;
            });

            return {
                account           : created,
                verificationToken : rawVerifyToken,
            };

        } catch (error: any) {

            if (error?.code === "23505") 
            throw new appError("Email or username already exists.", 409);

            console.error("Auth signup failed:", {
                message : error?.message,
                code    : error?.code,
            });

            throw new appError("Failed to create account.", 500);

        }
    }

}

export default new AuthSignup();