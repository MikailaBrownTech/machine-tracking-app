// Hand-written JSON schema sent as output_config.format. It cannot enforce
// string lengths or array sizes, so intake.ts validates them with Zod. A test keeps the keys
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
      description:
        "1-4 short sentences in the technician's voice, restating only the note",
    },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    rationale: {
      type: "string",
      description: "One short sentence explaining the priority",
    },
    low_detail: {
      type: "boolean",
      description: "True if the note lacks a concrete symptom, part or action",
    },
    questions: {
      type: "array",
      items: { type: "string" },
      description: "Up to 3 short questions; empty when low_detail is false",
    },
    suggested_steps: {
      type: "array",
      items: { type: "string" },
      description:
        "Ordered suggested fix steps, safe checks first; empty array allowed",
    },
  },
  required: [
    "title",
    "description",
    "priority",
    "rationale",
    "low_detail",
    "questions",
    "suggested_steps",
  ],
  additionalProperties: false,
} as const;
