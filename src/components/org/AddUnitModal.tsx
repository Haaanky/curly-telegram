import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import type { UnitType } from '../../types';

const UNIT_TYPES: UnitType[] = ['HQ', 'INF', 'ARMOR', 'ARTY', 'ENG', 'LOG', 'SIGNAL', 'RECON'];
const ECHELONS = ['BDE', 'BTN', 'COY', 'PLT'] as const;
const COLORS = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#06b6d4', '#f97316'];

interface Props { onClose: () => void }

export default function AddUnitModal({ onClose }: Props) {
  const addUnit = useStore(s => s.addUnit);
  const units = useStore(s => s.units);
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    type: 'INF' as UnitType,
    echelon: 'BTN' as typeof ECHELONS[number],
    color: COLORS[1],
    parentId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortName) return;
    addUnit({
      name: form.name,
      shortName: form.shortName,
      type: form.type,
      echelon: form.echelon,
      color: form.color,
      parentId: form.parentId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-100">Lägg till enhet</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Namn</label>
              <input
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="3. Infanteribataljonen"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Kortnamn</label>
              <input
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.shortName}
                onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                placeholder="3 INF BTN"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Typ</label>
              <select
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as UnitType }))}
              >
                {UNIT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Nivå</label>
              <select
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.echelon}
                onChange={e => setForm(f => ({ ...f, echelon: e.target.value as typeof ECHELONS[number] }))}
              >
                {ECHELONS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Överordnad enhet</label>
            <select
              className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
              value={form.parentId}
              onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
            >
              <option value="">— Ingen (toppnivå) —</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Färg</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-6 h-6 rounded-full border-2"
                  style={{
                    background: c,
                    borderColor: form.color === c ? 'white' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-2 rounded font-semibold"
            >
              Lägg till
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
