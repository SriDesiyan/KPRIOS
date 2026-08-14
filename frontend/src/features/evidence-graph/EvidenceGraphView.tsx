import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { graphService } from '../../services/graphService';
import { EvidenceGraph, GraphNode, GraphEdge } from '../../types/graph';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface EvidenceGraphViewProps {
  activeCaseId: string | null;
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({ activeCaseId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [graphData, setGraphData] = useState<EvidenceGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nodeFilter, setNodeFilter] = useState<string>('ALL');

  // Physics positions
  const positionsRef = useRef<Map<string, NodePosition>>(new Map());
  const isDraggingRef = useRef<boolean>(false);
  const draggedNodeRef = useRef<string | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const fetchGraph = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      const data = await graphService.getCaseGraph(activeCaseId);
      setGraphData(data);

      // Initialize circular layout
      const positions = new Map<string, NodePosition>();
      const count = data.nodes.length;
      const radius = Math.min(260, Math.max(120, count * 28));
      data.nodes.forEach((node, idx) => {
        const angle = (idx / (count || 1)) * 2 * Math.PI;
        positions.set(node.id, {
          x: 400 + radius * Math.cos(angle) + (Math.random() * 20 - 10),
          y: 300 + radius * Math.sin(angle) + (Math.random() * 20 - 10),
          vx: 0,
          vy: 0,
        });
      });
      positionsRef.current = positions;
    } catch (err) {
      console.error('Failed to load evidence graph:', err);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Color helper by node type
  const getNodeColor = (nodeType: string) => {
    switch (nodeType.toLowerCase()) {
      case 'evidence':
        return '#a855f7'; // Purple
      case 'entity':
        return '#3b82f6'; // Blue
      case 'fact':
        return '#10b981'; // Emerald
      case 'hypothesis':
        return '#f59e0b'; // Amber
      default:
        return '#94a3b8'; // Slate
    }
  };

  // Color helper by edge relationship type
  const getEdgeColor = (relType: string) => {
    switch (relType.toLowerCase()) {
      case 'supports':
        return '#10b981'; // Green
      case 'attacks':
        return '#ef4444'; // Red
      case 'contradicts':
        return '#f97316'; // Orange
      case 'derives_from':
        return '#3b82f6'; // Blue
      default:
        return '#64748b'; // Muted
    }
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const positions = positionsRef.current;

      // Filter nodes
      const visibleNodes = graphData.nodes.filter(
        (n) => nodeFilter === 'ALL' || n.node_type.toUpperCase() === nodeFilter
      );
      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      // 1. Draw Edges
      graphData.edges.forEach((edge) => {
        if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return;
        const srcPos = positions.get(edge.source);
        const tgtPos = positions.get(edge.target);
        if (!srcPos || !tgtPos) return;

        ctx.beginPath();
        ctx.moveTo(srcPos.x, srcPos.y);
        ctx.lineTo(tgtPos.x, tgtPos.y);
        ctx.strokeStyle = getEdgeColor(edge.relationship_type);
        ctx.lineWidth = selectedEdge?.id === edge.id ? 3 : 1.5;
        ctx.setLineDash(edge.relationship_type === 'contradicts' ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw relationship label midpoint
        const midX = (srcPos.x + tgtPos.x) / 2;
        const midY = (srcPos.y + tgtPos.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(edge.relationship_type, midX + 3, midY - 3);
      });

      // 2. Draw Nodes
      visibleNodes.forEach((node) => {
        const pos = positions.get(node.id);
        if (!pos) return;

        const isSelected = selectedNode?.id === node.id;
        const color = getNodeColor(node.node_type);

        // Outer glow on selection
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 22, 0, 2 * Math.PI);
          ctx.fillStyle = `${color}33`;
          ctx.fill();
        }

        // Main Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 16, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        const displayLabel = node.label.length > 18 ? node.label.substring(0, 18) + '...' : node.label;
        ctx.fillText(displayLabel, pos.x, pos.y + 28);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [graphData, zoom, pan, selectedNode, selectedEdge, nodeFilter]);

  // Canvas Mouse Controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check hit on nodes
    let clickedNode: GraphNode | null = null;
    const positions = positionsRef.current;

    for (const node of graphData.nodes) {
      const pos = positions.get(node.id);
      if (pos) {
        const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
        if (dist <= 18) {
          clickedNode = node;
          draggedNodeRef.current = node.id;
          break;
        }
      }
    }

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setSelectedEdge(null);
      isDraggingRef.current = true;
    } else {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    if (draggedNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      const pos = positionsRef.current.get(draggedNodeRef.current);
      if (pos) {
        pos.x = mouseX;
        pos.y = mouseY;
      }
    } else {
      // Pan canvas
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            NetworkX Evidence Graph
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Multi-directed graph rehydrated from database • 5 Locked Edge Types • Structural Provenance
          </p>
        </div>

        {/* Node Filter Chips */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'ENTITY', 'FACT', 'HYPOTHESIS', 'EVIDENCE'].map((f) => (
            <button
              key={f}
              onClick={() => setNodeFilter(f)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                backgroundColor: nodeFilter === f ? 'var(--color-primary)' : 'var(--color-bg-base)',
                borderColor: nodeFilter === f ? 'var(--color-primary)' : 'var(--color-border)',
                color: nodeFilter === f ? '#ffffff' : 'var(--color-text-secondary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph Canvas & Inspector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr',
        gap: '1.25rem',
        alignItems: 'start',
      }}>
        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: '600px',
        }}>
          {/* Zoom/Pan Overlay Controls */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '0.4rem',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
              title="Reset View"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Graph Legend */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '1rem',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span>Entity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Fact</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span>Hypothesis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a855f7' }} />
              <span>Evidence</span>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={850}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ width: '100%', height: '600px', cursor: 'grab', display: 'block' }}
          />
        </div>

        {/* Selected Node Inspector */}
        {selectedNode && (
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <Badge variant="primary">{selectedNode.node_type.toUpperCase()}</Badge>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
              {selectedNode.label}
            </h3>

            {selectedNode.sub_type && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Classification: <strong>{selectedNode.sub_type}</strong>
              </div>
            )}

            <div style={{
              background: 'var(--color-bg-base)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                STRUCTURAL PROVENANCE (MANDATORY):
              </span>
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {selectedNode.source_ids.length > 0 ? (
                  selectedNode.source_ids.map((src) => (
                    <code key={src} style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                      {src}
                    </code>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Root evidence node</span>
                )}
              </div>
            </div>

            {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Extracted Attributes
                </h4>
                <pre style={{
                  background: 'var(--color-bg-base)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}>
                  {JSON.stringify(selectedNode.attributes, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
