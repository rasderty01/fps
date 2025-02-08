// auth.ts
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";

interface InviteEmailProps {
  organizationName: string;
  code: string;
  orgToken: string;
  expires: Date;
  inviterEmail: string;
  role: string;
  url: string;
}
export function generateInviteEmail({
  organizationName,
  code,
  orgToken,
  expires,
  inviterEmail,
  role,
  url,
}: InviteEmailProps): string {
  const baseUrl = new URL(url);
  if (!baseUrl.searchParams.has("orgToken")) {
    baseUrl.searchParams.append("orgToken", orgToken);
  }
  baseUrl.searchParams.append("inviteToken", code);

  const verifyUrl = baseUrl.toString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${organizationName} on PrintBridge</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.4; margin: 0; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff;">
          <h1 style="color: #2563eb; margin-bottom: 24px;">Join ${organizationName}</h1>
          <p style="margin-bottom: 16px;">You've been invited by ${inviterEmail} to join ${organizationName} as a ${role}.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 24px; letter-spacing: 2px; text-align: center; font-family: monospace;">${code}</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #2563eb; 
                      color: white; 
                      padding: 12px 24px; 
                      border-radius: 6px; 
                      text-decoration: none; 
                      font-weight: 500;
                      display: inline-block;">
              Join Organization
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This invitation expires in ${Math.floor((expires.getTime() - Date.now()) / 60000)} minutes.</p>
        </div>
      </body>
    </html>
  `;
}

export const OrganizationInvite = Email({
  id: "org-invite",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20,
  from: "PrintBridge <noreply@invite.printbridge.printrail.com>",
  name: "Organization Invite",

  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9"));
  },

  async sendVerificationRequest({
    identifier: email,
    provider,
    token,
    expires,
    url,
  }) {
    const searchParams = new URL(url).searchParams;
    const organizationName = searchParams.get("orgName") || "";
    const inviterEmail = searchParams.get("inviter") || "";
    const role = searchParams.get("role") || "member";
    const orgToken = searchParams.get("orgToken") || "";

    const resend = new ResendAPI(provider.apiKey);
    const { data, error } = await resend.emails.send({
      from:
        process.env.AUTH_EMAIL ??
        "PrintBridge <noreply@invite.printbridge.printrail.com>",
      to: [email],
      subject: `Join ${organizationName} on PrintBridge`,
      html: generateInviteEmail({
        organizationName,
        code: token,
        orgToken,
        expires,
        inviterEmail,
        role,
        url,
      }),
    });

    if (error) {
      console.error(error);
      throw new Error(JSON.stringify(error));
    }
  },
});
