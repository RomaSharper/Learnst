using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Learnst.Dao.Abstraction;

namespace Learnst.Api.Services;

public partial class ValidationService(ApplicationDbContext context) : IValidationService
{
    private readonly string[] ForbiddenWords = [
        "bitch", "ass", "nigger", "nigga", "fuck", "fucker", "motherfucker", "mfer", "killyourself", "kys"
    ];

    // Допустимые домены для email
    private readonly string[] EmailDomains = ["mail.ru", "xmail.ru", "gmail.com", "vk.com", "yandex.ru", "icloud.com"];

    // Валидация имени пользователя
    public async Task<UpdatedResponse> ValidateUsername(string username, Guid userId)
    {
        if (string.IsNullOrEmpty(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя не может быть пустым" };

        if (username.Length < 3 || username.Length > 20)
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя должно быть от 3 до 20 символов" };

        if (NumbersAndUnderscoreInStartRegex().IsMatch(username) || NumbersAndUnderscoreInEndRegex().IsMatch(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя не может начинаться или заканчиваться на подчёркивание или цифру" };

        if (!UsernameRegex().IsMatch(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя может содержать только латинские буквы, цифры и одно подчёркивание" };

        if (username.Count(c => c == '_') > 1)
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя может содержать только одно подчёркивание" };

        if (ForbiddenWords.Any(word => username.Contains(word, StringComparison.CurrentCultureIgnoreCase)))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя содержит запрещённое слово" };

        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.Username == username && u.Id != userId);

        if (existingUser is not null)
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя уже занято" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация пароля
    public UpdatedResponse ValidatePassword(string password)
    {
        if (string.IsNullOrEmpty(password))
            return new UpdatedResponse { Succeed = false, Message = "Пароль не может быть пустым" };

        if (!PasswordRegex().IsMatch(password))
            return new UpdatedResponse { Succeed = false, Message = "Пароль должен содержать минимум 8 символов, одну заглавную букву, одну строчную букву и одну цифру" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация email
    public UpdatedResponse ValidateEmail(string email)
    {
        if (string.IsNullOrEmpty(email))
            return new UpdatedResponse { Succeed = false, Message = "Email не может быть пустым" };

        if (!EmailRegex().IsMatch(email))
            return new UpdatedResponse { Succeed = false, Message = "Некорректный формат email" };

        var emailParts = email.Split('@');
        if (emailParts.Length != 2 || !EmailDomains.Contains(emailParts[1]))
            return new UpdatedResponse { Succeed = false, Message = "Недопустимый домен email" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация телефона
    public UpdatedResponse ValidatePhone(string phone)
    {
        if (string.IsNullOrEmpty(phone))
            return new UpdatedResponse { Succeed = false, Message = "Телефон не может быть пустым" };

        if (!PhoneRegex().IsMatch(phone))
            return new UpdatedResponse { Succeed = false, Message = "Некорректный формат телефона" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация URL
    public UpdatedResponse ValidateUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return new UpdatedResponse { Succeed = false, Message = "URL не может быть пустым" };

        if (!UrlRegex().IsMatch(url))
            return new UpdatedResponse { Succeed = false, Message = "Некорректный формат URL" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Генерация регулярных выражений
    [GeneratedRegex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")]
    private partial Regex PasswordRegex();

    [GeneratedRegex(@"^(?!_)(?!\d)[a-z0-9]+(_[a-z0-9]+)*(?<!_)(?<!\d)$")]
    private partial Regex UsernameRegex();

    [GeneratedRegex(@"^[_0-9]")]
    private static partial Regex NumbersAndUnderscoreInStartRegex();

    [GeneratedRegex(@"[_0-9]$")]
    private static partial Regex NumbersAndUnderscoreInEndRegex();

    [GeneratedRegex(@"^\+?[0-9]{11}$")]
    private static partial Regex PhoneRegex();

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-@]*)*\/?$")]
    private static partial Regex UrlRegex();
}