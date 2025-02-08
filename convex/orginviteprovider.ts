import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";

// Constants for better maintainability
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60; // 30 days in minutes
const VERIFICATION_CODE_LENGTH = 8;

interface InviteEmailProps {
  organizationName: string;
  code: string;
  orgToken: string;
  expires: Date;
  inviterEmail: string;
  role: string;
  url: string;
}

function formatTimeRemaining(expiryDate: Date): string {
  const millisecondsRemaining = expiryDate.getTime() - Date.now();

  // Convert to days with decimal points
  const daysRemaining = millisecondsRemaining / (1000 * 60 * 60 * 24);

  // Round up to nearest whole number to avoid showing 0 days when there's still time
  const roundedDays = Math.ceil(daysRemaining);

  // Handle edge cases
  if (roundedDays <= 0) {
    return "expired";
  }

  return `${roundedDays} day${roundedDays !== 1 ? "s" : ""}`;
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
  const searchParams = baseUrl.searchParams;

  if (!searchParams.has("orgToken")) {
    searchParams.set("orgToken", orgToken);
  }
  searchParams.set("inviteToken", code);

  const verifyUrl = baseUrl.toString();
  const timeRemaining = formatTimeRemaining(expires);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <title>Join ${organizationName} on PrintBridge</title>
      </head>
      <body style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.4;
        margin: 0;
        padding: 20px;
        color: #333;
        background-color: #f9fafb;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        ">
          <h1 style="
            color: #2563eb;
            margin-bottom: 24px;
            font-size: 24px;
            font-weight: 600;
          ">Join ${organizationName}</h1>
          
          <p style="margin-bottom: 16px;">
            You've been invited by <strong>${inviterEmail}</strong> to join 
            <strong>${organizationName}</strong> as a <strong>${role}</strong>.
          </p>

          <div style="
            background: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
          ">
            <p style="
              margin: 0;
              font-size: 24px;
              letter-spacing: 2px;
              text-align: center;
              font-family: monospace;
              color: #1f2937;
            ">${code}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="
                 background-color: #2563eb;
                 color: white;
                 padding: 12px 24px;
                 border-radius: 6px;
                 text-decoration: none;
                 font-weight: 500;
                 display: inline-block;
                 transition: background-color 0.2s;
               "
               onmouseover="this.style.backgroundColor='#1d4ed8'"
               onmouseout="this.style.backgroundColor='#2563eb'">
              Join Organization
            </a>
          </div>

          <p style="
            color: #6b7280;
            font-size: 14px;
            text-align: center;
            margin-top: 24px;
          ">
            This invitation expires in ${timeRemaining}.
          </p>
        </div>
      </body>
    </html>
  `;
}

export const OrganizationInvite = Email({
  id: "org-invite",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: THIRTY_DAYS_IN_MINUTES,

  from:
    process.env.INVITE_EMAIL ??
    "PrintBridge <noreply@invite.printbridge.printrail.com>",
  name: "Organization Invite",

  async generateVerificationToken() {
    return generateRandomString(VERIFICATION_CODE_LENGTH, alphabet("0-9"));
  },

  async sendVerificationRequest({
    identifier: email,
    provider,
    token,
    expires,
    url,
  }) {
    try {
      const searchParams = new URL(url).searchParams;
      const organizationName = searchParams.get("orgName") || "Organization";
      const inviterEmail = searchParams.get("inviter") || "Admin";
      const role = searchParams.get("role") || "member";
      const orgToken = searchParams.get("orgToken") || "";

      const resend = new ResendAPI(provider.apiKey);
      const { error } = await resend.emails.send({
        from: provider.from ?? process.env.INVITE_EMAIL!,
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
        throw new Error(
          `Failed to send invite email: ${JSON.stringify(error)}`,
        );
      }
    } catch (error) {
      console.error("Error sending organization invite:", error);
      throw error;
    }
  },
});
