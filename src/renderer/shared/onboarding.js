const STORAGE_KEY = 'shifty.onboardingCompleted';

export function readOnboardingCompleted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
