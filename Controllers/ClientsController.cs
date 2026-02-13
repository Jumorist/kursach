using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _context;
    public ClientsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Clients>>> GetClients()
    {
        return await _context.Clients
            .OrderBy(c => c.client_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Clients>> GetClients(int id)
    {
        var clients = await _context.Clients.FindAsync(id);

        if (clients == null)
        {
            return NotFound();
        }
        return clients;
    }

    [HttpPost]
    [Authorize(Roles = "manager,seller")]
    public async Task<ActionResult<Clients>> PostClients(Clients clients)
    {
        _context.Clients.Add(clients);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClients", new { id = clients.client_id }, clients);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager,seller")]
    public async Task<IActionResult> PutClients(int id, Clients clients)
    {
        if (id != clients.client_id)
        {
            return BadRequest();
        }
        _context.Entry(clients).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClientsExists(id))
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
    public async Task<IActionResult> DeleteClients(int id)
    {
        var clients = await _context.Clients.FindAsync(id);
        if (clients == null)
        {
            return NotFound();
        }

        _context.Clients.Remove(clients);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClientsExists(int id)
    {
        return _context.Clients.Any(e => e.client_id == id);
    }
}