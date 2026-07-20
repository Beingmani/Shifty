import Store from 'electron-store';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

const DEFAULT_PROFILE = {
  name: 'Untitled',
  emoji: '🗂️',
  apps: [],
  schedule: { enabled: false, days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
  autoActivate: false,
  quitPrevious: 'ask',
};

const store = new Store({
  name: 'shifty',
  defaults: {
    profiles: [],
    settings: { hotkey: 'Alt+Space', launchAtLogin: false, appearance: 'system' },
    state: { activeProfileId: null, lastScheduleCheck: 0 },
    cache: { appIcons: {} },
  },
});

export const events = new EventEmitter();

function emitChanged(what) {
  events.emit('changed', what);
}

export function getSnapshot() {
  return {
    profiles: getProfiles(),
    settings: getSettings(),
    activeProfileId: store.get('state.activeProfileId'),
  };
}

export function getProfiles() {
  return store.get('profiles');
}

export function getProfile(id) {
  if (!id) return null;
  return getProfiles().find((p) => p.id === id) ?? null;
}

const VALID_QUIT = new Set(['ask', 'always', 'never']);

export function saveProfile(profile) {
  const profiles = getProfiles();
  let saved;
  if (profile.id) {
    const i = profiles.findIndex((p) => p.id === profile.id);
    if (i === -1) throw new Error(`No profile with id ${profile.id}`);
    saved = { ...profiles[i], ...profile };
    profiles[i] = saved;
  } else {
    saved = {
      ...DEFAULT_PROFILE,
      ...profile,
      id: randomUUID(),
      schedule: { ...DEFAULT_PROFILE.schedule, ...(profile.schedule ?? {}) },
    };
    profiles.push(saved);
  }
  // Normalize quit policy so "When switching here" always has a valid value
  if (!VALID_QUIT.has(saved.quitPrevious)) {
    saved.quitPrevious = 'ask';
  }
  store.set('profiles', profiles);
  emitChanged('profiles');
  return saved;
}

export function deleteProfile(id) {
  store.set('profiles', getProfiles().filter((p) => p.id !== id));
  if (store.get('state.activeProfileId') === id) {
    store.set('state.activeProfileId', null);
  }
  emitChanged('profiles');
}

export function getSettings() {
  return store.get('settings');
}

export function setSettings(partial) {
  const next = { ...getSettings(), ...partial };
  store.set('settings', next);
  emitChanged('settings');
  return next;
}

export function getState() {
  return store.get('state');
}

export function setActiveProfile(id) {
  store.set('state.activeProfileId', id);
  emitChanged('state');
}

export function getLastScheduleCheck() {
  return store.get('state.lastScheduleCheck') ?? 0;
}

export function setLastScheduleCheck(ms) {
  store.set('state.lastScheduleCheck', ms);
}

export function getIconCache() {
  return store.get('cache.appIcons') ?? {};
}

export function setIconCache(cache) {
  store.set('cache.appIcons', cache);
}

export function getIconCacheVersion() {
  return store.get('cache.iconCacheVersion') ?? 0;
}

export function setIconCacheVersion(version) {
  store.set('cache.iconCacheVersion', version);
}
