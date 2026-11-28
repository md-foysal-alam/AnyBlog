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
import type { Request, Response, NextFunction } from "express";
import { and, eq, gt } from "drizzle-orm";

import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { accounts, sessions } from "../../models/schema.ts";

import type { SessionAccount } from "../../types/types.ts";

class AuthVerifySession {
    private hashToken(rawToken: string): string {
        return crypto.createHash("sha256").update(rawToken).digest("hex");
    }

    /** Pull the token from a cookie first, then from an Authorization: Bearer header. */
    private extractToken(req: Request): string | null {
        const cookie = req.cookies?.sessionToken;
        if (typeof cookie === "string" && cookie.length > 0) return cookie;

        const header = req.headers.authorization;
        if (typeof header === "string" && header.startsWith("Bearer ")) {
            const bearer = header.slice(7).trim();
            return bearer.length > 0 ? bearer : null;
        }
        return null;
    }

    /** Express middleware — attach account + sessionId to req. */
    public verify = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const rawToken = this.extractToken(req);
            if (!rawToken) throw new appError("Unauthorized.", 401);

            const tokenHash = this.hashToken(rawToken);
            const now       = new Date();

            const [session] = await db
                .select({
                    id        : sessions.id,
                    accountId : sessions.accountId,
                    expiresAt : sessions.expiresAt,
                })
                .from(sessions)
                .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
                .limit(1);

            if (!session) throw new appError("Invalid or expired session.", 401);

            const [account] = await db
                .select({
                    id            : accounts.id,
                    email         : accounts.email,
                    username      : accounts.username,
                    displayName   : accounts.displayName,
                    avatarUrl     : accounts.avatarUrl,
                    bio           : accounts.bio,
                    websiteUrl    : accounts.websiteUrl,
                    twitterUrl    : accounts.twitterUrl,
                    githubUrl     : accounts.githubUrl,
                    linkedinUrl   : accounts.linkedinUrl,
                    emailVerified : accounts.emailVerified,
                })
                .from(accounts)
                .where(eq(accounts.id, session.accountId))
                .limit(1);

            if (!account) throw new appError("Account not found.", 401);

            // `account` is already structurally compatible with SessionAccount
            // (both inferred from the same schema), so no cast is needed.
            req.account   = account satisfies SessionAccount;
            req.sessionId = session.id;
            next();
        } catch (err) {
            next(err);
        }
    };
}

// Export the *bound middleware function*, not the instance.
const verifySession = new AuthVerifySession().verify;
export default verifySession;