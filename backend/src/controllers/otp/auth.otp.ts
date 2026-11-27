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
// See the License for the specific language governing permissions and
// limitations under the License.

import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";

import appError from "../../utils/appError.ts";

import { db } from "../../db/db.ts";
import { otpCodes } from "../../models/schema.ts";

export type OtpPurpose = "signin" | "password_reset";

const OTP_TTL_MS      = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS    = 5;

const getSecret = (): string => {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new appError("OTP_SECRET must be set.", 500);
    return secret;
};

class AuthOtp {

    private hashCode(accountId: string, purpose: OtpPurpose, otp: string): string {
        return crypto
            .createHmac("sha256", getSecret())
            .update(`${accountId}:${purpose}:${otp}`)
            .digest("hex");
    }

    public async issue(accountId: string, purpose: OtpPurpose) {

        const now       = new Date();
        const otp       = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
        const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
        const codeHash  = this.hashCode(accountId, purpose, otp);

        return await db.transaction(async (tx) => {
            const [existing] = await tx
                .select({ createdAt: otpCodes.createdAt })
                .from(otpCodes)
                .where(and(eq(otpCodes.accountId, accountId), eq(otpCodes.purpose, purpose)))
                .limit(1);

            if (existing && now.getTime() - existing.createdAt.getTime() < RESEND_AFTER_MS)
            return null;

            await tx
                .insert(otpCodes)
                .values({ accountId, purpose, codeHash, attempts: 0, expiresAt, createdAt: now })
                .onConflictDoUpdate({
                    target : [otpCodes.accountId, otpCodes.purpose],
                    set    : { codeHash, attempts: 0, expiresAt, createdAt: now },
                });

            return { otp, expiresAt };
        });
    }

    public async revoke(accountId: string, purpose: OtpPurpose): Promise<void> {
        await db
            .delete(otpCodes)
            .where(and(eq(otpCodes.accountId, accountId), eq(otpCodes.purpose, purpose)));
    }

    public async verifyAndConsume(accountId: string, purpose: OtpPurpose, otp: string): Promise<void> {

        const normalizedOtp = String(otp ?? "").trim();
        if (!normalizedOtp)
        throw new appError("Invalid or expired code.", 401);

        const now = Date.now();

        const [row] = await db
            .select()
            .from(otpCodes)
            .where(and(eq(otpCodes.accountId, accountId), eq(otpCodes.purpose, purpose)))
            .limit(1);

        if (!row)
        throw new appError("Invalid or expired code.", 401);

        if (row.expiresAt.getTime() <= now) {
            await this.revoke(accountId, purpose);
            throw new appError("Invalid or expired code.", 401);
        }

        if (row.attempts >= MAX_ATTEMPTS) {
            await this.revoke(accountId, purpose);
            throw new appError("Too many wrong attempts. Please request a new code.", 429);
        }

        const given    = Buffer.from(this.hashCode(accountId, purpose, normalizedOtp));
        const expected = Buffer.from(row.codeHash);
        const matches  = given.length === expected.length && crypto.timingSafeEqual(given, expected);

        if (!matches) {
            const [updated] = await db
                .update(otpCodes)
                .set({ attempts: sql`${otpCodes.attempts} + 1` })
                .where(eq(otpCodes.id, row.id))
                .returning({ attempts: otpCodes.attempts });

            if ((updated?.attempts ?? row.attempts + 1) >= MAX_ATTEMPTS) {
                await this.revoke(accountId, purpose);
                throw new appError("Too many wrong attempts. Please request a new code.", 429);
            }

            throw new appError("Invalid or expired code.", 401);
        }

        const consumed = await db
            .delete(otpCodes)
            .where(and(eq(otpCodes.id, row.id), eq(otpCodes.codeHash, row.codeHash)))
            .returning({ id: otpCodes.id });

        if (consumed.length === 0)
        throw new appError("Invalid or expired code.", 401);
    }
}

export default new AuthOtp();