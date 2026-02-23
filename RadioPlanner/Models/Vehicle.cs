namespace RadioPlanner.Models;

public class Vehicle
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string CallSign { get; set; } = "";
    public string Type { get; set; } = "";
    public LatLng? Position { get; set; }
    public List<RadioEquipment> Equipment { get; set; } = [];
    public string UnitId { get; set; } = "";
}
