using Learnst.Infrastructure;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Learnst.Api.Services;

public class CertificateService(ApplicationDbContext context) : ICertificateService
{
    public async Task<bool> ValidateUserCompletionAsync(Guid userId, Guid activityId)
    {
        // Проверяем, прошёл ли пользователь все уроки
        var allLessons = await context.Lessons
            .Where(l => l.Topic!.ActivityId == activityId)
            .ToListAsync();

        var userLessons = await context.UserLessons
            .Where(ul => ul.UserId == userId && allLessons.Select(l => l.Id).Contains(ul.LessonId))
            .ToListAsync();

        if (userLessons.Count != allLessons.Count)
            return false;

        // Проверяем, набрал ли пользователь минимальное количество баллов
        var activity = await context.Activities
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity is null)
            return false;

        var userPoints = await context.UserAnswers
            .Include(ua => ua.Answer)
                .ThenInclude(a => a!.Question)
                    .ThenInclude(q => q!.Lesson)
                        .ThenInclude(l => l!.Topic)
            .Where(ua => ua.UserId == userId && ua.Answer!.Question!.Lesson!.Topic!.ActivityId == activityId && ua.Answer!.IsCorrect)
            .CountAsync();

        if (activity.MinimalScore > 0 && userPoints < activity.MinimalScore)
            return false;

        return true;
    }

    public async Task<byte[]> GenerateCertificateAsync(User user, Activity activity)
    {
        using PdfDocument pdfDoc = new();
        var page = pdfDoc.AddPage();
        using var gfx = XGraphics.FromPdfPage(page);

        // Установка цветного фона
        var gradientBrush = new XLinearGradientBrush(
            new XPoint(0, 0),
            new XPoint(page.Width.Point, page.Height.Point),
            XColors.LightSkyBlue,
            XColors.LightGreen
        );
        gfx.DrawRectangle(gradientBrush, new XRect(0, 0, page.Width.Point, page.Height.Point));

        // Загрузка иконки по URL
        var logoUrl = "http://learnst.runasp.net/favicon.png";
        using HttpClient httpClient = new();
        try
        {
            var logoBytes = await httpClient.GetByteArrayAsync(logoUrl);
            using MemoryStream logoStream = new(logoBytes);
            var logo = XImage.FromStream(logoStream);

            // Размещение иконки с оригинальным размером 96x96
            gfx.DrawImage(logo, new XRect(50, 50, 96, 96)); // Позиция (50, 50), размер 96x96
        }
        catch (Exception ex)
        {
            // Обработка ошибок загрузки иконки
            Console.WriteLine($"Ошибка загрузки иконки: {ex.Message}");
        }

        // Шрифты
        XFont titleFont = new("Arial", 28, XFontStyleEx.Bold);
        XFont headerFont = new("Arial", 20, XFontStyleEx.Bold);
        XFont bodyFont = new("Arial", 14, XFontStyleEx.Regular);
        XFont smallFont = new("Arial", 12, XFontStyleEx.Italic);

        // Заголовок сертификата
        gfx.DrawString("Learnst", titleFont, XBrushes.DarkBlue, new XPoint(50, 160)); // Сдвинуто ниже иконки

        // Название курса на новой строке
        var courseTitle = $"Сертификат о прохождении курса:";
        var courseName = activity.Title;
        gfx.DrawString(courseTitle, headerFont, XBrushes.Black, new XPoint(50, 210));
        gfx.DrawString(courseName, headerFont, XBrushes.DarkBlue, new XPoint(50, 240));

        // Информация о пользователе
        gfx.DrawString($"Выдан: {user.FullName}", bodyFont, XBrushes.Black, new XPoint(50, 290));
        gfx.DrawString($"Дата выдачи: {DateTime.UtcNow:dd.MM.yyyy}", bodyFont, XBrushes.Black, new XPoint(50, 320));

        // Поздравление
        gfx.DrawString("Поздравляем с успешным завершением курса!", headerFont, XBrushes.DarkGreen, new XPoint(50, 460));

        // Подпись
        gfx.DrawString("Подпись: ___________________", smallFont, XBrushes.Black, new XPoint(50, 510));

        // Декоративная рамка
        var borderPen = new XPen(XColors.DarkBlue, 2);
        gfx.DrawRectangle(borderPen, new XRect(40, 40, page.Width.Point - 80, page.Height.Point - 80));

        // Водяной знак
        XFont watermarkFont = new("Arial", 48, XFontStyleEx.BoldItalic);
        XSolidBrush watermarkBrush = new(XColor.FromArgb(50, XColors.Gray));
        XStringFormat watermarkFormat = new()
        {
            Alignment = XStringAlignment.Center,
            LineAlignment = XLineAlignment.Center
        };
        gfx.DrawString("Learnst", watermarkFont, watermarkBrush, new XRect(0, 0, page.Width.Point, page.Height.Point), watermarkFormat);

        using MemoryStream stream = new();
        pdfDoc.Save(stream);
        return stream.ToArray();
    }
}