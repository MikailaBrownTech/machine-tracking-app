// Fixed to UTC so server and client render identically.
const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatDateTime(date: Date): string {
  return formatter.format(date);
}

// First segment of a UUID: short enough to read aloud, shown in mono.
export function shortId(id: string): string {
  return id.slice(0, 8);
}
