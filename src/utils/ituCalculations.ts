/**
 * ITU Radio Propagation Calculations
 *
 * Implements the following ITU-R Recommendations:
 *   P.525  – Free-space attenuation (Friis)
 *   P.526  – Propagation by diffraction (knife-edge model)
 *   P.676  – Attenuation by atmospheric gases
 *   P.838  – Specific attenuation by rain
 *   P.840  – Attenuation by cloud and fog
 *   P.2108 – Clutter loss statistics
 *   P.1546 – Point-to-area predictions VHF/UHF (simplified)
 *   Okumura-Hata empirical model (150–1500 MHz)
 */

import type {
  LatLng,
  TerrainProfile,
  GroundType,
  PropagationModel,
  ConnectionQuality,
  ItuLinkBudget,
  RadioLink,
  RadioEquipment,
} from '../types';
import { haversineKm } from './geo';

// ─── ITU-R P.525 ─────────────────────────────────────────────────────────────

/**
 * Free-space path loss (dB).
 * FSPL = 20·log₁₀(d_km) + 20·log₁₀(f_MHz) + 32.44
 */
export function fspl(distKm: number, freqMhz: number): number {
  if (distKm <= 0 || freqMhz <= 0) return 0;
  return 20 * Math.log10(distKm) + 20 * Math.log10(freqMhz) + 32.44;
}

// ─── ITU-R P.526 ─────────────────────────────────────────────────────────────

/**
 * Knife-edge diffraction loss (dB) from Fresnel-Kirchhoff parameter ν.
 * Piecewise approximation per ITU-R P.526-15 §4.1 eq.(31).
 *
 * ν < 0  → shadow boundary not reached, loss approaches 0
 * ν = 0  → exactly on LOS, ~6 dB loss
 * ν > 0  → obstacle above LOS, increasing loss
 */
export function knifeEdgeDiffraction(nu: number): number {
  // Returns positive loss (dB) = −J(ν) where J is the field reduction in dB
  if (nu < -1) return 0;
  if (nu < 0) return -20 * Math.log10(0.5 - 0.62 * nu);
  if (nu < 1) return -20 * Math.log10(0.5 * Math.exp(-0.95 * nu));
  if (nu < 2.4) {
    const inner = 0.1184 - Math.pow(0.38 - 0.1 * nu, 2);
    return -20 * Math.log10(0.4 - Math.sqrt(Math.max(0, inner)));
  }
  return -20 * Math.log10(0.225 / nu);
}

/**
 * Compute the Fresnel-Kirchhoff diffraction parameter ν for a single obstacle.
 *
 * @param distKm   Total path length (km)
 * @param freqMhz  Frequency (MHz)
 * @param terrain  Terrain profile supplying obstacle geometry
 * @returns ν (dimensionless); negative means obstacle is below LOS
 */
export function fresnelParameter(
  distKm: number,
  freqMhz: number,
  terrain: TerrainProfile,
): number {
  if (
    terrain.obstaclePeakElevM === undefined ||
    terrain.obstacleDistFromTxKm === undefined
  ) {
    return -2; // No obstacle → well below LOS
  }

  const d1 = terrain.obstacleDistFromTxKm;
  const d2 = distKm - d1;
  if (d1 <= 0 || d2 <= 0) return -2;

  // LOS height at the obstacle position (linear interpolation between Tx and Rx)
  const txElev = terrain.elevationTxM + terrain.antennaHeightTxM;
  const rxElev = terrain.elevationRxM + terrain.antennaHeightRxM;
  const losAtObstacle = txElev + (rxElev - txElev) * (d1 / distKm);

  // Height of obstacle tip above (positive) or below (negative) the LOS
  const h = terrain.obstaclePeakElevM - losAtObstacle;

  const lambda = 300 / freqMhz; // wavelength (m)
  const d1m = d1 * 1000;
  const d2m = d2 * 1000;

  return h * Math.sqrt((2 * (d1m + d2m)) / (lambda * d1m * d2m));
}

