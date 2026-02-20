import { useCallback } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { RadioNode } from '../../types';
import { useStore } from '../../store';

interface Props {
  node: RadioNode;
  selected: boolean;
  planningFrom: boolean;
  onPlanningClick?: (nodeId: string) => void;
}

const TYPE_SYMBOL: Record<string, string> = {
  HQ: '⬟', INF: '△', ARMOR: '◉', ARTY: '◎',
  ENG: '⬡', LOG: '□', SIGNAL: '◈', RECON: '◇',
};

function makeIcon(node: RadioNode, selected: boolean, planningFrom: boolean): L.DivIcon {
  const sym = TYPE_SYMBOL[node.type] ?? '●';
  const ring = selected ? `box-shadow:0 0 0 3px white,0 0 0 5px ${node.color ?? '#3b82f6'};` : '';
  const glow = planningFrom ? `box-shadow:0 0 0 4px #22c55e,0 0 12px #22c55e;` : ring;
  const html = `
    <div style="
      background:${node.color ?? '#3b82f6'};
      color:white;
      width:36px;height:36px;
      border-radius:4px;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;font-weight:bold;
      border:2px solid rgba(255,255,255,0.8);
      cursor:pointer;
      ${glow}
    ">${sym}</div>
    <div style="
      text-align:center;font-size:10px;font-weight:700;
      color:white;text-shadow:1px 1px 2px #000;
      margin-top:1px;white-space:nowrap;
    ">${node.label}</div>`;
  return L.divIcon({ html, className: '', iconSize: [36, 52], iconAnchor: [18, 18] });
}

export default function NodeMarker({ node, selected, planningFrom, onPlanningClick }: Props) {
  const selectNode = useStore(s => s.selectNode);
  const setPlanningFrom = useStore(s => s.setPlanningFrom);
  const planningFromNodeId = useStore(s => s.planningFromNodeId);
  const moveNode = useStore(s => s.moveNode);

  const handleClick = useCallback(() => {
    if (planningFromNodeId && planningFromNodeId !== node.id && onPlanningClick) {
      onPlanningClick(node.id);
      return;
    }
    selectNode(node.id);
  }, [node.id, planningFromNodeId, selectNode, onPlanningClick]);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const latlng = marker.getLatLng();
    moveNode(node.id, { lat: latlng.lat, lng: latlng.lng });
  }, [node.id, moveNode]);

  return (
    <Marker
      position={[node.position.lat, node.position.lng]}
      icon={makeIcon(node, selected, planningFrom)}
      draggable={true}
      eventHandlers={{
        click: handleClick,
        dragend: handleDragEnd,
      }}
    >
      <Tooltip permanent={false} direction="top" offset={[0, -20]}>
        <div className="text-xs">
          <div className="font-bold">{node.label}</div>
          <div className="text-gray-300">{node.fullName}</div>
          <div className="text-gray-400">{node.equipment.length} radio(n)</div>
        </div>
      </Tooltip>
    </Marker>
  );
}
