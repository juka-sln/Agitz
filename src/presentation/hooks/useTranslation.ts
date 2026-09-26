import { useCallback } from 'react';

import { MESSAGES, type MessageKey } from '../i18n/messages';
import { usePreferencesStore } from '../stores/preferencesStore';

export function useTranslation() {
  const language = usePreferencesStore((state) => state.language);
  const translate = useCallback((key: MessageKey) => MESSAGES[language][key], [language]);
  return { t: translate, language };
}
