using RadioPlanner.Models;

namespace RadioPlanner.Services;

public static class LinkBudgetService
{
    /// <summary>
    /// Free Space Path Loss (dB) — Friis equation.
    /// FSPL = 20·log₁₀(d_km) + 20·log₁₀(f_MHz) + 32.44
    /// </summary>
    public static double FreespacePathLossDb(double distKm, double freqMhz)
    {
        if (distKm <= 0 || freqMhz <= 0) return 0;
        return 20 * Math.Log10(distKm) + 20 * Math.Log10(freqMhz) + 32.44;
    }

    /// <summary>Approximate terrain/obstacle loss based on distance and frequency.</summary>
    public static double EstimateTerrainLoss(double distKm, double freqMhz)
    {
        var factor = freqMhz < 100 ? 0.5 : freqMhz < 1000 ? 0.3 : 0.15;
        return Math.Min(factor * distKm, 30);
    }

    /// <summary>Atmospheric loss in dB (simple approximation).</summary>
    public static double AtmosphericLoss(double distKm, double freqMhz)
    {
        if (freqMhz < 1000) return 0.01 * distKm;
        if (freqMhz < 10000) return 0.05 * distKm;
        return 0.2 * distKm;
    }

    /// <summary>Convert Watts to dBm.</summary>
    public static double WattToDbm(double watts) => 10 * Math.Log10(watts * 1000);

    /// <summary>Convert dBm to Watts.</summary>
    public static double DbmToWatt(double dbm) => Math.Pow(10, (dbm - 30) / 10);

    /// <summary>First Fresnel zone radius (m) at mid-path.</summary>
    public static double FresnelRadius1(double distKm, double freqMhz)
    {
        var lambda = 300.0 / freqMhz; // wavelength in metres
        var d = distKm * 1000;
        return Math.Sqrt(lambda * d / 4);
    }

    /// <summary>Calculate full link budget.</summary>
    public static LinkBudget CalcLinkBudget(
        LatLng from,
        LatLng to,
        RadioLink link,
        RadioEquipment? fromEquip = null,
        RadioEquipment? toEquip = null)
    {
        var distKm = GeoService.HaversineKm(from, to);
        var freqMhz = link.FrequencyMhz;

        var txPowerDbm = WattToDbm(link.TxPowerW);
        var txGainDbi = fromEquip?.AntennaGainDbi ?? 0;
        var rxGainDbi = toEquip?.AntennaGainDbi ?? 0;
        var rxSensDbm = toEquip?.RxSensitivityDbm ?? -110;

        var fsplDb = FreespacePathLossDb(distKm, freqMhz);
        var terrainLossDb = EstimateTerrainLoss(distKm, freqMhz);
        var atmosphericLossDb = AtmosphericLoss(distKm, freqMhz);

        var receivedPowerDbm = txPowerDbm + txGainDbi - fsplDb - terrainLossDb - atmosphericLossDb + rxGainDbi;
        var linkMarginDb = receivedPowerDbm - rxSensDbm;

        return new LinkBudget
        {
            TxPowerDbm = txPowerDbm,
            TxGainDbi = txGainDbi,
            RxGainDbi = rxGainDbi,
            FsplDb = fsplDb,
            TerrainLossDb = terrainLossDb,
            AtmosphericLossDb = atmosphericLossDb,
            ReceivedPowerDbm = receivedPowerDbm,
            RxSensitivityDbm = rxSensDbm,
            LinkMarginDb = linkMarginDb,
            DistanceKm = distKm,
            Feasible = linkMarginDb > 0,
        };
    }

    /// <summary>Format a dB value with sign.</summary>
    public static string FmtDb(double val) => (val >= 0 ? "+" : "") + val.ToString("F1") + " dB";

    /// <summary>Format a dBm value.</summary>
    public static string FmtDbm(double val) => val.ToString("F1") + " dBm";

    /// <summary>Signal quality label from link margin.</summary>
    public static (string Label, string Color) LinkQuality(double margin) => margin switch
    {
        > 20 => ("Utmärkt", "#22c55e"),
        > 10 => ("God", "#86efac"),
        > 3  => ("Acceptabel", "#facc15"),
        > 0  => ("Svag", "#f97316"),
        _    => ("Otillräcklig", "#ef4444"),
    };
}
