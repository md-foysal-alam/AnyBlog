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
import { and, eq, gt, isNull } from "drizzle-orm";

import appError from "../../utils/appError.ts";

import { db } from "../../db/db.ts";
import { accounts, emailVerifications } from "../../models/schema.ts";

class AuthVerifyEmail {

    public async AuthVerifyEmail(rawToken: string) {

        const token = String(rawToken ?? "").trim();

        if (!/^[a-f0-9]{64}$/.test(token))
        throw new appError("Invalid or expired verification link.", 400);

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const now       = new Date();

        await db.transaction(async (tx) => {
            const [record] = await tx
                .update(emailVerifications)
                .set({ usedAt: now })
                .where(
                    and(
                        eq(emailVerifications.tokenHash, tokenHash),
                        isNull(emailVerifications.usedAt),
                        gt(emailVerifications.expiresAt, now)
                    )
                )
                .returning({ accountId: emailVerifications.accountId });

            if (!record)
            throw new appError("Invalid or expired verification link.", 400);

            await tx
                .update(accounts)
                .set({ emailVerified: true, updatedAt: now })
                .where(eq(accounts.id, record.accountId));
        });

        return { verified: true };
    }

}

export default new AuthVerifyEmail();