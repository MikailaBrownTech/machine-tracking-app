import { z } from "zod";
import { assetStatus } from "@/db/schema";

const required = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(200);

const optional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v === "" ? null : v));

export const assetInputSchema = z.object({
  name: required("Name"),
  type: required("Type"),
  location: optional,
  serial: optional,
  status: z.enum(assetStatus.enumValues),
});

export type AssetInput = z.infer<typeof assetInputSchema>;
