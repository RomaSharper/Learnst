using System.Security.Cryptography;
using System.Text;

namespace Learnst.Infrastructure.Services;

public static class AuthService
{
    private const string Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    public static string GenerateCode(byte length = 32)
    {
        if (length > 100)
            throw new ArgumentException("Длина не может быть более 100 символов", nameof(length));
        
        Random random = new();
        return new string([.. Enumerable.Repeat(Chars, length).Select(s => s[random.Next(s.Length)])]);
    }

    public static string GenerateCodeSecure(int length = 32)
    {
        if (length > 100)
            throw new ArgumentException("Длина не может быть более 100 символов", nameof(length));
        
        // Генерируем случайные байты
        var randomNumber = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);

        // Кодируем в строку
        StringBuilder result = new(length);
        
        foreach (var b in randomNumber)
            result.Append(Chars[b % Chars.Length]);
                
        return result.ToString();
    }
}
