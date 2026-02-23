namespace RadioPlanner.Models;

public class FrequencyNet
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    /// <summary>Primary frequency in MHz</summary>
    public double PrimaryFreqMhz { get; set; }
    /// <summary>Alternate frequency in MHz (optional)</summary>
    public double? AltFreqMhz { get; set; }
    public WaveformType Waveform { get; set; }
    public NetType NetType { get; set; }
    public List<string> MemberNodeIds { get; set; } = [];
    public string Color { get; set; } = "#3b82f6";
}
