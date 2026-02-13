using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Supplies")]
public class Supplies
{
    [Key]
    public int supply_id { get; set; }
    public int supplier_id { get; set; }
    public int car_id { get; set; }
    public decimal purchase_price { get; set; }
    public DateOnly supply_date { get; set; }
}