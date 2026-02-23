using Microsoft.AspNetCore.Mvc;
using RadioPlanner.Models;
using RadioPlanner.Services;

namespace RadioPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LinksController(RadioPlannerStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(store.Links);

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var link = store.GetLink(id);
        return link is null ? NotFound() : Ok(link);
    }

    [HttpPost]
    public IActionResult Create([FromBody] RadioLink link)
    {
        var created = store.AddLink(link);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPatch("{id}")]
    public IActionResult Update(string id, [FromBody] LinkPatch patch)
    {
        var updated = store.UpdateLink(id, l =>
        {
            if (patch.Name is not null)            l.Name            = patch.Name;
            if (patch.NetName is not null)         l.NetName         = patch.NetName;
            if (patch.NetType is not null)         l.NetType         = patch.NetType.Value;
            if (patch.FrequencyMhz is not null)    l.FrequencyMhz    = patch.FrequencyMhz.Value;
            if (patch.BandwidthKhz is not null)    l.BandwidthKhz    = patch.BandwidthKhz.Value;
            if (patch.Waveform is not null)        l.Waveform        = patch.Waveform.Value;
            if (patch.TxPowerW is not null)        l.TxPowerW        = patch.TxPowerW.Value;
            if (patch.Status is not null)          l.Status          = patch.Status.Value;
            if (patch.StartTime is not null)       l.StartTime       = patch.StartTime.Value;
            if (patch.EndTime is not null)         l.EndTime         = patch.EndTime.Value;
            if (patch.Notes is not null)           l.Notes           = patch.Notes;
            if (patch.EquipmentFromId is not null) l.EquipmentFromId = patch.EquipmentFromId;
            if (patch.EquipmentToId is not null)   l.EquipmentToId   = patch.EquipmentToId;
        });
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) =>
        store.DeleteLink(id) ? NoContent() : NotFound();

    [HttpPost("{id}/recalc")]
    public IActionResult Recalc(string id)
    {
        var link = store.GetLink(id);
        if (link is null) return NotFound();
        store.RecalcLinkBudget(id);
        return Ok(store.GetLink(id));
    }

    [HttpGet("{id}/budget")]
    public IActionResult GetBudget(string id)
    {
        var link = store.GetLink(id);
        if (link is null) return NotFound();
        if (link.LinkBudget is null) return NoContent();
        return Ok(link.LinkBudget);
    }
}

public class LinkPatch
{
    public string? Name { get; set; }
    public string? NetName { get; set; }
    public NetType? NetType { get; set; }
    public double? FrequencyMhz { get; set; }
    public double? BandwidthKhz { get; set; }
    public WaveformType? Waveform { get; set; }
    public double? TxPowerW { get; set; }
    public LinkStatus? Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Notes { get; set; }
    public string? EquipmentFromId { get; set; }
    public string? EquipmentToId { get; set; }
}
