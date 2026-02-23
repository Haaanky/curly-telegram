using Microsoft.AspNetCore.Mvc;
using RadioPlanner.Models;
using RadioPlanner.Services;

namespace RadioPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NodesController(RadioPlannerStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(store.Nodes);

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var node = store.GetNode(id);
        return node is null ? NotFound() : Ok(node);
    }

    [HttpPatch("{id}/position")]
    public IActionResult MoveNode(string id, [FromBody] LatLng position)
    {
        var moved = store.MoveNode(id, position);
        if (!moved) return NotFound();
        return Ok(store.GetNode(id));
    }
}
