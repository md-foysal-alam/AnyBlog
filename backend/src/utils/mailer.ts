import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const appName = () => process.env.APP_NAME || "anyBlog";

export const maskEmail = (email: string) => {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
};

class Mailer {
  public async sendSigninOtp(to: string, data: { name: string; otp: string; expiresAt: Date }) {
    await resend.emails.send({
      from: `${appName()} <onboarding@resend.dev>`, // MUST BE onboarding@resend.dev
      to,
      subject: `${appName()} login code`,
      html: `<h1>Your login code</h1><p>Hi ${data.name}, your code is: <strong style="font-size:24px">${data.otp}</strong></p>`,
    });
  }

  public async sendPasswordReset(to: string, data: { name: string; otp: string; expiresAt: Date }) {
    await resend.emails.send({
      from: `${appName()} <onboarding@resend.dev>`,
      to,
      subject: `${appName()} password reset code`,
      html: `<h1>Password Reset</h1><p>Hi ${data.name}, your reset code is: <strong style="font-size:24px">${data.otp}</strong></p>`,
    });
  }

  public async sendVerifyEmail(to: string, data: { name: string; token: string }) {
    const url = `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(data.token)}`;
    await resend.emails.send({
      from: `${appName()} <onboarding@resend.dev>`,
      to,
      subject: `Verify your ${appName()} email`,
      html: `<h1>Verify your email</h1><p>Hi ${data.name}, click <a href="${url}">here to verify your email</a>.</p>`,
    });
  }

  public async sendPasswordChanged(to: string, name: string) {
    await resend.emails.send({
      from: `${appName()} <onboarding@resend.dev>`,
      to,
      subject: `Your ${appName()} password was changed`,
      html: `<h1>Password Changed</h1><p>Hi ${name}, your password was just changed.</p>`,
    });
  }
}

export default new Mailer();