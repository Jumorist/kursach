using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Cars")]
public class Cars
{
    [Key]
    public int car_id { get; set; }
    public int model_id { get; set; }
    public int manufacture_year { get; set; }
    public string trim_level { get; set; }
    public string color { get; set; }
    public int mileage { get; set; }
    public decimal price { get; set; }
    public string status { get; set; }
    public string condition { get; set; }

    [ForeignKey("model_id")]
    public virtual Model Model { get; set; }
}