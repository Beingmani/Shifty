import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, RefreshCw, Search, X } from 'lucide-react';
import AppIcon from './AppIcon.jsx';
import AppDock from './AppDock.jsx';

/** Local shortcut shown in UI (macOS-only app). */
export const ADD_APPS_SHORTCUT_LABEL = '⌘⇧A';

function AppAddModal({
  open,
  query,
  setQuery,
  allApps,
  filtered,
  selectedPaths,
  onToggle,
  scanning,
  onScan,
  onClose,
  onConfirm,
  searchRef,
  iconLoadingPaths,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [open, searchRef]);

  if (!open) return null;

  const selectedCount = selectedPaths.size;
  const addLabel =
    selectedCount === 0
      ? 'Add apps'
      : selectedCount === 1
        ? 'Add 1 app'
        : `Add ${selectedCount} apps`;

  return createPortal(
    <div
      className="app-add-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="app-add-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Add apps to profile"
      >
        <header className="app-add-header">
          <div className="app-add-header-text">
            <h2 className="app-add-title">Add apps</h2>
            <p className="app-add-subtitle">Select one or more apps to open with this profile.</p>
          </div>
          <button
            type="button"
            className="btn btn-chrome btn-icon-only"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={15} strokeWidth={1.6} />
          </button>
        </header>

        <div className="app-add-search-bar">
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search installed apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search apps"
          />
          <button
            type="button"
            className="btn btn-chrome btn-icon-only"
            onClick={() => onScan(true)}
            disabled={scanning}
            title="Rescan applications"
            aria-label="Rescan applications"
          >
            <RefreshCw size={14} strokeWidth={2} className={scanning ? 'spin' : ''} />
          </button>
        </div>

        <div className="app-add-body chromeScroll">
          {allApps === null && (
            <p className="app-add-empty-msg">Scanning applications…</p>
          )}
          {allApps !== null && filtered.length === 0 && (
            <p className="app-add-empty-msg">
              {query.trim()
                ? 'No matches — try a different name.'
                : 'No more apps to add.'}
            </p>
          )}
          {filtered.length > 0 && (
            <div className="app-add-grid" role="listbox" aria-multiselectable="true" aria-label="Apps">
              {filtered.map((a) => {
                const selected = selectedPaths.has(a.path);
                return (
                  <button
                    key={a.path}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`app-add-tile${selected ? ' app-add-tile-selected' : ''}`}
                    onClick={() => onToggle(a)}
                    title={a.name}
                  >
                    <span className="app-add-tile-icon">
                      <AppIcon
                        src={a.iconDataUrl}
                        name={a.name}
                        size={40}
                        loading={iconLoadingPaths?.has(a.path) && !a.iconDataUrl}
                      />
                      {selected && (
                        <span className="app-add-tile-check" aria-hidden="true">
                          <Check size={12} strokeWidth={2.75} />
                        </span>
                      )}
                    </span>
                    <span className="app-add-tile-name">{a.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="app-add-footer">
          <span className="app-add-selection-count" aria-live="polite">
            {selectedCount === 0
              ? 'Select apps to add'
              : selectedCount === 1
                ? '1 selected'
                : `${selectedCount} selected`}
          </span>
          <div className="app-add-footer-actions">
            <button type="button" className="btn btn-chrome" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={selectedCount === 0}
            >
              <Plus size={14} strokeWidth={2.25} />
              {addLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

const AppPicker = forwardRef(function AppPicker({ chosen, onChange }, ref) {
  const [allApps, setAllApps] = useState(null);
  const [chosenIcons, setChosenIcons] = useState({});
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [pendingIconPaths, setPendingIconPaths] = useState(() => new Set());
  const [selectedPaths, setSelectedPaths] = useState(() => new Set());
  const selectedByPath = useRef(new Map());
  const searchRef = useRef(null);
  const addingRef = useRef(false);

  async function scan(force = false) {
    setScanning(true);
    try {
      setAllApps(await window.shifty.scanApps({ force }));
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    scan();
  }, []);

  const chosenPaths = useMemo(() => chosen.map((a) => a.path), [chosen]);

  useEffect(() => {
    if (chosenPaths.length === 0) {
      setChosenIcons({});
      return;
    }
    let cancelled = false;
    setPendingIconPaths((prev) => {
      const next = new Set(prev);
      for (const p of chosenPaths) next.add(p);
      return next;
    });

    window.shifty.iconsFor(chosenPaths).then((icons) => {
      if (cancelled) return;
      setChosenIcons(icons ?? {});
      setPendingIconPaths((prev) => {
        const next = new Set(prev);
        for (const p of chosenPaths) next.delete(p);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [chosenPaths.join('|')]);

  const iconByPath = useMemo(() => {
    const m = new Map();
    for (const a of allApps ?? []) {
      if (a.iconDataUrl) m.set(a.path, a.iconDataUrl);
    }
    for (const [p, url] of Object.entries(chosenIcons)) {
      if (url) m.set(p, url);
    }
    return m;
  }, [allApps, chosenIcons]);

  const chosenPathSet = useMemo(() => new Set(chosenPaths), [chosenPaths]);

  const filtered = useMemo(() => {
    if (!allApps) return [];
    const q = query.trim().toLowerCase();
    return allApps
      .filter((a) => !chosenPathSet.has(a.path))
      .filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [allApps, query, chosenPathSet]);

  const filteredPathKey = useMemo(() => filtered.map((a) => a.path).join('|'), [filtered]);

  // Load icons for every app shown in the add-apps modal as soon as it opens
  useEffect(() => {
    if (!adding || !allApps || filtered.length === 0) return;

    const paths = filtered.filter((a) => !a.iconDataUrl).map((a) => a.path);
    if (paths.length === 0) return;

    let cancelled = false;
    setPendingIconPaths((prev) => {
      const next = new Set(prev);
      for (const p of paths) next.add(p);
      return next;
    });

    window.shifty.iconsFor(paths).then((icons) => {
      if (cancelled || !icons) return;
      setAllApps(
        (prev) =>
          prev?.map((a) => (icons[a.path] ? { ...a, iconDataUrl: icons[a.path] } : a)) ?? prev
      );
      setChosenIcons((prev) => ({ ...prev, ...icons }));
      setPendingIconPaths((prev) => {
        const next = new Set(prev);
        for (const p of paths) next.delete(p);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [adding, filteredPathKey, allApps !== null]);

  const openAdd = useCallback(() => {
    selectedByPath.current = new Map();
    setSelectedPaths(new Set());
    setQuery('');
    setAdding(true);
    addingRef.current = true;
  }, []);

  const closeAdd = useCallback(() => {
    setAdding(false);
    addingRef.current = false;
    setQuery('');
    selectedByPath.current = new Map();
    setSelectedPaths(new Set());
    const chosenSet = new Set(chosen.map((a) => a.path));
    setPendingIconPaths((prev) => new Set([...prev].filter((p) => chosenSet.has(p))));
  }, [chosen]);

  useImperativeHandle(ref, () => ({ openAdd }), [openAdd]);

  // ⌘⇧A — open add-apps modal (settings window, local only)
  useEffect(() => {
    function onKey(e) {
      if (addingRef.current) return;
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== 'a') return;

      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      openAdd();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [openAdd]);

  function toggleApp(app) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(app.path)) {
        next.delete(app.path);
        selectedByPath.current.delete(app.path);
      } else {
        next.add(app.path);
        selectedByPath.current.set(app.path, app);
      }
      return next;
    });
  }

  function confirmAdd() {
    if (selectedPaths.size === 0) return;
    const additions = [...selectedPaths].map((path) => {
      const app = selectedByPath.current.get(path);
      return {
        path,
        name: app?.name ?? path.split('/').pop()?.replace(/\.app$/i, '') ?? path,
        bundleId: app?.bundleId ?? undefined,
      };
    });
    onChange([...chosen, ...additions]);
    closeAdd();
  }

  function removeAt(pathToRemove) {
    onChange(chosen.filter((a) => a.path !== pathToRemove));
  }

  const hasApps = chosen.length > 0;

  return (
    <div className="app-picker">
      {!hasApps && (
        <div className="app-picker-empty">
          <p className="app-picker-empty-label">No apps yet</p>
          <button
            type="button"
            className="btn btn-primary btn-compact"
            onClick={openAdd}
            title={`Add apps (${ADD_APPS_SHORTCUT_LABEL})`}
          >
            <Plus size={14} strokeWidth={2.25} />
            Add apps
            <kbd className="shortcut-hint">{ADD_APPS_SHORTCUT_LABEL}</kbd>
          </button>
        </div>
      )}

      {hasApps && (
        <AppDock
          apps={chosen}
          iconByPath={iconByPath}
          iconLoadingPaths={pendingIconPaths}
          onRemove={removeAt}
          onAdd={openAdd}
        />
      )}

      <AppAddModal
        open={adding}
        query={query}
        setQuery={setQuery}
        allApps={allApps}
        filtered={filtered}
        selectedPaths={selectedPaths}
        onToggle={toggleApp}
        scanning={scanning}
        onScan={scan}
        onClose={closeAdd}
        onConfirm={confirmAdd}
        searchRef={searchRef}
        iconLoadingPaths={pendingIconPaths}
      />
    </div>
  );
});

export default AppPicker;
