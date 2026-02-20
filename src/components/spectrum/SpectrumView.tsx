import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../store';
import type { RadioLink } from '../../types';
import { linkQuality } from '../../utils/linkBudget';

// Frequency bands (MHz) with labels
const BANDS = [
  { label: 'HF', min: 2, max: 30, color: '#6366f1' },
  { label: 'VHF Lo', min: 30, max: 88, color: '#8b5cf6' },
  { label: 'VHF Hi', min: 88, max: 225, color: '#a78bfa' },
  { label: 'UHF', min: 225, max: 512, color: '#3b82f6' },
  { label: 'L-band', min: 1000, max: 2000, color: '#06b6d4' },
];

const NET_COLORS: Record<string, string> = {
  COMMAND: '#ef4444',
  ADMIN_LOG: '#f59e0b',
  FIRE_SUPPORT: '#f97316',
  AIR: '#60a5fa',
  DATA: '#34d399',
  COORD: '#a78bfa',
};

interface BandViewProps {
  band: typeof BANDS[0];
  links: RadioLink[];
  onSelectLink: (id: string) => void;
  selectedId: string | null;
}

function BandView({ band, links, onSelectLink, selectedId }: BandViewProps) {
  const inBand = links.filter(
    l => l.frequencyMhz >= band.min && l.frequencyMhz <= band.max
  );

  const span = band.max - band.min;

  const freqToX = (f: number) => ((f - band.min) / span) * 100;
  const bwToW = (bw: number) => Math.max(0.3, (bw / 1000 / span) * 100);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold" style={{ color: band.color }}>{band.label}</span>
        <span className="text-xs text-gray-500">{band.min}–{band.max} MHz</span>
        <span className="text-xs text-gray-600">{inBand.length} länk(ar)</span>
      </div>
      <div
        className="relative h-14 bg-gray-900 rounded border border-white/10 overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${band.color}10, transparent)` }}
      >
        {/* Frequency tick marks */}
        {Array.from({ length: 6 }, (_, i) => {
          const f = band.min + (i / 5) * span;
          const x = (i / 5) * 100;
          return (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: `${x}%` }}>
              <div className="h-full border-l border-white/5" />
              <span className="absolute bottom-0.5 text-[9px] text-gray-600 transform -translate-x-1/2">
                {f.toFixed(1)}
              </span>
            </div>
          );
        })}

        {/* Links */}
        {inBand.map((link, i) => {
          const x = freqToX(link.frequencyMhz);
          const w = bwToW(link.bandwidthKhz);
          const q = link.linkBudget ? linkQuality(link.linkBudget.linkMarginDb) : null;
          const color = q?.color ?? NET_COLORS[link.netType] ?? '#6b7280';
          const selected = link.id === selectedId;

          // Stack links vertically
          const row = i % 3;
          const top = 4 + row * 14;

          return (
            <div
              key={link.id}
              className="absolute cursor-pointer rounded-sm transition-all"
              style={{
                left: `calc(${x}% - ${w / 2}%)`,
                width: `max(${w}%, 8px)`,
                top: `${top}px`,
                height: '12px',
                background: color,
                opacity: selected ? 1 : 0.75,
                outline: selected ? `2px solid white` : undefined,
                zIndex: selected ? 10 : 1,
              }}
              onClick={() => onSelectLink(link.id)}
              title={`${link.netName} · ${link.frequencyMhz} MHz · ${link.waveform}`}
            />
          );
        })}

        {inBand.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-700">
            Inga länkplanerade
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpectrumView() {
  const links = useStore(s => s.links);
  const selectedLinkId = useStore(s => s.selectedLinkId);
  const selectLink = useStore(s => s.selectLink);
  const nodes = useStore(s => s.nodes);

  const selectedLink = links.find(l => l.id === selectedLinkId);
  const fromNode = selectedLink ? nodes.find(n => n.id === selectedLink.fromNodeId) : null;
  const toNode = selectedLink ? nodes.find(n => n.id === selectedLink.toNodeId) : null;

  // Group links by overlap detection
  const freqGroups = useMemo(() => {
    const conflicts: string[] = [];
    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) {
        const a = links[i], b = links[j];
        const aMin = a.frequencyMhz - a.bandwidthKhz / 2000;
        const aMax = a.frequencyMhz + a.bandwidthKhz / 2000;
        const bMin = b.frequencyMhz - b.bandwidthKhz / 2000;
        const bMax = b.frequencyMhz + b.bandwidthKhz / 2000;
        if (aMax > bMin && bMax > aMin) {
          conflicts.push(a.id, b.id);
        }
      }
    }
    return [...new Set(conflicts)];
  }, [links]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Spektrumöversikt</h2>
          <p className="text-xs text-gray-500">Frekvensanvändning per band</p>
        </div>
        {freqGroups.length > 0 && (
          <div className="text-xs bg-red-900/40 border border-red-700/50 text-red-400 px-2 py-1 rounded">
            ⚠ {freqGroups.length / 2} frekvenskonflikter
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {BANDS.map(band => (
          <BandView
            key={band.label}
            band={band}
            links={links}
            onSelectLink={selectLink}
            selectedId={selectedLinkId}
          />
        ))}

        {/* Legend */}
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-xs text-gray-500 mb-2 font-semibold">Nättyper</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(NET_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                <span className="text-xs text-gray-400">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frequency conflict details */}
        {freqGroups.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-xs text-red-400 font-semibold mb-2">Frekvenskonflikter</div>
            {links
              .filter(l => freqGroups.includes(l.id))
              .map(l => (
                <div key={l.id}
                  className="text-xs text-gray-400 bg-red-900/20 border border-red-800/30 rounded px-2 py-1 mb-1 cursor-pointer hover:bg-red-900/40"
                  onClick={() => selectLink(l.id)}
                >
                  {l.netName} · {l.frequencyMhz} MHz ± {(l.bandwidthKhz / 2).toFixed(0)} kHz
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
