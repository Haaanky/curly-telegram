// ── Geo ────────────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

// ── Equipment ──────────────────────────────────────────────────────────────
export type EquipmentCategory = 'VHF' | 'HF' | 'UHF' | 'SHF' | 'SATCOM' | 'DATALINK';

export interface RadioEquipment {
  id: string;
  name: string;
  model: string;
  category: EquipmentCategory;
  freqMin: number;   // MHz
  freqMax: number;   // MHz
  maxPowerW: number; // Watts
  rxSensitivityDbm: number;
  antennaGainDbi: number;
  description?: string;
}

// ── Organization ───────────────────────────────────────────────────────────
export type UnitType = 'HQ' | 'INF' | 'ARMOR' | 'ARTY' | 'ENG' | 'LOG' | 'SIGNAL' | 'RECON';

export interface RadioNode {
  id: string;
  label: string;       // callsign / short name
  fullName: string;
  type: UnitType;
  position: LatLng;
  unitId: string;
  vehicleId?: string;
  equipment: RadioEquipment[];
  color?: string;      // display colour on map
}

export interface Vehicle {
  id: string;
  name: string;
  callSign: string;
  type: string;
  position?: LatLng;
  equipment: RadioEquipment[];
  unitId: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  type: UnitType;
  echelon: 'ARMY' | 'CORPS' | 'DIV' | 'BDE' | 'BTN' | 'COY' | 'PLT';
  parentId?: string;
  position?: LatLng;
  vehicles: Vehicle[];
  color: string;
}

// ── Radio Links ────────────────────────────────────────────────────────────
export type WaveformType = 'AM' | 'FM' | 'USB' | 'LSB' | 'WBFM' | 'FSK' | 'PSK' | 'QAM';
export type LinkStatus = 'planned' | 'active' | 'degraded' | 'failed';
export type NetType = 'COMMAND' | 'ADMIN_LOG' | 'FIRE_SUPPORT' | 'AIR' | 'DATA' | 'COORD';

export interface LinkBudget {
  txPowerDbm: number;
  txGainDbi: number;
  rxGainDbi: number;
  fsplDb: number;
  terrainLossDb: number;
  atmosphericLossDb: number;
  receivedPowerDbm: number;
  rxSensitivityDbm: number;
  linkMarginDb: number;
  distanceKm: number;
  feasible: boolean;
}

export interface RadioLink {
  id: string;
  name: string;
  netName: string;
  netType: NetType;
  fromNodeId: string;
  toNodeId: string;
  equipmentFromId?: string;
  equipmentToId?: string;
  frequencyMhz: number;
  bandwidthKhz: number;
  waveform: WaveformType;
  txPowerW: number;
  startTime: string;  // ISO
  endTime: string;    // ISO
  status: LinkStatus;
  linkBudget?: LinkBudget;
  notes?: string;
}

// ── Frequency Nets ─────────────────────────────────────────────────────────
export interface FrequencyNet {
  id: string;
  name: string;
  primaryFreqMhz: number;
  altFreqMhz?: number;
  waveform: WaveformType;
  netType: NetType;
  memberNodeIds: string[];
  color: string;
}

// ── App State ──────────────────────────────────────────────────────────────
export type AppView = 'map' | 'org' | 'spectrum' | 'timeline' | 'planning';

export interface AppSettings {
  coordSystem: 'WGS84' | 'SWEREF99' | 'RT90';
  timeZone: string;
  showFresnel: boolean;
  showLinkBudgets: boolean;
  showGrid: boolean;
}
