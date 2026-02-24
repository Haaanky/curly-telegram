// ── Geo ────────────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

// ── Terrain & Environment (ITU geodata) ─────────────────────────────────────
/** Macroscopic terrain shape along the path */
export type TerrainType = 'FLAT' | 'HILLY' | 'MOUNTAINOUS' | 'VALLEY';

/**
 * ITU-R P.527 / P.1546 ground/surface classification.
 * Affects ground-wave propagation and clutter loss.
 */
export type GroundType =
  | 'SEA'          // Open sea / large lake
  | 'COAST'        // Coastal/shoreline (within ~1 km of sea)
  | 'OPEN_LAND'    // Flat, open (fields, tundra)
  | 'FARMLAND'     // Cultivated land with scattered trees
  | 'FOREST'       // Dense or medium tree canopy
  | 'SUBURBAN'     // Residential, low buildings
  | 'URBAN'        // Mixed commercial/residential
  | 'DENSE_URBAN'; // Dense high-rise, city centre

/** Dominant vegetation type on the radio path */
export type VegetationType = 'NONE' | 'CROPS' | 'SPARSE_TREES' | 'FOREST' | 'JUNGLE';

/** ITU climate zone (affects atmospheric refractivity) */
export type ClimateZone = 'ARCTIC' | 'TEMPERATE' | 'SUBTROPICAL' | 'TROPICAL' | 'ARID';

/** Which ITU or empirical propagation model to use */
export type PropagationModel =
  | 'FSPL'          // Free-space path loss only (Friis)
  | 'ITU_P452'      // ITU-R P.452  – interference / long paths
  | 'ITU_P1546'     // ITU-R P.1546 – point-to-area, VHF/UHF
  | 'ITU_P526'      // ITU-R P.526  – diffraction
  | 'OKUMURA_HATA'  // Okumura-Hata – urban VHF/UHF 150-1500 MHz
  | 'AUTO';         // Select best model automatically

/**
 * Full terrain profile describing the radio path environment.
 * All fields with defaults are optional; reasonable defaults are applied
 * when a field is omitted.
 */
export interface TerrainProfile {
  type: TerrainType;
  groundType: GroundType;
  climateZone: ClimateZone;
  vegetation: VegetationType;

  /** Transmitter antenna height above ground (m) */
  antennaHeightTxM: number;
  /** Receiver antenna height above ground (m) */
  antennaHeightRxM: number;

  /** Transmitter site elevation above MSL (m) */
  elevationTxM: number;
  /** Receiver site elevation above MSL (m) */
  elevationRxM: number;

  /** Height of the highest obstacle above MSL on the path (m). Used for diffraction. */
  obstaclePeakElevM?: number;
  /** Distance from Tx to the main obstacle (km) */
  obstacleDistFromTxKm?: number;

  /** Rain rate at the 0.01 % exceedance level (mm/h). Default ~30 for temperate. */
  rainRateMmH?: number;
  /** Liquid water content for cloud/fog attenuation (g/m³). 0 = clear sky. */
  liquidWaterContentGm3?: number;
}

// ── Extended ITU Link Budget ─────────────────────────────────────────────────
/** Connection quality score expressed in multiple formats */
export interface ConnectionQuality {
  /** 0–100 composite score */
  score: number;
  /** Human-readable label (Swedish) */
  label: string;
  /** Hex colour for UI */
  color: string;
  /** Estimated link availability (probability 0–1) */
  availability: number;
  /** Signal-to-noise ratio estimate (dB) */
  snrDb: number;
}

/** Full ITU-aware link budget extending the basic LinkBudget */
export interface ItuLinkBudget extends LinkBudget {
  /** Propagation model that was applied */
  model: PropagationModel;
  /** Knife-edge / ITU-R P.526 diffraction loss (dB) */
  diffractionLossDb: number;
  /** ITU-R P.838 rain attenuation (dB) */
  rainAttenuationDb: number;
  /** ITU-R P.840 cloud/fog attenuation (dB) */
  cloudFogAttenuationDb: number;
  /** ITU-R P.676 atmospheric gas absorption (dB) */
  gasAbsorptionDb: number;
  /** Terrain clutter / shadowing loss (dB) based on GroundType */
  clutterLossDb: number;
  /** Fraction of first Fresnel zone that is clear (0 = fully blocked, 1 = fully clear) */
  fresnelClearanceFraction: number;
  /** Composite connection quality */
  connectionQuality: ConnectionQuality;
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