/**
 * Total diffraction loss (dB) for a path.
 * Returns 0 when no obstacle data is present in the terrain profile.
 */
export function calcDiffractionLoss(
  distKm: number,
  freqMhz: number,
  terrain: TerrainProfile,
): number {
  const nu = fresnelParameter(distKm, freqMhz, terrain);
  return Math.max(0, knifeEdgeDiffraction(nu));
}

/**
 * Fraction of the first Fresnel zone radius that is unobstructed (0–1).
 * 1.0 = fully clear; 0.6 = minimum recommended clearance (0.6·r₁).
 */
export function fresnelClearance(
  distKm: number,
  freqMhz: number,
  terrain: TerrainProfile,
): number {
  if (
    terrain.obstaclePeakElevM === undefined ||
    terrain.obstacleDistFromTxKm === undefined
  ) {
    return 1.0;
  }

  const d1 = terrain.obstacleDistFromTxKm;
  const d2 = distKm - d1;
  if (d1 <= 0 || d2 <= 0) return 1.0;

  const lambda = 300 / freqMhz; // m
  const d1m = d1 * 1000;
  const d2m = d2 * 1000;
  const r1 = Math.sqrt((lambda * d1m * d2m) / (d1m + d2m)); // first Fresnel radius (m)

  // LOS height at obstacle position
  const txElev = terrain.elevationTxM + terrain.antennaHeightTxM;
  const rxElev = terrain.elevationRxM + terrain.antennaHeightRxM;
  const losH = txElev + (rxElev - txElev) * (d1 / distKm);

  // Clearance = how far the LOS is above the obstacle, normalised by r₁
  const clearanceM = losH - terrain.obstaclePeakElevM;
  return Math.min(1.0, Math.max(0, clearanceM / r1 + 1));
}

// ─── ITU-R P.676 ─────────────────────────────────────────────────────────────

/**
 * Specific attenuation by atmospheric gases (dB/km) at sea level.
 *
 * Covers:
 *   – Oxygen (O₂) absorption, dominant below 100 GHz with resonance at ~60 GHz
 *   – Water vapour (H₂O) with resonances at 22.235 GHz and 183.310 GHz
 *
 * Approximation based on ITU-R P.676-13 with piecewise fit for the main bands.
 */
export function specificGasAttenuation(freqMhz: number): number {
  const fGhz = freqMhz / 1000;

  if (fGhz < 0.1) return 0.0; // HF/MF — negligible

  // Oxygen component (P.676 simplified — stays flat until the 60 GHz band)
  let gammaO2: number;
  if (fGhz < 50) {
    gammaO2 = 7.19e-3; // ~0.007 dB/km, approximately flat below 50 GHz
  } else if (fGhz < 57) {
    // Sharp rise toward 60 GHz resonance band
    gammaO2 = 7.19e-3 + (fGhz - 50) * (14.5 / 7);
  } else if (fGhz < 63) {
    gammaO2 = 14.5; // ~15 dB/km peak at 60 GHz
  } else if (fGhz < 100) {
    gammaO2 = 14.5 * Math.exp(-Math.pow((fGhz - 63) / 10, 2));
  } else {
    gammaO2 = 0.05;
  }

  // Water vapour component (standard atmosphere: 7.5 g/m³)
  let gammaH2O: number;
  if (fGhz < 1) {
    gammaH2O = 0.0;
  } else if (fGhz < 22) {
    gammaH2O = 0.001 + (fGhz / 22) * 0.17;
  } else if (fGhz < 23) {
    // 22.235 GHz resonance peak
    gammaH2O = 0.18;
  } else if (fGhz < 183) {
    gammaH2O = 0.05 + (fGhz / 183) * 0.1;
  } else if (fGhz < 185) {
    // 183.310 GHz resonance
    gammaH2O = 30;
  } else {
    gammaH2O = 0.5;
  }

  return gammaO2 + gammaH2O;
}

