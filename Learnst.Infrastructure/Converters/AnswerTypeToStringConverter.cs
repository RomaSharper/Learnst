using Learnst.Infrastructure.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Infrastructure.Converters;

public class AnswerTypeToStringConverter()
    : ValueConverter<AnswerType, string>(v => v.ToString(), v => Enum.Parse<AnswerType>(v));
