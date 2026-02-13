using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly AppDbContext _context;
    public SalesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Sales>>> GetSales()
    {
        return await _context.Sales
            .OrderBy(c => c.sale_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Sales>> GetSales(int id)
    {
        var sales = await _context.Sales.FindAsync(id);

        if (sales == null)
        {
            return NotFound();
        }
        return sales;
    }

    [HttpPost]
    [Authorize(Roles = "manager,seller")] 
    public async Task<ActionResult<Sales>> PostSales(Sales sales)
    {
        _context.Sales.Add(sales);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetSales", new { id = sales.sale_id }, sales);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager,seller")] 
    public async Task<IActionResult> PutSales(int id, Sales sales)
    {
        if (id != sales.sale_id)
        {
            return BadRequest();
        }
        _context.Entry(sales).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!SalesExists(id))
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
    public async Task<IActionResult> DeleteSales(int id)
    {
        var sales = await _context.Sales.FindAsync(id);
        if (sales == null)
        {
            return NotFound();
        }

        _context.Sales.Remove(sales);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool SalesExists(int id)
    {
        return _context.Sales.Any(e => e.sale_id == id);
    }
}