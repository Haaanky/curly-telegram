import { X, Radio, MapPin, Antenna } from 'lucide-react';
import { useStore } from '../../store';
import { formatLatLng } from '../../utils/geo';

export default function NodeDetailPanel() {
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const nodes = useStore(s => s.nodes);
  const links = useStore(s => s.links);
  const units = useStore(s => s.units);
  const selectNode = useStore(s => s.selectNode);
  const setPlanningFrom = useStore(s => s.setPlanningFrom);
  const planningFromNodeId = useStore(s => s.planningFromNodeId);

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const unit = units.find(u => u.id === node.unitId);
  const nodeLinks = links.filter(l => l.fromNodeId === node.id || l.toNodeId === node.id);

  const isPlanningFrom = planningFromNodeId === node.id;

  return (
    <div className="absolute bottom-4 left-4 w-72 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm z-[1000]">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: node.color }} />
          <span className="font-bold text-sm text-gray-100">{node.label}</span>
          <span className="text-xs text-gray-500">{node.type}</span>
        </div>
        <button onClick={() => selectNode(null)} className="text-gray-500 hover:text-gray-300">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Enhet</div>
          <div className="text-sm text-gray-200">{node.fullName}</div>
          {unit && <div className="text-xs text-gray-500">{unit.name} · {unit.echelon}</div>}
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
            <MapPin size={10} /> Position
          </div>
          <div className="text-xs font-mono text-gray-300">{formatLatLng(node.position)}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Antenna size={10} /> Radioutrustning ({node.equipment.length})
          </div>
          {node.equipment.length === 0 ? (
            <div className="text-xs text-gray-600 italic">Ingen utrustning registrerad</div>
          ) : (
            <div className="space-y-1">
              {node.equipment.map(eq => (
                <div key={eq.id} className="bg-gray-800/80 rounded px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200">{eq.name}</span>
                    <span className="text-[10px] bg-gray-700 text-gray-400 px-1 rounded">{eq.category}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {eq.freqMin}–{eq.freqMax} MHz · {eq.maxPowerW} W · {eq.antennaGainDbi} dBi
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {nodeLinks.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Radio size={10} /> Aktiva länktar ({nodeLinks.length})
            </div>
            {nodeLinks.map(link => (
              <div key={link.id} className="text-xs text-gray-400 bg-gray-800/60 rounded px-2 py-0.5 mb-0.5 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${link.status === 'active' ? 'bg-green-400' : link.status === 'planned' ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                <span className="font-mono font-bold text-gray-300">{link.netName}</span>
                <span>{link.frequencyMhz} MHz</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPlanningFrom(isPlanningFrom ? null : node.id)}
          className={`w-full text-xs py-2 rounded font-semibold flex items-center justify-center gap-2
            ${isPlanningFrom
              ? 'bg-green-700 text-white animate-pulse'
              : 'bg-blue-900/60 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50'}`}
        >
          <Radio size={12} />
          {isPlanningFrom ? 'Välj mål-nod på kartan…' : 'Planera länk härifrån'}
        </button>
      </div>
    </div>
  );
}