/**
 * Total atmospheric gas absorption along the path (dB).
 * ITU-R P.676 — oxygen + water vapour at standard atmosphere.
 */
export function gasAbsorption(distKm: number, freqMhz: number): number {
  return specificGasAttenuation(freqMhz) * distKm;
}

// ─── ITU-R P.838 ─────────────────────────────────────────────────────────────

/**
 * Frequency-dependent coefficients k and α for rain attenuation.
 * Source: ITU-R P.838-3, Table 1 (horizontal polarisation).
 * Values are log-linearly interpolated between the tabulated GHz points.
 */
function rainCoefficients(freqMhz: number): { k: number; alpha: number } {
  const fGhz = freqMhz / 1000;

  // [fGhz, k_H, alpha_H] from P.838-3 Table 1
  const table: [number, number, number][] = [
    [1,    0.0000387, 0.912],
    [2,    0.000154,  0.963],
    [4,    0.000650,  1.121],
    [6,    0.00175,   1.308],
    [7,    0.00301,   1.332],
    [8,    0.00454,   1.327],
    [10,   0.0101,    1.276],
    [12,   0.0188,    1.217],
    [15,   0.0367,    1.154],
    [20,   0.0751,    1.099],
    [25,   0.124,     1.061],
    [30,   0.187,     1.021],
    [35,   0.263,     0.979],
    [40,   0.350,     0.939],
    [50,   0.536,     0.873],
    [60,   0.707,     0.826],
    [80,   1.07,      0.767],
    [100,  1.42,      0.731],
  ];

  if (fGhz <= table[0][0]) return { k: table[0][1], alpha: table[0][2] };
  if (fGhz >= table[table.length - 1][0]) {
    const last = table[table.length - 1];
    return { k: last[1], alpha: last[2] };
  }

  for (let i = 1; i < table.length; i++) {
    if (fGhz <= table[i][0]) {
      const [f0, k0, a0] = table[i - 1];
      const [f1, k1, a1] = table[i];
      const t = (Math.log10(fGhz) - Math.log10(f0)) / (Math.log10(f1) - Math.log10(f0));
      return {
        k: Math.pow(10, Math.log10(k0) + t * (Math.log10(k1) - Math.log10(k0))),
        alpha: a0 + t * (a1 - a0),
      };
    }
  }

  return { k: table[table.length - 1][1], alpha: table[table.length - 1][2] };
}

/**
 * Total rain attenuation along the path (dB).
 * ITU-R P.838-3 power law: γ_R = k · R^α (dB/km)
 * Effective path length from ITU-R P.530: r = 1 / (1 + 0.045·d)
 *
 * @param distKm      Path length (km)
 * @param freqMhz     Frequency (MHz)
 * @param rainRateMmH Rain rate at 0.01 % exceedance (mm/h). 0 → no rain.
 */
export function rainAttenuation(
  distKm: number,
  freqMhz: number,
  rainRateMmH: number,
): number {
  if (rainRateMmH <= 0 || freqMhz < 1000) return 0; // rain irrelevant below ~1 GHz
  const { k, alpha } = rainCoefficients(freqMhz);
  const gammaR = k * Math.pow(rainRateMmH, alpha); // specific attenuation (dB/km)
  const r = 1 / (1 + 0.045 * distKm); // path reduction factor
  return gammaR * distKm * r;
}

// ─── ITU-R P.840 ─────────────────────────────────────────────────────────────

/**
 * Specific attenuation coefficient K_l (dB/km per g/m³) for liquid water.
 * Interpolated from ITU-R P.840-8 for temperature 0 °C (conservative).
 */
function cloudLiquidAttenuationCoeff(freqMhz: number): number {
  const fGhz = freqMhz / 1000;
  // Approximate fit: K_l ≈ 0.0671·(f/10)^1.74  dB/(km·g·m⁻³)
  if (fGhz < 1) return 0;
  return 0.0671 * Math.pow(fGhz / 10, 1.74);
}

