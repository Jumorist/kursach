using Microsoft.EntityFrameworkCore;
using Kursach.Models;

namespace Kursach.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Cars> Cars { get; set; }
        public DbSet<Clients> Clients { get; set; }
        public DbSet<Employees> Employees { get; set; }
        public DbSet<Model> Model { get; set; }
        public DbSet<Sales> Sales { get; set; }
        public DbSet<Suppliers> Suppliers { get; set; }
        public DbSet<Supplies> Supplies { get; set; }
        public DbSet<User> Users { get; set; }

    }
}