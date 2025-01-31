using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class InfoTypeToStringConverter()
    : ValueConverter<InfoType, string>(v => v.ToString(), v => Enum.Parse<InfoType>(v));
