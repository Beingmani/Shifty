import { useEffect, useState } from 'react';

/** Live snapshot of profiles + settings, kept in sync with the main process. */
export function useStore() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let mounted = true;
    window.shifty.listProfiles().then((s) => mounted && setSnapshot(s));
    const unsubscribe = window.shifty.onStoreChanged((s) => mounted && setSnapshot(s));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return snapshot; // null until loaded
}
