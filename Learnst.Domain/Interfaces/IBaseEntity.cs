namespace Learnst.Domain.Interfaces;

public interface IBaseEntity<out TKey> where TKey : IEquatable<TKey>;
