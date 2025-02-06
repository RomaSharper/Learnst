using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class SocialMediaProfilesController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/SocialMediaProfiles
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SocialMediaProfile>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all social media profiles",
        Description = "Returns a list of all social media profiles",
        OperationId = "GetSocialMediaProfiles",
        Tags = ["SocialMediaProfiles"]
    )]
    public async Task<ActionResult<IEnumerable<SocialMediaProfile>>> GetSocialMediaProfiles()
    {
        return await context.SocialMediaProfiles
            .Include(s => s.User)
            .ToListAsync();
    }

    // GET: api/SocialMediaProfiles/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(SocialMediaProfile))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a social media profile by ID",
        Description = "Returns a single social media profile by its ID",
        OperationId = "GetSocialMediaProfile",
        Tags = ["SocialMediaProfiles"]
    )]
    public async Task<ActionResult<SocialMediaProfile>> GetSocialMediaProfile(int id)
    {
        var socialMediaProfile = await context.SocialMediaProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (socialMediaProfile is null)
            return NotFound();

        return socialMediaProfile;
    }

    // POST: api/SocialMediaProfiles
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(SocialMediaProfile))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new social media profile",
        Description = "Creates a new social media profile",
        OperationId = "PostSocialMediaProfile",
        Tags = ["SocialMediaProfiles"]
    )]
    public async Task<ActionResult<SocialMediaProfile>> PostSocialMediaProfile(SocialMediaProfile socialMediaProfile)
    {
        var id = socialMediaProfile.Id;
        if (await SocialMediaProfileExists(id))
            return BadRequest($"Социальный профиль с ID \"{id}\" уже существует.");

        context.SocialMediaProfiles.Add(socialMediaProfile);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSocialMediaProfile), new { id = socialMediaProfile.Id }, socialMediaProfile);
    }

    // PUT: api/SocialMediaProfiles/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a social media profile",
        Description = "Updates an existing social media profile",
        OperationId = "PutSocialMediaProfile",
        Tags = ["SocialMediaProfiles"]
    )]
    public async Task<IActionResult> PutSocialMediaProfile(int id, SocialMediaProfile socialMediaProfile)
    {
        if (id != socialMediaProfile.Id)
            return BadRequest();

        context.Entry(socialMediaProfile).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await SocialMediaProfileExists(id))
                return NotFound();
            throw;
        }

        return Ok(socialMediaProfile);
    }

    // DELETE: api/SocialMediaProfiles/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a social media profile",
        Description = "Deletes a social media profile by its ID",
        OperationId = "DeleteSocialMediaProfile",
        Tags = ["SocialMediaProfiles"]
    )]
    public async Task<IActionResult> DeleteSocialMediaProfile(int id)
    {
        var socialMediaProfile = await context.SocialMediaProfiles.FindAsync(id);
        if (socialMediaProfile is null)
            return NotFound();

        context.SocialMediaProfiles.Remove(socialMediaProfile);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> SocialMediaProfileExists(int id) => await context.SocialMediaProfiles.AnyAsync(e => e.Id == id);
}