/**
 * Cloud and fog attenuation (dB).
 * ITU-R P.840-8: A_c = K_l · M · d
 *
 * @param distKm     Path length (km)
 * @param freqMhz    Frequency (MHz)
 * @param lwcGm3     Liquid water content (g/m³). 0 = clear sky.
 *                   Typical: fog ~0.05–0.5, thick cloud ~0.05–0.15
 */
export function cloudFogAttenuation(
  distKm: number,
  freqMhz: number,
  lwcGm3: number,
): number {
  if (lwcGm3 <= 0 || freqMhz < 10000) return 0; // negligible below 10 GHz
  return cloudLiquidAttenuationCoeff(freqMhz) * lwcGm3 * distKm;
}

// ─── ITU-R P.2108 — Clutter loss ─────────────────────────────────────────────

/**
 * Median clutter loss at the terminal (dB).
 * Based on ITU-R P.2108-1 statistical clutter model, representative median values.
 *
 * @param freqMhz   Frequency (MHz)
 * @param groundType Ground/surface classification of the receiver environment
 */
export function clutterLoss(freqMhz: number, groundType: GroundType): number {
  const fGhz = freqMhz / 1000;

  switch (groundType) {
    case 'SEA':        return 0;
    case 'COAST':      return 0.5;
    case 'OPEN_LAND':  return 1.0;
    case 'FARMLAND':   return 2.0;
    case 'FOREST':
      // Frequency-dependent: P.833 model, increases with f
      return Math.min(15, 5 + 4 * Math.log10(Math.max(fGhz, 0.03) / 0.03));
    case 'SUBURBAN':
      return 6 + 1.5 * Math.log10(Math.max(fGhz, 0.1) / 0.1);
    case 'URBAN':
      return 12 + 2 * Math.log10(Math.max(fGhz, 0.1) / 0.1);
    case 'DENSE_URBAN':
      return 20 + 3 * Math.log10(Math.max(fGhz, 0.1) / 0.1);
  }
}

// ─── Okumura-Hata (150–1500 MHz) ─────────────────────────────────────────────

/**
 * Okumura-Hata path loss (dB).
 * Valid for:  fc 150–1500 MHz, d 1–20 km, hte 30–200 m, hre 1–10 m.
 *
 * For paths shorter than 1 km or frequencies outside the valid range,
 * this function falls back to FSPL.
 *
 * @param distKm     Distance (km)
 * @param freqMhz    Carrier frequency (MHz)
 * @param hteTxM     Transmitter (base) antenna height above ground (m)
 * @param hreRxM     Receiver (mobile) antenna height above ground (m)
 * @param groundType Determines the correction variant applied
 */
export function okumuraHataLoss(
  distKm: number,
  freqMhz: number,
  hteTxM: number,
  hreRxM: number,
  groundType: GroundType,
): number {
  if (distKm < 0.1 || freqMhz < 150 || freqMhz > 1500) {
    return fspl(distKm, freqMhz);
  }

  const fc = freqMhz;
  const d = Math.max(distKm, 0.1);
  const hte = Math.max(hteTxM, 1);
  const hre = Math.max(hreRxM, 0.5);

  // Mobile antenna correction factor (small/medium city)
  const aHre = (1.1 * Math.log10(fc) - 0.7) * hre - (1.56 * Math.log10(fc) - 0.8);

  // Median path loss (urban, large city if fc >= 300 MHz)
  const Lb =
    69.55 +
    26.16 * Math.log10(fc) -
    13.82 * Math.log10(hte) -
    aHre +
    (44.9 - 6.55 * Math.log10(hte)) * Math.log10(d);

  // Environment corrections
  switch (groundType) {
    case 'DENSE_URBAN':
    case 'URBAN':
      return Lb;
    case 'SUBURBAN':
      return Lb - 2 * Math.pow(Math.log10(fc / 28), 2) - 5.4;
    case 'OPEN_LAND':
    case 'FARMLAND':
      return Lb - 4.78 * Math.pow(Math.log10(fc), 2) + 18.33 * Math.log10(fc) - 40.94;
    default:
      return Lb - 2 * Math.pow(Math.log10(fc / 28), 2) - 5.4;
  }
}

