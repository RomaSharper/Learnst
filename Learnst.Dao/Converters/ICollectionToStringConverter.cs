using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class ICollectionToStringConverter()
    : ValueConverter<ICollection<string>, string>(
        v => string.Join(';', v),
        v => v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList());
