import { lazy, Suspense } from 'react';
import Topbar from './components/shared/Topbar';
import OrgPanel from './components/org/OrgPanel';
import LinkPanel from './components/planning/LinkPanel';
import NetsPanel from './components/planning/NetsPanel';
import NodeDetailPanel from './components/shared/NodeDetailPanel';
import LinkDetailPanel from './components/shared/LinkDetailPanel';
import { useStore } from './store';

// Lazy-load heavy views
const MapView = lazy(() => import('./components/map/MapView'));
const SpectrumView = lazy(() => import('./components/spectrum/SpectrumView'));
const TimelineView = lazy(() => import('./components/timeline/TimelineView'));

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
      Laddar…
    </div>
  );
}

function SidebarContent() {
  const tab = useStore(s => s.sidebarTab);
  if (tab === 'org') return <OrgPanel />;
  if (tab === 'links') return <LinkPanel />;
  return <NetsPanel />;
}

function MainContent() {
  const view = useStore(s => s.view);
  return (
    <div className="flex-1 relative overflow-hidden">
      <Suspense fallback={<Spinner />}>
        {view === 'map' && <MapView />}
        {view === 'spectrum' && <SpectrumView />}
        {view === 'timeline' && <TimelineView />}
      </Suspense>
      {view === 'map' && (
        <>
          <NodeDetailPanel />
          <LinkDetailPanel />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col bg-gray-950 overflow-hidden">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <MainContent />
      </div>
    </div>
  );
}