// ─── ITU-R P.1546 simplified ──────────────────────────────────────────────────

/**
 * Simplified ITU-R P.1546 path loss estimate for VHF/UHF (30–3000 MHz).
 * Uses a distance-power-law approximation calibrated to the standard's
 * field-strength curves for land paths at 50 % locations, 50 % time.
 *
 * For a full implementation, numerical interpolation of P.1546 tables is required.
 * This simplified version is suitable for planning estimates.
 */
export function ituP1546Loss(
  distKm: number,
  freqMhz: number,
  terrain: TerrainProfile,
): number {
  if (freqMhz < 30 || freqMhz > 3000) return fspl(distKm, freqMhz);

  const heff = terrain.antennaHeightTxM; // effective Tx height above ground

  // Path loss exponent varies with terrain and frequency band
  let n: number;
  if (freqMhz < 300) {
    n = terrain.type === 'FLAT' ? 3.0 : 3.5;
  } else {
    n = terrain.type === 'FLAT' ? 3.5 : 4.0;
  }

  // Height gain (effective Tx antenna height correction)
  const hGain = 20 * Math.log10(Math.max(heff, 1) / 10);

  // Base loss using FSPL at 1 km + slope term
  const baseLoss = fspl(1, freqMhz);
  return baseLoss + 10 * n * Math.log10(Math.max(distKm, 0.01)) - hGain;
}

// ─── Model selection ──────────────────────────────────────────────────────────

/**
 * Automatically select the most appropriate propagation model.
 *
 * Selection criteria:
 *   HF (< 30 MHz)                   → FSPL (ground-wave/sky-wave handled separately)
 *   VHF/UHF urban (30–1500 MHz)     → Okumura-Hata
 *   VHF/UHF rural/open (30–3000 MHz)→ ITU-R P.1546
 *   Microwave (> 3 GHz)             → FSPL + individual loss terms
 *   Significant obstacle present    → ITU-R P.526 diffraction
 */
export function selectModel(
  freqMhz: number,
  distKm: number,
  terrain: TerrainProfile,
): PropagationModel {
  const hasObstacle =
    terrain.obstaclePeakElevM !== undefined &&
    terrain.obstacleDistFromTxKm !== undefined;

  if (hasObstacle && freqMhz >= 30) return 'ITU_P526';
  if (freqMhz < 30) return 'FSPL';

  const isUrban =
    terrain.groundType === 'URBAN' || terrain.groundType === 'DENSE_URBAN' || terrain.groundType === 'SUBURBAN';

  if (freqMhz <= 1500 && isUrban && distKm >= 1) return 'OKUMURA_HATA';
  if (freqMhz <= 3000) return 'ITU_P1546';

  return 'FSPL';
}

// ─── Connection quality ───────────────────────────────────────────────────────

const NOISE_FIGURE_DB = 6; // typical receiver noise figure

/**
 * Thermal noise floor (dBm) for a given bandwidth.
 * N = −174 + 10·log₁₀(BW_Hz) + NF  dBm
 */
export function thermalNoise(bandwidthKhz: number): number {
  const bwHz = bandwidthKhz * 1000;
  return -174 + 10 * Math.log10(bwHz) + NOISE_FIGURE_DB;
}

/**
 * Composite connection quality score (0–100) and related indicators.
 *
 * Weighting:
 *   50 % – Link margin (normalised to 30 dB)
 *   20 % – Fresnel zone clearance fraction
 *   20 % – Weather reliability (based on weather losses vs. margin)
 *   10 % – Antenna gain quality (tx + rx gain normalised to 20 dBi)
 *
 * Availability is modelled as P(margin > fade) = Φ(margin / σ_fade),
 * where σ_fade ≈ 8 dB is a typical slow-fading standard deviation.
 */
