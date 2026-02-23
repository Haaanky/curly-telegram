namespace RadioPlanner.Models;

public class RadioLink
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string NetName { get; set; } = "";
    public NetType NetType { get; set; }
    public string FromNodeId { get; set; } = "";
    public string ToNodeId { get; set; } = "";
    public string? EquipmentFromId { get; set; }
    public string? EquipmentToId { get; set; }
    /// <summary>Frequency in MHz</summary>
    public double FrequencyMhz { get; set; }
    /// <summary>Bandwidth in kHz</summary>
    public double BandwidthKhz { get; set; }
    public WaveformType Waveform { get; set; }
    /// <summary>Transmit power in Watts</summary>
    public double TxPowerW { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public LinkStatus Status { get; set; }
    public LinkBudget? LinkBudget { get; set; }
    public string? Notes { get; set; }
}
