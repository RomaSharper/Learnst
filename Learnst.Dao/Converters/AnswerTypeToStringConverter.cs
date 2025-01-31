using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Learnst.Dao.Converters;

public class AnswerTypeToStringConverter()
    : ValueConverter<AnswerType, string>(v => v.ToString(), v => Enum.Parse<AnswerType>(v));
