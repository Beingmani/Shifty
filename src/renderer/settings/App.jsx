import React, { useCallback, useState } from 'react';
import { useStore } from '../shared/useStore.js';
import Navbar from './components/Navbar.jsx';
import ProfileBar from './components/ProfileBar.jsx';
import ProfileEditor from './components/ProfileEditor.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import TemplatePicker from './components/TemplatePicker.jsx';
import UpdatePill from './components/UpdatePill.jsx';
import WhatsNewModal from './components/WhatsNewModal.jsx';

export default function App() {
  const snapshot = useStore();
  const [selectedId, setSelectedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState('appearance');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  React.useEffect(() => {
    if (!snapshot) return;
    const ids = snapshot.profiles.map((p) => p.id);
    if (selectedId && !ids.includes(selectedId)) setSelectedId(ids[0] ?? null);
    if (!selectedId && ids.length > 0) setSelectedId(ids[0]);
  }, [snapshot, selectedId]);

  React.useEffect(() => {
    const seen = localStorage.getItem('shifty.lastSeenVersion');
    if (seen !== import.meta.env.VITE_APP_VERSION) {
      const t = window.setTimeout(() => setWhatsNewOpen(true), 1200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    const unsub = window.shifty?.onUpdateAvailable?.((payload) => {
      setUpdateAvailable(payload);
    });
    window.shifty?.updates
      ?.check?.()
      .then((result) => {
        if (result?.available && result.version) {
          setUpdateAvailable({
            version: result.version,
            url: result.url,
            name: result.name,
            current: result.current,
          });
        }
      })
      .catch(() => {});
    return unsub;
  }, []);

  const closeWhatsNew = useCallback(() => {
    localStorage.setItem('shifty.lastSeenVersion', import.meta.env.VITE_APP_VERSION);
    setWhatsNewOpen(false);
  }, []);

  const openSettings = useCallback((section = 'appearance') => {
    setSettingsSection(section);
    setSettingsOpen(true);
  }, []);

  const onOpenUpdate = useCallback(async () => {
    await window.shifty?.updates?.open?.();
  }, []);

  if (!snapshot) return null;

  const selected = snapshot.profiles.find((p) => p.id === selectedId) ?? null;

  function openTemplatePicker() {
    setTemplateOpen(true);
  }

  function onTemplateCreated(profile) {
    if (profile?.id) setSelectedId(profile.id);
  }

  async function activateSelected() {
    if (!selected) return;
    setActivating(true);
    await window.shifty.activateProfile(selected.id);
    setActivating(false);
  }

  return (
    <div className="app-shell">
      <div className="layout sidebar-collapsed">
        <div className="main-col">
          <div className="library-stage">
            <div className="toolbar-shell">
              <div className="toolbar-shell-inner">
                <Navbar
                  profiles={snapshot.profiles}
                  selectedId={selectedId}
                  activeProfileId={snapshot.activeProfileId}
                  hotkey={snapshot.settings.hotkey}
                  canActivate={!!selected}
                  activating={activating}
                  isActiveProfile={selected?.id === snapshot.activeProfileId}
                  onOpenSettings={() => openSettings('appearance')}
                  onActivate={activateSelected}
                  onGoHome={() => setSelectedId(snapshot.profiles[0]?.id ?? null)}
                  onSelectProfile={setSelectedId}
                  onAddProfile={openTemplatePicker}
                />
              </div>
            </div>

            <div className="content-scroll chromeScroll">
              <div className="profile-bar-scroll">
                <ProfileBar
                  profiles={snapshot.profiles}
                  activeProfileId={snapshot.activeProfileId}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onAdd={openTemplatePicker}
                />
              </div>
              <div className="content-scroll-inner">
                {selected ? (
                  <ProfileEditor key={selected.id} profile={selected} />
                ) : (
                  <div className="content-panel-card empty-state-card">
                    <h2 className="empty-title">Welcome to Shifty</h2>
                    <p className="empty-description">
                      Start from a template like Work or Personal — we’ll add apps we find on this
                      Mac. Edit anytime.
                    </p>
                    <button type="button" className="btn btn-primary" onClick={openTemplatePicker}>
                      Choose a template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={snapshot.settings}
        initialSection={settingsSection}
      />

      <WhatsNewModal
        open={whatsNewOpen}
        onClose={closeWhatsNew}
        onViewAll={() => {
          closeWhatsNew();
          openSettings('whatsnew');
        }}
      />

      {updateAvailable?.version ? (
        <UpdatePill version={updateAvailable.version} onOpen={onOpenUpdate} />
      ) : null}

      <TemplatePicker
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onCreated={onTemplateCreated}
      />
    </div>
  );
}
