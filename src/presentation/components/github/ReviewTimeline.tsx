import type { Review, ReviewRemark } from '@/domain/entities/PullRequest';

import { useTranslation } from '../../hooks/useTranslation';
import type { MessageKey } from '../../i18n/messages';
import { RichText } from '../docs/RichText';
import { Avatar } from '../team/Avatar';

import { useAvatarToken } from './useAvatarToken';

const VERDICTS: Record<Review['verdict'], MessageKey> = {
  comment: 'github.review.commented',
  approve: 'github.review.approved',
  requestChanges: 'github.review.requestedChanges',
};

function RemarkText({ remark }: { readonly remark: ReviewRemark }) {
  const { t } = useTranslation();
  switch (remark.kind) {
    case 'looksGood':
      return <RichText text={t('github.remark.looksGood')} />;
    case 'titleNotConventional':
      return <RichText text={t('github.remark.titleNotConventional', { title: remark.title })} />;
    case 'emptyDescription':
      return <RichText text={t('github.remark.emptyDescription')} />;
    case 'commitNotConventional':
      return (
        <RichText text={t('github.remark.commitNotConventional', { subject: remark.subject })} />
      );
    case 'conflictMarkers':
      return <RichText text={t('github.remark.conflictMarkers', { path: remark.path })} />;
    case 'checksFailing':
      return <RichText text={t('github.remark.checksFailing')} />;
  }
}

export function ReviewTimeline({ reviews }: { readonly reviews: readonly Review[] }) {
  const { t } = useTranslation();
  const avatarToken = useAvatarToken();
  if (reviews.length === 0) {
    return null;
  }
  return (
    <ol className="flex flex-col gap-3" aria-label={t('github.review.timeline')}>
      {reviews.map((review, index) => (
        // Reviews are only ever appended, so their position identifies them.
        <li key={index} className="flex gap-2">
          <Avatar name={review.author.identity.name} colorToken={avatarToken(review.author.id)} />
          <div className="border-rule min-w-0 flex-1 rounded-md border">
            <p
              className={`border-rule border-b px-3 py-1.5 text-xs ${
                review.verdict === 'approve'
                  ? 'text-status-staged'
                  : review.verdict === 'requestChanges'
                    ? 'text-status-deleted'
                    : 'text-ink-muted'
              }`}
            >
              <strong className="text-ink">{review.author.id}</strong> {t(VERDICTS[review.verdict])}
            </p>
            <div className="text-ink px-3 py-2">
              {review.body !== '' && <p className="whitespace-pre-wrap">{review.body}</p>}
              {review.remarks.length > 0 && (
                <ul className="list-disc space-y-1 pl-4">
                  {review.remarks.map((remark, remarkIndex) => (
                    <li key={remarkIndex}>
                      <RemarkText remark={remark} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
