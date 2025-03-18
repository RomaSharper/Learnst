using Learnst.Infrastructure.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Infrastructure.Converters;

public class SocialMediaPlatformToStringConverter()
    : ValueConverter<SocialMediaPlatform, string>(v => v.ToString(), v => Enum.Parse<SocialMediaPlatform>(v));
