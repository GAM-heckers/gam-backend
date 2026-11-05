using AiMcpService.Tools;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AiMcpService.Ai;

public sealed class AgentFrameworkAssistant : IAiAssistant
{
    private readonly string? _endpoint;
    private readonly string? _deploymentName;
    private readonly SmartStoreTools _smartStoreTools;
    private readonly AzureOpenAiClientFactory _clientFactory;
    private readonly Lazy<AIAgent> _agent;

    public AgentFrameworkAssistant(
        IConfiguration configuration,
        SmartStoreTools smartStoreTools,
        AzureOpenAiClientFactory clientFactory)
    {
        _endpoint = configuration["AZURE_OPENAI_ENDPOINT"];
        _deploymentName = configuration["AZURE_OPENAI_DEPLOYMENT"]
            ?? configuration["AZURE_OPENAI_DEPLOYMENT_NAME"];
        _smartStoreTools = smartStoreTools;
        _clientFactory = clientFactory;
        _agent = new Lazy<AIAgent>(CreateAgent);
    }

    public async Task<AiChatResponse> ChatAsync(
        string message,
        CancellationToken cancellationToken)
    {
        EnsureConfiguration();
        var response = await _agent.Value.RunAsync(
            message,
            cancellationToken: cancellationToken);

        return new AiChatResponse(response.Text, "azure-openai");
    }

    private AIAgent CreateAgent()
    {
        EnsureConfiguration();
        var endpoint = CreateAzureOpenAiEndpoint(_endpoint)
            ?? throw new AiProviderNotConfiguredException(
                "AZURE_OPENAI_ENDPOINT에 유효한 Azure OpenAI endpoint를 설정해야 합니다.");
        var tool = AIFunctionFactory.Create(
            _smartStoreTools.GetRegistrationSampleAsync);

        return _clientFactory.Create(endpoint)
            .GetChatClient(_deploymentName!)
            .AsIChatClient()
            .AsAIAgent(
                instructions:
                    "청도 스마트스토어 상품 등록 보조 에이전트입니다. 상품 등록 폼이나 입력 데이터에 대한 질문에는 get_smartstore_registration_sample 도구를 사용하고, 응답 데이터가 목업임을 분명히 안내하세요. 네이버에 상품을 등록하거나 변경했다고 주장하지 마세요.",
                name: "SmartStoreAssistant",
                tools: [tool]);
    }

    private static Uri? CreateAzureOpenAiEndpoint(string? endpoint)
    {
        if (string.IsNullOrWhiteSpace(endpoint) ||
            !Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri))
        {
            return null;
        }

        if (endpointUri.AbsolutePath.TrimEnd('/').EndsWith(
                "/openai/v1",
                StringComparison.OrdinalIgnoreCase))
        {
            return endpointUri;
        }

        return new UriBuilder(endpointUri)
        {
            Path = $"{endpointUri.AbsolutePath.TrimEnd('/')}/openai/v1/",
        }.Uri;
    }

    private void EnsureConfiguration()
    {
        if (string.IsNullOrWhiteSpace(_endpoint) ||
            string.IsNullOrWhiteSpace(_deploymentName))
        {
            throw new AiProviderNotConfiguredException(
                "AZURE_OPENAI_ENDPOINT와 AZURE_OPENAI_DEPLOYMENT를 설정해야 AI 채팅을 사용할 수 있습니다.");
        }
    }
}
