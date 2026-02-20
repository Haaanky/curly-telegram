import { create } from 'zustand';
import type {
  Unit, RadioNode, RadioLink, FrequencyNet, AppView, AppSettings, LatLng, RadioEquipment,
} from '../types';
import {
  INITIAL_UNITS, INITIAL_LINKS, INITIAL_NETS, EQUIPMENT_CATALOG, buildNodesFromUnits,
} from '../utils/sampleData';
import { nanoid } from '../utils/id';
import { calcLinkBudget } from '../utils/linkBudget';

interface AppState {
  // Data
  units: Unit[];
  nodes: RadioNode[];
  links: RadioLink[];
  nets: FrequencyNet[];
  equipmentCatalog: RadioEquipment[];

  // UI
  view: AppView;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  hoveredLinkId: string | null;
  planningFromNodeId: string | null;
  sidebarTab: 'org' | 'links' | 'nets';
  timelineDate: string;          // ISO date string for timeline focus
  showLinkBudgetPanel: boolean;

  // Actions – view
  setView: (v: AppView) => void;
  selectNode: (id: string | null) => void;
  selectLink: (id: string | null) => void;
  hoverLink: (id: string | null) => void;
  setSidebarTab: (t: 'org' | 'links' | 'nets') => void;
  setTimelineDate: (d: string) => void;
  setShowLinkBudgetPanel: (v: boolean) => void;
  setPlanningFrom: (id: string | null) => void;

  // Actions – nodes
  moveNode: (nodeId: string, pos: LatLng) => void;
  updateNode: (nodeId: string, patch: Partial<RadioNode>) => void;

  // Actions – units
  addUnit: (unit: Omit<Unit, 'id' | 'vehicles'>) => void;
  updateUnit: (id: string, patch: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  // Actions – links
  addLink: (link: Omit<RadioLink, 'id' | 'linkBudget'>) => void;
  updateLink: (id: string, patch: Partial<RadioLink>) => void;
  deleteLink: (id: string) => void;
  recalcLinkBudget: (id: string) => void;
  recalcAllBudgets: () => void;

  // Actions – nets
  addNet: (net: Omit<FrequencyNet, 'id'>) => void;
  updateNet: (id: string, patch: Partial<FrequencyNet>) => void;
  deleteNet: (id: string) => void;
}

function rebuildNodes(units: Unit[]): RadioNode[] {
  return buildNodesFromUnits(units);
}

export const useStore = create<AppState>((set, get) => ({
  units: INITIAL_UNITS,
  nodes: rebuildNodes(INITIAL_UNITS),
  links: INITIAL_LINKS,
  nets: INITIAL_NETS,
  equipmentCatalog: EQUIPMENT_CATALOG,

  view: 'map',
  selectedNodeId: null,
  selectedLinkId: null,
  hoveredLinkId: null,
  planningFromNodeId: null,
  sidebarTab: 'org',
  timelineDate: new Date().toISOString().slice(0, 10),
  showLinkBudgetPanel: false,

  setView: (view) => set({ view }),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedLinkId: null }),
  selectLink: (selectedLinkId) => set({ selectedLinkId, selectedNodeId: null }),
  hoverLink: (hoveredLinkId) => set({ hoveredLinkId }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setTimelineDate: (timelineDate) => set({ timelineDate }),
  setShowLinkBudgetPanel: (showLinkBudgetPanel) => set({ showLinkBudgetPanel }),
  setPlanningFrom: (planningFromNodeId) => set({ planningFromNodeId }),

  moveNode: (nodeId, pos) => {
    const { units } = get();
    const updated = units.map(u => ({
      ...u,
      vehicles: u.vehicles.map(v =>
        v.id === nodeId ? { ...v, position: pos } : v
      ),
      position: u.id === nodeId ? pos : u.position,
    }));
    set({ units: updated, nodes: rebuildNodes(updated) });
    get().recalcAllBudgets();
  },

  updateNode: (nodeId, patch) => {
    set(s => ({
      nodes: s.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n),
    }));
  },

  addUnit: (unitData) => {
    const unit: Unit = { ...unitData, id: nanoid(), vehicles: [] };
    const units = [...get().units, unit];
    set({ units, nodes: rebuildNodes(units) });
  },

  updateUnit: (id, patch) => {
    const units = get().units.map(u => u.id === id ? { ...u, ...patch } : u);
    set({ units, nodes: rebuildNodes(units) });
  },

  deleteUnit: (id) => {
    const units = get().units.filter(u => u.id !== id);
    set({ units, nodes: rebuildNodes(units) });
  },

  addLink: (linkData) => {
    const link: RadioLink = { ...linkData, id: nanoid() };
    set(s => ({ links: [...s.links, link] }));
    get().recalcLinkBudget(link.id);
  },

  updateLink: (id, patch) => {
    set(s => ({ links: s.links.map(l => l.id === id ? { ...l, ...patch } : l) }));
    get().recalcLinkBudget(id);
  },

  deleteLink: (id) => {
    set(s => ({ links: s.links.filter(l => l.id !== id) }));
  },

  recalcLinkBudget: (id) => {
    const { links, nodes, units } = get();
    const link = links.find(l => l.id === id);
    if (!link) return;

    const fromNode = nodes.find(n => n.id === link.fromNodeId);
    const toNode = nodes.find(n => n.id === link.toNodeId);
    if (!fromNode || !toNode) return;

    // Find equipment
    const fromVehicle = units.flatMap(u => u.vehicles).find(v => v.id === fromNode.vehicleId);
    const toVehicle = units.flatMap(u => u.vehicles).find(v => v.id === toNode.vehicleId);
    const fromEquip = fromVehicle?.equipment.find(e => e.id === link.equipmentFromId);
    const toEquip = toVehicle?.equipment.find(e => e.id === link.equipmentToId);

    const budget = calcLinkBudget(fromNode.position, toNode.position, link, fromEquip, toEquip);
    set(s => ({
      links: s.links.map(l => l.id === id ? { ...l, linkBudget: budget } : l),
    }));
  },

  recalcAllBudgets: () => {
    get().links.forEach(l => get().recalcLinkBudget(l.id));
  },

  addNet: (netData) => {
    set(s => ({ nets: [...s.nets, { ...netData, id: nanoid() }] }));
  },

  updateNet: (id, patch) => {
    set(s => ({ nets: s.nets.map(n => n.id === id ? { ...n, ...patch } : n) }));
  },

  deleteNet: (id) => {
    set(s => ({ nets: s.nets.filter(n => n.id !== id) }));
  },
}));

// Recalculate all link budgets on startup
setTimeout(() => useStore.getState().recalcAllBudgets(), 0);
