using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Learnst.Infrastructure.Comparers;

public class StringCollectionComparer()
    : ValueComparer<ICollection<string>>(
        (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
        c => c.ToList());
