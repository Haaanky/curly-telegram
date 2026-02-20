import type { Unit, RadioNode, RadioLink, FrequencyNet, RadioEquipment } from '../types';
import { nanoid } from './id';

// ── Sample Radio Equipment ─────────────────────────────────────────────────
export const EQUIPMENT_CATALOG: RadioEquipment[] = [
  {
    id: 'ra180',
    name: 'RA 180',
    model: 'RA 180',
    category: 'VHF',
    freqMin: 30,
    freqMax: 88,
    maxPowerW: 50,
    rxSensitivityDbm: -113,
    antennaGainDbi: 2,
    description: 'Markbunden VHF-radio',
  },
  {
    id: 'ra190',
    name: 'RA 190',
    model: 'RA 190',
    category: 'VHF',
    freqMin: 30,
    freqMax: 512,
    maxPowerW: 100,
    rxSensitivityDbm: -110,
    antennaGainDbi: 3,
    description: 'VHF/UHF multibands-radio',
  },
  {
    id: 'hf3000',
    name: 'HF-3000',
    model: 'HF-3000',
    category: 'HF',
    freqMin: 2,
    freqMax: 30,
    maxPowerW: 200,
    rxSensitivityDbm: -120,
    antennaGainDbi: 0,
    description: 'Kortvågsradio för lång räckvidd',
  },
  {
    id: 'uhf_man',
    name: 'UHF Manuportabel',
    model: 'UHF-portable',
    category: 'UHF',
    freqMin: 225,
    freqMax: 512,
    maxPowerW: 5,
    rxSensitivityDbm: -108,
    antennaGainDbi: 0,
    description: 'Manuportabel UHF-radio',
  },
  {
    id: 'satcom1',
    name: 'SATCOM Terminal',
    model: 'SATCOM-L',
    category: 'SATCOM',
    freqMin: 1525,
    freqMax: 1660,
    maxPowerW: 20,
    rxSensitivityDbm: -105,
    antennaGainDbi: 12,
    description: 'Satellitkommunikationsterminal',
  },
];

// ── Helper ──────────────────────────────────────────────────────────────────
function eq(id: string): RadioEquipment {
  return EQUIPMENT_CATALOG.find(e => e.id === id)!;
}

// ── Sample Units ────────────────────────────────────────────────────────────
export const INITIAL_UNITS: Unit[] = [
  {
    id: 'u_stab',
    name: '1. Brigadens Stab',
    shortName: '1 BGSTAB',
    type: 'HQ',
    echelon: 'BDE',
    color: '#ef4444',
    position: { lat: 59.33, lng: 18.07 },
    vehicles: [
      {
        id: 'v_stab1',
        name: 'Stabsbandvagn 1',
        callSign: 'ALFA 01',
        type: 'CV90C2',
        position: { lat: 59.33, lng: 18.07 },
        equipment: [eq('ra190'), eq('hf3000'), eq('satcom1')],
        unitId: 'u_stab',
      },
    ],
  },
  {
    id: 'u_1mek',
    name: '1. Mekaniserade Bataljon',
    shortName: '1 MEK BTN',
    type: 'ARMOR',
    echelon: 'BTN',
    parentId: 'u_stab',
    color: '#3b82f6',
    position: { lat: 59.36, lng: 18.04 },
    vehicles: [
      {
        id: 'v_1mek_stab',
        name: 'Bataljonstab',
        callSign: 'BRAVO 01',
        type: 'Pansarbandvagn 302',
        position: { lat: 59.36, lng: 18.04 },
        equipment: [eq('ra190'), eq('ra180')],
        unitId: 'u_1mek',
      },
      {
        id: 'v_1mek_k1',
        name: '1. Kompani Ledning',
        callSign: 'BRAVO 11',
        type: 'CV90',
        position: { lat: 59.375, lng: 18.01 },
        equipment: [eq('ra180')],
        unitId: 'u_1mek',
      },
    ],
  },
  {
    id: 'u_2mek',
    name: '2. Mekaniserade Bataljon',
    shortName: '2 MEK BTN',
    type: 'ARMOR',
    echelon: 'BTN',
    parentId: 'u_stab',
    color: '#8b5cf6',
    position: { lat: 59.30, lng: 18.12 },
    vehicles: [
      {
        id: 'v_2mek_stab',
        name: 'Bataljonstab',
        callSign: 'CHARLIE 01',
        type: 'Pansarbandvagn 302',
        position: { lat: 59.30, lng: 18.12 },
        equipment: [eq('ra190'), eq('hf3000')],
        unitId: 'u_2mek',
      },
      {
        id: 'v_2mek_k1',
        name: '1. Kompani Ledning',
        callSign: 'CHARLIE 11',
        type: 'CV90',
        position: { lat: 59.285, lng: 18.15 },
        equipment: [eq('ra180'), eq('uhf_man')],
        unitId: 'u_2mek',
      },
    ],
  },
  {
    id: 'u_signal',
    name: 'Signalkompaní',
    shortName: 'SIGKOMP',
    type: 'SIGNAL',
    echelon: 'COY',
    parentId: 'u_stab',
    color: '#f59e0b',
    position: { lat: 59.325, lng: 18.09 },
    vehicles: [
      {
        id: 'v_sig_radio',
        name: 'Radionode Alpha',
        callSign: 'DELTA 01',
        type: 'Terrängbil 6x6',
        position: { lat: 59.325, lng: 18.09 },
        equipment: [eq('ra190'), eq('hf3000'), eq('satcom1')],
        unitId: 'u_signal',
      },
    ],
  },
];

