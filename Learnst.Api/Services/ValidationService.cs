using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Learnst.Api.Models;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;

namespace Learnst.Api.Services;

public partial class ValidationService(ApplicationDbContext context) : IValidationService
{
    private readonly string[] ForbiddenWords =
    [
        // Основные оскорбления (английские)
        "bitch", "asshole", "nigger", "nigga", "fuck", "fucker", "motherfucker",
        "shit", "cunt", "whore", "slut", "dick", "pussy", "bastard", "retard",
        "douche", "wanker", "twat", "pedo", "rapist", "scum", "jizz", "cum",

        // Русские оскорбления
        "сука", "сучка", "блядь", "блять", "хуй", "хуё", "пидор", "пидарас",
        "мудак", "говно", "долбоёб", "шлюха", "дебил", "кретин", "еблан", "жопа",
        "залупа", "мразь", "падла", "сволочь", "урод", "чмо", "гандон", "козёл",
        "лох", "пердун", "пизда", "ебучка", "выёбок", "манда", "ссанина",

        // Украинские оскорбления
        "бля", "хуйло", "курва", "гівно", "пізда", "мусор", "хамло", "тупий",
        "виродок", "срака", "падлюка", "свиня", "чорт", "дідько", "перець",
        "халява", "шльондра", "москаль", "кацап", "свидомый",

        // Расистские термины
        "чурка", "хач", "жид", "нигер", "расист", "фашист", "нацист",
        "белый мусор", "чёрный", "yellowface", "spic", "wetback", "kike", "gook",
        "chink", "raghead", "coon", "porchmonkey", "beaner", "towelhead",

        // Сексуальные термины
        "секс", "порно", "голый", "нагота", "мастурбация", "проститутка",
        "изнасилование", "педофил", "вуайерист", "инцест", "зоофил", "садо",
        "мазо", "оргия", "эрекция", "сперма", "вагина", "член", "соси", "трахни",
        "ебать", "кончил", "оргазм",

        // Термины насилия
        "убийца", "убивать", "резать", "стрелять", "террорист", "бомба",
        "самоубийство", "пытка", "избиение", "кровь", "расчленить", "захват",
        "заложник", "маньяк", "покушение",

        // Современный сленг и интернет-термины
        "simp", "incel", "thot", "karen", "neckbeard", "cuck", "soyboy", "cuntface",
        "dickhead", "asshat", "buttface", "cocknose", "douchecanoe", "fuckwit",
        "shitbag", "twatwaffle",

        // Альтернативные написания и символы
        "f4ck", "b1tch", "n1gg3r", "5uk4", "bl9d", "xyй", "h\\/\\i", "p!zda",
        "bl**t", "mud@k", "d0lbaeb", "pi3or", "govn0", "3жopa", "cyka", "blyat",
        "6лядь", "xуесос", "ъуъ", "и$пать", "ёб@ный", "п@дон", "чм0", "г0вно",

        // Запрещенные исторические термины
        "фашист", "наци", "свастика", "1488", "88", "14words", "aryan", "supremacy",
        "white-power", "kkk", "nsdap", "reich", "holocaust", "nazi", "gas-chamber",

        // Гендерные оскорбления
        "трансгендер", "гомик", "лесбиянка", "педик", "гей", "феменистка", "содомит",
        "гермафродит", "андрогин", "квир", "nonbinary", "tranny", "shemale", "faggot",
        "dyke", "homo",

        // Религиозные оскорбления
        "еретик", "сатана", "дьявол", "ислам", "жид", "мусульманин", "иудей",
        "язычник", "безбожник", "коран", "библия", "аллах", "богомол", "секта",

        // Дискриминация по возрасту
        "старый", "дряхлый", "старуха", "младенец", "подросток", "пенсионер",
        "динозавр", "малолетка", "недоросль",

        // Дискриминация по здоровью
        "инвалид", "даун", "аутист", "дебил", "калека", "псих", "шизофреник",
        "олигофрен", "эпилептик", "алкаш", "наркоман", "идиот",

        // Дополнительные фильтры
        "scat", "coprophilia", "necrophilia", "zoophilia", "pedo", "lolita",
        "underage", "childporn", "cp", "loli", "shota", "drugs", "meth", "heroin",
        "cocaine", "weed", "lsd", "overdose", "suicide", "kill"
    ];

