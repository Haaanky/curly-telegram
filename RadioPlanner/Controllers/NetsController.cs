using Microsoft.AspNetCore.Mvc;
using RadioPlanner.Models;
using RadioPlanner.Services;

namespace RadioPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NetsController(RadioPlannerStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(store.Nets);

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var net = store.GetNet(id);
        return net is null ? NotFound() : Ok(net);
    }

    [HttpPost]
    public IActionResult Create([FromBody] FrequencyNet net)
    {
        var created = store.AddNet(net);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPatch("{id}")]
    public IActionResult Update(string id, [FromBody] NetPatch patch)
    {
        var updated = store.UpdateNet(id, n =>
        {
            if (patch.Name is not null)           n.Name           = patch.Name;
            if (patch.PrimaryFreqMhz is not null) n.PrimaryFreqMhz = patch.PrimaryFreqMhz.Value;
            if (patch.AltFreqMhz is not null)     n.AltFreqMhz     = patch.AltFreqMhz;
            if (patch.Waveform is not null)        n.Waveform       = patch.Waveform.Value;
            if (patch.NetType is not null)         n.NetType        = patch.NetType.Value;
            if (patch.Color is not null)           n.Color          = patch.Color;
            if (patch.MemberNodeIds is not null)   n.MemberNodeIds  = patch.MemberNodeIds;
        });
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) =>
        store.DeleteNet(id) ? NoContent() : NotFound();
}

public class NetPatch
{
    public string? Name { get; set; }
    public double? PrimaryFreqMhz { get; set; }
    public double? AltFreqMhz { get; set; }
    public WaveformType? Waveform { get; set; }
    public NetType? NetType { get; set; }
    public string? Color { get; set; }
    public List<string>? MemberNodeIds { get; set; }
}
