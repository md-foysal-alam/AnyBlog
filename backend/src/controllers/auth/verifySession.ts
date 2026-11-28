import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import appError from "../../utils/appError.ts";
import { db } from "../../db/db.ts";
import { accounts, sessions } from "../../models/schema.ts";

class AuthVerifySession {
    private hashToken(rawToken: string): string {
        return crypto.createHash("sha256").update(rawToken).digest("hex");
    }

    public async AuthVerifySession(rawToken: string) {
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

        return { account, sessionId: session.id };
    }
}
export default new AuthVerifySession();