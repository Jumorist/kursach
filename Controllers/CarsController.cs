using Kursach.Data;
using Kursach.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace Kursach.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CarsController : ControllerBase
{
    private readonly AppDbContext _context;
    public CarsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetCars()
    {
        return await _context.Cars
            .Include(c => c.Model)
            .OrderBy(c => c.car_id)
            .Select(c => new
            {
                c.car_id,
                c.model_id,
                c.manufacture_year,
                c.trim_level,
                c.color,
                c.mileage,
                c.price,
                c.status,
                c.condition
            })
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetCars(int id)
    {
        var car = await _context.Cars
            .Include(c => c.Model)
            .Where(c => c.car_id == id)
            .Select(c => new
            {
                c.car_id,
                c.model_id,
                c.manufacture_year,
                c.trim_level,
                c.color,
                c.mileage,
                c.price,
                c.status,
                c.condition
            })
            .FirstOrDefaultAsync();

        if (car == null)
        {
            return NotFound();
        }
        return car;
    }

    [HttpPost]
    [Authorize(Roles = "manager,seller")]
    public async Task<ActionResult<Cars>> PostCars([FromBody] Dictionary<string, JsonElement> carData)
    {
        try
        {
            var model_id = carData["model_id"].GetInt32();
            var modelExists = await _context.Model.AnyAsync(m => m.model_id == model_id);
            if (!modelExists)
            {
                return BadRequest("Указанная модель не существует");
            }

            var car = new Cars
            {
                model_id = model_id,
                manufacture_year = carData["manufacture_year"].GetInt32(),
                trim_level = carData["trim_level"].GetString(),
                color = carData["color"].GetString(),
                mileage = carData["mileage"].GetInt32(),
                price = carData["price"].GetDecimal(),
                status = carData["status"].GetString(),
                condition = carData["condition"].GetString()
            };

            _context.Cars.Add(car);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCars", new { id = car.car_id }, car);
        }
        catch (Exception ex)
        {
            return BadRequest($"Ошибка при создании автомобиля: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager,seller")]
    public async Task<IActionResult> PutCars(int id, [FromBody] Dictionary<string, JsonElement> carData)
    {
        try
        {
            var existingCar = await _context.Cars.FindAsync(id);
            if (existingCar == null)
            {
                return NotFound();
            }

            var model_id = carData["model_id"].GetInt32();
            var modelExists = await _context.Model.AnyAsync(m => m.model_id == model_id);
            if (!modelExists)
            {
                return BadRequest("Указанная модель не существует");
            }

            existingCar.model_id = model_id;
            existingCar.manufacture_year = carData["manufacture_year"].GetInt32();
            existingCar.trim_level = carData["trim_level"].GetString();
            existingCar.color = carData["color"].GetString();
            existingCar.mileage = carData["mileage"].GetInt32();
            existingCar.price = carData["price"].GetDecimal();
            existingCar.status = carData["status"].GetString();
            existingCar.condition = carData["condition"].GetString();

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest($"Ошибка при обновлении автомобиля: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> DeleteCars(int id)
    {
        var cars = await _context.Cars.FindAsync(id);
        if (cars == null)
        {
            return NotFound();
        }

        _context.Cars.Remove(cars);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}