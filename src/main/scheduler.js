import { powerMonitor } from 'electron';
import * as store from './store.js';
import * as notifications from './notifications.js';
import { atTime, computeNextTrigger, computeMissedTrigger } from './scheduleMath.js';

// setTimeout is unreliable across sleep / background throttle, so we:
//  1. Cap timer delays and re-arm
//  2. Poll periodically for any due schedule windows
const MAX_TIMER_MS = 6 * 60 * 60 * 1000;
const TICK_MS = 30_000;

let timer = null;
let tickTimer = null;
let activate = null; // injected: (profileId, opts) => Promise
let firing = false;

/**
 * Run a schedule trigger for a profile id (always re-reads store).
 *
 * notify  → toast "Start?" → on accept activate (which may chain quit-ask)
 * auto    → activate immediately (success + optional quit-ask toasts queued)
 */
async function fire(profileId) {
  const profile = store.getProfile(profileId);
  if (!profile?.schedule?.enabled) return;
  if (!activate) {
    console.error('[scheduler] activate() not initialized');
    return;
  }

  if (profile.autoActivate) {
    try {
      // silent: activateProfile owns success / quit-ask messaging
      await activate(profile.id, { source: 'schedule', silent: false });
    } catch (err) {
      console.error('[scheduler] auto-activate failed', err);
      await notifications.notify(
        'Shifty couldn’t switch profiles',
        err?.message || 'Automatic schedule activation failed.',
        'info'
      );
    }
    return;
  }

  // Notify mode — if already this profile, still offer re-open only when there are apps
  if (store.getState().activeProfileId === profile.id) {
    if ((profile.apps ?? []).length === 0) return;
    // Soft re-prompt to re-open apps for the current scheduled profile
    await notifications.showStartPrompt(profile, async () => {
      await activate(profile.id, { source: 'schedule', silent: false });
    });
    return;
  }

  await notifications.showStartPrompt(profile, async () => {
    await activate(profile.id, { source: 'schedule', silent: false });
  });
}

/** Fire at most one due schedule (latest missed in window). */
async function processDue() {
  if (firing) return;
  const now = new Date();
  const since = store.getLastScheduleCheck();

  let latest = null;
  let latestId = null;
  for (const profile of store.getProfiles()) {
    const missed = computeMissedTrigger(profile, since, now);
    if (!missed) continue;
    const end = profile.schedule.end ? atTime(missed, profile.schedule.end) : null;
    if (end && end > missed && now > end) continue;
    if (!latest || missed > latest) {
      latest = missed;
      latestId = profile.id;
    }
  }

  if (!latestId) return;

  firing = true;
  try {
    // Advance watermark first so a slow activate doesn't double-fire on the next tick
    store.setLastScheduleCheck(now.getTime());
    await fire(latestId);
  } finally {
    firing = false;
  }
}

function armAll() {
  if (timer) clearTimeout(timer);
  timer = null;

  const now = new Date();
  let earliest = null;
  for (const profile of store.getProfiles()) {
    const next = computeNextTrigger(profile, now);
    if (next && (!earliest || next < earliest)) {
      earliest = next;
    }
  }
  if (!earliest) return;

  const delay = Math.min(Math.max(earliest.getTime() - now.getTime(), 0), MAX_TIMER_MS);
  timer = setTimeout(() => {
    processDue().finally(() => armAll());
  }, delay);
}

function catchUp() {
  return processDue();
}

export function init({ activate: activateFn }) {
  activate = activateFn;
  catchUp().finally(() => armAll());

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    processDue().then(() => armAll());
  }, TICK_MS);

  store.events.on('changed', (what) => {
    if (what === 'profiles' || what === 'state') {
      processDue().finally(() => armAll());
    }
  });

  powerMonitor.on('resume', () => {
    catchUp().finally(() => armAll());
  });
  powerMonitor.on('unlock-screen', () => {
    catchUp().finally(() => armAll());
  });
}
