import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useStore } from '../../store';
import type { RadioLink } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  planned: '#3b82f6',
  active: '#22c55e',
  degraded: '#facc15',
  failed: '#ef4444',
};

const NET_COLORS: Record<string, string> = {
  COMMAND: '#ef4444',
  ADMIN_LOG: '#f59e0b',
  FIRE_SUPPORT: '#f97316',
  AIR: '#60a5fa',
  DATA: '#34d399',
  COORD: '#a78bfa',
};

function formatHour(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('sv-SE', { weekday: 'short', day: '2-digit', month: 'short' });
}

interface GanttBarProps {
  link: RadioLink;
  viewStart: number;
  viewEnd: number;
  rowH: number;
  rowIdx: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

function GanttBar({ link, viewStart, viewEnd, rowH, rowIdx, selected, onSelect }: GanttBarProps) {
  const span = viewEnd - viewStart;
  const linkStart = new Date(link.startTime).getTime();
  const linkEnd = new Date(link.endTime).getTime();

  // Clip to visible range
  const clippedStart = Math.max(linkStart, viewStart);
  const clippedEnd = Math.min(linkEnd, viewEnd);
  if (clippedStart >= clippedEnd) return null;

  const left = ((clippedStart - viewStart) / span) * 100;
  const width = ((clippedEnd - clippedStart) / span) * 100;
  const color = NET_COLORS[link.netType] ?? '#6b7280';

  return (
    <div
      className="absolute cursor-pointer rounded flex items-center overflow-hidden px-1.5 transition-all"
      style={{
        left: `${left}%`,
        width: `${Math.max(width, 0.5)}%`,
        top: rowIdx * rowH + 4,
        height: rowH - 8,
        background: color,
        opacity: selected ? 1 : 0.8,
        outline: selected ? '2px solid white' : undefined,
        zIndex: selected ? 10 : 1,
      }}
      onClick={() => onSelect(link.id)}
      title={`${link.netName} · ${link.frequencyMhz} MHz · ${link.status}`}
    >
      <span className="text-[10px] font-bold text-white truncate leading-none">
        {link.netName}
      </span>
    </div>
  );
}

export default function TimelineView() {
  const links = useStore(s => s.links);
  const nodes = useStore(s => s.nodes);
  const selectedLinkId = useStore(s => s.selectedLinkId);
  const selectLink = useStore(s => s.selectLink);

  const now = new Date();
  const [offsetHours, setOffsetHours] = useState(0);
  const [spanHours, setSpanHours] = useState(24);

  const viewStart = new Date(now.getTime() + (offsetHours - spanHours / 2) * 3600000).getTime();
  const viewEnd = viewStart + spanHours * 3600000;

  // Group by node (from)
  const rowNodes = useMemo(() => {
    const seen = new Set<string>();
    const result: typeof nodes = [];
    for (const link of links) {
      if (!seen.has(link.fromNodeId)) {
        const n = nodes.find(n => n.id === link.fromNodeId);
        if (n) { result.push(n); seen.add(link.fromNodeId); }
      }
      if (!seen.has(link.toNodeId)) {
        const n = nodes.find(n => n.id === link.toNodeId);
        if (n) { result.push(n); seen.add(link.toNodeId); }
      }
    }
    return result;
  }, [links, nodes]);

  const ROW_H = 32;
  const LABEL_W = 140;
  const HEADER_H = 40;

  // Build tick marks (every 2h or 6h based on span)
  const tickInterval = spanHours <= 12 ? 1 : spanHours <= 48 ? 4 : 12;
  const ticks = useMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = [];
    const start = new Date(viewStart);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - (start.getHours() % tickInterval) + tickInterval);
    for (let t = start.getTime(); t <= viewEnd; t += tickInterval * 3600000) {
      const d = new Date(t);
      const major = d.getHours() === 0;
      result.push({
        time: t,
        label: major ? formatDay(d) : formatHour(d),
        major,
      });
    }
    return result;
  }, [viewStart, viewEnd, tickInterval]);

  // Now-line position
  const nowPct = ((now.getTime() - viewStart) / (viewEnd - viewStart)) * 100;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 overflow-hidden select-none">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 flex-shrink-0">
        <Clock size={14} className="text-gray-500" />
        <span className="text-sm font-semibold">Tidslinje</span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500">Span:</span>
          {[6, 12, 24, 48, 96].map(h => (
            <button
              key={h}
              onClick={() => setSpanHours(h)}
              className={`text-xs px-2 py-0.5 rounded ${spanHours === h ? 'bg-green-800 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {h}h
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffsetHours(o => o - spanHours / 2)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setOffsetHours(0)}
            className="text-xs px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          >
            Nu
          </button>
          <button
            onClick={() => setOffsetHours(o => o + spanHours / 2)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div style={{ display: 'flex', minWidth: '600px' }}>
          {/* Row labels */}
          <div style={{ width: LABEL_W, flexShrink: 0 }}>
            {/* Header spacer */}
            <div style={{ height: HEADER_H }} className="border-b border-white/10" />
            {rowNodes.map((node, i) => (
              <div
                key={node.id}
                className="flex items-center gap-1.5 px-2 border-b border-white/5"
                style={{ height: ROW_H }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: node.color }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-200 truncate leading-tight">{node.label}</div>
                  <div className="text-[10px] text-gray-500 truncate leading-tight">{node.fullName.split('/')[0]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Header with ticks */}
            <div
              className="relative border-b border-white/10"
              style={{ height: HEADER_H, background: '#111827' }}
            >
              {ticks.map((tick, i) => {
                const pct = ((tick.time - viewStart) / (viewEnd - viewStart)) * 100;
                if (pct < 0 || pct > 100) return null;
                return (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left: `${pct}%` }}>
                    <div className={`h-full border-l ${tick.major ? 'border-white/30' : 'border-white/10'}`} />
                    <span
                      className={`absolute top-1.5 text-[10px] transform -translate-x-1/2 whitespace-nowrap
                        ${tick.major ? 'text-gray-200 font-bold' : 'text-gray-500'}`}
                    >
                      {tick.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Row backgrounds & bars */}
            <div className="relative" style={{ height: rowNodes.length * ROW_H }}>
              {/* Grid lines */}
              {ticks.map((tick, i) => {
                const pct = ((tick.time - viewStart) / (viewEnd - viewStart)) * 100;
                if (pct < 0 || pct > 100) return null;
                return (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 border-l ${tick.major ? 'border-white/15' : 'border-white/5'}`}
                    style={{ left: `${pct}%` }}
                  />
                );
              })}

              {/* Row stripes */}
              {rowNodes.map((node, i) => (
                <div
                  key={node.id}
                  className="absolute left-0 right-0 border-b border-white/5"
                  style={{ top: i * ROW_H, height: ROW_H, background: i % 2 === 0 ? '#0f172a40' : 'transparent' }}
                />
              ))}

              {/* Now line */}
              {nowPct >= 0 && nowPct <= 100 && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-green-400 pointer-events-none"
                  style={{ left: `${nowPct}%`, zIndex: 20 }}
                >
                  <div className="absolute -top-0.5 -translate-x-1/2 bg-green-400 text-black text-[9px] px-1 rounded font-bold">
                    NU
                  </div>
                </div>
              )}

              {/* Gantt bars – per link, find which rows it belongs to */}
              {links.map(link => {
                const fromIdx = rowNodes.findIndex(n => n.id === link.fromNodeId);
                const toIdx = rowNodes.findIndex(n => n.id === link.toNodeId);

                return (
                  <>
                    {fromIdx >= 0 && (
                      <GanttBar
                        key={`${link.id}-from`}
                        link={link}
                        viewStart={viewStart}
                        viewEnd={viewEnd}
                        rowH={ROW_H}
                        rowIdx={fromIdx}
                        selected={link.id === selectedLinkId}
                        onSelect={selectLink}
                      />
                    )}
                    {toIdx >= 0 && toIdx !== fromIdx && (
                      <GanttBar
                        key={`${link.id}-to`}
                        link={link}
                        viewStart={viewStart}
                        viewEnd={viewEnd}
                        rowH={ROW_H}
                        rowIdx={toIdx}
                        selected={link.id === selectedLinkId}
                        onSelect={selectLink}
                      />
                    )}
                  </>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10 text-xs text-gray-500 flex-shrink-0">
        {['planned', 'active', 'degraded', 'failed'].map(s => {
          const count = links.filter(l => l.status === s).length;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              <span>{count} {s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
