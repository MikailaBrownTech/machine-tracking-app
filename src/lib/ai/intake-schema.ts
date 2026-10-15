// Hand-written JSON schema sent as output_config.format. It cannot enforce
// string lengths, so intake.ts validates them with Zod. A test keeps the keys
// and enum values in sync with that Zod schema.
export const intakeJsonSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Short summary, under 80 characters",
    },
    description: {
      type: "string",
      description: "Plain text: observation, what to check or do, unknowns",
    },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    rationale: {
      type: "string",
      description: "One short sentence explaining the priority",
    },
  },
  required: ["title", "description", "priority", "rationale"],
  additionalProperties: false,
} as const;
