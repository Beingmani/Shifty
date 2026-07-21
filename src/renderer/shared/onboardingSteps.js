export function buildOnboardingSteps({ hotkey = '⌥Space', hasProfiles = false } = {}) {
  const steps = [
    {
      id: 'welcome',
      target: null,
      placement: 'center',
      title: 'Welcome to Shifty',
      body: 'Save app groups for Work, Personal, or Focus. Activate a profile to open them all at once.',
    },
    {
      id: 'profiles',
      target: hasProfiles ? 'profiles' : 'new-profile',
      placement: 'bottom',
      title: hasProfiles ? 'Your profiles' : 'Create a profile',
      body: hasProfiles
        ? 'Click a profile to edit it, or add a new one.'
        : 'Pick a template — Shifty finds matching apps on this Mac and adds them.',
    },
    ...(hasProfiles
      ? [
          {
            id: 'activate',
            target: 'activate',
            placement: 'bottom',
            placementOrder: ['bottom', 'left', 'top'],
            title: 'Activate',
            body: 'Opens every app in the profile. Shifty can quit the previous set or leave them running.',
          },
        ]
      : []),
    {
      id: 'switch',
      target: 'switcher',
      placement: 'bottom',
      title: 'Quick switcher',
      body: `${hotkey} from anywhere — type to filter, Enter to switch, Esc to close.`,
    },
    {
      id: 'guide',
      target: 'guide',
      placement: 'bottom',
      placementOrder: ['bottom', 'left', 'top'],
      title: "That's it",
      body: 'Come back to this guide via ? any time. Switch profiles from the menu bar too.',
    },
  ];

  return steps;
}
