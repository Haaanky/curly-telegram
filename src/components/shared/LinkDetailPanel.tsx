import { X, Trash2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useStore } from '../../store';
import { linkQuality, fmtDb, fmtDbm } from '../../utils/linkBudget';
import type { LinkStatus } from '../../types';

const STATUS_ICON: Record<LinkStatus, React.ReactNode> = {
  planned: <Clock size={13} className="text-blue-400" />,
  active: <CheckCircle2 size={13} className="text-green-400" />,
  degraded: <AlertTriangle size={13} className="text-yellow-400" />,
  failed: <XCircle size={13} className="text-red-400" />,
};

export default function LinkDetailPanel() {
  const selectedLinkId = useStore(s => s.selectedLinkId);
  const links = useStore(s => s.links);
  const nodes = useStore(s => s.nodes);
  const selectLink = useStore(s => s.selectLink);
  const deleteLink = useStore(s => s.deleteLink);
  const updateLink = useStore(s => s.updateLink);

  const link = links.find(l => l.id === selectedLinkId);
  if (!link) return null;

  const from = nodes.find(n => n.id === link.fromNodeId);
  const to = nodes.find(n => n.id === link.toNodeId);
  const b = link.linkBudget;
  const q = b ? linkQuality(b.linkMarginDb) : null;

  const handleDelete = () => {
    deleteLink(link.id);
    selectLink(null);
  };

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm z-[1000]">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          {STATUS_ICON[link.status]}
          <span className="font-bold text-sm text-gray-100">{link.netName}</span>
          <span className="text-xs text-gray-500">{link.frequencyMhz} MHz</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDelete} className="text-red-500/60 hover:text-red-400">
            <Trash2 size={13} />
          </button>
          <button onClick={() => selectLink(null)} className="text-gray-500 hover:text-gray-300">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="text-gray-500">Nättyp</div>
          <div className="text-gray-200">{link.netType}</div>
          <div className="text-gray-500">Modulering</div>
          <div className="font-mono text-gray-200">{link.waveform}</div>
          <div className="text-gray-500">Bandbredd</div>
          <div className="font-mono text-gray-200">{link.bandwidthKhz} kHz</div>
          <div className="text-gray-500">Sändeffekt</div>
          <div className="font-mono text-gray-200">{link.txPowerW} W</div>
          <div className="text-gray-500">Från</div>
          <div className="text-gray-200 font-semibold">{from?.label ?? '?'}</div>
          <div className="text-gray-500">Till</div>
          <div className="text-gray-200 font-semibold">{to?.label ?? '?'}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          {(['planned', 'active', 'degraded', 'failed'] as LinkStatus[]).map(s => (
            <button
              key={s}
              onClick={() => updateLink(link.id, { status: s })}
              className={`text-[10px] px-2 py-0.5 rounded capitalize
                ${link.status === s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {b && (
          <div className="bg-gray-800/60 rounded p-2 space-y-0.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-300">Länkbudget</span>
              {q && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: q.color + '30', color: q.color }}>
                  {q.label}
                </span>
              )}
            </div>
            {[
              ['Avstånd', `${b.distanceKm.toFixed(2)} km`],
              ['FSPL', `-${b.fsplDb.toFixed(1)} dB`],
              ['Terrängdämpning', `-${b.terrainLossDb.toFixed(1)} dB`],
              ['Mottagen effekt', fmtDbm(b.receivedPowerDbm)],
              ['Rx-känslighet', fmtDbm(b.rxSensitivityDbm)],
              ['Länkmarginal', fmtDb(b.linkMarginDb)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={`font-mono ${label === 'Länkmarginal' ? (b.linkMarginDb > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-200'}`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}

        {link.notes && (
          <div className="text-xs text-gray-400 italic border-t border-white/10 pt-2">
            {link.notes}
          </div>
        )}
      </div>
    </div>
  );
}
