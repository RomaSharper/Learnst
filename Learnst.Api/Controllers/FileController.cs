using Learnst.Api.Models;
using Learnst.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class FileController(IOptions<SftpSettings> settings) : ControllerBase
{
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Upload([FromForm] UploadFileModel model)
    {
        try
        {
            var path = await FileService.Upload(model, settings.Value);
            return Ok(new
            {
                fileUrl = $@"\{path}",
                message = "Файл добавлен успешно"
            });
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
    public async Task<IActionResult> Delete([FromQuery] string path)
    {
        try
        {
            FileService.Delete(path, settings.Value);
            await LogService.WriteLine($"Файл \"{path}\" удалён.");
            return Ok(new
            {
                message = "Файл удален успешно"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = ex.Message,
                message = "Не удалось удалить файл"
            });
        }
    }
}
