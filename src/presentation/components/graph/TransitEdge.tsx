import { BaseEdge, type EdgeProps } from '@xyflow/react';

import { transitPath, type TransitEdge as TransitEdgeType } from './layoutCommitGraph';

export function TransitEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<TransitEdgeType>) {
  const color = data?.color ?? 'var(--line-none)';
  const faded = data?.faded ?? false;
  return (
    <BaseEdge
      id={id}
      path={transitPath(sourceX, sourceY, targetX, targetY, data?.bend ?? 'source', data?.offset)}
      style={{
        stroke: color,
        strokeWidth: 6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        opacity: faded ? 0.45 : 1,
        strokeDasharray: faded ? '1 11' : undefined,
      }}
    />
  );
}
