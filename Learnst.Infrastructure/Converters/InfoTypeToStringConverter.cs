using Learnst.Infrastructure.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Infrastructure.Converters;

public class InfoTypeToStringConverter()
    : ValueConverter<InfoType, string>(v => v.ToString(), v => Enum.Parse<InfoType>(v));
