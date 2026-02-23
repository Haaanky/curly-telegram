namespace RadioPlanner.Models;

public class RadioNode
{
    public string Id { get; set; } = "";
    /// <summary>Callsign / short name</summary>
    public string Label { get; set; } = "";
    public string FullName { get; set; } = "";
    public UnitType Type { get; set; }
    public LatLng Position { get; set; } = new(0, 0);
    public string UnitId { get; set; } = "";
    public string? VehicleId { get; set; }
    public List<RadioEquipment> Equipment { get; set; } = [];
    public string? Color { get; set; }
}
