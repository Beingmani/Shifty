/**
 * Predefined profile templates — resolved against apps installed on this Mac.
 * Users get a ready-to-edit profile; missing apps are simply skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as appScanner from './appScanner.js';

const HOME_APPS = path.join(os.homedir(), 'Applications');

/**
 * Candidate app names (basename without .app). First match wins per entry.
 * Arrays allow aliases (e.g. "Visual Studio Code" | "Code").
 */
const TEMPLATES = [
  {
    id: 'work',
    name: 'Work',
    emoji: '💼',
    description: 'Weekday focus — chat, calendar, browser, and your editor.',
    quitPrevious: 'ask',
    autoActivate: false,
    schedule: { enabled: false, days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
    appCandidates: [
      ['Slack'],
      ['Microsoft Teams', 'Teams'],
      ['Zoom'],
      ['Calendar'],
      ['Mail'],
      ['Google Chrome', 'Chromium', 'Arc', 'Microsoft Edge', 'Brave Browser'],
      ['Safari'],
      ['Visual Studio Code', 'Code', 'Cursor', 'Zed'],
      ['Notion'],
      ['Figma'],
      ['Linear'],
      ['Spotify'],
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    emoji: '🏠',
    description: 'Evenings & weekends — messages, media, and browsing.',
    quitPrevious: 'ask',
    autoActivate: false,
    schedule: { enabled: false, days: [0, 5, 6], start: '18:00', end: '22:00' },
    appCandidates: [
      ['Messages'],
      ['Safari'],
      ['Music'],
      ['Photos'],
      ['TV'],
      ['Podcasts'],
      ['Spotify'],
      ['Netflix'],
      ['WhatsApp'],
      ['Telegram'],
      ['Discord'],
      ['Google Chrome', 'Arc', 'Firefox'],
    ],
  },
  {
    id: 'focus',
    name: 'Focus',
    emoji: '🎯',
    description: 'Deep work — editor and notes, minimal distractions.',
    quitPrevious: 'always',
    autoActivate: false,
    schedule: { enabled: false, days: [1, 2, 3, 4, 5], start: '09:00', end: '12:00' },
    appCandidates: [
      ['Visual Studio Code', 'Code', 'Cursor', 'Zed', 'Nova', 'Sublime Text'],
      ['Notion', 'Obsidian', 'Bear', 'Notes'],
      ['Safari', 'Google Chrome', 'Arc'],
      ['Music', 'Spotify'],
      ['Calendar'],
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    emoji: '✨',
    description: 'Empty profile — add whatever you want.',
    quitPrevious: 'ask',
    autoActivate: false,
    schedule: { enabled: false, days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
    appCandidates: [],
  },
];

function pathIfApp(dir, name) {
  const full = path.join(dir, `${name}.app`);
  try {
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) return full;
  } catch {
    /* ignore */
  }
  return null;
}

/** Resolve a single app name against common install locations. */
function resolveAppPath(name) {
  const roots = ['/Applications', '/System/Applications', HOME_APPS, '/Applications/Utilities'];
  for (const root of roots) {
    const hit = pathIfApp(root, name);
    if (hit) return hit;
  }
  return null;
}

/**
 * Match candidate aliases against a scanned app list (name, case-insensitive).
 * @param {string[]} aliases
 * @param {{ path: string, name: string }[]} scanned
 */
function matchScanned(aliases, scanned) {
  const lower = aliases.map((a) => a.toLowerCase());
  for (const a of scanned) {
    const n = (a.name || '').toLowerCase();
    if (lower.includes(n)) return a;
  }
  // Prefix / contains (e.g. "Google Chrome" vs "Chrome")
  for (const a of scanned) {
    const n = (a.name || '').toLowerCase();
    for (const alias of lower) {
      if (n === alias || n.includes(alias) || alias.includes(n)) {
        if (alias.length >= 4 || n.length >= 4) return a;
      }
    }
  }
  return null;
}

/**
 * Build the apps array for a template from this machine’s installs.
 */
export async function resolveTemplateApps(appCandidates) {
  let scanned = [];
  try {
    scanned = await appScanner.scanApps({ force: false });
  } catch {
    scanned = [];
  }

  const apps = [];
  const seen = new Set();

  for (const aliases of appCandidates ?? []) {
    if (!aliases?.length) continue;

    // 1) Exact path probes (fast, no scan needed)
    let resolved = null;
    for (const name of aliases) {
      const p = resolveAppPath(name);
      if (p) {
        resolved = { path: p, name: path.basename(p, '.app') };
        break;
      }
    }

    // 2) Fall back to full scan name match
    if (!resolved && scanned.length) {
      const hit = matchScanned(aliases, scanned);
      if (hit) resolved = { path: hit.path, name: hit.name };
    }

    if (!resolved) continue;
    const key = path.resolve(resolved.path);
    if (seen.has(key)) continue;
    seen.add(key);
    apps.push({
      path: resolved.path,
      name: resolved.name,
    });
  }

  return apps;
}

/** Public list for UI (with resolved app counts). */
export async function listTemplates() {
  const out = [];
  for (const t of TEMPLATES) {
    const apps = await resolveTemplateApps(t.appCandidates);
    out.push({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      description: t.description,
      quitPrevious: t.quitPrevious,
      autoActivate: t.autoActivate,
      schedule: t.schedule,
      suggestedAppNames: (t.appCandidates ?? []).map((a) => a[0]),
      resolvedApps: apps,
      resolvedCount: apps.length,
    });
  }
  return out;
}

/** Materialize a template into a profile payload (no id — store assigns). */
export async function buildProfileFromTemplate(templateId) {
  const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES.find((x) => x.id === 'blank');
  const apps = await resolveTemplateApps(t.appCandidates);
  return {
    name: t.name,
    emoji: t.emoji,
    apps,
    schedule: { ...t.schedule },
    autoActivate: t.autoActivate,
    quitPrevious: t.quitPrevious,
    templateId: t.id,
  };
}
