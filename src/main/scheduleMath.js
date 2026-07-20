// Pure schedule math — no Electron imports, so it can be unit-tested with plain node.

export function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

export function atTime(date, hhmm) {
  const { h, m } = parseTime(hhmm);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

const CATCH_UP_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Next schedule trigger for a profile strictly after `from`, or null. */
export function computeNextTrigger(profile, from = new Date()) {
  const s = profile.schedule;
  if (!s?.enabled || !s.days?.length || !s.start) return null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(from);
    day.setDate(day.getDate() + offset);
    if (!s.days.includes(day.getDay())) continue;
    const candidate = atTime(day, s.start);
    if (candidate > from) return candidate;
  }
  return null;
}

/**
 * Most recent trigger in (since, now] within the last 24h, or null.
 * `since` may be a ms timestamp or Date.
 */
export function computeMissedTrigger(profile, since, now = new Date()) {
  const s = profile.schedule;
  if (!s?.enabled || !s.days?.length || !s.start) return null;
  const sinceMs = since instanceof Date ? since.getTime() : Number(since) || 0;
  const floor = Math.max(sinceMs, now.getTime() - CATCH_UP_WINDOW_MS);
  // Look back a few days so we don't miss a trigger after sleep / long gaps
  for (let offset = 0; offset >= -7; offset--) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    if (!s.days.includes(day.getDay())) continue;
    const candidate = atTime(day, s.start);
    if (candidate.getTime() > floor && candidate.getTime() <= now.getTime()) {
      return candidate;
    }
  }
  return null;
}
