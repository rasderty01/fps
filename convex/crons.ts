import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "check and send pending organization invites",
  { minutes: 15 }, // every 15 minutes
  internal.invites.processInvites,
);

export default crons;
