using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Renci.SshNet;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class FileController(IOptions<SftpSettings> settings) : ControllerBase
{
    private const string _baseDir = @"\wwwroot";

    private readonly string _sftpHost = settings.Value.Host;
    private readonly int _sftpPort = settings.Value.Port;
    private readonly string _sftpUsername = settings.Value.Username;
    private readonly string _sftpPassword = settings.Value.Password;

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
        try
        {
            var path = await FileService.Upload(model, settings.Value);
            return Ok(new { message = "Файл добавлен успешно", fileUrl = $@"\{path}" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
        try
        {
            FileService.Delete(path, settings.Value);
            return Ok(new { message=  "Файл удален успешно" });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Не удалось удалить файл", error = ex.Message });
        }
    }
}
