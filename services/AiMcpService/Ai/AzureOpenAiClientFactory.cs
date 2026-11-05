using Azure.AI.OpenAI;
using Azure.Identity;
using System.ClientModel;

namespace AiMcpService.Ai;

public sealed class AzureOpenAiClientFactory(IConfiguration configuration)
{
    private readonly string? _apiKey = configuration["AZURE_OPENAI_API_KEY"];

    public AzureOpenAIClient Create(Uri endpoint) =>
        string.IsNullOrWhiteSpace(_apiKey)
            ? new AzureOpenAIClient(endpoint, new DefaultAzureCredential())
            : new AzureOpenAIClient(endpoint, new ApiKeyCredential(_apiKey));
}
