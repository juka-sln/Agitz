import { useId, useState, type FormEvent } from 'react';

import type { PullRequest, ReviewVerdict } from '@/domain/entities/PullRequest';

import { useGitHub, useGitHubAction } from '../../hooks/useGitHub';
import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';

import { Box, Button, ProblemAlert, SectionTitle, SelectField, TextField } from './ui';

const VERDICTS: readonly { readonly verdict: ReviewVerdict; readonly label: MessageKey }[] = [
  { verdict: 'comment', label: 'github.review.comment' },
  { verdict: 'approve', label: 'github.review.approve' },
  { verdict: 'requestChanges', label: 'github.review.requestChanges' },
];

/** Ask a simulated teammate: they review at once, following the code review guide. */
function RequestReviewBox({ pullRequest }: { readonly pullRequest: PullRequest }) {
  const { t } = useTranslation();
  const users = useSession((state) => state.users);
  const { problem, run } = useGitHubAction();
  const candidates = users.filter((user) => user.id !== pullRequest.author.id);
  const [reviewer, setReviewer] = useState(candidates[0]?.id ?? '');
  const selected = candidates.find((user) => user.id === reviewer);
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <SelectField
            label={t('github.review.requestFrom')}
            value={reviewer}
            options={candidates.map((user) => ({ value: user.id, label: user.identity.name }))}
            onChange={setReviewer}
          />
        </div>
        <Button
          disabled={selected === undefined}
          onClick={() => {
            if (selected !== undefined) {
              run((actions, state) =>
                actions.requestReview.execute(state, {
                  repository: pullRequest.repository,
                  number: pullRequest.number,
                  reviewer: selected,
                }),
              );
            }
          }}
        >
          {t('github.review.request')}
        </Button>
      </div>
      <ProblemAlert problem={problem} />
    </div>
  );
}

export function ReviewForm({ pullRequest }: { readonly pullRequest: PullRequest }) {
  const { t } = useTranslation();
  const { actor } = useGitHub();
  const { problem, run, clearProblem } = useGitHubAction();
  const [body, setBody] = useState('');
  const [verdict, setVerdict] = useState<ReviewVerdict>('comment');
  const groupId = useId();
  const isAuthor = actor.id === pullRequest.author.id;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const sent = run((actions, state) =>
      actions.reviewPullRequest.execute(state, {
        repository: pullRequest.repository,
        number: pullRequest.number,
        reviewer: actor,
        verdict,
        body,
      }),
    );
    if (sent) {
      setBody('');
      setVerdict('comment');
    }
  };

  return (
    <Box className="flex flex-col gap-3 p-3">
      <SectionTitle>{t('github.review.title')}</SectionTitle>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <TextField
          label={t('github.review.bodyLabel', { login: actor.id })}
          value={body}
          multiline
          onChange={(value) => {
            setBody(value);
            clearProblem();
          }}
        />
        <fieldset
          className="flex flex-wrap gap-x-4 gap-y-1"
          aria-describedby={isAuthor ? groupId : undefined}
        >
          <legend className="sr-only">{t('github.review.verdict')}</legend>
          {VERDICTS.map((option) => (
            <label key={option.verdict} className="text-ink flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name={`verdict-${groupId}`}
                checked={verdict === option.verdict}
                disabled={isAuthor && option.verdict !== 'comment'}
                onChange={() => {
                  setVerdict(option.verdict);
                  clearProblem();
                }}
              />
              {t(option.label)}
            </label>
          ))}
        </fieldset>
        {isAuthor && (
          <p id={groupId} className="text-ink-muted text-xs">
            {t('github.review.authorHint')}
          </p>
        )}
        <ProblemAlert problem={problem} />
        <div>
          <Button type="submit" variant="primary">
            {t('github.review.submit')}
          </Button>
        </div>
      </form>
      <RequestReviewBox pullRequest={pullRequest} />
    </Box>
  );
}
