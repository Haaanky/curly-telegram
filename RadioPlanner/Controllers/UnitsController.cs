using Microsoft.AspNetCore.Mvc;
using RadioPlanner.Models;
using RadioPlanner.Services;

namespace RadioPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UnitsController(RadioPlannerStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(store.Units);

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var unit = store.GetUnit(id);
        return unit is null ? NotFound() : Ok(unit);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Unit unit)
    {
        var created = store.AddUnit(unit);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPatch("{id}")]
    public IActionResult Update(string id, [FromBody] UnitPatch patch)
    {
        var updated = store.UpdateUnit(id, u =>
        {
            if (patch.Name is not null)      u.Name      = patch.Name;
            if (patch.ShortName is not null) u.ShortName = patch.ShortName;
            if (patch.Color is not null)     u.Color     = patch.Color;
            if (patch.Position is not null)  u.Position  = patch.Position;
            if (patch.Type is not null)      u.Type      = patch.Type.Value;
            if (patch.ParentId is not null)  u.ParentId  = patch.ParentId;
        });
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) =>
        store.DeleteUnit(id) ? NoContent() : NotFound();
}

public class UnitPatch
{
    public string? Name { get; set; }
    public string? ShortName { get; set; }
    public string? Color { get; set; }
    public LatLng? Position { get; set; }
    public UnitType? Type { get; set; }
    public string? ParentId { get; set; }
}
