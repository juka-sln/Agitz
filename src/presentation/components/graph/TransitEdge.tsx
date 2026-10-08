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
  const color = `var(--${data?.lineToken ?? 'line-none'})`;
  const faded = data?.faded ?? false;
  const appearsAfterMs = data?.appearsAfterMs;
  return (
    <BaseEdge
      id={id}
      className={appearsAfterMs === undefined ? undefined : 'transit-appear'}
      path={transitPath(sourceX, sourceY, targetX, targetY, data?.bend ?? 'source', data?.offset)}
      style={{
        stroke: color,
        strokeWidth: 6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        opacity: faded ? 0.45 : 1,
        strokeDasharray: faded ? '1 11' : undefined,
        ...(appearsAfterMs === undefined ? {} : { '--motion-delay': `${appearsAfterMs}ms` }),
      }}
    />
  );
}
