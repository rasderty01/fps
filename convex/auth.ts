import GitHub from "@auth/core/providers/github";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { OrganizationInvite } from "./orginviteprovider";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Resend({ from: `auth@invite.printbridge.printrail.com` }),
    OrganizationInvite,
  ],
});
