namespace Learnst.Api.Services;

public static class LogService
{
    public static async Task Write(string s)
    {
        await File.AppendAllTextAsync("events.log", s);
    }

    public static async Task WriteLine(string s)
    {
        await File.AppendAllTextAsync("events.log", $"""
        {s}

        """);
    }
}
