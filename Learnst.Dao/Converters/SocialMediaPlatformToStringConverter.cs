using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class SocialMediaPlatformToStringConverter()
    : ValueConverter<SocialMediaPlatform, string>(v => v.ToString(), v => Enum.Parse<SocialMediaPlatform>(v));
