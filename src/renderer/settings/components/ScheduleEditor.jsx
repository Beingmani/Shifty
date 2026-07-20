import React, { useMemo } from 'react';
import Switch from './Switch.jsx';
import TimeField from './TimeField.jsx';

const DAYS = [
  { value: 0, short: 'S', full: 'Sunday' },
  { value: 1, short: 'M', full: 'Monday' },
  { value: 2, short: 'T', full: 'Tuesday' },
  { value: 3, short: 'W', full: 'Wednesday' },
  { value: 4, short: 'T', full: 'Thursday' },
  { value: 5, short: 'F', full: 'Friday' },
  { value: 6, short: 'S', full: 'Saturday' },
];

const QUICK = [
  { id: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { id: 'weekends', label: 'Weekends', days: [0, 6] },
  { id: 'everyday', label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
];

/** Named time windows — quick apply for common routines. */
const TIME_PRESETS = [
  { id: 'work', label: 'Work', hint: '9–5', start: '09:00', end: '17:00' },
  { id: 'personal', label: 'Personal', hint: '6–10pm', start: '18:00', end: '22:00' },
  { id: 'morning', label: 'Morning', hint: '6–12', start: '06:00', end: '12:00' },
  { id: 'evening', label: 'Evening', hint: '5–9pm', start: '17:00', end: '21:00' },
];

function sameDays(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((d, i) => d === sb[i]);
}

export default function ScheduleEditor({
  schedule,
  autoActivate,
  onChange,
  onAutoActivateChange,
}) {
  function patch(partial) {
    onChange({ ...schedule, ...partial });
  }

  function toggleDay(day) {
    const next = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day].sort((a, b) => a - b);
    patch({ days: next });
  }

  const quickId = QUICK.find((q) => sameDays(q.days, schedule.days))?.id ?? null;
  const timePresetId = useMemo(
    () =>
      TIME_PRESETS.find((p) => p.start === schedule.start && p.end === schedule.end)?.id ?? null,
    [schedule.start, schedule.end]
  );

  if (!schedule.enabled) {
    return (
      <div className="sched">
        <p className="sched-off">
          Off. Flip the switch to choose days and a time window.
        </p>
      </div>
    );
  }

  return (
    <div className="sched">
      <div className="sched-plate">
        {/* Pills left · day toolbar right */}
        <div className="sched-days-block">
          <div className="sched-quick" role="group" aria-label="Quick day sets">
            {QUICK.map((q) => (
              <button
                key={q.id}
                type="button"
                className={`sched-quick-btn ${quickId === q.id ? 'is-on' : ''}`}
                aria-pressed={quickId === q.id}
                onClick={() => patch({ days: [...q.days] })}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="sched-week" role="group" aria-label="Active days">
            {DAYS.map(({ value, short, full }) => {
              const on = schedule.days.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={`sched-day ${on ? 'is-on' : ''}`}
                  title={full}
                  aria-label={full}
                  aria-pressed={on}
                  onClick={() => toggleDay(value)}
                >
                  {short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom times left · named windows right */}
        <div className="sched-hours-block">
          <div className="sched-times" role="group" aria-label="Time window">
            <TimeField
              label="Starts"
              value={schedule.start}
              onChange={(start) => patch({ start })}
            />
            <span className="sched-times-sep" aria-hidden="true">
              –
            </span>
            <TimeField
              label="Ends"
              value={schedule.end}
              onChange={(end) => patch({ end })}
            />
          </div>

          <div className="sched-time-presets" role="group" aria-label="Time presets">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`sched-time-preset ${timePresetId === p.id ? 'is-on' : ''}`}
                aria-pressed={timePresetId === p.id}
                title={`${p.label}: ${p.hint}`}
                onClick={() => patch({ start: p.start, end: p.end })}
              >
                <span className="sched-time-preset-label">{p.label}</span>
                <span className="sched-time-preset-hint">{p.hint}</span>
              </button>
            ))}
            <span
              className={`sched-time-preset sched-time-preset-custom ${
                timePresetId == null ? 'is-on' : ''
              }`}
              aria-current={timePresetId == null ? 'true' : undefined}
              title="Custom times — use Starts and Ends pickers"
            >
              <span className="sched-time-preset-label">Custom</span>
              <span className="sched-time-preset-hint">Your times</span>
            </span>
          </div>
        </div>

        <div className="sched-foot">
          <div className="sched-activate">
            <div className="sched-activate-copy">
              <p className="sched-activate-title">When the schedule starts</p>
              <p className="sched-activate-desc">
                {autoActivate
                  ? 'Switch to this profile right away — no notification.'
                  : 'Send a notification so you can switch when you’re ready.'}
              </p>
            </div>
            <div className="sched-activate-control">
              <span className="sched-activate-state" aria-hidden="true">
                {autoActivate ? 'Auto' : 'Notify'}
              </span>
              <Switch
                checked={autoActivate}
                onChange={onAutoActivateChange}
                compact
                aria-label={
                  autoActivate
                    ? 'Activate automatically when schedule starts. Currently on.'
                    : 'Activate automatically when schedule starts. Currently off — notify first.'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
