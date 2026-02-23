using RadioPlanner.Data;
using RadioPlanner.Models;

namespace RadioPlanner.Services;

/// <summary>
/// In-memory store for all radio planning data.
/// Equivalent to the Zustand store in the original TypeScript frontend.
/// </summary>
public class RadioPlannerStore
{
    private readonly List<Unit> _units;
    private readonly List<RadioLink> _links;
    private readonly List<FrequencyNet> _nets;

    public RadioPlannerStore()
    {
        _units = [.. SampleData.InitialUnits];
        _links = [.. SampleData.InitialLinks];
        _nets  = [.. SampleData.InitialNets];
        RecalcAllBudgets();
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    public IReadOnlyList<Unit> Units => _units;
    public IReadOnlyList<RadioLink> Links => _links;
    public IReadOnlyList<FrequencyNet> Nets => _nets;
    public IReadOnlyList<RadioEquipment> EquipmentCatalog => SampleData.EquipmentCatalog;

    public IReadOnlyList<RadioNode> Nodes => BuildNodesFromUnits(_units);

    // ── Units ─────────────────────────────────────────────────────────────────

    public Unit? GetUnit(string id) => _units.FirstOrDefault(u => u.Id == id);

    public Unit AddUnit(Unit unit)
    {
        unit.Id = IdHelper.NewId();
        _units.Add(unit);
        return unit;
    }

    public Unit? UpdateUnit(string id, Action<Unit> patch)
    {
        var unit = GetUnit(id);
        if (unit is null) return null;
        patch(unit);
        return unit;
    }

    public bool DeleteUnit(string id) => _units.RemoveAll(u => u.Id == id) > 0;

    // ── Nodes ─────────────────────────────────────────────────────────────────

    public RadioNode? GetNode(string id) => Nodes.FirstOrDefault(n => n.Id == id);

    public bool MoveNode(string nodeId, LatLng pos)
    {
        bool moved = false;
        foreach (var unit in _units)
        {
            if (unit.Id == nodeId) { unit.Position = pos; moved = true; }
            foreach (var v in unit.Vehicles)
                if (v.Id == nodeId) { v.Position = pos; moved = true; }
        }
        if (moved) RecalcAllBudgets();
        return moved;
    }

    // ── Links ─────────────────────────────────────────────────────────────────

    public RadioLink? GetLink(string id) => _links.FirstOrDefault(l => l.Id == id);

    public RadioLink AddLink(RadioLink link)
    {
        link.Id = IdHelper.NewId();
        _links.Add(link);
        RecalcLinkBudget(link.Id);
        return link;
    }

    public RadioLink? UpdateLink(string id, Action<RadioLink> patch)
    {
        var link = GetLink(id);
        if (link is null) return null;
        patch(link);
        RecalcLinkBudget(id);
        return link;
    }

    public bool DeleteLink(string id) => _links.RemoveAll(l => l.Id == id) > 0;

    public void RecalcLinkBudget(string id)
    {
        var link = GetLink(id);
        if (link is null) return;

        var nodes = Nodes;
        var fromNode = nodes.FirstOrDefault(n => n.Id == link.FromNodeId);
        var toNode   = nodes.FirstOrDefault(n => n.Id == link.ToNodeId);
        if (fromNode is null || toNode is null) return;

        var fromEquip = _units.SelectMany(u => u.Vehicles)
            .FirstOrDefault(v => v.Id == fromNode.VehicleId)
            ?.Equipment.FirstOrDefault(e => e.Id == link.EquipmentFromId);

        var toEquip = _units.SelectMany(u => u.Vehicles)
            .FirstOrDefault(v => v.Id == toNode.VehicleId)
            ?.Equipment.FirstOrDefault(e => e.Id == link.EquipmentToId);

        link.LinkBudget = LinkBudgetService.CalcLinkBudget(
            fromNode.Position, toNode.Position, link, fromEquip, toEquip);
    }

    public void RecalcAllBudgets()
    {
        foreach (var link in _links)
            RecalcLinkBudget(link.Id);
    }

    // ── Nets ──────────────────────────────────────────────────────────────────

    public FrequencyNet? GetNet(string id) => _nets.FirstOrDefault(n => n.Id == id);

    public FrequencyNet AddNet(FrequencyNet net)
    {
        net.Id = IdHelper.NewId();
        _nets.Add(net);
        return net;
    }

    public FrequencyNet? UpdateNet(string id, Action<FrequencyNet> patch)
    {
        var net = GetNet(id);
        if (net is null) return null;
        patch(net);
        return net;
    }

    public bool DeleteNet(string id) => _nets.RemoveAll(n => n.Id == id) > 0;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static List<RadioNode> BuildNodesFromUnits(IEnumerable<Unit> units)
    {
        var nodes = new List<RadioNode>();
        foreach (var unit in units)
        {
            foreach (var vehicle in unit.Vehicles)
            {
                if (vehicle.Position is not null)
                {
                    nodes.Add(new RadioNode
                    {
                        Id        = vehicle.Id,
                        Label     = vehicle.CallSign,
                        FullName  = $"{unit.ShortName} / {vehicle.Name}",
                        Type      = unit.Type,
                        Position  = vehicle.Position,
                        UnitId    = unit.Id,
                        VehicleId = vehicle.Id,
                        Equipment = vehicle.Equipment,
                        Color     = unit.Color,
                    });
                }
            }

            // Add unit HQ node if no vehicles but unit has a position
            if (unit.Vehicles.Count == 0 && unit.Position is not null)
            {
                nodes.Add(new RadioNode
                {
                    Id       = unit.Id,
                    Label    = unit.ShortName,
                    FullName = unit.Name,
                    Type     = unit.Type,
                    Position = unit.Position,
                    UnitId   = unit.Id,
                    Color    = unit.Color,
                });
            }
        }
        return nodes;
    }
}
