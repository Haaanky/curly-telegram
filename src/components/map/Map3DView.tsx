import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../../store';
import type { RadioNode } from '../../types';

const NET_COLOR: Record<string, string> = {
  COMMAND: '#ef4444',
  ADMIN_LOG: '#f59e0b',
  FIRE_SUPPORT: '#f97316',
  AIR: '#60a5fa',
  DATA: '#34d399',
  COORD: '#a78bfa',
};

const TYPE_SYMBOL: Record<string, string> = {
  HQ: '⬟', INF: '△', ARMOR: '◉', ARTY: '◎',
  ENG: '⬡', LOG: '□', SIGNAL: '◈', RECON: '◇',
};

function makeMarkerEl(node: RadioNode, selected: boolean): HTMLElement {
  const el = document.createElement('div');
  const sym = TYPE_SYMBOL[node.type] ?? '●';
  const color = node.color ?? '#3b82f6';

  const ring = selected
    ? `box-shadow:0 0 0 3px white,0 0 0 6px ${color},0 0 20px ${color}88;`
    : `box-shadow:0 4px 16px rgba(0,0,0,0.9),0 2px 4px rgba(0,0,0,0.6);`;

  el.innerHTML = `
    <div style="
      background:linear-gradient(145deg,${color}ee,${color}bb);
      color:white;
      width:40px;height:40px;border-radius:6px;
      display:flex;align-items:center;justify-content:center;
      font-size:20px;font-weight:bold;
      border:2px solid rgba(255,255,255,0.85);
      cursor:pointer;
      transition:transform 0.1s ease;
      ${ring}
    " onmouseover="this.style.transform='scale(1.12)'" onmouseout="this.style.transform='scale(1)'">${sym}</div>
    <div style="
      text-align:center;font-size:10px;font-weight:800;
      color:white;
      text-shadow:0 1px 4px #000,0 0 8px #000;
      margin-top:3px;white-space:nowrap;cursor:pointer;
      letter-spacing:0.05em;
    ">${node.label}</div>
  `;
  return el;
}

export default function Map3DView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const loadedRef = useRef(false);

  const nodes = useStore(s => s.nodes);
  const links = useStore(s => s.links);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectNode = useStore(s => s.selectNode);
  const selectLink = useStore(s => s.selectLink);

  const nodesRef = useRef(nodes);
  const linksRef = useRef(links);
  nodesRef.current = nodes;
  linksRef.current = links;

  const updateLinks = () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const nodeMap = new Map(nodesRef.current.map(n => [n.id, n]));
    const features = linksRef.current.flatMap(link => {
      const from = nodeMap.get(link.fromNodeId);
      const to = nodeMap.get(link.toNodeId);
      if (!from || !to) return [];
      return [{
        type: 'Feature' as const,
        properties: {
          linkId: link.id,
          color: NET_COLOR[link.netType] ?? '#6b7280',
          status: link.status,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [from.position.lng, from.position.lat],
            [to.position.lng, to.position.lat],
          ],
        },
      }];
    });
    (map.getSource('links') as maplibregl.GeoJSONSource)
      ?.setData({ type: 'FeatureCollection', features });
  };

  // Init map (once)
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          base: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© CartoDB © OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'base', type: 'raster', source: 'base' }],
      },
      center: [18.07, 59.33],
      zoom: 10,
      pitch: 62,
      bearing: -20,
      maxPitch: 85,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Terrain DEM
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14,
        attribution: '© Mapzen / AWS terrain tiles',
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: 2.8 });

      // Sky / atmosphere
      map.setSky({
        'sky-color': '#0a0e1a',
        'sky-horizon-blend': 0.5,
        'horizon-color': '#1a2a4a',
        'horizon-fog-blend': 0.8,
        'fog-color': '#0d1825',
        'fog-ground-blend': 0.9,
      });

      // Radio links — casing layer (glow/shadow under lines)
      map.addSource('links', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Glow/shadow beneath lines
      map.addLayer({
        id: 'links-glow',
        type: 'line',
        source: 'links',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['==', ['get', 'status'], 'active'], 12,
            ['==', ['get', 'status'], 'failed'], 4,
            8,
          ],
          'line-opacity': 0.18,
          'line-blur': 6,
        },
      });

      // Main link lines
      map.addLayer({
        id: 'links-line',
        type: 'line',
        source: 'links',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['==', ['get', 'status'], 'active'], 4,
            ['==', ['get', 'status'], 'failed'], 1.5,
            2.5,
          ],
          'line-opacity': [
            'case',
            ['==', ['get', 'status'], 'failed'], 0.3,
            ['==', ['get', 'status'], 'active'], 1.0,
            0.85,
          ],
          'line-dasharray': [
            'case',
            ['==', ['get', 'status'], 'failed'],
            ['literal', [3, 3]],
            ['literal', [1]],
          ],
        },
      });

      map.on('click', 'links-line', (e) => {
        const id = e.features?.[0]?.properties?.linkId as string | undefined;
        if (id) {
          selectLink(id);
          e.originalEvent.stopPropagation();
        }
      });
      map.on('mouseenter', 'links-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'links-line', () => { map.getCanvas().style.cursor = ''; });

      loadedRef.current = true;
      updateLinks();
    });

    map.on('click', () => { selectNode(null); selectLink(null); });

    // Controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    return () => {
      loadedRef.current = false;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(updateLinks, [links, nodes]);

  // Sync node markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();
    nodes.forEach(node => {
      const el = makeMarkerEl(node, node.id === selectedNodeId);
      el.onclick = (e) => { e.stopPropagation(); selectNode(node.id); };
      const marker = new maplibregl.Marker({ element: el, anchor: 'top' })
        .setLngLat([node.position.lng, node.position.lat])
        .addTo(map);
      markersRef.current.set(node.id, marker);
    });
  }, [nodes, selectedNodeId, selectNode]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
