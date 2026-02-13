using Kursach.Models;
using System.Security.Cryptography;
using System.Text;

namespace Kursach.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            if (!context.Users.Any())
            {
                CreatePasswordHash("meneg123", out byte[] passwordHash, out byte[] passwordSalt);

                var managerUser = new User
                {
                    username = "manager",
                    role = "manager",
                    password_hash = Convert.ToBase64String(passwordHash) + ":" + Convert.ToBase64String(passwordSalt)
                };

                context.Users.Add(managerUser);
                context.SaveChanges();
            }
        }

        private static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }
    }
}


