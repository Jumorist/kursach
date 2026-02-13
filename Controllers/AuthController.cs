using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<string>> Login(LoginRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.username == request.Username);
            if (user == null || !VerifyPasswordHash(request.Password, user.password_hash))
                return BadRequest("Неверный логин или пароль");

            var token = CreateToken(user);
            return Ok(new { token, user.role, user.username });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.username == request.Username))
            return BadRequest("Имя пользователя уже существует");

        string role = DetermineRoleFromPassword(request.RolePassword);

        if (string.IsNullOrEmpty(role))
            return BadRequest("Неверный пароль роли");

        CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

        var user = new User
        {
            username = request.Username,
            role = role,
            password_hash = Convert.ToBase64String(passwordHash) + ":" + Convert.ToBase64String(passwordSalt)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Пользователь создан успешно",
            user.username,
            user.role
        });
    }

    [HttpGet("listUsers")]
    [AllowAnonymous]
    public async Task<IActionResult> ListUsers()
    {
        try
        {
            var users = await _context.Users
                .Select(u => new {
                    u.user_id,
                    u.username,
                    u.role
                })
                .ToListAsync();

            return Ok(new
            {
                totalUsers = users.Count,
                users
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("verify")]
    [Authorize]
    public IActionResult VerifyToken()
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Ok(new
        {
            message = "Token is valid",
            username = userName,
            role = userRole,
            userId,
            timestamp = DateTime.Now
        });
    }

    private string CreateToken(User user)
    {
        try
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.username),
                new Claim(ClaimTypes.Role, user.role),
                new Claim(ClaimTypes.NameIdentifier, user.user_id.ToString())
            };

            var keyString = _configuration.GetSection("AppSettings:Token").Value;

            if (string.IsNullOrEmpty(keyString))
            {
                throw new Exception("JWT ключ не настроен в appsettings.json");
            }

            var keyBytes = Encoding.UTF8.GetBytes(keyString);

            if (keyBytes.Length < 32)
            {
                throw new Exception($"JWT ключ слишком короткий: {keyBytes.Length} байт ({keyBytes.Length * 8} бит). Нужно минимум 32 байта (256 бит) для HMACSHA256.");
            }

            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка создания токена: {ex.Message}");
            throw;
        }
    }

    private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
    {
        using (var hmac = new HMACSHA512())
        {
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }
    }

    private bool VerifyPasswordHash(string password, string storedHash)
    {
        try
        {
            var parts = storedHash.Split(':');
            if (parts.Length != 2) return false;

            var storedPasswordHash = Convert.FromBase64String(parts[0]);
            var storedPasswordSalt = Convert.FromBase64String(parts[1]);

            using (var hmac = new HMACSHA512(storedPasswordSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(storedPasswordHash);
            }
        }
        catch
        {
            return false;
        }
    }

    private string? DetermineRoleFromPassword(string rolePassword)
    {
        return rolePassword.ToLower() switch
        {
            "meneg123" => "manager",
            "saler123" => "seller",
            _ => null
        };
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}

public class RegisterRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
    public string RolePassword { get; set; }
}