using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SuppliesController : ControllerBase
{
    private readonly AppDbContext _context;
    public SuppliesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<IEnumerable<Supplies>>> GetSupplies()
    {
        return await _context.Supplies
            .OrderBy(c => c.supply_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Supplies>> GetSupplies(int id)
    {
        var supplies = await _context.Supplies.FindAsync(id);

        if (supplies == null)
        {
            return NotFound();
        }
        return supplies;
    }

    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Supplies>> PostSupplies(Supplies supplies)
    {
        _context.Supplies.Add(supplies);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetSupplies", new { id = supplies.supply_id }, supplies);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> PutSupplies(int id, Supplies supplies)
    {
        if (id != supplies.supply_id)
        {
            return BadRequest();
        }
        _context.Entry(supplies).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!SuppliesExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> DeleteSupplies(int id)
    {
        var supplies = await _context.Supplies.FindAsync(id);
        if (supplies == null)
        {
            return NotFound();
        }

        _context.Supplies.Remove(supplies);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool SuppliesExists(int id)
    {
        return _context.Supplies.Any(e => e.supply_id == id);
    }
}