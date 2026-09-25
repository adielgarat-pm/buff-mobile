/**
 * PushPermissionPrePrompt — the kid body interpolates {{name}}. NotificationGate
 * renders it without a buddyName, which used to show the literal "{{name}}" to
 * the child. It must fall back to "BUDDY".
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import i18n from '../../../i18n';
import { PushPermissionPrePrompt } from '../PushPermissionPrePrompt';

const noop = () => {};

describe.each([
  ['en', 'is here when you want'],
  ['he', 'פה כשתרצה'],
])('kid pre-prompt (%s)', (lang, bodyStart) => {
  beforeAll(async () => { await i18n.changeLanguage(lang); });

  it('falls back to BUDDY when no buddyName is passed', () => {
    const { toJSON, getByText } = render(
      <PushPermissionPrePrompt visible audience="kid" onAccept={noop} onDecline={noop} />
    );
    expect(JSON.stringify(toJSON())).not.toContain('{{');
    getByText(new RegExp(`^BUDDY ${bodyStart}`));
  });

  it('uses the buddyName when one is passed', () => {
    const { getByText } = render(
      <PushPermissionPrePrompt visible audience="kid" buddyName="Rex" onAccept={noop} onDecline={noop} />
    );
    getByText(new RegExp(`^Rex ${bodyStart}`));
  });
});

it('parent body has no placeholder', async () => {
  await i18n.changeLanguage('en');
  const { toJSON } = render(
    <PushPermissionPrePrompt visible audience="parent" onAccept={noop} onDecline={noop} />
  );
  expect(JSON.stringify(toJSON())).not.toContain('{{');
});
