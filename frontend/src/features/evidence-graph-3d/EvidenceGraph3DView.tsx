import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Card } from '../../design-system/Card';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { graphService } from '../../services/graphService';
import { EvidenceGraph } from '../../types/graph';
import { getNodeTypeColor, getEdgeTypeColor, Node3DData } from '../../shared/three/nodePrimitives';
import { EvidenceGraphView } from '../evidence-graph/EvidenceGraphView';
import { Box, Layers, ShieldCheck } from 'lucide-react';

interface EvidenceGraph3DViewProps {
  activeCaseId: string | null;
}

// 3D Node Mesh Component
const GraphNode3D: React.FC<{
  node: Node3DData;
  isSelected: boolean;
  onClick: (node: Node3DData) => void;
}> = ({ node, isSelected, onClick }) => {
  const color = getNodeTypeColor(node.node_type);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer halo when selected */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[1.3, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
        </mesh>
      )}

      {/* Main Node Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
      >
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.0}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>

      {/* Billboard Text Label */}
      <Html position={[0, -1.2, 0]} center distanceFactor={15}>
        <div style={{
          background: isSelected ? 'rgba(59, 130, 246, 0.9)' : 'rgba(15, 23, 42, 0.85)',
          border: `1px solid ${isSelected ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '4px',
          padding: '2px 6px',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
        </div>
      </Html>
    </group>
  );
};

// 3D Edge Line Component
const GraphEdge3D: React.FC<{
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  relType: string;
}> = ({ sourcePos, targetPos, relType }) => {
  const color = getEdgeTypeColor(relType);

  const points = useMemo(() => {
    return [new THREE.Vector3(...sourcePos), new THREE.Vector3(...targetPos)];
  }, [sourcePos, targetPos]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <primitive object={new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.75 })
    )} />
  );
};

export const EvidenceGraph3DView: React.FC<EvidenceGraph3DViewProps> = ({ activeCaseId }) => {
  const [graphData, setGraphData] = useState<EvidenceGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [nodeFilter, setNodeFilter] = useState<string>('ALL');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        setIs3DMode(false);
      }
    } catch {
      setWebglSupported(false);
      setIs3DMode(false);
    }
  }, []);

  const fetchGraph = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      const data = await graphService.getCaseGraph(activeCaseId);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load evidence graph for 3D view:', err);
    }
  }, [activeCaseId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Transform graph nodes into 3D spatial coordinates
  const nodes3D: Node3DData[] = useMemo(() => {
    if (!graphData) return [];
    const count = graphData.nodes.length;
    const radius = Math.min(18, Math.max(8, count * 1.5));

    return graphData.nodes.map((n, idx) => {
      // Spherical Fibonacci distribution for uniform 3D placement
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / (count || 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * (idx + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      return {
        id: n.id,
        label: n.label,
        node_type: n.node_type,
        sub_type: n.sub_type,
        x,
        y,
        z,
        attributes: n.attributes,
        source_ids: n.source_ids,
        confidence: n.confidence,
      };
    });
  }, [graphData]);

  // Position lookup map
  const positionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    nodes3D.forEach((n) => map.set(n.id, [n.x, n.y, n.z]));
    return map;
  }, [nodes3D]);

  // Filter visible nodes & edges
  const visibleNodes = useMemo(() => {
    return nodes3D.filter((n) => nodeFilter === 'ALL' || n.node_type.toUpperCase() === nodeFilter);
  }, [nodes3D, nodeFilter]);

  const visibleNodeIds = useMemo(() => {
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [graphData, visibleNodeIds]);

  if (!is3DMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              2D Fallback Evidence Graph
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              High-performance 2D Canvas representation active
            </p>
          </div>
          {webglSupported && (
            <Button variant="primary" onClick={() => setIs3DMode(true)}>
              <Box size={16} />
              <span>Switch to 3D View</span>
            </Button>
          )}
        </div>
        <EvidenceGraphView activeCaseId={activeCaseId} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="primary">3D SPATIAL GRAPH</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              React Three Fiber • Three.js WebGL Core
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            3D Spatial Evidence Graph
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Rotational 3D investigation space • Node type classification • 5 Locked Edge Types • Provenance Inspector
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Node Filter Chips */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
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

          <Button variant="secondary" onClick={() => setIs3DMode(false)}>
            <Layers size={16} />
            <span>2D View</span>
          </Button>
        </div>
      </div>

      {/* Main 3D Canvas & Inspector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr',
        gap: '1.25rem',
        alignItems: 'start',
      }}>
        {/* Three.js Canvas Container */}
        <div style={{
          position: 'relative',
          background: 'radial-gradient(circle at center, #0f172a 0%, #070b13 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: '620px',
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* 3D Legend Overlay */}
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

          <Canvas
            camera={{ position: [0, 0, 32], fov: 60 }}
            style={{ width: '100%', height: '620px', display: 'block' }}
          >
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={1.5} />
            <pointLight position={[-20, -20, -20]} intensity={0.8} color="#3b82f6" />

            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              maxDistance={80}
              minDistance={5}
            />

            {/* Render 3D Edges */}
            {visibleEdges.map((edge) => {
              const src = positionMap.get(edge.source);
              const tgt = positionMap.get(edge.target);
              if (!src || !tgt) return null;
              return (
                <GraphEdge3D
                  key={edge.id}
                  sourcePos={src}
                  targetPos={tgt}
                  relType={edge.relationship_type}
                />
              );
            })}

            {/* Render 3D Nodes */}
            {visibleNodes.map((node) => (
              <GraphNode3D
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onClick={(n) => setSelectedNode(n)}
              />
            ))}
          </Canvas>
        </div>

        {/* Selected Node Provenance Inspector */}
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
                Type: <strong>{selectedNode.sub_type}</strong>
              </div>
            )}

            {/* Structural Provenance Box */}
            <div style={{
              background: 'var(--color-bg-base)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  STRUCTURAL PROVENANCE LINK:
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {selectedNode.source_ids && selectedNode.source_ids.length > 0 ? (
                  selectedNode.source_ids.map((src) => (
                    <code key={src} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                      {src}
                    </code>
                  ))
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Root evidence node</span>
                )}
              </div>
            </div>

            {/* Extracted Attributes */}
            {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Attributes Payload
                </h4>
                <pre style={{
                  background: 'var(--color-bg-base)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
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