// ── Derive RadioNodes from units/vehicles ──────────────────────────────────
export function buildNodesFromUnits(units: Unit[]): RadioNode[] {
  const nodes: RadioNode[] = [];
  for (const unit of units) {
    for (const vehicle of unit.vehicles) {
      if (vehicle.position) {
        nodes.push({
          id: vehicle.id,
          label: vehicle.callSign,
          fullName: `${unit.shortName} / ${vehicle.name}`,
          type: unit.type,
          position: vehicle.position,
          unitId: unit.id,
          vehicleId: vehicle.id,
          equipment: vehicle.equipment,
          color: unit.color,
        });
      }
    }
    // Add unit HQ node if no vehicles but has position
    if (unit.vehicles.length === 0 && unit.position) {
      nodes.push({
        id: unit.id,
        label: unit.shortName,
        fullName: unit.name,
        type: unit.type,
        position: unit.position,
        unitId: unit.id,
        equipment: [],
        color: unit.color,
      });
    }
  }
  return nodes;
}

// ── Sample Radio Links ──────────────────────────────────────────────────────
const now = new Date();
const t = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

export const INITIAL_LINKS: RadioLink[] = [
  {
    id: 'link_cmd1',
    name: 'BDE CMD NET',
    netName: 'CMD-01',
    netType: 'COMMAND',
    fromNodeId: 'v_stab1',
    toNodeId: 'v_1mek_stab',
    equipmentFromId: 'ra190',
    equipmentToId: 'ra190',
    frequencyMhz: 45.5,
    bandwidthKhz: 25,
    waveform: 'FM',
    txPowerW: 50,
    startTime: t(-1),
    endTime: t(23),
    status: 'active',
    notes: 'Primärt befälsnät',
  },
  {
    id: 'link_cmd2',
    name: 'BDE CMD NET',
    netName: 'CMD-01',
    netType: 'COMMAND',
    fromNodeId: 'v_stab1',
    toNodeId: 'v_2mek_stab',
    equipmentFromId: 'ra190',
    equipmentToId: 'ra190',
    frequencyMhz: 45.5,
    bandwidthKhz: 25,
    waveform: 'FM',
    txPowerW: 50,
    startTime: t(-1),
    endTime: t(23),
    status: 'active',
  },
  {
    id: 'link_hf1',
    name: 'HF LONG HAUL',
    netName: 'HF-ALFA',
    netType: 'COMMAND',
    fromNodeId: 'v_stab1',
    toNodeId: 'v_sig_radio',
    equipmentFromId: 'hf3000',
    equipmentToId: 'hf3000',
    frequencyMhz: 8.5,
    bandwidthKhz: 6,
    waveform: 'USB',
    txPowerW: 100,
    startTime: t(0),
    endTime: t(12),
    status: 'planned',
    notes: 'Backup lång räckvidd',
  },
  {
    id: 'link_log1',
    name: 'LOG NET',
    netName: 'LOG-01',
    netType: 'ADMIN_LOG',
    fromNodeId: 'v_sig_radio',
    toNodeId: 'v_1mek_k1',
    equipmentFromId: 'ra190',
    equipmentToId: 'ra180',
    frequencyMhz: 68.25,
    bandwidthKhz: 25,
    waveform: 'FM',
    txPowerW: 20,
    startTime: t(-2),
    endTime: t(22),
    status: 'active',
  },
  {
    id: 'link_sat1',
    name: 'SATCOM LINK',
    netName: 'SAT-01',
    netType: 'DATA',
    fromNodeId: 'v_stab1',
    toNodeId: 'v_sig_radio',
    equipmentFromId: 'satcom1',
    equipmentToId: 'satcom1',
    frequencyMhz: 1545.0,
    bandwidthKhz: 500,
    waveform: 'PSK',
    txPowerW: 10,
    startTime: t(-1),
    endTime: t(47),
    status: 'active',
    notes: 'Satellit backhaul',
  },
];

// ── Sample Frequency Nets ───────────────────────────────────────────────────
export const INITIAL_NETS: FrequencyNet[] = [
  {
    id: 'net_cmd',
    name: 'Befälsnät BDE',
    primaryFreqMhz: 45.5,
    altFreqMhz: 46.0,
    waveform: 'FM',
    netType: 'COMMAND',
    memberNodeIds: ['v_stab1', 'v_1mek_stab', 'v_2mek_stab'],
    color: '#ef4444',
  },
  {
    id: 'net_log',
    name: 'Logistiknät',
    primaryFreqMhz: 68.25,
    waveform: 'FM',
    netType: 'ADMIN_LOG',
    memberNodeIds: ['v_sig_radio', 'v_1mek_k1', 'v_2mek_k1'],
    color: '#f59e0b',
  },
  {
    id: 'net_hf',
    name: 'HF Länk',
    primaryFreqMhz: 8.5,
    waveform: 'USB',
    netType: 'COMMAND',
    memberNodeIds: ['v_stab1', 'v_sig_radio'],
    color: '#8b5cf6',
  },
];

export function nanoidFn() {
  return Math.random().toString(36).slice(2, 10);
}
