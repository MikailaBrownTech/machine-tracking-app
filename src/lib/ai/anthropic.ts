import Anthropic from "@anthropic-ai/sdk";
import type { Complete, Completion } from "./intake.ts";
import { intakeJsonSchema } from "./intake-schema.ts";

// Server-only: the key never reaches client code. No tools, no database access.
export function createAnthropicCompleter(config: {
  apiKey: string;
  model: string;
}): Complete {
  const client = new Anthropic({
    apiKey: config.apiKey,
    timeout: 15_000,
    maxRetries: 1,
  });

  return async (system, user): Promise<Completion> => {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 900,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        format: { type: "json_schema", schema: intakeJsonSchema },
      },
    });
    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
    const stop = message.stop_reason;
    return {
      stopReason:
        stop === "refusal" || stop === "max_tokens" || stop === "end_turn"
          ? stop
          : "other",
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  };
}
