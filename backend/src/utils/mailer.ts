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

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type Env = Record<string, string | undefined>;

const getEnv = (): Env =>
    (globalThis as typeof globalThis & { process?: { env?: Env } }).process?.env ?? {};

const appName = (): string => getEnv().APP_NAME || "anyBlog";
const appUrl  = (): string => (getEnv().APP_URL || "http://localhost:5173").replace(/\/+$/, "");

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
    if (transporter)
    return transporter;

    const e       = getEnv();
    const host    = e.SMTP_HOST?.trim();
    const user    = e.SMTP_USER?.trim();
    const pass    = e.SMTP_PASS?.replace(/\s+/g, "");
    const rawPort = Number(e.SMTP_PORT ?? 587);
    const port    = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 587;

    const missing = [
        !host && "SMTP_HOST",
        !user && "SMTP_USER",
        !pass && "SMTP_PASS",
    ].filter(Boolean);

    if (missing.length)
    throw new Error(`Missing SMTP settings: ${missing.join(", ")}`);

    const secure = e.SMTP_SECURE ? e.SMTP_SECURE === "true" : port === 465;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth              : { user, pass },
        connectionTimeout : 10_000,
        greetingTimeout   : 10_000,
        socketTimeout     : 20_000,
    });

    return transporter;
}

export async function verifyMailer(): Promise<void> {
    await getTransporter().verify();
}

const esc = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const render = (template: string, vars: Record<string, string>): string =>
    template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => esc(vars[key] ?? ""));

const renderText = (template: string, vars: Record<string, string>): string =>
    template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => vars[key] ?? "");

const CODE_BOX_STYLE =
    "margin:24px 0;padding:16px;background:#f4f5f7;border-radius:8px;text-align:center;" +
    "font-size:32px;font-weight:bold;letter-spacing:8px;color:#111111;font-family:'Courier New',monospace;";

const BUTTON_STYLE =
    "display:inline-block;margin:24px 0;padding:14px 28px;background:#2563eb;color:#ffffff;" +
    "text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;";

