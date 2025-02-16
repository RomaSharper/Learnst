using System.ComponentModel.DataAnnotations;

namespace Learnst.Infrastructure.Interfaces;

public interface IEntity : IEntity<Guid>;
    
public interface IEntity<TKey> : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    [Key] public TKey Id { get; set; }
}
