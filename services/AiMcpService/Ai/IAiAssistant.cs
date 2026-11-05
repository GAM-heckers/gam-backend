namespace AiMcpService.Ai;

public interface IAiAssistant
{
    Task<AiChatResponse> ChatAsync(
        string message,
        CancellationToken cancellationToken);
}

public sealed record AiChatResponse(string Text, string Provider);

public sealed class AiProviderNotConfiguredException(string message)
    : Exception(message);
