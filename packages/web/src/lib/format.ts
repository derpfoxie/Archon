/** Localizable unit suffixes for duration formatting. */
export interface DurationUnits {
  ms: string;
  s: string;
  m: string;
}

const DEFAULT_UNITS: DurationUnits = { ms: 'ms', s: 's', m: 'm' };

/** Ensure a timestamp string ends with 'Z' for UTC parsing. */
export function ensureUtc(timestamp: string): string {
  return timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
}

/** Format the duration between two timestamps as a human-readable string. */
export function formatDuration(
  startedAt: string,
  completedAt: string | null,
  units: DurationUnits = DEFAULT_UNITS
): string {
  const start = new Date(ensureUtc(startedAt)).getTime();
  const end = completedAt ? new Date(ensureUtc(completedAt)).getTime() : Date.now();
  return formatDurationMs(end - start, units);
}

/** Format a started_at timestamp as a short locale string (e.g., "Mar 10, 2:30 PM"). */
export function formatStarted(startedAt: string): string {
  const d = new Date(ensureUtc(startedAt));
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a duration in milliseconds as a human-readable string (e.g., "1.2s", "3.5m"). */
export function formatDurationMs(ms: number, units: DurationUnits = DEFAULT_UNITS): string {
  if (ms < 1000) return `${String(ms)}${units.ms}`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}${units.s}`;
  return `${(ms / 60000).toFixed(1)}${units.m}`;
}
