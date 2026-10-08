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

import type { CommitGraph } from '@/application/queries/getCommitGraph';
import { shortHash } from '@/domain/value-objects/Hash';

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

/** Keeps stations clear of the badges above them, the labels below and the minimap on the right. */
const FIT_VIEW_OPTIONS = {
  padding: { top: '96px', right: '300px', bottom: '88px', left: '88px' },
  maxZoom: 1,
  minZoom: 0.4,
} as const;

/** Re-frames the map whenever a commit appears or HEAD moves. */
function FitViewOnChange({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fitView({ ...FIT_VIEW_OPTIONS, duration: 400 });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [signature, fitView]);
  return null;
}

/** Text alternative to the map for screen readers, read like `git log --oneline --all`. */
function GraphSummary({ graph }: { graph: CommitGraph }) {
  const { t } = useTranslation();
  const head =
    graph.head.type === 'attached'
      ? graph.head.branch
      : t('graph.summaryDetached', { commit: shortHash(graph.head.commit) });
  return (
    <div className="sr-only">
      <p>{t('graph.summary', { count: graph.commits.length, head })}</p>
      <ol>
        {[...graph.commits].reverse().map((commit) => (
          <li key={commit.hash}>
            {[
              shortHash(commit.hash),
              commit.subject,
              ...commit.branches,
              ...commit.remoteBranches,
            ].join(', ')}
          </li>
        ))}
      </ol>
    </div>
  );
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
      <GraphSummary graph={graph} />
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
          ariaLabelConfig={{
            'controls.ariaLabel': t('graph.controls'),
            'controls.zoomIn.ariaLabel': t('graph.zoomIn'),
            'controls.zoomOut.ariaLabel': t('graph.zoomOut'),
            'controls.fitView.ariaLabel': t('graph.fitView'),
            'minimap.ariaLabel': t('graph.minimap'),
          }}
          nodesFocusable={false}
          edgesFocusable={false}
          minZoom={0.2}
          maxZoom={1.6}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
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
