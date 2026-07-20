/**
 * Shifty in-app toast notifications (custom window, top-center).
 * Serial queue so chained prompts (Start → Quit ask) never race or get dropped.
 */

import * as windows from './windows.js';

/** @type {Promise<void>} */
let queueTail = Promise.resolve();

/**
 * Enqueue a toast. Resolves when the user acts or it auto-dismisses.
 * @returns {Promise<'primary'|'dismiss'|'timeout'|'hidden'>}
 */
export function show({
  title,
  body = '',
  primaryLabel = null,
  onPrimary = null,
  onDismiss = null,
  durationMs,
  kind,
} = {}) {
  const hasAction = Boolean(primaryLabel && onPrimary);
  const resolvedDuration =
    durationMs !== undefined
      ? durationMs
      : hasAction
        ? 20_000 // action toasts stay up longer
        : 5_500;

  const run = () =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (reason) => {
        if (settled) return;
        settled = true;
        resolve(reason);
      };

      windows.showToast({
        title: title || 'Shifty',
        body: body || '',
        primaryLabel: hasAction ? primaryLabel : null,
        kind: kind || (hasAction ? 'action' : 'info'),
        durationMs: resolvedDuration,
        onPrimary: hasAction
          ? () => {
              // Release the queue *before* running the action so follow-up
              // toasts (e.g. Quit ask after Start) can enqueue without deadlock.
              finish('primary');
              setTimeout(() => {
                try {
                  const r = onPrimary();
                  if (r && typeof r.then === 'function') {
                    r.catch((err) => console.error('[notifications] onPrimary', err));
                  }
                } catch (err) {
                  console.error('[notifications] onPrimary', err);
                }
              }, 0);
            }
          : null,
        onDismiss: () => {
          try {
            onDismiss?.();
          } catch (err) {
            console.error('[notifications] onDismiss', err);
          }
          finish('dismiss');
        },
        onTimeout: () => finish('timeout'),
      });
    }).then(async (reason) => {
      // Brief gap so exit animation can finish before the next toast
      await delay(280);
      return reason;
    });

  // Serialize: each toast waits for the previous one to fully finish
  const job = queueTail.then(run, run);
  queueTail = job.then(
    () => undefined,
    () => undefined
  );
  return job;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Scheduled start prompt — primary action activates the profile. */
export function showStartPrompt(profile, onStart) {
  const count = profile.apps?.length ?? 0;
  const name = `${profile.emoji ? `${profile.emoji} ` : ''}${profile.name}`.trim();
  return show({
    title: `Start ${name}?`,
    body:
      count === 0
        ? 'Switch to this profile now'
        : `Open ${count} app${count === 1 ? '' : 's'} for this profile`,
    primaryLabel: 'Start',
    onPrimary: onStart,
    kind: 'action',
  });
}

/**
 * After a switch: offer to quit previous profile apps.
 * @returns {Promise<'primary'|'dismiss'|'timeout'|'hidden'>}
 */
export function showQuitPrompt(prevProfileName, apps, onQuit) {
  const list = apps ?? [];
  const names = list
    .map((a) => a.name || 'App')
    .slice(0, 3)
    .join(', ');
  const extra = list.length > 3 ? ` +${list.length - 3} more` : '';
  return show({
    title: `Quit ${prevProfileName} apps?`,
    body: list.length === 0 ? 'Close apps from the previous profile' : `${names}${extra}`,
    primaryLabel: 'Quit apps',
    onPrimary: onQuit,
    kind: 'destructive',
  });
}

/** Plain informational toast. */
export function notify(title, body, kind = 'success') {
  return show({ title, body, kind });
}

/**
 * Dev-only previews for every toast kind used in production.
 * @param {'info'|'success'|'action'|'destructive'|'schedule-start'|'schedule-auto'|'quit-ask'|'chain'} type
 */
export function preview(type) {
  switch (type) {
    case 'info':
      return show({
        title: 'Info toast',
        body: 'Neutral message — permissions, tips, etc.',
        kind: 'info',
        durationMs: 8_000,
      });
    case 'success':
      return notify('Work', 'Opened 4 apps on schedule');
    case 'action':
      return show({
        title: 'Action toast',
        body: 'Primary button for a quick confirm',
        primaryLabel: 'Confirm',
        onPrimary: () => notify('Action', 'Primary clicked'),
        kind: 'action',
      });
    case 'destructive':
      return show({
        title: 'Destructive toast',
        body: 'Used for quitting previous-profile apps',
        primaryLabel: 'Quit apps',
        onPrimary: () => notify('Quit', 'Would quit apps (dev preview)'),
        kind: 'destructive',
      });
    case 'schedule-start':
      return showStartPrompt(
        { name: 'Work', emoji: '💼', apps: [{ name: 'Safari' }, { name: 'Slack' }, { name: 'Mail' }] },
        () => notify('Schedule', 'Would start Work (dev preview)')
      );
    case 'schedule-auto':
      return notify('💼 Work', 'Opened 3 apps on schedule');
    case 'quit-ask':
      return showQuitPrompt(
        'Personal',
        [{ name: 'Messages' }, { name: 'Music' }, { name: 'Photos' }],
        () => notify('Quit', 'Would quit Personal apps (dev preview)')
      );
    case 'chain':
      // Full Start → Quit sequence for QA
      return showStartPrompt(
        { name: 'Work', emoji: '💼', apps: [{ name: 'Safari' }, { name: 'Slack' }] },
        async () => {
          /* start accepted */
        }
      ).then(() =>
        showQuitPrompt(
          'Personal',
          [{ name: 'Messages' }, { name: 'Music' }],
          () => notify('Chain', 'Quit confirmed (dev preview)')
        )
      );
    default:
      return notify('Unknown preview', `No toast type “${type}”`);
  }
}
