using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Suppliers")]
public class Suppliers
{
    [Key]
    public int supplier_id { get; set; }
    public string name { get; set; }
    public string contact { get; set; }
    public string additional_info { get; set; }
}