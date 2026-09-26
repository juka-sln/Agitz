import { useCallback } from 'react';

import { MESSAGES, type MessageKey } from '../i18n/messages';
import { usePreferencesStore } from '../stores/preferencesStore';

export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  const translate = useCallback(
    (key: MessageKey, params: Readonly<Record<string, string | number>> = {}) =>
      MESSAGES[language][key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
        String(params[name] ?? placeholder),
      ),
    [language],
  );
  return { t: translate, language };
}
