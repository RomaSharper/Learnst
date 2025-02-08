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

    public static string Upload(
        byte[] fileData,
        string contentType,
        string fileName,
        SftpSettings settings)
    {
        if (fileData is null || fileData.Length == 0)
            throw new Exception("Файл не обнаружен");

        var path = Path.Combine(
            GetPathFromContentType(contentType), 
            $"{DateTimeOffset.Now.ToUnixTimeSeconds()}_{fileName}"
        );
        
        var fullPath = Path.Combine(@"\wwwroot", path);
        
        using SftpClient sftp = new(settings.Host, settings.Port, settings.Username, settings.Password);
        try
        {
            sftp.Connect();
            using MemoryStream stream = new(fileData);
            sftp.UploadFile(stream, fullPath);
            return path;
        }
        finally
        {
            sftp.Disconnect();
        }
    }

    public static void Delete(string path, SftpSettings settings)
    {
        using SftpClient sftp = new(settings.Host, settings.Port, settings.Username, settings.Password);
        path = path.Replace(@"\\", @"\");
        try
        {
            sftp.Connect();
            if (!sftp.Exists(path))
                throw new Exception($"Файл не найден по пути \"{path}\"");
            sftp.DeleteFile(path);
        }
        finally
        {
            sftp.Disconnect();
        }
    }

    private static string GetPathFromContentType(string contentType) => contentType switch
    {
        "image/jpeg" or "image/png" => "images",
        "video/mp4" => "videos",
        _ => "docs"
    };
}
