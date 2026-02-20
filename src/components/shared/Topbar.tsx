import { Map, BarChart2, Clock, Radio } from 'lucide-react';
import { useStore } from '../../store';
import type { AppView } from '../../types';
import BackgroundMusic from './BackgroundMusic';

const VIEWS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'map', label: 'Karta', icon: <Map size={15} /> },
  { id: 'spectrum', label: 'Spektrum', icon: <BarChart2 size={15} /> },
  { id: 'timeline', label: 'Tidslinje', icon: <Clock size={15} /> },
];

const SIDEBAR_TABS: { id: 'org' | 'links' | 'nets'; label: string }[] = [
  { id: 'org', label: 'Organisation' },
  { id: 'links', label: 'Länktar' },
  { id: 'nets', label: 'Nät' },
];

export default function Topbar() {
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);
  const sidebarTab = useStore(s => s.sidebarTab);
  const setSidebarTab = useStore(s => s.setSidebarTab);
  const links = useStore(s => s.links);

  const activeCount = links.filter(l => l.status === 'active').length;
  const failedCount = links.filter(l => l.status === 'failed').length;
  const degradedCount = links.filter(l => l.status === 'degraded').length;

  return (
    <header className="flex items-center h-12 bg-gray-950 border-b border-white/10 px-3 gap-3 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 pr-3 border-r border-white/10">
        <Radio size={18} className="text-green-400" />
        <span className="text-sm font-bold text-gray-100 tracking-wide">RadioLink</span>
        <span className="text-xs text-gray-500">Sambandsplanering</span>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors
              ${view === v.id
                ? 'bg-green-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Sidebar tabs */}
      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
        {SIDEBAR_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSidebarTab(t.id)}
            className={`text-xs px-2.5 py-1 rounded transition-colors
              ${sidebarTab === t.id
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Background music */}
      <div className="ml-auto flex items-center">
        <BackgroundMusic />
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-3 text-xs border-l border-white/10 pl-3">
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400">{activeCount} aktiv</span>
          </div>
        )}
        {degradedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-400">{degradedCount} nedsatt</span>
          </div>
        )}
        {failedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-400">{failedCount} utslagen</span>
          </div>
        )}
        <div className="text-gray-600">
          {new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}
        </div>
      </div>
    </header>
  );
}
