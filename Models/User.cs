using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kursach.Models;

[Table("Users")]
public class User
{
    [Key]
    public int user_id { get; set; }

    [Required]
    [StringLength(50)]
    public string username { get; set; }

    [Required]
    public string password_hash { get; set; }

    [Required]
    [StringLength(20)]
    public string role { get; set; }
}