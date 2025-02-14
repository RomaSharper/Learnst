using System.ComponentModel.DataAnnotations;

namespace Learnst.Domain.Interfaces;

public interface IEntity : IEntity<Guid>;
    
public interface IEntity<TKey> : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    [Key] public TKey Id { get; set; }
}
