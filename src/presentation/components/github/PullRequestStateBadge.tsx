import type { PullRequestState } from '@/domain/entities/PullRequest';

import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';

import { Badge, type Tone } from './ui';

const STATES: Record<PullRequestState, { readonly tone: Tone; readonly label: MessageKey }> = {
  open: { tone: 'open', label: 'github.state.open' },
  merged: { tone: 'merged', label: 'github.state.merged' },
  closed: { tone: 'closed', label: 'github.state.closed' },
};

export function PullRequestStateBadge({ state }: { readonly state: PullRequestState }) {
  const { t } = useTranslation();
  const { tone, label } = STATES[state];
  return <Badge tone={tone}>{t(label)}</Badge>;
}
