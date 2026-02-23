namespace RadioPlanner.Models;

public class RadioEquipment
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Model { get; set; } = "";
    public EquipmentCategory Category { get; set; }
    /// <summary>Minimum frequency in MHz</summary>
    public double FreqMinMhz { get; set; }
    /// <summary>Maximum frequency in MHz</summary>
    public double FreqMaxMhz { get; set; }
    /// <summary>Maximum transmit power in Watts</summary>
    public double MaxPowerW { get; set; }
    /// <summary>Receiver sensitivity in dBm</summary>
    public double RxSensitivityDbm { get; set; }
    /// <summary>Antenna gain in dBi</summary>
    public double AntennaGainDbi { get; set; }
    public string? Description { get; set; }
}
