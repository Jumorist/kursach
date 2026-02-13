using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ModelController : ControllerBase
{
    private readonly AppDbContext _context;
    public ModelController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<IEnumerable<Model>>> GetModel()
    {
        return await _context.Model
            .OrderBy(c => c.model_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Model>> GetModel(int id)
    {
        var model = await _context.Model.FindAsync(id);

        if (model == null)
        {
            return NotFound();
        }
        return model;
    }

    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Model>> PostModel(Model model)
    {
        _context.Model.Add(model);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetModel", new { id = model.model_id }, model);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> PutModel(int id, Model model)
    {
        if (id != model.model_id)
        {
            return BadRequest();
        }
        _context.Entry(model).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ModelExists(id))
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
    public async Task<IActionResult> DeleteModel(int id)
    {
        var model = await _context.Model.FindAsync(id);
        if (model == null)
        {
            return NotFound();
        }

        _context.Model.Remove(model);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ModelExists(int id)
    {
        return _context.Model.Any(e => e.model_id == id);
    }
}