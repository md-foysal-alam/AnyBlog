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

import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";

import appError from "../../utils/appError.ts";
import mailer, { maskEmail } from "../../utils/mailer.ts";

import { db } from "../../db/db.ts";
import { accounts, credentials, sessions } from "../../models/schema.ts";
import type { LoginInput, VerifyLoginOtpInput } from "../../types/types.ts";
import AuthOtp from "../otp/auth.otp.ts";

const DUMMY_HASH = bcrypt.hashSync("anyblog-dummy-password", 12);

class AuthSignin {

    private hashToken(rawValue: string): string {
        return crypto.createHash("sha256").update(rawValue).digest("hex");
    }

    public async AuthSignin(input: LoginInput) {

        const identifier = String(input.identifier ?? "").trim().toLowerCase();
        const password   = String(input.password ?? "");

        if (!identifier || !password)
        throw new appError("identifier and password are required.", 400);

        const [account] = await db
            .select({
                id          : accounts.id,
                email       : accounts.email,
                username    : accounts.username,
                displayName : accounts.displayName,
            })
            .from(accounts)
            .where(or(eq(accounts.email, identifier), eq(accounts.username, identifier)))
            .limit(1);

        const [cred] = account
            ? await db
                .select({ passwordHash: credentials.passwordHash })
                .from(credentials)
                .where(eq(credentials.accountId, account.id))
                .limit(1)
            : [];

        const isValid = await bcrypt.compare(password, cred?.passwordHash ?? DUMMY_HASH);

        if (!account || !cred || !isValid)
        throw new appError("Invalid credentials.", 401);

        const issued = await AuthOtp.issue(account.id, "signin");

        if (!issued)
        throw new appError("A code was just sent. Please wait a minute before requesting another.", 429);

        try {
            await mailer.sendSigninOtp(account.email, {
                name      : account.displayName || account.username,
                otp       : issued.otp,
                expiresAt : issued.expiresAt,
            });
        } catch (error: any) {

            console.error("Signin OTP mail failed:", {
                message      : error?.message,
                code         : error?.code,
                responseCode : error?.responseCode,
                command      : error?.command,
            });

            await AuthOtp.revoke(account.id, "signin").catch(() => undefined);

            throw new appError("Could not send the verification code. Please try again.", 502);
        }

        return {
            otpRequired : true,
            sentTo      : maskEmail(account.email),
            expiresAt   : issued.expiresAt,
        };
    }

        public async VerifySigninOtp(input: VerifyLoginOtpInput) {

        const identifier = String(input.identifier ?? "").trim().toLowerCase();
        const otp        = String(input.otp ?? "").trim();

        if (!identifier || !otp)
        throw new appError("identifier and otp are required.", 400);

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
        throw new appError("Invalid or expired code.", 401);

        await AuthOtp.verifyAndConsume(account.id, "signin", otp);

        if (!account.emailVerified) {
            const now = new Date();
            await db
                .update(accounts)
                .set({ emailVerified: true, updatedAt: now })
                .where(eq(accounts.id, account.id));
            account.emailVerified = true; 
        }

        const rawSession     = crypto.randomBytes(32).toString("hex");
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        try {

            const [session] = await db
                .insert(sessions)
                .values({
                    accountId : account.id,
                    tokenHash : this.hashToken(rawSession),
                    userAgent : input.userAgent || null,
                    ipAddress : input.ipAddress || null,
                    expiresAt : sessionExpires,
                })
                .returning({
                    id        : sessions.id,
                    expiresAt : sessions.expiresAt,
                });

            return { token: rawSession, session, account };

        } catch (error: any) {

            console.error("Create session failed:", { message: error?.message, code: error?.code });
            throw new appError("Failed to sign in.", 500);

        }
    }

}

export default new AuthSignin();