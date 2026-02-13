using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;
    public EmployeesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<IEnumerable<Employees>>> GetEmployees()
    {
        return await _context.Employees
            .OrderBy(c => c.employee_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<Employees>> GetEmployees(int id)
    {
        var employees = await _context.Employees.FindAsync(id);

        if (employees == null)
        {
            return NotFound();
        }
        return employees;
    }

    [HttpPost]
    [Authorize(Roles = "manager")] 
    public async Task<ActionResult<Employees>> PostEmployees(Employees employees)
    {
        _context.Employees.Add(employees);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetEmployees", new { id = employees.employee_id }, employees);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")] 
    public async Task<IActionResult> PutEmployees(int id, Employees employees)
    {
        if (id != employees.employee_id)
        {
            return BadRequest();
        }
        _context.Entry(employees).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EmployeesExists(id))
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
    public async Task<IActionResult> DeleteEmployees(int id)
    {
        var employees = await _context.Employees.FindAsync(id);
        if (employees == null)
        {
            return NotFound();
        }

        _context.Employees.Remove(employees);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool EmployeesExists(int id)
    {
        return _context.Employees.Any(e => e.employee_id == id);
    }
}