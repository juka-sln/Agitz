import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { useEffect, useMemo } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { useCommitGraph } from '../../hooks/useWorkspaceViews';
import { usePreferencesStore } from '../../stores/preferencesStore';

import { GraphEmptyState } from './GraphEmptyState';
import { layoutCommitGraph, type StationNode as StationNodeType } from './layoutCommitGraph';
import { StationNode } from './StationNode';
import { TransitEdge } from './TransitEdge';

const nodeTypes = { station: StationNode };

/** SVG attributes cannot read CSS variables, so the minimap needs the computed color. */
function resolveCssColor(value: string): string {
  const variable = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (variable === undefined) {
    return value;
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || value;
}
const edgeTypes = { transit: TransitEdge };

/** Re-frames the map whenever a commit appears or HEAD moves. */
function FitViewOnChange({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fitView({ duration: 400, padding: 0.3, maxZoom: 1, minZoom: 0.4 });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [signature, fitView]);
  return null;
}

export function CommitGraphView() {
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const graph = useCommitGraph();
  const layout = useMemo(() => (graph ? layoutCommitGraph(graph) : null), [graph]);

  if (!graph || !layout) {
    return (
      <GraphEmptyState
        title={t('graph.noRepository.title')}
        body={t('graph.noRepository.body')}
        commands={['git init']}
      />
    );
  }
  if (graph.commits.length === 0) {
    return (
      <GraphEmptyState
        title={t('graph.noCommits.title')}
        body={t('graph.noCommits.body')}
        commands={[
          'echo "# My project" > README.md',
          'git add README.md',
          'git commit -m "docs: add readme"',
        ]}
      />
    );
  }

  return (
    <div className="h-full w-full" role="region" aria-label={t('graph.label')}>
      <ReactFlowProvider>
        <ReactFlow<StationNodeType>
          nodes={layout.nodes}
          edges={layout.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={theme}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          minZoom={0.2}
          maxZoom={1.6}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="var(--rule)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            nodeColor={(node) =>
              resolveCssColor(`var(--${(node as StationNodeType).data.lineToken})`)
            }
            nodeBorderRadius={999}
          />
          <FitViewOnChange signature={`${graph.commits.length}:${graph.headCommit ?? ''}`} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
