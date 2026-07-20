import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import * as store from './store.js';
import * as notifications from './notifications.js';

const execFileP = promisify(execFile);

// Never quit these, even if a profile somehow contains them.
const NEVER_QUIT = new Set([
  'Finder',
  'Shifty',
  'Electron',
  'System Events',
  'System Settings',
  'System Preferences',
]);

const VALID_POLICIES = new Set(['ask', 'always', 'never']);

function appName(appPath) {
  return path.basename(appPath, '.app');
}

function resolveQuitPolicy(profile, quitPreviousOverride) {
  if (typeof quitPreviousOverride === 'boolean') {
    return quitPreviousOverride ? 'always' : 'never';
  }
  if (typeof quitPreviousOverride === 'string' && VALID_POLICIES.has(quitPreviousOverride)) {
    return quitPreviousOverride;
  }
  const fromProfile = profile?.quitPrevious;
  if (VALID_POLICIES.has(fromProfile)) return fromProfile;
  return 'ask';
}

async function launchApp(appPath) {
  await execFileP('open', ['-a', appPath], { timeout: 15_000 });
}

async function quitApp(app) {
  const appPath = typeof app === 'string' ? app : app?.path;
  if (!appPath) return;

  const name = appName(appPath);
  if (NEVER_QUIT.has(name)) return;

  const bundleId = typeof app === 'object' ? app.bundleId : null;
  const escapedName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const scripts = [];
  if (bundleId) {
    const escapedId = String(bundleId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    scripts.push(`tell application id "${escapedId}" to quit`);
  }
  scripts.push(`tell application "${escapedName}" to quit`);

  let lastErr = null;
  for (const script of scripts) {
    try {
      await execFileP('osascript', ['-e', script], { timeout: 8_000 });
      return;
    } catch (err) {
      lastErr = err;
      const msg = String(err.stderr || err.message || '');
      if (msg.includes('-1743')) {
        notifications.notify(
          'Shifty needs permission',
          'Enable Shifty under System Settings → Privacy & Security → Automation to quit apps.'
        );
        return;
      }
    }
  }
  if (lastErr) {
    const msg = String(lastErr.stderr || lastErr.message || '');
    if (!/isn'?t running|connection is invalid|-600|not running/i.test(msg)) {
      console.warn('[launcher] quit failed for', name, msg);
    }
  }
}

export async function quitApps(apps) {
  await Promise.all((apps ?? []).map((a) => quitApp(a)));
}

/**
 * Apps on `prev` that are not also on `next` (by resolved path).
 * Shared apps stay open so the handoff doesn't kill e.g. a shared browser.
 */
export function appsToQuit(prevApps, nextApps) {
  const keep = new Set((nextApps ?? []).map((a) => path.resolve(a.path)));
  return (prevApps ?? []).filter((a) => a?.path && !keep.has(path.resolve(a.path)));
}

/**
 * Activate a profile: open its apps, then handle previous profile apps
 * per the *destination* profile's quitPrevious ("ask" | "always" | "never").
 *
 * @param {string} id
 * @param {object} [opts]
 * @param {boolean|string} [opts.quitPrevious] override policy
 * @param {boolean} [opts.silent] skip success toast (caller will notify)
 * @param {string} [opts.source] 'schedule' | 'switcher' | 'tray' | etc.
 */
export async function activateProfile(id, opts = {}) {
  const { quitPrevious: quitOverride, silent = false, source } = opts;
  const profile = store.getProfile(id);
  if (!profile) {
    return { ok: false, errors: [`No profile with id ${id}`], launched: [], quit: [], policy: 'ask' };
  }

  const prevId = store.getState().activeProfileId;
  const prev = prevId && prevId !== id ? store.getProfile(prevId) : null;
  const policy = resolveQuitPolicy(profile, quitOverride);

  const errors = [];
  const launched = [];
  await Promise.all(
    (profile.apps ?? []).map(async (a) => {
      try {
        await launchApp(a.path);
        launched.push(a.name || appName(a.path));
      } catch (err) {
        errors.push(`${a.name || a.path}: ${err.message}`);
      }
    })
  );

  store.setActiveProfile(id);

  const quit = [];
  let quitAsked = false;

  if (prev) {
    const toQuit = appsToQuit(prev.apps, profile.apps);
    if (toQuit.length > 0) {
      if (policy === 'always') {
        await quitApps(toQuit);
        quit.push(...toQuit.map((a) => a.name || appName(a.path)));
      } else if (policy === 'ask') {
        quitAsked = true;
        const prevName = prev.name || 'previous profile';
        // Awaited via toast queue — never races with a prior Start toast
        await notifications.showQuitPrompt(prevName, toQuit, () => quitApps(toQuit));
      }
      // never → leave running
    }
  }

  // Success feedback (skip when caller handles messaging, or when quit-ask already informed)
  if (!silent && !quitAsked) {
    const name = `${profile.emoji ? `${profile.emoji} ` : ''}${profile.name}`.trim() || 'Profile';
    if (errors.length > 0 && launched.length === 0) {
      await notifications.notify(
        `Couldn’t open apps for ${name}`,
        errors.slice(0, 2).join(' · '),
        'info'
      );
    } else if (launched.length > 0 || source === 'schedule') {
      let body =
        launched.length > 0
          ? `Opened ${launched.length} app${launched.length === 1 ? '' : 's'}`
          : 'Profile activated';
      if (quit.length > 0) {
        body += ` · quit ${quit.length} from previous`;
      }
      await notifications.notify(name, body, 'success');
    }
  } else if (!silent && quitAsked && launched.length > 0) {
    // After quit-ask toast is answered/dismissed, confirm apps opened
    const name = `${profile.emoji ? `${profile.emoji} ` : ''}${profile.name}`.trim() || 'Profile';
    // Fire-and-forget on the queue (quit prompt already awaited above)
    void notifications.notify(
      name,
      `Opened ${launched.length} app${launched.length === 1 ? '' : 's'}`,
      'success'
    );
  }

  return {
    ok: errors.length === 0,
    launched,
    quit,
    errors,
    policy,
    quitAsked,
    prevId: prev?.id ?? null,
  };
}
