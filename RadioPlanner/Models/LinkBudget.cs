namespace RadioPlanner.Models;

public class LinkBudget
{
    public double TxPowerDbm { get; set; }
    public double TxGainDbi { get; set; }
    public double RxGainDbi { get; set; }
    public double FsplDb { get; set; }
    public double TerrainLossDb { get; set; }
    public double AtmosphericLossDb { get; set; }
    public double ReceivedPowerDbm { get; set; }
    public double RxSensitivityDbm { get; set; }
    public double LinkMarginDb { get; set; }
    public double DistanceKm { get; set; }
    public bool Feasible { get; set; }
}
