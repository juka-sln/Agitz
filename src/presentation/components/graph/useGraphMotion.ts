import { useState } from 'react';

import { describeGraphMotion, NO_MOTION, type GraphMotion } from './graphMotion';
import type { StationNode } from './layoutCommitGraph';

interface Remembered {
  readonly nodes: readonly StationNode[] | null;
  /** Whose repository the map shows: switching workstation is not a move. */
  readonly scope: string;
  readonly motion: GraphMotion;
}

/** What moved since the map was last drawn, remembered across renders like derived state. */
export function useGraphMotion(nodes: readonly StationNode[] | null, scope: string): GraphMotion {
  const [remembered, setRemembered] = useState<Remembered>({ nodes, scope, motion: NO_MOTION });
  if (remembered.nodes !== nodes || remembered.scope !== scope) {
    const comparable = remembered.scope === scope && remembered.nodes !== null && nodes !== null;
    const motion = comparable ? describeGraphMotion(remembered.nodes, nodes) : NO_MOTION;
    setRemembered({ nodes, scope, motion });
    return motion;
  }
  return remembered.motion;
}
