import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store';
import NodeMarker from './NodeMarker';
import LinkLine from './LinkLine';
import PlanningOverlay from './PlanningOverlay';

const Map3DView = lazy(() => import('./Map3DView'));

// Fix default icon issue
import L from 'leaflet';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler() {
  const planningFromNodeId = useStore(s => s.planningFromNodeId);
  const setPlanningFrom = useStore(s => s.setPlanningFrom);
  const selectNode = useStore(s => s.selectNode);
  const selectLink = useStore(s => s.selectLink);

  useMapEvents({
    click: () => {
      if (planningFromNodeId) {
        setPlanningFrom(null);
      } else {
        selectNode(null);
        selectLink(null);
      }
    },
  });
  return null;
}

interface MapBoundsProps {
  nodes: { position: { lat: number; lng: number } }[];
}
function FitBounds({ nodes }: MapBoundsProps) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || nodes.length === 0) return;
    fitted.current = true;
    const bounds = L.latLngBounds(nodes.map(n => [n.position.lat, n.position.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, nodes]);
  return null;
}

export default function MapView() {
  const [is3D, setIs3D] = useState(false);
  const nodes = useStore(s => s.nodes);
  const links = useStore(s => s.links);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectedLinkId = useStore(s => s.selectedLinkId);
  const hoveredLinkId = useStore(s => s.hoveredLinkId);
  const planningFromNodeId = useStore(s => s.planningFromNodeId);
  const addLink = useStore(s => s.addLink);
  const selectLink = useStore(s => s.selectLink);
  const setPlanningFrom = useStore(s => s.setPlanningFrom);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Handle second node click when planning
  const handleNodeClickForPlanning = useCallback((toNodeId: string) => {
    if (!planningFromNodeId || planningFromNodeId === toNodeId) return;
    const fromNode = nodeMap.get(planningFromNodeId);
    const toNode = nodeMap.get(toNodeId);
    if (!fromNode || !toNode) return;

    const fromEquip = fromNode.equipment[0];
    const toEquip = toNode.equipment[0];

    addLink({
      name: `${fromNode.label} → ${toNode.label}`,
      netName: 'NY-NET',
      netType: 'COMMAND',
      fromNodeId: planningFromNodeId,
      toNodeId,
      equipmentFromId: fromEquip?.id,
      equipmentToId: toEquip?.id,
      frequencyMhz: fromEquip?.freqMin ?? 45.0,
      bandwidthKhz: 25,
      waveform: 'FM',
      txPowerW: fromEquip?.maxPowerW ?? 20,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 3600000).toISOString(),
      status: 'planned',
    });
    setPlanningFrom(null);
  }, [planningFromNodeId, nodeMap, addLink, setPlanningFrom]);

  const toggle = (
    <button
      onClick={() => setIs3D(v => !v)}
      className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg border border-white/20 backdrop-blur-sm select-none"
      style={{ background: is3D ? '#3b82f6' : 'rgba(30,40,30,0.85)', color: 'white' }}
      title="Växla 2D / 3D"
    >
      {is3D ? '2D' : '3D'}
    </button>
  );

  if (is3D) {
    return (
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500 text-sm h-full">Laddar 3D…</div>}>
          <Map3DView />
        </Suspense>
        {toggle}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
    {toggle}
    <MapContainer
      center={[59.33, 18.07]}
      zoom={11}
      style={{ height: '100%', width: '100%', background: '#1a2010' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles-dark"
      />
      <ZoomControl position="bottomright" />
      <MapClickHandler />
      <FitBounds nodes={nodes} />

      {/* Radio links */}
      {links.map(link => {
        const from = nodeMap.get(link.fromNodeId);
        const to = nodeMap.get(link.toNodeId);
        if (!from || !to) return null;
        return (
          <LinkLine
            key={link.id}
            link={link}
            fromNode={from}
            toNode={to}
            selected={link.id === selectedLinkId}
            hovered={link.id === hoveredLinkId}
          />
        );
      })}

      {/* Node markers */}
      {nodes.map(node => (
        <NodeMarker
          key={node.id}
          node={node}
          selected={node.id === selectedNodeId}
          planningFrom={node.id === planningFromNodeId}
          onPlanningClick={planningFromNodeId ? handleNodeClickForPlanning : undefined}
        />
      ))}

      {/* Planning overlay – click handling */}
      {planningFromNodeId && (
        <PlanningOverlay
          fromNodeId={planningFromNodeId}
          nodes={nodes}
          onSelect={handleNodeClickForPlanning}
        />
      )}
    </MapContainer>
    </div>
  );
}
