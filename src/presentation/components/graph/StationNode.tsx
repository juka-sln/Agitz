import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';

import { shortHash } from '@/domain/value-objects/Hash';

import { useTranslation } from '../../hooks/useTranslation';

import { STATION_SIZE, type StationNode as StationNodeType } from './layoutCommitGraph';

const hiddenHandle = '!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent';

function TagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M1 1h5l5 5-5 5-5-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}

function StationNodeView({ data }: NodeProps<StationNodeType>) {
  const { t } = useTranslation();
  const { commit, lineToken, headState, currentBranch, branchTokens } = data;
  const isHead = headState !== null;
  const isMerge = commit.parents.length > 1;
  const hasLabels = isHead || commit.branches.length > 0 || commit.tags.length > 0;

  return (
    <div
      className="station-enter relative"
      style={{ width: STATION_SIZE, height: STATION_SIZE, opacity: commit.isReachable ? 1 : 0.5 }}
      title={commit.isReachable ? undefined : t('graph.unreachable')}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={hiddenHandle}
        isConnectable={false}
      />
      <div
        className="flex h-full w-full items-center justify-center rounded-full"
        title={isMerge ? t('graph.mergeCommit') : undefined}
        style={{
          background: 'var(--station-fill)',
          border: `5px ${commit.isReachable ? 'solid' : 'dashed'} var(--${lineToken})`,
          boxShadow: isHead ? `0 0 0 3px var(--canvas), 0 0 0 6px var(--ink)` : undefined,
        }}
      >
        {isMerge && (
          <span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ background: `var(--${lineToken})` }}
          />
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={hiddenHandle}
        isConnectable={false}
      />

      {hasLabels && (
        <div className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 flex-col items-center gap-1">
          {isHead && (
            <span
              className="bg-ink text-canvas relative rounded-md px-2 py-0.5 text-xs font-bold"
              style={
                headState === 'detached'
                  ? { outline: '2px dashed var(--ink)', outlineOffset: 2 }
                  : undefined
              }
              title={headState === 'detached' ? t('graph.headDetached') : t('graph.head')}
            >
              HEAD
            </span>
          )}
          {commit.branches.map((branch) => (
            <span
              key={branch}
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
              style={{
                background: `var(--${branchTokens[branch] ?? 'line-none'})`,
                color: `var(--${branchTokens[branch] ?? 'line-none'}-ink)`,
                boxShadow:
                  headState === 'attached' && branch === currentBranch
                    ? '0 0 0 2px var(--canvas), 0 0 0 4px var(--ink)'
                    : undefined,
              }}
            >
              {branch}
            </span>
          ))}
          {commit.tags.map((tag) => (
            <span
              key={tag}
              title={t('graph.tag')}
              className="border-ink-muted bg-surface text-ink inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
            >
              <TagIcon />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="absolute top-full left-1/2 mt-2 w-[150px] -translate-x-1/2 text-center leading-tight">
        <div className="text-ink-muted font-mono text-[11px]">{shortHash(commit.hash)}</div>
        <div className="text-ink line-clamp-2 text-[13px]" title={commit.subject}>
          {commit.subject}
        </div>
      </div>
    </div>
  );
}

export const StationNode = memo(StationNodeView);
