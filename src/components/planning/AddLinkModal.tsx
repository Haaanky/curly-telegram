import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import type { NetType, WaveformType } from '../../types';

const WAVEFORMS: WaveformType[] = ['FM', 'AM', 'USB', 'LSB', 'WBFM', 'FSK', 'PSK', 'QAM'];
const NET_TYPES: NetType[] = ['COMMAND', 'ADMIN_LOG', 'FIRE_SUPPORT', 'AIR', 'DATA', 'COORD'];
const NET_LABELS: Record<NetType, string> = {
  COMMAND: 'Befälsnät',
  ADMIN_LOG: 'Logistiknät',
  FIRE_SUPPORT: 'Eldledningsnät',
  AIR: 'Luftnät',
  DATA: 'Datanät',
  COORD: 'Samordningsnät',
};

interface Props { onClose: () => void }

export default function AddLinkModal({ onClose }: Props) {
  const nodes = useStore(s => s.nodes);
  const addLink = useStore(s => s.addLink);
  const units = useStore(s => s.units);

  const [form, setForm] = useState({
    name: '',
    netName: '',
    netType: 'COMMAND' as NetType,
    fromNodeId: nodes[0]?.id ?? '',
    toNodeId: nodes[1]?.id ?? '',
    frequencyMhz: 45.5,
    bandwidthKhz: 25,
    waveform: 'FM' as WaveformType,
    txPowerW: 50,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
    notes: '',
  });

  const fromNode = nodes.find(n => n.id === form.fromNodeId);
  const fromEquipOptions = fromNode?.equipment ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromNodeId || !form.toNodeId || form.fromNodeId === form.toNodeId) return;
    addLink({
      name: form.name || `${form.netName} länk`,
      netName: form.netName,
      netType: form.netType,
      fromNodeId: form.fromNodeId,
      toNodeId: form.toNodeId,
      equipmentFromId: fromEquipOptions[0]?.id,
      equipmentToId: undefined,
      frequencyMhz: form.frequencyMhz,
      bandwidthKhz: form.bandwidthKhz,
      waveform: form.waveform,
      txPowerW: form.txPowerW,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      status: 'planned',
      notes: form.notes,
    });
    onClose();
  };

  const F = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/20 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-100">Ny radiolänk</h2>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Nätnamn</label>
              <input
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.netName}
                onChange={F('netName')}
                placeholder="CMD-03"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Nättyp</label>
              <select
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.netType}
                onChange={F('netType')}
              >
                {NET_TYPES.map(t => <option key={t} value={t}>{NET_LABELS[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Från nod</label>
              <select
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.fromNodeId}
                onChange={F('fromNodeId')}
              >
                {nodes.map(n => <option key={n.id} value={n.id}>{n.label} – {n.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Till nod</label>
              <select
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.toNodeId}
                onChange={F('toNodeId')}
              >
                {nodes.filter(n => n.id !== form.fromNodeId).map(n =>
                  <option key={n.id} value={n.id}>{n.label} – {n.fullName}</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400">Frekvens (MHz)</label>
              <input
                type="number"
                step="0.005"
                min="0.1"
                max="30000"
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 font-mono"
                value={form.frequencyMhz}
                onChange={F('frequencyMhz')}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Bandbredd (kHz)</label>
              <input
                type="number"
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 font-mono"
                value={form.bandwidthKhz}
                onChange={F('bandwidthKhz')}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Effekt (W)</label>
              <input
                type="number"
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 font-mono"
                value={form.txPowerW}
                onChange={F('txPowerW')}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Modulering</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {WAVEFORMS.map(w => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setForm(f => ({ ...f, waveform: w }))}
                  className={`text-xs px-2 py-1 rounded ${form.waveform === w
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Starttid</label>
              <input
                type="datetime-local"
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.startTime}
                onChange={F('startTime')}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Sluttid</label>
              <input
                type="datetime-local"
                className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100"
                value={form.endTime}
                onChange={F('endTime')}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Anteckningar</label>
            <textarea
              rows={2}
              className="mt-1 w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 resize-none"
              value={form.notes}
              onChange={F('notes')}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-2 rounded font-semibold"
            >
              Skapa länk
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded">
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
