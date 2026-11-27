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

import "dotenv/config";
import mailer, { verifyMailer } from "../utils/mailer.ts";

const proc = (globalThis as any).process;
const env: Record<string, string | undefined> = proc.env;

console.log("--- .env check (values hidden) ---");
for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "OTP_SECRET", "APP_URL"]) {
    console.log(`${key.padEnd(11)}: ${env[key] ? "set" : "MISSING"}`);
}

console.log("\n--- SMTP login test ---");
try {
    await verifyMailer();
    console.log("OK: connected and logged in to", env.SMTP_HOST);
} catch (e: any) {
    console.error("FAILED:", { code: e?.code, responseCode: e?.responseCode, message: e?.message });

    if (e?.code === "EAUTH" || e?.responseCode === 535)
        console.error("\nFix: Gmail rejected the login. Create a NEW app password (2-Step Verification must be on)\n" +
                      "     while signed in as SMTP_USER, and paste it into SMTP_PASS.");
    else if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED"].includes(e?.code))
        console.error("\nFix: your network blocks the SMTP port. Try SMTP_PORT=465 and SMTP_SECURE=true,\n" +
                      "     or switch network / use an email API provider.");
    else if (String(e?.message).startsWith("Missing SMTP settings"))
        console.error("\nFix: run this from the project root so dotenv finds your .env file.");

    proc.exit(1);
}

const to = proc.argv[2] || env.SMTP_USER!;
console.log("\n--- sending a real test email to", to, "---");
try {
    await mailer.sendSigninOtp(to, { name: "Test", otp: "123456", expiresAt: new Date(Date.now() + 10 * 60000) });
    console.log("OK: test email sent. Check the inbox (and spam).");
} catch (e: any) {
    console.error("FAILED to send:", { code: e?.code, responseCode: e?.responseCode, message: e?.message });
    proc.exit(1);
}