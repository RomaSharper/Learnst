using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class LevelToStringConverter()
    : ValueConverter<Level, string>(v => v.ToString(), v => Enum.Parse<Level>(v));
