using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Sales")]
public class Sales
{
    [Key]
    public int sale_id { get; set; }
    public int client_id { get; set; }
    public int car_id { get; set; }
    public int employee_id { get; set; }
    public decimal purchase_price { get; set; }
    public decimal sale_price { get; set; }
    public DateOnly sale_date { get; set; }
}