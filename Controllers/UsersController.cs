using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        return await _context.Users
            .Select(u => new
            {
                u.user_id,
                u.username,
                u.role
            })
            .OrderBy(c => c.user_id)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<object>> GetUsers(int id)
    {
        var user = await _context.Users
            .Where(u => u.user_id == id)
            .Select(u => new
            {
                u.user_id,
                u.username,
                u.role
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound();
        }
        return user;
    }

    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<ActionResult<User>> PostUsers(UserCreateRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.username == request.username))
            return BadRequest("Пользователь с таким именем уже существует");

        if (request.role != "manager" && request.role != "seller")
            return BadRequest("Недопустимая роль. Используйте 'manager' или 'seller'");

        CreatePasswordHash(request.password, out byte[] passwordHash, out byte[] passwordSalt);

        var user = new User
        {
            username = request.username,
            role = request.role,
            password_hash = Convert.ToBase64String(passwordHash) + ":" + Convert.ToBase64String(passwordSalt)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetUsers", new { id = user.user_id }, new
        {
            user.user_id,
            user.username,
            user.role
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> PutUsers(int id, UserUpdateRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        if (await _context.Users.AnyAsync(u => u.username == request.username && u.user_id != id))
            return BadRequest("Пользователь с таким именем уже существует");

        user.username = request.username;
        user.role = request.role;

        if (!string.IsNullOrEmpty(request.password))
        {
            CreatePasswordHash(request.password, out byte[] passwordHash, out byte[] passwordSalt);
            user.password_hash = Convert.ToBase64String(passwordHash) + ":" + Convert.ToBase64String(passwordSalt);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!UsersExists(id))
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
    public async Task<IActionResult> DeleteUsers(int id)
    {
        var users = await _context.Users.FindAsync(id);
        if (users == null)
        {
            return NotFound();
        }

        _context.Users.Remove(users);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool UsersExists(int id)
    {
        return _context.Users.Any(e => e.user_id == id);
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }
}

public class UserCreateRequest
{
    public string username { get; set; }
    public string password { get; set; }
    public string role { get; set; }
}

public class UserUpdateRequest
{
    public string username { get; set; }
    public string password { get; set; }
    public string role { get; set; }
}