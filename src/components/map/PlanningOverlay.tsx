import { useMapEvents } from 'react-leaflet';
import type { RadioNode } from '../../types';

interface Props {
  fromNodeId: string;
  nodes: RadioNode[];
  onSelect: (nodeId: string) => void;
}

/** Intercepts map clicks during planning mode and routes to nearest node */
export default function PlanningOverlay({ fromNodeId, nodes, onSelect }: Props) {
  useMapEvents({
    click: (e) => {
      // Find nearest node to click position (within ~60px screen distance)
      const map = e.target;
      let nearest: RadioNode | null = null;
      let minDist = 60; // pixels

      nodes.forEach(node => {
        if (node.id === fromNodeId) return;
        const point = map.latLngToContainerPoint([node.position.lat, node.position.lng]);
        const clickPoint = map.latLngToContainerPoint(e.latlng);
        const dist = Math.hypot(point.x - clickPoint.x, point.y - clickPoint.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = node;
        }
      });

      if (nearest) {
        onSelect((nearest as RadioNode).id);
      }
    },
  });

  return null;
}
