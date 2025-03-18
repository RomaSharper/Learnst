using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class VkUserResponse
{
    [JsonPropertyName("response")]
    public List<VkUserInfo> Response { get; set; } = [];
}
