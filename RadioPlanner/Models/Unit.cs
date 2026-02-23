namespace RadioPlanner.Models;

public class Unit
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string ShortName { get; set; } = "";
    public UnitType Type { get; set; }
    public Echelon Echelon { get; set; }
    public string? ParentId { get; set; }
    public LatLng? Position { get; set; }
    public List<Vehicle> Vehicles { get; set; } = [];
    /// <summary>Hex color for display on map</summary>
    public string Color { get; set; } = "#3b82f6";
}
