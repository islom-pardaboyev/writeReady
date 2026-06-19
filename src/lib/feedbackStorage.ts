export type FeedbackEntry = {
  id: string;
  mode: "Mock" | "Practice" | "Relax";
  task: 1 | 2;
  question: string;
  response: string;
  createdAt: string;
};

const FEEDBACK_STORAGE_KEY = "writeready_feedback_entries";

export function getFeedbackEntries(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedbackEntry(
  entry: Omit<FeedbackEntry, "id" | "createdAt">,
) {
  if (typeof window === "undefined") return;

  const nextEntry: FeedbackEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };

  const entries = getFeedbackEntries();
  const updated = [nextEntry, ...entries].slice(0, 100);

  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
}
