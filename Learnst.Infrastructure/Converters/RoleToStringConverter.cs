using Learnst.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Infrastructure.Converters;

public class RoleToStringConverter()
    : ValueConverter<Role, string>(v => v.ToString(), v => Enum.Parse<Role>(v));