export function connectionQuality(params: {
  linkMarginDb: number;
  fresnelClearanceFraction: number;
  txGainDbi: number;
  rxGainDbi: number;
  receivedPowerDbm: number;
  bandwidthKhz: number;
  rainAttenuationDb: number;
  cloudFogAttenuationDb: number;
}): ConnectionQuality {
  const {
    linkMarginDb,
    fresnelClearanceFraction,
    txGainDbi,
    rxGainDbi,
    receivedPowerDbm,
    bandwidthKhz,
    rainAttenuationDb,
    cloudFogAttenuationDb,
  } = params;

  // 1. Margin score (50 points)
  const marginScore = Math.min(50, Math.max(0, (linkMarginDb / 30) * 50));

  // 2. Fresnel score (20 points)
  const fresnelScore = Math.min(20, Math.max(0, fresnelClearanceFraction * 20));

  // 3. Weather reliability (20 points)
  // Full 20 pts when weather losses are negligible; degrade as losses eat into margin
  const weatherLoss = rainAttenuationDb + cloudFogAttenuationDb;
  const weatherReliability = Math.max(0, 1 - weatherLoss / Math.max(weatherLoss + 10, 10));
  const weatherScore = weatherReliability * 20;

  // 4. Gain quality (10 points)
  const totalGain = txGainDbi + rxGainDbi;
  const gainScore = Math.min(10, Math.max(0, (totalGain / 20) * 10));

  let score = Math.round(marginScore + fresnelScore + weatherScore + gainScore);
  // When margin is negative the link is infeasible — hard-cap the score so it
  // always shows as 'Svag' or worse regardless of other factors.
  if (linkMarginDb < 0) {
    score = Math.min(score, Math.max(0, 19 + Math.round(linkMarginDb * 2)));
  }

  // SNR
  const noise = thermalNoise(Math.max(bandwidthKhz, 1));
  const snrDb = receivedPowerDbm - noise;

  // Link availability: Gaussian CDF approximation (erf-based)
  // Φ(x) ≈ 0.5·(1 + erf(x/√2))
  const sigmaFade = 8;
  const z = linkMarginDb / (sigmaFade * Math.SQRT2);
  const availability = 0.5 * (1 + erf(z));

  // Label and colour
  let label: string;
  let color: string;
  if (score >= 80) { label = 'Utmärkt';     color = '#22c55e'; }
  else if (score >= 60) { label = 'God';         color = '#86efac'; }
  else if (score >= 40) { label = 'Acceptabel';  color = '#facc15'; }
  else if (score >= 20) { label = 'Svag';        color = '#f97316'; }
  else                  { label = 'Otillräcklig'; color = '#ef4444'; }

  return { score, label, color, availability, snrDb };
}

/** Gauss error function — approximation (max error < 1.5×10⁻⁷) */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 =  1.061405429, p  = 0.3275911;
  const t = 1 / (1 + p * x);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return sign * (1 - poly * Math.exp(-x * x));
}

// ─── Full ITU link budget ─────────────────────────────────────────────────────

/** Convert Watts to dBm */
function wToDbm(w: number): number {
  return 10 * Math.log10(w * 1000);
}

/**
 * Calculate a full ITU-aware link budget.
 *
 * The propagation model is chosen automatically (or forced via `forceModel`).
 * All individual loss components are returned alongside the composite
 * ConnectionQuality score.
 */
