using Learnst.Infrastructure.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace Learnst.Infrastructure.Models;

public class Theme : IEntity<string>
{
    [Key, StringLength(100)] public string Id { get; set; } = string.Empty;
    public bool Premium { get; set; }
}
