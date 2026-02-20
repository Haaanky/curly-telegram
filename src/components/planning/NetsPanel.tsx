import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import type { FrequencyNet } from '../../types';

function NetRow({ net }: { net: FrequencyNet }) {
  const deleteNet = useStore(s => s.deleteNet);
  const nodes = useStore(s => s.nodes);
  const members = nodes.filter(n => net.memberNodeIds.includes(n.id));

  return (
    <div className="border border-white/5 bg-gray-900/40 rounded mb-1.5 p-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: net.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-100">{net.name}</div>
          <div className="text-[10px] text-gray-500">{net.netType}</div>
        </div>
        <button onClick={() => deleteNet(net.id)} className="text-red-500/50 hover:text-red-400">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <div className="text-[10px] text-gray-400 w-full">
          Prim: <span className="font-mono text-gray-200">{net.primaryFreqMhz} MHz</span>
          {net.altFreqMhz && <span className="ml-2">Alt: <span className="font-mono text-gray-200">{net.altFreqMhz} MHz</span></span>}
          <span className="ml-2">{net.waveform}</span>
        </div>
        <div className="w-full text-[10px] text-gray-500">
          Deltagare ({members.length}):
        </div>
        {members.map(n => (
          <span key={n.id} className="text-[10px] bg-gray-800 text-gray-300 px-1.5 rounded font-mono">
            {n.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function NetsPanel() {
  const nets = useStore(s => s.nets);
  const addNet = useStore(s => s.addNet);
  const nodes = useStore(s => s.nodes);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    primaryFreqMhz: 45.5,
    waveform: 'FM',
    netType: 'COMMAND' as FrequencyNet['netType'],
    color: '#ef4444',
    memberIds: [] as string[],
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    addNet({
      name: form.name,
      primaryFreqMhz: form.primaryFreqMhz,
      waveform: form.waveform as FrequencyNet['waveform'],
      netType: form.netType,
      color: form.color,
      memberNodeIds: form.memberIds,
    });
    setShowAdd(false);
    setForm(f => ({ ...f, name: '', memberIds: [] }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Frekvensnät
        </span>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
        >
          <Plus size={14} /> Nytt nät
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-3 border-b border-white/10 space-y-2 bg-gray-900/60">
          <input
            className="w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-100"
            placeholder="Nätnamn"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.005"
              className="flex-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-gray-100"
              placeholder="Frekvens MHz"
              value={form.primaryFreqMhz}
              onChange={e => setForm(f => ({ ...f, primaryFreqMhz: Number(e.target.value) }))}
            />
            <select
              className="flex-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-100"
              value={form.waveform}
              onChange={e => setForm(f => ({ ...f, waveform: e.target.value }))}
            >
              {['FM', 'AM', 'USB', 'LSB', 'FSK', 'PSK'].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <select
            className="w-full bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-100"
            value={form.netType}
            onChange={e => setForm(f => ({ ...f, netType: e.target.value as FrequencyNet['netType'] }))}
          >
            {(['COMMAND', 'ADMIN_LOG', 'FIRE_SUPPORT', 'AIR', 'DATA', 'COORD'] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div>
            <div className="text-[10px] text-gray-500 mb-1">Deltagare</div>
            <div className="flex flex-wrap gap-1">
              {nodes.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    memberIds: f.memberIds.includes(n.id)
                      ? f.memberIds.filter(id => id !== n.id)
                      : [...f.memberIds, n.id],
                  }))}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono
                    ${form.memberIds.includes(n.id) ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-400'}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-800 hover:bg-green-700 text-white text-xs py-1.5 rounded font-semibold"
          >
            Skapa nät
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {nets.map(n => <NetRow key={n.id} net={n} />)}
      </div>
    </div>
  );
}
