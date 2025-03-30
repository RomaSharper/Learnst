using Learnst.Api.Models;
using Renci.SshNet;

namespace Learnst.Api.Services;

public static class FileService
{
    public static async Task<string> Upload(UploadFileModel model, SftpSettings settings)
    {
        if (model.File is null || model.File.Length is 0)
            throw new Exception("Файл не обнаружен");

        using MemoryStream memoryStream = new();
        await model.File.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var path = Path.Combine(GetPathFromContentType(model.File.ContentType), $"{DateTimeOffset.Now.ToUnixTimeSeconds()}_{model.File.FileName}");
        var fullPath = Path.Combine(@"\wwwroot", path);
        using SftpClient sftp = new(settings.Host, settings.Port, settings.Username, settings.Password);

        try
        {
            sftp.Connect();
            using MemoryStream fileStream = new(fileBytes);
            sftp.UploadFile(fileStream, fullPath);
            sftp.Disconnect();
        }
        finally
        {
            sftp.Disconnect();
        }

        return path;
    }

    public static void Delete(string path, SftpSettings settings)
    {
        using SftpClient sftp = new(settings.Host, settings.Port, settings.Username, settings.Password);
        path = path.Replace("%5C", @"\").Replace(@"\\", @"\");
        try
        {
            sftp.Connect();
            if (sftp.Exists(path)) sftp.DeleteFile(path);
        }
        finally
        {
            sftp.Disconnect();
        }
    }

    private static string GetPathFromContentType(string contentType) => contentType switch
    {
        "image/jpeg" or "image/jpg" or "image/png" or "image/gif" or "image/webp" or "image/tiff" => "images",
        "video/mp4" or "video/webm" or "video/avi" => "videos",
        _ => "docs"
    };
}
