export const STEPS_HEADING =
  "Suggested fix (AI-suggested, verify before work):";

// Faithful description first, then the suggested steps as a bullet list.
export function composeDescription(
  description: string,
  steps: string[],
): string {
  if (steps.length === 0) return description;
  return `${description}\n\n${STEPS_HEADING}\n${steps.map((s) => `- ${s}`).join("\n")}`;
}