export function calcItuLinkBudget(
  from: LatLng,
  to: LatLng,
  link: RadioLink,
  fromEquip?: RadioEquipment,
  toEquip?: RadioEquipment,
  terrain?: Partial<TerrainProfile>,
  forceModel?: PropagationModel,
): ItuLinkBudget {
  const distKm = haversineKm(from, to);
  const freqMhz = link.frequencyMhz;

  // Merge supplied terrain with defaults
  const t: TerrainProfile = {
    type: 'FLAT',
    groundType: 'OPEN_LAND',
    climateZone: 'TEMPERATE',
    vegetation: 'NONE',
    antennaHeightTxM: 2,
    antennaHeightRxM: 2,
    elevationTxM: 0,
    elevationRxM: 0,
    rainRateMmH: 0,
    liquidWaterContentGm3: 0,
    ...terrain,
  };

  const txPowerDbm = wToDbm(link.txPowerW);
  const txGainDbi = fromEquip?.antennaGainDbi ?? 0;
  const rxGainDbi = toEquip?.antennaGainDbi ?? 0;
  const rxSensDbm = toEquip?.rxSensitivityDbm ?? -110;

  // Select propagation model
  const model: PropagationModel =
    forceModel && forceModel !== 'AUTO'
      ? forceModel
      : selectModel(freqMhz, distKm, t);

  // Base path loss from chosen model
  let baseLossDb: number;
  switch (model) {
    case 'OKUMURA_HATA':
      baseLossDb = okumuraHataLoss(distKm, freqMhz, t.antennaHeightTxM, t.antennaHeightRxM, t.groundType);
      break;
    case 'ITU_P1546':
      baseLossDb = ituP1546Loss(distKm, freqMhz, t);
      break;
    default:
      baseLossDb = fspl(distKm, freqMhz);
  }

  // Individual loss terms
  const diffractionLossDb = model === 'ITU_P526'
    ? calcDiffractionLoss(distKm, freqMhz, t)
    : 0;
  const gasAbsorptionDb   = gasAbsorption(distKm, freqMhz);
  const rainAttenuationDb = rainAttenuation(distKm, freqMhz, t.rainRateMmH ?? 0);
  const cloudFogDb        = cloudFogAttenuation(distKm, freqMhz, t.liquidWaterContentGm3 ?? 0);

  // Clutter loss: only apply when Okumura-Hata is NOT selected (it already
  // incorporates urban clutter implicitly)
  const clutterLossDb = model === 'OKUMURA_HATA'
    ? 0
    : clutterLoss(freqMhz, t.groundType);

  // Total received power
  const totalLossDb =
    baseLossDb +
    diffractionLossDb +
    gasAbsorptionDb +
    rainAttenuationDb +
    cloudFogDb +
    clutterLossDb;

  const receivedPowerDbm = txPowerDbm + txGainDbi - totalLossDb + rxGainDbi;
  const linkMarginDb = receivedPowerDbm - rxSensDbm;

  const fresnelFraction = fresnelClearance(distKm, freqMhz, t);

  const quality = connectionQuality({
    linkMarginDb,
    fresnelClearanceFraction: fresnelFraction,
    txGainDbi,
    rxGainDbi,
    receivedPowerDbm,
    bandwidthKhz: link.bandwidthKhz,
    rainAttenuationDb,
    cloudFogAttenuationDb: cloudFogDb,
  });

  return {
    // Base LinkBudget fields
    txPowerDbm,
    txGainDbi,
    rxGainDbi,
    fsplDb: baseLossDb,           // renamed: represents the chosen model's base loss
    terrainLossDb: clutterLossDb, // for backwards compatibility
    atmosphericLossDb: gasAbsorptionDb + rainAttenuationDb + cloudFogDb,
    receivedPowerDbm,
    rxSensitivityDbm: rxSensDbm,
    linkMarginDb,
    distanceKm: distKm,
    feasible: linkMarginDb > 0,

    // ITU-specific fields
    model,
    diffractionLossDb,
    rainAttenuationDb,
    cloudFogAttenuationDb: cloudFogDb,
    gasAbsorptionDb,
    clutterLossDb,
    fresnelClearanceFraction: fresnelFraction,
    connectionQuality: quality,
  };
}
