import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Radio, Antenna } from 'lucide-react';
import { useStore } from '../../store';
import type { RadioLink, NetType, WaveformType, LinkStatus } from '../../types';
import { linkQuality, fmtDb, fmtDbm } from '../../utils/linkBudget';
import AddLinkModal from './AddLinkModal';

const STATUS_COLOR: Record<LinkStatus, string> = {
  planned: 'text-blue-400',
  active: 'text-green-400',
  degraded: 'text-yellow-400',
  failed: 'text-red-400',
};

const STATUS_LABEL: Record<LinkStatus, string> = {
  planned: 'Planerad',
  active: 'Aktiv',
  degraded: 'Nedsatt',
  failed: 'Utslagen',
};

const NET_BADGE: Record<NetType, { label: string; cls: string }> = {
  COMMAND: { label: 'BEF', cls: 'bg-red-900/60 text-red-300' },
  ADMIN_LOG: { label: 'LOG', cls: 'bg-yellow-900/60 text-yellow-300' },
  FIRE_SUPPORT: { label: 'ELD', cls: 'bg-orange-900/60 text-orange-300' },
  AIR: { label: 'LUFT', cls: 'bg-blue-900/60 text-blue-300' },
  DATA: { label: 'DATA', cls: 'bg-teal-900/60 text-teal-300' },
  COORD: { label: 'COORD', cls: 'bg-purple-900/60 text-purple-300' },
};

function LinkBudgetDetails({ link }: { link: RadioLink }) {
  const b = link.linkBudget;
  if (!b) return <div className="text-xs text-gray-500 italic px-3 py-1">Ingen länkbudget</div>;
  const q = linkQuality(b.linkMarginDb);
  return (
    <div className="bg-gray-900/80 border border-white/5 rounded mx-2 mb-2 p-2 text-xs font-mono space-y-0.5">
      <div className="flex justify-between">
        <span className="text-gray-400">Avstånd</span>
        <span>{b.distanceKm.toFixed(2)} km</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Tx-effekt</span>
        <span>{fmtDbm(b.txPowerDbm)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Tx-antennförstärk.</span>
        <span>{fmtDb(b.txGainDbi)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">FSPL</span>
        <span className="text-red-400">-{b.fsplDb.toFixed(1)} dB</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Terrängdämpning</span>
        <span className="text-red-400">-{b.terrainLossDb.toFixed(1)} dB</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Rx-antennförstärk.</span>
        <span>{fmtDb(b.rxGainDbi)}</span>
      </div>
      <div className="flex justify-between border-t border-white/10 pt-0.5 mt-0.5">
        <span className="text-gray-400">Mottagen effekt</span>
        <span>{fmtDbm(b.receivedPowerDbm)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Rx-känslighet</span>
        <span>{fmtDbm(b.rxSensitivityDbm)}</span>
      </div>
      <div className="flex justify-between font-bold border-t border-white/10 pt-0.5 mt-0.5">
        <span>Marginal</span>
        <span style={{ color: q.color }}>{fmtDb(b.linkMarginDb)} ({q.label})</span>
      </div>
    </div>
  );
}

function LinkRow({ link }: { link: RadioLink }) {
  const [expanded, setExpanded] = useState(false);
  const selectLink = useStore(s => s.selectLink);
  const deleteLink = useStore(s => s.deleteLink);
  const updateLink = useStore(s => s.updateLink);
  const nodes = useStore(s => s.nodes);
  const selectedLinkId = useStore(s => s.selectedLinkId);

  const from = nodes.find(n => n.id === link.fromNodeId);
  const to = nodes.find(n => n.id === link.toNodeId);
  const selected = link.id === selectedLinkId;
  const q = link.linkBudget ? linkQuality(link.linkBudget.linkMarginDb) : null;
  const netBadge = NET_BADGE[link.netType];

  return (
    <div className={`border rounded mb-1 overflow-hidden ${selected ? 'border-green-600/60 bg-green-900/10' : 'border-white/5 bg-gray-900/40'}`}>
      <div
        className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-white/5"
        onClick={() => { selectLink(link.id); setExpanded(e => !e); }}
      >
        <span className="text-gray-500 w-3">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className={`text-[10px] px-1 rounded font-mono ${netBadge.cls}`}>{netBadge.label}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-100 truncate">{link.netName}</span>
            {q && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: q.color }} />
            )}
          </div>
          <div className="text-[10px] text-gray-500 truncate">
            {from?.label ?? '?'} → {to?.label ?? '?'} · {link.frequencyMhz} MHz · {link.waveform}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] ${STATUS_COLOR[link.status]}`}>
            {STATUS_LABEL[link.status]}
          </span>
          <button
            onClick={e => { e.stopPropagation(); deleteLink(link.id); }}
            className="text-red-500/50 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          <div className="px-3 py-1 flex gap-3 text-xs border-t border-white/5 bg-gray-900/60">
            <select
              className="bg-gray-800 border border-white/10 rounded px-1 py-0.5 text-xs text-gray-200"
              value={link.status}
              onChange={e => updateLink(link.id, { status: e.target.value as LinkStatus })}
            >
              {(['planned', 'active', 'degraded', 'failed'] as LinkStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 text-gray-400">
              <Radio size={10} /> {link.txPowerW} W · BW {link.bandwidthKhz} kHz
            </div>
          </div>
          <LinkBudgetDetails link={link} />
        </div>
      )}
    </div>
  );
}

export default function LinkPanel() {
  const links = useStore(s => s.links);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  const NET_TYPES: (NetType | 'ALL')[] = ['ALL', 'COMMAND', 'ADMIN_LOG', 'FIRE_SUPPORT', 'DATA', 'AIR'];
  const filtered = filter === 'ALL' ? links : links.filter(l => l.netType === filter);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Radiolänkar
        </span>
        <button
          onClick={() => setShowAdd(true)}
          className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
        >
          <Plus size={14} /> Ny länk
        </button>
      </div>

      <div className="flex gap-1 p-2 border-b border-white/5 overflow-x-auto">
        {NET_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0
              ${filter === t ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {t === 'ALL' ? 'Alla' : NET_BADGE[t as NetType]?.label ?? t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-500 text-center mt-8">Inga länkar</div>
        ) : (
          filtered.map(l => <LinkRow key={l.id} link={l} />)
        )}
      </div>

      {showAdd && <AddLinkModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
