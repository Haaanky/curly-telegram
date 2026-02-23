using Microsoft.AspNetCore.Mvc;
using RadioPlanner.Services;

namespace RadioPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController(RadioPlannerStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult GetCatalog() => Ok(store.EquipmentCatalog);
}