function layout(bodyHtml: string): string {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  .code-box { ${CODE_BOX_STYLE} }
  .button   { ${BUTTON_STYLE} }
</style>
</head>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;">
    <tr><td style="padding:32px;">
${bodyHtml}
    </td></tr>
    <tr><td style="padding:0 32px 24px;font-size:12px;color:#999999;">
      &copy; ${new Date().getFullYear()} ${esc(appName())}. All rights reserved.
    </td></tr>
  </table>
</body>
</html>`;
}

function minutesFrom(expiresAt: Date): string {
    const m = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60000));
    return `${m} minutes`;
}

const baseVars = () => ({ year: String(new Date().getFullYear()), app: appName() });

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
    const e    = getEnv();
    const from = e.MAIL_FROM || e.SMTP_USER;
    await getTransporter().sendMail({ from, to, subject, text, html });
}

export function maskEmail(email: string): string {
    const [local = "", domain = ""] = email.split("@");
    return `${local.slice(0, 1)}***@${domain}`;
}

const LOGIN_CODE_HTML = `
<h1 style="margin-top: 0; font-size: 24px; color: #111111;">Your login code</h1>
<p style="font-size: 16px; line-height: 1.6; color: #444444;">Hi {{name}}, use the verification code below to log into your account. This code is valid for {{expires_in}}.</p>
<div class="code-box" style="${CODE_BOX_STYLE}">{{code}}</div>
<p style="font-size: 14px; color: #777777;">Never share this code with anyone. Our support team will never ask for your verification code.</p>`;

const LOGIN_CODE_TEXT = `Your login code

Hi {{name}}, use the verification code below to log into your account:

{{code}}

This code is valid for {{expires_in}}. Never share this code with anyone.

---
© {{year}} {{app}}. All rights reserved.`;

const RESET_OTP_HTML = `
<h1 style="margin-top: 0; font-size: 24px; color: #111111;">Password reset code</h1>
<p style="font-size: 16px; line-height: 1.6; color: #444444;">Hi {{name}}, enter the code below to reset your password. This code is valid for {{expires_in}}.</p>
<div class="code-box" style="${CODE_BOX_STYLE}">{{code}}</div>
<p style="font-size: 14px; color: #777777;">If you didn't request a password reset, you can safely ignore this email.</p>`;

const RESET_OTP_TEXT = `Password reset code

Hi {{name}}, enter the code below to reset your password:

{{code}}

This code is valid for {{expires_in}}. If you didn't request a password reset, ignore this email.

---
© {{year}} {{app}}. All rights reserved.`;

const VERIFY_HTML = `
<h1 style="margin-top: 0; font-size: 24px; color: #111111;">Verify your email</h1>
<p style="font-size: 16px; line-height: 1.6; color: #444444;">Hi {{name}}, welcome to {{app}}! Please confirm your email address. This link expires in {{expires_in}}.</p>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center">
      <a href="{{verify_url}}" class="button" style="${BUTTON_STYLE}" target="_blank">Verify Email</a>
    </td>
  </tr>
</table>
<p style="font-size: 14px; color: #777777;">If you didn't create this account, you can ignore this email.</p>`;

const VERIFY_TEXT = `Verify your email

Hi {{name}}, welcome to {{app}}! Confirm your email address using the link below:

{{verify_url}}

This link expires in {{expires_in}}. If you didn't create this account, ignore this email.

---
© {{year}} {{app}}. All rights reserved.`;

const CHANGED_HTML = `
<h1 style="margin-top: 0; font-size: 24px; color: #111111;">Password changed</h1>
<p style="font-size: 16px; line-height: 1.6; color: #444444;">Hi {{name}}, your password was just changed and all your sessions were signed out.</p>
<p style="font-size: 14px; color: #777777;">If this wasn't you, contact support immediately.</p>`;

const CHANGED_TEXT = `Password changed

Hi {{name}}, your password was just changed and all your sessions were signed out.

If this wasn't you, contact support immediately.

---
© {{year}} {{app}}. All rights reserved.`;

class Mailer {

    public async sendSigninOtp(
        to: string,
        data: { name: string; otp: string; expiresAt: Date }
    ) {
        const vars = {
            ...baseVars(),
            name       : data.name,
            code       : data.otp,
            expires_in : minutesFrom(data.expiresAt),
        };
        await send(
            to,
            `${appName()} login code`,
            renderText(LOGIN_CODE_TEXT, vars),
            layout(render(LOGIN_CODE_HTML, vars))
        );
    }

    public async sendPasswordReset(
        to: string,
        data: { name: string; otp: string; expiresAt: Date }
    ) {
        const vars = {
            ...baseVars(),
            name       : data.name,
            code       : data.otp,
            expires_in : minutesFrom(data.expiresAt),
        };
        await send(
            to,
            `${appName()} password reset code`,
            renderText(RESET_OTP_TEXT, vars),
            layout(render(RESET_OTP_HTML, vars))
        );
    }

    public async sendVerifyEmail(
        to: string,
        data: { name: string; token: string }
    ) {
        const vars = {
            ...baseVars(),
            name       : data.name,
            verify_url : `${appUrl()}/verify-email?token=${encodeURIComponent(data.token)}`,
            expires_in : "24 hours",
        };
        await send(
            to,
            `Verify your ${appName()} email`,
            renderText(VERIFY_TEXT, vars),
            layout(render(VERIFY_HTML, vars))
        );
    }

    public async sendPasswordChanged(to: string, name: string) {
        const vars = { ...baseVars(), name };
        await send(
            to,
            `Your ${appName()} password was changed`,
            renderText(CHANGED_TEXT, vars),
            layout(render(CHANGED_HTML, vars))
        );
    }
}

export default new Mailer();