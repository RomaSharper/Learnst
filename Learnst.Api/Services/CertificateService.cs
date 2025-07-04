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

    public byte[] GenerateCertificate(User user, Activity activity)
    {
        using PdfDocument pdfDoc = new();
        var page = pdfDoc.AddPage();
        using var gfx = XGraphics.FromPdfPage(page);

        // Установка фона
        var bgColor = XColor.FromArgb(255, 10, 16, 26);
        gfx.DrawRectangle(new XSolidBrush(bgColor), new XRect(0, 0, page.Width.Point, page.Height.Point));

        // Шрифты и цвета
        XFont titleFont = new("Courier New", 28, XFontStyleEx.Bold);
        XFont headerFont = new("Courier New", 18, XFontStyleEx.Bold);
        XFont bodyFont = new("Courier New", 14, XFontStyleEx.Regular);
        XFont codeFont = new("Courier New", 18, XFontStyleEx.Bold);

        var mainColor = XColor.FromArgb(255, 138, 190, 183);
        var accentColor = XColor.FromArgb(255, 58, 107, 136);

        // Основная рамка документа
        var borderPen = new XPen(accentColor, 2);
        gfx.DrawRectangle(borderPen, new XRect(40, 40, page.Width.Point - 80, page.Height.Point - 80));

        // Заголовок
        gfx.DrawString("> CERTIFICATE_OSv1.4", headerFont, new XSolidBrush(accentColor), 60, 80);
        gfx.DrawString("Learnst Terminal", titleFont, new XSolidBrush(mainColor), 60, 120);

        // Блок информации о пользователе
        DrawTerminalBox(gfx, new XRect(60, 160, 480, 160), "User Data", accentColor);
        gfx.DrawString($"USER: {user.FullName}", bodyFont, new XSolidBrush(mainColor), 80, 200);
        gfx.DrawString($"ISSUED: {DateTime.UtcNow:yyyy-MM-dd}", bodyFont, new XSolidBrush(mainColor), 80, 230);
        gfx.DrawString($"COURSE: {activity.Title}", bodyFont, new XSolidBrush(mainColor), 80, 260);

        // Блок с кодом подтверждения
        var code = Guid.NewGuid().ToString()[..8].ToUpper();
        DrawTerminalBox(gfx, new XRect(60, 340, 480, 80), "Hash Code", accentColor);
        gfx.DrawString(code, codeFont, new XSolidBrush(mainColor),
            new XRect(60, 340, 480, 80), XStringFormats.Center);

        using MemoryStream stream = new();
        pdfDoc.Save(stream);
        return stream.ToArray();
    }

    private static void DrawTerminalBox(XGraphics gfx, XRect rect, string title, XColor accentColor)
    {
        var boxPen = new XPen(accentColor, 1.5);
        gfx.DrawRectangle(boxPen, rect);

        // Заголовок блока
        var titleFont = new XFont("Courier New", 12, XFontStyleEx.Bold);
        gfx.DrawString($">> {title}", titleFont, new XSolidBrush(accentColor),
            new XPoint(rect.X + 15, rect.Y + 20));
    }
}