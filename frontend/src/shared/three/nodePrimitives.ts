import * as THREE from 'three';

export interface Node3DData {
  id: string;
  label: string;
  node_type: string;
  sub_type?: string | null;
  x: number;
  y: number;
  z: number;
  attributes?: Record<string, unknown>;
  source_ids?: string[];
  confidence?: number;
}

export const getNodeTypeColor = (nodeType: string): string => {
  switch (nodeType.toLowerCase()) {
    case 'evidence':
      return '#a855f7'; // Purple
    case 'entity':
      return '#3b82f6'; // Electric Blue
    case 'fact':
      return '#10b981'; // Emerald Green
    case 'hypothesis':
      return '#f59e0b'; // Amber
    default:
      return '#94a3b8'; // Slate
  }
};

export const getEdgeTypeColor = (relType: string): string => {
  switch (relType.toLowerCase()) {
    case 'supports':
      return '#10b981'; // Emerald
    case 'attacks':
      return '#ef4444'; // Red
    case 'contradicts':
      return '#f97316'; // Orange
    case 'derives_from':
      return '#3b82f6'; // Blue
    default:
      return '#64748b'; // Muted Slate
  }
};

export const createNodeMaterial = (color: string, isSelected: boolean): THREE.MeshStandardMaterial => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: isSelected ? new THREE.Color(color).multiplyScalar(0.4) : new THREE.Color(0x000000),
    roughness: 0.3,
    metalness: 0.2,
  });
};
