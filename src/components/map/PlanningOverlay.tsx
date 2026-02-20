import { useMapEvents } from 'react-leaflet';
import type { RadioNode } from '../../types';

interface Props {
  fromNodeId: string;
  nodes: RadioNode[];
  onSelect: (nodeId: string) => void;
}

/** Invisible overlay that intercepts click events for planning mode */
export default function PlanningOverlay({ fromNodeId, nodes, onSelect }: Props) {
  useMapEvents({
    click: (e) => {
      // Find nearest node within 30px
      // Actual node selection is done by the NodeMarker click handler
    },
  });

  // Re-render node markers with special handlers is done in MapView
  return null;
}
