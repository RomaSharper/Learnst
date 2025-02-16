namespace Learnst.Infrastructure.Interfaces;

public interface IBaseEntity<out TKey> where TKey : IEquatable<TKey>;
