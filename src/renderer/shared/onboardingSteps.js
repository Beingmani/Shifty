export function buildOnboardingSteps({ hotkey = '⌥Space', hasProfiles = false } = {}) {
  const steps = [
    {
      id: 'welcome',
      target: null,
      placement: 'center',
      title: 'Welcome to Shifty',
      body: 'Save app sets for Work, Personal, or Focus — then open them all in one shot when you switch context.',
    },
    {
      id: 'profiles',
      target: hasProfiles ? 'profiles' : 'new-profile',
      placement: 'bottom',
      title: hasProfiles ? 'Your profiles' : 'Create a profile',
      body: hasProfiles
        ? 'Tap a chip to edit it, or New profile for another set.'
        : 'Start here — pick a template and Shifty adds matching apps from this Mac.',
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
      title: 'You’re all set',
      body: 'Reopen this guide from ? anytime. Shifty also lives in your menu bar.',
    },
  ];

  return steps;
}
