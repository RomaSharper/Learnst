namespace Learnst.Infrastructure.Interfaces;

public interface IDeletableEntity<out TKey> : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    public bool IsDeleted { get; set; }
    
    public DateTime? DeletedAt { get; set; }
    
    public void Delete() => (IsDeleted, DeletedAt) = (true, DateTime.UtcNow);
    
    public void Restore() => (IsDeleted, DeletedAt) = (false, null);
}