    // Допустимые домены для email
    private readonly string[] EmailDomains = ["mail.ru", "xmail.ru", "gmail.com", "vk.com", "yandex.ru", "icloud.com"];

    // Валидация имени пользователя
    public async Task<UpdatedResponse> ValidateUsername(string username, Guid userId)
    {
        if (string.IsNullOrEmpty(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя не может быть пустым" };

        if (username.Length is < 3 or > 20)
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя должно быть от 3 до 20 символов" };

        if (UnderscoreInStartRegex().IsMatch(username) || UnderscoreInEndRegex().IsMatch(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя не может начинаться или заканчиваться на подчёркивание" };

        if (!UsernameRegex().IsMatch(username))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя может содержать только латинские буквы, цифры и одно подчёркивание" };

        if (username.Count(c => c is '_') > 1)
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя может содержать только одно подчёркивание" };

        if (ForbiddenWords.Any(word => username.Contains(word, StringComparison.CurrentCultureIgnoreCase)))
            return new UpdatedResponse { Succeed = false, Message = "Имя пользователя содержит запрещённое слово" };

        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.Username == username && u.Id != userId);

        return existingUser is not null
            ? new UpdatedResponse { Succeed = false, Message = "Имя пользователя уже занято" }
            : new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация пароля
    public UpdatedResponse ValidatePassword(User user)
    {
        if (!string.IsNullOrEmpty(user.ExternalLoginId))
            return new UpdatedResponse { Succeed = true, Message = "Успех" };

        if (string.IsNullOrEmpty(user.PasswordHash))
            return new UpdatedResponse { Succeed = false, Message = "Пароль не может быть пустым, если аккаунт не зарегистирован через OAuth2" };

        return !PasswordRegex().IsMatch(user.PasswordHash)
            ? new UpdatedResponse { Succeed = false, Message = "Пароль должен содержать минимум 8 символов, одну заглавную букву, одну строчную букву и одну цифру" }
            : new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация email
    public UpdatedResponse ValidateEmail(string email)
    {
        if (string.IsNullOrEmpty(email))
            return new UpdatedResponse { Succeed = true, Message = "Email пуст" };

        if (!EmailRegex().IsMatch(email))
            return new UpdatedResponse { Succeed = false, Message = "Некорректный формат email" };

        var emailParts = email.Split("@");
        if (emailParts.Length != 2 || !EmailDomains.Contains(emailParts[1]))
            return new UpdatedResponse { Succeed = false, Message = "Недопустимый домен email" };

        return new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Валидация URL
    public UpdatedResponse ValidateUrl(string url)
    {
        if (string.IsNullOrEmpty(url))
            return new UpdatedResponse { Succeed = false, Message = "URL не может быть пустым" };

        return !UrlRegex().IsMatch(url)
            ? new UpdatedResponse { Succeed = false, Message = "Некорректный формат URL" }
            : new UpdatedResponse { Succeed = true, Message = "Успех" };
    }

    // Генерация регулярных выражений
    [GeneratedRegex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")]
    private partial Regex PasswordRegex();

    [GeneratedRegex(@"^(?!_)[a-zA-Z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)?(?<!_)$")]
    private partial Regex UsernameRegex();

    [GeneratedRegex(@"^_")]
    private static partial Regex UnderscoreInStartRegex();

    [GeneratedRegex(@"_$")]
    private static partial Regex UnderscoreInEndRegex();

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-@]*)*\/?$")]
    private static partial Regex UrlRegex();
}