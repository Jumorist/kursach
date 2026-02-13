using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Clients")]
public class Clients
{
    [Key]
    public int client_id { get; set; }
    public string full_name { get; set; }
    public string contact { get; set; }
}