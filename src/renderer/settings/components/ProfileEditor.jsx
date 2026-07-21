import React, { useMemo, useRef } from 'react';
import { AppWindow, Calendar, Plus, Zap } from 'lucide-react';
import AppPicker, { ADD_APPS_SHORTCUT_LABEL } from './AppPicker.jsx';
import ScheduleEditor from './ScheduleEditor.jsx';
import Segment from './Segment.jsx';
import SettingBlock from './SettingBlock.jsx';
import Switch from './Switch.jsx';
import ProfileHero from './ProfileHero.jsx';

const QUIT_OPTIONS = [
  { value: 'ask', label: 'Ask me' },
  { value: 'always', label: 'Always quit' },
  { value: 'never', label: 'Leave running' },
];

function formatScheduleSummary(schedule) {
  if (!schedule?.enabled) return 'Off';
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [...(schedule.days ?? [])].sort((a, b) => a - b);
  if (days.length === 0) return 'No days selected';

  let dayStr;
  if (days.length === 7) dayStr = 'Every day';
  else if (days.join(',') === '1,2,3,4,5') dayStr = 'Weekdays';
  else if (days.join(',') === '0,6') dayStr = 'Weekends';
  else dayStr = days.map((d) => labels[d]).join(', ');

  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return `${dayStr} · ${fmt(schedule.start)} – ${fmt(schedule.end)}`;
}

export default function ProfileEditor({ profile }) {
  const appPickerRef = useRef(null);

  function patch(partial) {
    window.shifty.saveProfile({ id: profile.id, ...partial });
  }

  async function remove() {
    if (window.confirm(`Delete profile “${profile.name}”? This can’t be undone.`)) {
      await window.shifty.deleteProfile(profile.id);
    }
  }

  const appCount = profile.apps?.length ?? 0;
  const scheduleSummary = useMemo(
    () => formatScheduleSummary(profile.schedule),
    [profile.schedule]
  );
  const quitPolicy = profile.quitPrevious || 'ask';

  return (
    <div className="profile-editor">
      <ProfileHero
        profile={profile}
        appCount={appCount}
        scheduleSummary={scheduleSummary}
        scheduleEnabled={profile.schedule.enabled}
        onPatch={patch}
        onDelete={remove}
      />

      <SettingBlock
        className="setting-block-apps"
        tourId="apps"
        icon={AppWindow}
        title="Apps"
        description="Opens together when you activate this profile."
        badge={appCount > 0 ? appCount : null}
        headerAction={
          <button
            type="button"
            className="btn btn-chrome btn-add-apps"
            onClick={() => appPickerRef.current?.openAdd()}
            title={`Add apps (${ADD_APPS_SHORTCUT_LABEL})`}
            aria-label={`Add apps, shortcut ${ADD_APPS_SHORTCUT_LABEL}`}
          >
            <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
            Add apps
            <kbd className="shortcut-hint">{ADD_APPS_SHORTCUT_LABEL}</kbd>
          </button>
        }
      >
        <AppPicker
          ref={appPickerRef}
          chosen={profile.apps}
          onChange={(apps) => patch({ apps })}
        />
      </SettingBlock>

      <SettingBlock
        tourId="schedules"
        icon={Calendar}
        title="Schedule"
        description="When this profile activates automatically."
        headerAction={
          <Switch
            checked={profile.schedule.enabled}
            onChange={(enabled) =>
              patch({ schedule: { ...profile.schedule, enabled } })
            }
            label="On"
            compact
            aria-label="Enable schedule"
          />
        }
      >
        <ScheduleEditor
          schedule={profile.schedule}
          autoActivate={profile.autoActivate}
          onChange={(schedule) => patch({ schedule })}
          onAutoActivateChange={(autoActivate) => patch({ autoActivate })}
        />
      </SettingBlock>

      <SettingBlock
        icon={Zap}
        title="When switching here"
        description="What happens to the previous profile’s apps when you switch here."
        headerAction={
          <div className="quit-policy-header-control">
            <Segment
              options={QUIT_OPTIONS}
              value={quitPolicy}
              onChange={(quitPrevious) => patch({ quitPrevious })}
              aria-label="Previous apps when switching here"
            />
          </div>
        }
      />

    </div>
  );
}
