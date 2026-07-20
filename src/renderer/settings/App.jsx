import React, { useCallback, useState } from 'react';
import { useStore } from '../shared/useStore.js';
import { readOnboardingCompleted } from '../shared/onboarding.js';
import Navbar from './components/Navbar.jsx';
import ProfileBar from './components/ProfileBar.jsx';
import ProfileEditor from './components/ProfileEditor.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import TemplatePicker from './components/TemplatePicker.jsx';
import WelcomeEmpty from './components/WelcomeEmpty.jsx';
import OnboardingGuide from './components/OnboardingGuide.jsx';
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
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  React.useEffect(() => {
    if (!snapshot) return;
    const ids = snapshot.profiles.map((p) => p.id);
    if (selectedId && !ids.includes(selectedId)) setSelectedId(ids[0] ?? null);
    if (!selectedId && ids.length > 0) setSelectedId(ids[0]);
  }, [snapshot, selectedId]);

  React.useEffect(() => {
    if (!snapshot || snapshot.profiles.length > 0) return undefined;
    if (readOnboardingCompleted()) return undefined;
    const t = window.setTimeout(() => setOnboardingOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [snapshot]);

  React.useEffect(() => {
    if (onboardingOpen) return undefined;
    const seen = localStorage.getItem('shifty.lastSeenVersion');
    if (seen !== import.meta.env.VITE_APP_VERSION) {
      const t = window.setTimeout(() => setWhatsNewOpen(true), 1200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [onboardingOpen]);

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

  React.useEffect(() => {
    return window.shifty?.onSettingsOpenSection?.((section) => {
      openSettings(section || 'appearance');
    });
  }, [openSettings]);

  const openOnboarding = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
  }, []);

  const onOpenUpdate = useCallback(async () => {
    await window.shifty?.updates?.open?.();
  }, []);

  const onUpdateFound = useCallback((payload) => {
    if (payload?.version) {
      setUpdateAvailable(payload);
    } else {
      setUpdateAvailable(null);
    }
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
                  onOpenGuide={openOnboarding}
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
                  <WelcomeEmpty
                    hotkey={snapshot.settings.hotkey}
                    onGetStarted={openTemplatePicker}
                    onCreated={onTemplateCreated}
                    onShowGuide={openOnboarding}
                  />
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
        onOpenGuide={() => {
          setSettingsOpen(false);
          openOnboarding();
        }}
        onUpdateFound={onUpdateFound}
      />

      <OnboardingGuide
        open={onboardingOpen}
        hotkey={snapshot.settings.hotkey}
        hasProfiles={snapshot.profiles.length > 0}
        onClose={closeOnboarding}
        onFinish={openTemplatePicker}
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
