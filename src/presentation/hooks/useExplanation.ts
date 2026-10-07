import type { Explanation } from '@/application/git-commands/GitCommand';
import { formatExplanation } from '@/content/explanations';

import { usePreferencesStore } from '../stores/preferencesStore';

export function useExplanation(explanation: Explanation): string {
  const language = usePreferencesStore((state) => state.language);
  return formatExplanation(explanation.key, explanation.params, language);
}
