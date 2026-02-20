import { Polyline, Tooltip } from 'react-leaflet';
import type { RadioLink, RadioNode } from '../../types';
import { useStore } from '../../store';
import { linkQuality } from '../../utils/linkBudget';

interface Props {
  link: RadioLink;
  fromNode: RadioNode;
  toNode: RadioNode;
  selected: boolean;
  hovered: boolean;
}

const STATUS_DASH: Record<string, string> = {
  planned: '10 6',
  active: '',
  degraded: '6 3 2 3',
  failed: '4 4',
};

const NET_COLOR: Record<string, string> = {
  COMMAND: '#ef4444',
  ADMIN_LOG: '#f59e0b',
  FIRE_SUPPORT: '#f97316',
  AIR: '#60a5fa',
  DATA: '#34d399',
  COORD: '#a78bfa',
};

export default function LinkLine({ link, fromNode, toNode, selected, hovered }: Props) {
  const selectLink = useStore(s => s.selectLink);
  const hoverLink = useStore(s => s.hoverLink);

  const budget = link.linkBudget;
  const quality = budget ? linkQuality(budget.linkMarginDb) : null;
  const color = quality?.color ?? NET_COLOR[link.netType] ?? '#6b7280';
  const weight = selected ? 5 : hovered ? 4 : 2.5;
  const dashArray = STATUS_DASH[link.status] ?? '';

  const positions: [number, number][] = [
    [fromNode.position.lat, fromNode.position.lng],
    [toNode.position.lat, toNode.position.lng],
  ];

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        dashArray,
        opacity: link.status === 'failed' ? 0.4 : 0.85,
      }}
      eventHandlers={{
        click: () => selectLink(link.id),
        mouseover: () => hoverLink(link.id),
        mouseout: () => hoverLink(null),
      }}
    >
      <Tooltip sticky direction="top">
        <div className="text-xs min-w-[160px]">
          <div className="font-bold text-sm">{link.netName}</div>
          <div className="text-gray-200">{link.name}</div>
          <div className="mt-1 space-y-0.5">
            <div>Frekvens: <span className="font-mono">{link.frequencyMhz} MHz</span></div>
            <div>Effekt: <span className="font-mono">{link.txPowerW} W</span></div>
            <div>Modulering: {link.waveform}</div>
            {budget && (
              <>
                <div>Avstånd: {budget.distanceKm.toFixed(1)} km</div>
                <div style={{ color: quality?.color }}>
                  Marginal: {budget.linkMarginDb.toFixed(1)} dB ({quality?.label})
                </div>
              </>
            )}
          </div>
          <div className="mt-1 text-gray-400 capitalize">{link.status}</div>
        </div>
      </Tooltip>
    </Polyline>
  );
}
