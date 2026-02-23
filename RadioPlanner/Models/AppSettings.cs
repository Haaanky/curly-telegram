namespace RadioPlanner.Models;

public class AppSettings
{
    public CoordSystem CoordSystem { get; set; } = CoordSystem.WGS84;
    public string TimeZone { get; set; } = "Europe/Stockholm";
    public bool ShowFresnel { get; set; }
    public bool ShowLinkBudgets { get; set; }
    public bool ShowGrid { get; set; }
}
