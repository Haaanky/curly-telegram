import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, MapPin, Radio } from 'lucide-react';
import { useStore } from '../../store';
import type { Unit, Vehicle } from '../../types';
import AddUnitModal from './AddUnitModal';

const ECHELON_INDENT: Record<string, number> = {
  ARMY: 0, CORPS: 1, DIV: 2, BDE: 3, BTN: 4, COY: 5, PLT: 6,
};

function VehicleRow({ vehicle, unitColor }: { vehicle: Vehicle; unitColor: string }) {
  const selectNode = useStore(s => s.selectNode);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const setPlanningFrom = useStore(s => s.setPlanningFrom);
  const selected = vehicle.id === selectedNodeId;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded text-sm
        ${selected ? 'bg-green-900/40 border border-green-600/60' : 'hover:bg-white/5'}`}
      onClick={() => selectNode(vehicle.id)}
    >
      <span className="text-xs text-gray-400 w-4">🚗</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold" style={{ color: unitColor }}>
            {vehicle.callSign}
          </span>
          <span className="text-gray-400 truncate">{vehicle.name}</span>
        </div>
        <div className="flex gap-2 mt-0.5">
          {vehicle.equipment.map(eq => (
            <span key={eq.id} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 rounded">
              {eq.category} {eq.model}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-1">
        {vehicle.position && (
          <span title="Har position"><MapPin size={12} className="text-green-500" /></span>
        )}
        <button
          onClick={e => { e.stopPropagation(); setPlanningFrom(vehicle.id); }}
          className="text-blue-400 hover:text-blue-300 p-0.5"
          title="Planera länk från denna enhet"
        >
          <Radio size={12} />
        </button>
      </div>
    </div>
  );
}

function UnitRow({ unit, level = 0 }: { unit: Unit; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const deleteUnit = useStore(s => s.deleteUnit);
  const selectNode = useStore(s => s.selectNode);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/5 cursor-pointer group rounded"
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-gray-500 w-4">
          {unit.vehicles.length > 0
            ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
            : <span className="w-4 inline-block" />}
        </span>
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ background: unit.color }}
        />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-100">{unit.shortName}</span>
          <span className="text-xs text-gray-500 ml-2">{unit.echelon}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); deleteUnit(unit.id); }}
          className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 p-0.5"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && unit.vehicles.map(v => (
        <div key={v.id} style={{ paddingLeft: `${8 + level * 16 + 20}px` }}>
          <VehicleRow vehicle={v} unitColor={unit.color} />
        </div>
      ))}
    </div>
  );
}

export default function OrgPanel() {
  const units = useStore(s => s.units);
  const [showAdd, setShowAdd] = useState(false);

  // Build tree – only top-level (no parent)
  const roots = units.filter(u => !u.parentId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Organisation
        </span>
        <button
          onClick={() => setShowAdd(true)}
          className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
        >
          <Plus size={14} /> Lägg till
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {roots.map(u => (
          <UnitRow key={u.id} unit={u} />
        ))}
        {/* Child units */}
        {units.filter(u => u.parentId).map(u => (
          <UnitRow key={u.id} unit={u} level={1} />
        ))}
      </div>

      {showAdd && <AddUnitModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
