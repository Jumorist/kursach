using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Employees")]
public class Employees
{
    [Key]
    public int employee_id { get; set; }
    public string full_name { get; set; }
    public string contact { get; set; }
    public string department { get; set; }
    public string position { get; set; }
    public int salary { get; set; }
}