import { useCallback } from 'react';

import { interpolate } from '@/shared/interpolate';

import { MESSAGES, type MessageKey } from '../i18n/messages';
import { usePreferencesStore } from '../stores/preferencesStore';

export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  const translate = useCallback(
    (key: MessageKey, params: Readonly<Record<string, string | number>> = {}) =>
      interpolate(MESSAGES[language][key], params),
    [language],
  );
  return { t: translate, language };
}
