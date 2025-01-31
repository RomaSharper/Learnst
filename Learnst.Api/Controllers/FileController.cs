using Microsoft.AspNetCore.Mvc;
using Renci.SshNet;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    private const int _sftpPort = 22;
    private const string _baseDir = @"\wwwroot";
    private const string _sftpUsername = "site15763";
    private const string _sftpPassword = "4a_KB%9d5Zq!";
    private const string _sftpHost = "site15763.siteasp.net";

    public class UploadFileModel
    {
        public IFormFile? File { get; set; }
    }

    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Upload file to FTP Server",
        Description = "Uploads file and returns response",
        OperationId = "Upload",
        Tags = ["FTP"]
    )]
    public async Task<IActionResult> Upload([FromForm] UploadFileModel model)
    {
        if (model.File is null || model.File.Length is 0)
            return BadRequest(new { message = "No file uploaded" });

        using MemoryStream memoryStream = new();
        await model.File.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();

        var path = Path.Combine(GetPathFromContentType(model.File.ContentType), $"{DateTimeOffset.Now.ToUnixTimeSeconds()}_{model.File.FileName}");
        var fullPath = Path.Combine(_baseDir, path);
        using SftpClient sftp = new(_sftpHost, _sftpPort, _sftpUsername, _sftpPassword);
        try
        {
            sftp.Connect();
            using MemoryStream fileStream = new(fileBytes);
            sftp.UploadFile(fileStream, fullPath);
            sftp.Disconnect();
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "File upload failed", error = ex.Message });
        }
        return Ok(new { message = "File uploaded successfully", fileUrl = $@"\{path}" });
    }


    [HttpDelete]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete file from FTP Server",
        Description = "Deletes file and returns response",
        OperationId = "Delete",
        Tags = ["FTP"]
    )]
    public IActionResult Delete([FromQuery] string path)
    {
        using SftpClient sftp = new(_sftpHost, _sftpPort, _sftpUsername, _sftpPassword);
        path = path.Replace(@"\\", @"\");

        try
        {
            sftp.Connect();
            if (!sftp.Exists(path))
                return NotFound(new { message = $"File not found: {path}" });

            sftp.DeleteFile(path);
            return Ok(new { message = "File deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "File deletion failed", error = ex.Message });
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
