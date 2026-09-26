import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';

import { shortHash } from '@/domain/value-objects/Hash';

import { useTranslation } from '../../hooks/useTranslation';

import { STATION_SIZE, type StationNode as StationNodeType } from './layoutCommitGraph';

const hiddenHandle = '!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent';

function StationNodeView({ data }: NodeProps<StationNodeType>) {
  const { t } = useTranslation();
  const { commit, lineToken, headState, currentBranch, branchTokens } = data;
  const isHead = headState !== null;

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
        className="h-full w-full rounded-full"
        style={{
          background: 'var(--station-fill)',
          border: `5px ${commit.isReachable ? 'solid' : 'dashed'} var(--${lineToken})`,
          boxShadow: isHead ? `0 0 0 3px var(--canvas), 0 0 0 6px var(--ink)` : undefined,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={hiddenHandle}
        isConnectable={false}
      />

      {(isHead || commit.branches.length > 0) && (
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
