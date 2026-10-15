export const DRAFT_LIMIT_PER_HOUR = 20;
export const DRAFT_WINDOW_MS = 60 * 60 * 1000;

// `recentDrafts` = this user's ai_drafts rows created within the window.
export function canDraft(
  recentDrafts: number,
  limit: number = DRAFT_LIMIT_PER_HOUR,
): boolean {
  return recentDrafts < limit;
}
