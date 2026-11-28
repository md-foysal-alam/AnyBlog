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

    /** Resolve a session to { account, sessionId }, or null if invalid/missing. */
    private async resolve(req: Request): Promise<{ account: SessionAccount; sessionId: string } | null> {
        const rawToken = this.extractToken(req);
        if (!rawToken) return null;

        const tokenHash = this.hashToken(rawToken);
        const now       = new Date();

        const [session] = await db
            .select({
                id        : sessions.id,
                accountId : sessions.accountId,
            })
            .from(sessions)
            .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
            .limit(1);

        if (!session) return null;

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

        if (!account) return null;

        return { account, sessionId: session.id };
    }

    /** Hard auth — 401 if no valid token. */
    public verify = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const result = await this.resolve(req);
            if (!result) throw new appError("Unauthorized.", 401);
            req.account   = result.account;
            req.sessionId = result.sessionId;
            next();
        } catch (err) {
            next(err);
        }
    };

    /** Soft auth — sets req.account if present, otherwise continues anonymous. */
    public verifyOptional = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const result = await this.resolve(req);
            if (result) {
                req.account   = result.account;
                req.sessionId = result.sessionId;
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

const instance = new AuthVerifySession();
export const optionalSession = instance.verifyOptional;
export default instance.verify;