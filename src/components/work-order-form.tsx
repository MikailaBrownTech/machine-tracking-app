"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { DraftResult } from "@/app/work-orders/ai-actions";
import type { WorkOrderFormState } from "@/app/work-orders/actions";
import { describedBy, Field, nativeSelectClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { composeDescription } from "@/lib/ai/compose";
import { clearFlash, setFlash } from "@/lib/flash";

const hints = {
  title: "A short summary, like “Replace spindle belt”.",
  description: "What is wrong and what needs doing. Optional.",
  priority: "High priority work shows on the dashboard until started.",
} as const;

type Priority = "low" | "medium" | "high";
type DraftMeta = {
  draftId: string;
  rationale: string;
  lowDetail: boolean;
  questions: string[];
};

export function WorkOrderForm({
  action,
  draftAction,
  cancelHref,
}: {
  action: (
    prev: WorkOrderFormState,
    formData: FormData,
  ) => Promise<WorkOrderFormState>;
  // Present only when AI drafting is enabled on the server.
  draftAction?: (note: string) => Promise<DraftResult>;
  cancelHref: string;
}) {
  // A successful create redirects, so the toast is shown on the next page.
  const [state, formAction, pending] = useActionState(
    async (prev: WorkOrderFormState, formData: FormData) => {
      setFlash("Work order created");
      const next = await action(prev, formData);
      clearFlash();
      return next;
    },
    {},
  );
  const errors = state.errors ?? {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<DraftMeta | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [drafting, startDrafting] = useTransition();

  function requestDraft() {
    if (!draftAction) return;
    setAiError(null);
    startDrafting(async () => {
      const result = await draftAction(note);
      if (!result.ok) {
        setAiError(result.error);
        return;
      }
      setTitle(result.draft.title);
      setDescription(
        composeDescription(
          result.draft.description,
          result.draft.suggested_steps,
        ),
      );
      setPriority(result.draft.priority);
      setDraft({
        draftId: result.draftId,
        rationale: result.draft.rationale,
        lowDetail: result.draft.low_detail,
        questions: result.draft.questions,
      });
    });
  }

  function discardDraft() {
    setDraft(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {draftAction && (
        <section
          aria-labelledby="ai-heading"
          className="flex flex-col gap-3 rounded-xl border bg-card p-4"
        >
          <h2
            id="ai-heading"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Sparkles className="size-5" aria-hidden />
            Draft with AI
          </h2>
          <Field
            label="What's wrong?"
            id="ai-note"
            hint="Your note and the asset's name, type and location are sent to an AI service to draft this."
          >
            <Textarea
              id="ai-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="e.g. Spindle is squealing on startup and the coolant pump is dripping. Stopped the line for now."
              aria-describedby="ai-note-hint"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={requestDraft}
              disabled={drafting || note.trim().length === 0}
              aria-busy={drafting}
            >
              {drafting ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <Sparkles aria-hidden />
              )}
              Draft with AI
            </Button>
            <p role="status" aria-live="polite" className="text-base">
              {drafting && (
                <span className="text-muted-foreground">Drafting…</span>
              )}
              {!drafting && aiError && (
                <span className="font-medium text-destructive">{aiError}</span>
              )}
              {!drafting && !aiError && draft && (
                <span className="text-muted-foreground">
                  Draft ready. Review the fields below.
                </span>
              )}
            </p>
          </div>
          {draft?.lowDetail && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-base text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-semibold">
                Short note, so this draft is minimal. Adding detail helps:
              </p>
              {draft.questions.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {draft.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {draft && (
            <div className="flex flex-col gap-2 rounded-lg border border-progress/40 bg-progress-soft p-3 text-progress-ink">
              <p className="text-base font-semibold">
                AI draft, review before saving
              </p>
              <p className="text-base">Why this priority: {draft.rationale}</p>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={discardDraft}
                  className="bg-card text-foreground"
                >
                  Discard draft
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
      {draft && <input type="hidden" name="draftId" value={draft.draftId} />}
      <Field label="Title" id="title" hint={hints.title} error={errors.title}>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={describedBy("title", hints.title, errors.title)}
        />
      </Field>
      <Field
        label="Description"
        id="description"
        hint={hints.description}
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!errors.description}
          aria-describedby={describedBy(
            "description",
            hints.description,
            errors.description,
          )}
        />
      </Field>
      <Field
        label="Priority"
        id="priority"
        hint={hints.priority}
        error={errors.priority}
      >
        <select
          id="priority"
          name="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className={nativeSelectClass}
          aria-invalid={!!errors.priority}
          aria-describedby={describedBy(
            "priority",
            hints.priority,
            errors.priority,
          )}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Field>
      {errors.form && (
        <p role="alert" className="text-base font-medium text-destructive">
          {errors.form}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>Create work order</SubmitButton>
      </div>
    </form>
  );
}
