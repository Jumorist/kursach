using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _context;
    public SuppliersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<IEnumerable<Suppliers>>> GetSuppliers()
    {
        return await _context.Suppliers
            .OrderBy(c => c.supplier_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Suppliers>> GetSuppliers(int id)
    {
        var suppliers = await _context.Suppliers.FindAsync(id);

        if (suppliers == null)
        {
            return NotFound();
        }
        return suppliers;
    }

    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Suppliers>> PostSuppliers(Suppliers suppliers)
    {
        _context.Suppliers.Add(suppliers);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetSuppliers", new { id = suppliers.supplier_id }, suppliers);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> PutSuppliers(int id, Suppliers suppliers)
    {
        if (id != suppliers.supplier_id)
        {
            return BadRequest();
        }
        _context.Entry(suppliers).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!SuppliersExists(id))
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
    public async Task<IActionResult> DeleteSuppliers(int id)
    {
        var suppliers = await _context.Suppliers.FindAsync(id);
        if (suppliers == null)
        {
            return NotFound();
        }

        _context.Suppliers.Remove(suppliers);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool SuppliersExists(int id)
    {
        return _context.Suppliers.Any(e => e.supplier_id == id);
    }
}