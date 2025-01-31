using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class RoleToStringConverter()
    : ValueConverter<Role, string>(v => v.ToString(), v => Enum.Parse<Role>(v));
