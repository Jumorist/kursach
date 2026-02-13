using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Model")]
public class Model
{
    [Key]
    public int model_id { get; set; }
    public string model { get; set; }
    public string vehicle_type { get; set; }
    public string brand { get; set; }
    public string body_type { get; set; }
    public string country { get; set; }
    public string fuel_type { get; set; }
    public string transmission { get; set; }
    public string steering { get; set; }
    public string drive_type { get; set; }
}