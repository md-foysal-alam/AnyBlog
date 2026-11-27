import bcrypt    from "bcrypt";
import { eq }    from "drizzle-orm";

import appError from "../../utils/appError.ts";
import mailer   from "../../utils/mailer.ts";

import { db } from "../../db/db.ts";
import { accounts, credentials, sessions } from "../../models/schema.ts";
import type { ForgotPasswordOtpInput } from "../../types/types.ts";
import AuthOtp from "../otp/auth.otp.ts";

class AuthForgotPassword {

    public async AuthForgotPassword(input: ForgotPasswordOtpInput) {

        const email       = String(input.email ?? "").trim().toLowerCase();
        const otp         = String(input.otp ?? "").trim();
        const newPassword = String(input.newPassword ?? "");

        if (!email)
        throw new appError("email is required.", 400);

        const [account] = await db
            .select({
                id          : accounts.id,
                email       : accounts.email,
                username    : accounts.username,
                displayName : accounts.displayName,
            })
            .from(accounts)
            .where(eq(accounts.email, email))
            .limit(1);

        // ---- Step 1: request a code ----
        if (!otp && !newPassword) {

            if (account) {
                const issued = await AuthOtp.issue(account.id, "password_reset");

                if (issued) {
                    mailer
                        .sendPasswordReset(account.email, {
                            name      : account.displayName || account.username,
                            otp       : issued.otp,
                            expiresAt : issued.expiresAt,
                        })
                        .catch((error: any) =>
                            console.error("Reset OTP mail failed:", {
                                message : error?.message,
                                code    : error?.code,
                            })
                        );
                }
            } else {
                // burn comparable time so response is indistinguishable
                await db.select({ id: accounts.id }).from(accounts).limit(1);
            }

            return { otpSent: true };
        }

        // ---- Step 2: code + new password ----
        if (!otp || newPassword.length < 8)
        throw new appError("otp and newPassword (min 8 chars) are required.", 400);

        if (!account)
        throw new appError("Invalid or expired code.", 401);

        await AuthOtp.verifyAndConsume(account.id, "password_reset", otp);

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const now          = new Date();

        try {

            await db.transaction(async (tx) => {
                await tx
                    .update(credentials)
                    .set({ passwordHash, updatedAt: now })
                    .where(eq(credentials.accountId, account.id));

                await tx
                    .update(accounts)
                    .set({ emailVerified: true, updatedAt: now })
                    .where(eq(accounts.id, account.id));

                await tx.delete(sessions).where(eq(sessions.accountId, account.id));
            });

        } catch (error: any) {

            console.error("Password reset failed:", { message: error?.message, code: error?.code });
            throw new appError("Failed to update password.", 500);

        }

        mailer
            .sendPasswordChanged(account.email, account.displayName || account.username)
            .catch((error: any) =>
                console.error("Password-changed mail failed:", { message: error?.message })
            );

        return { passwordUpdated: true };
    }

}

export default new AuthForgotPassword();