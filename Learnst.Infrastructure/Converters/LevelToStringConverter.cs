using Learnst.Infrastructure.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Infrastructure.Converters;

public class LevelToStringConverter()
    : ValueConverter<Level, string>(v => v.ToString(), v => Enum.Parse<Level>(v));
