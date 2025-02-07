// auth.ts
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { Resend as ResendAPI } from "resend";
import { OrgInviteByEmail } from "../components/organizations/organization-invite-email";

export const OrganizationInvite = Email({
  id: "org-invite",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 20,

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

    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL ?? "PrintBridge <noreply@printbridge.app>",
      to: [email],
      subject: `Join ${organizationName} on PrintBridge`,
      react: OrgInviteByEmail({
        organizationName,
        code: token,
        expires,
        inviterEmail,
        role,
      }),
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
