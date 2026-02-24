import type { LinkBudget, RadioEquipment, RadioLink } from '../types';
import type { LatLng } from '../types';
import { haversineKm } from './geo';

export {
  calcItuLinkBudget,
  fspl as freespacePathLossDb,
  gasAbsorption,
  rainAttenuation,
  cloudFogAttenuation,
  clutterLoss,
  knifeEdgeDiffraction,
  fresnelClearance,
  connectionQuality,
  thermalNoise,
  selectModel,
} from './ituCalculations';

/** Free Space Path Loss (dB) — Friis equation
 *  FSPL = 20·log₁₀(d_km) + 20·log₁₀(f_MHz) + 32.44
 */
export function freespacePathLoss(distKm: number, freqMhz: number): number {
  if (distKm <= 0 || freqMhz <= 0) return 0;
  return 20 * Math.log10(distKm) + 20 * Math.log10(freqMhz) + 32.44;
}

/** Approximate terrain/obstacle loss based on distance & frequency */
function estimateTerrainLoss(distKm: number, freqMhz: number): number {
  // Simple model: extra loss grows with distance, VHF/HF has more terrain issues
  const factor = freqMhz < 100 ? 0.5 : freqMhz < 1000 ? 0.3 : 0.15;
  return Math.min(factor * distKm, 30);
}

/** Atmospheric loss dB (simple approximation) */
function atmosphericLoss(distKm: number, freqMhz: number): number {
  // Significant above ~10 GHz
  if (freqMhz < 1000) return 0.01 * distKm;
  if (freqMhz < 10000) return 0.05 * distKm;
  return 0.2 * distKm;
}

/** Convert Watts to dBm */
export function wattToDbm(w: number): number {
  return 10 * Math.log10(w * 1000);
}

/** Convert dBm to Watts */
export function dbmToWatt(dbm: number): number {
  return Math.pow(10, (dbm - 30) / 10);
}

/** First Fresnel zone radius (m) at mid-path */
export function fresnelRadius1(distKm: number, freqMhz: number): number {
  const lambda = 300 / freqMhz; // wavelength in m
  const d = distKm * 1000;
  return Math.sqrt((lambda * d) / 4); // at midpoint
}

/** Calculate full link budget (simple model — use calcItuLinkBudget for ITU accuracy) */
export function calcLinkBudget(
  from: LatLng,
  to: LatLng,
  link: RadioLink,
  fromEquip?: RadioEquipment,
  toEquip?: RadioEquipment,
): LinkBudget {
  const distKm = haversineKm(from, to);
  const freqMhz = link.frequencyMhz;

  const txPowerDbm = wattToDbm(link.txPowerW);
  const txGainDbi = fromEquip?.antennaGainDbi ?? 0;
  const rxGainDbi = toEquip?.antennaGainDbi ?? 0;
  const rxSensDbm = toEquip?.rxSensitivityDbm ?? -110;

  const fsplDb = freespacePathLoss(distKm, freqMhz);
  const terrainLossDb = estimateTerrainLoss(distKm, freqMhz);
  const atmosphericLossDb = atmosphericLoss(distKm, freqMhz);

  const receivedPowerDbm =
    txPowerDbm + txGainDbi - fsplDb - terrainLossDb - atmosphericLossDb + rxGainDbi;

  const linkMarginDb = receivedPowerDbm - rxSensDbm;

  return {
    txPowerDbm,
    txGainDbi,
    rxGainDbi,
    fsplDb,
    terrainLossDb,
    atmosphericLossDb,
    receivedPowerDbm,
    rxSensitivityDbm: rxSensDbm,
    linkMarginDb,
    distanceKm: distKm,
    feasible: linkMarginDb > 0,
  };
}

/** Format dB value with sign */
export function fmtDb(val: number): string {
  return (val >= 0 ? '+' : '') + val.toFixed(1) + ' dB';
}

/** Format dBm value */
export function fmtDbm(val: number): string {
  return val.toFixed(1) + ' dBm';
}

/** Signal quality label from margin */
export function linkQuality(margin: number): { label: string; color: string } {
  if (margin > 20) return { label: 'Utmärkt', color: '#22c55e' };
  if (margin > 10) return { label: 'God', color: '#86efac' };
  if (margin > 3) return { label: 'Acceptabel', color: '#facc15' };
  if (margin > 0) return { label: 'Svag', color: '#f97316' };
  return { label: 'Otillräcklig', color: '#ef4444' };
}
