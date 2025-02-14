using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Models;

public class Education : IEntity<int>
{
    [Key] public int Id { get; set; }

    [Required, StringLength(200, MinimumLength = 3)] public string InstitutionName { get; set; } = string.Empty;

    [Required, StringLength(200, MinimumLength = 3)] public string Degree { get; set; } = string.Empty;

    [Required] public int GraduationYear { get; set; }

    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }
}