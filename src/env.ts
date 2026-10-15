import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_URL_UNPOOLED: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // AI intake is hidden when the key is missing.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).default("claude-haiku-5-5"),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
  AI_MODEL: process.env.AI_MODEL || undefined,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
