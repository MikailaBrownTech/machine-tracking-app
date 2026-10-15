import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "viewer",
        input: false,
      },
      deactivatedAt: { type: "date", required: false, input: false },
    },
  },
  session: { modelName: "sessions" },
  account: { modelName: "accounts" },
  verification: { modelName: "verifications" },
  databaseHooks: {
    session: {
      create: {
        // Runs on every sign-in; blocks deactivated users from getting a session.
        before: async (session) => {
          const [user] = await db
            .select({ deactivatedAt: schema.users.deactivatedAt })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1);
          if (user?.deactivatedAt) {
            throw new APIError("FORBIDDEN", {
              message: "This account has been deactivated.",
            });
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
