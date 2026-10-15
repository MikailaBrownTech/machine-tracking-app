import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
});

const parsed = schema.safeParse({ DATABASE_URL: process.env.DATABASE_URL });

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
