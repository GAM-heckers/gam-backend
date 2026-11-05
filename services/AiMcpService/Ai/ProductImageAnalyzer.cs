using System.Text.Json;
using OpenAI.Chat;

namespace AiMcpService.Ai;

public interface IProductImageAnalyzer
{
    Task<ProductImageAnalysis> AnalyzeAsync(
        byte[] image,
        string contentType,
        CancellationToken cancellationToken);
}

public sealed record ProductImageAnalysis(
    string? ProductName,
    string? FruitType,
    string? Size,
    decimal? Price,
    decimal? WeightKg,
    int? BoxCount,
    string? ProductDescription,
    string[] VisibleText,
    string[] NeedsConfirmation);

public sealed class AzureOpenAiProductImageAnalyzer : IProductImageAnalyzer
{
    private const string AnalysisPrompt = """
        Analyze this product image for a Korean SmartStore product draft.
        Identify the product name from visible packaging text, the fruit type,
        and the fruit size or grade if it is explicitly shown or can be judged
        reliably from the image. Describe size as a short Korean value such as
        "중과" or "약 2~3 cm"; use null when it cannot be determined reliably.
        Do not guess physical dimensions without a visible scale reference.
        Return only a JSON object with these keys:
        productName, fruitType, size, price, weightKg, boxCount,
        productDescription, visibleText, needsConfirmation.
        Respond with Korean text. Use null for productName, fruitType, size,
        price, weightKg, boxCount, or productDescription when the value cannot
        be determined from the image. Use numbers for price, weightKg, and
        boxCount; convert a clearly shown weight to kilograms. Do not infer
        missing values. visibleText must contain other legible text from the
        image. needsConfirmation must list unclear or ambiguous details.
        Do not treat marketing claims as verified facts.
        """;

    private readonly string? _endpoint;
    private readonly string? _deploymentName;
    private readonly AzureOpenAiClientFactory _clientFactory;

    public AzureOpenAiProductImageAnalyzer(
        IConfiguration configuration,
        AzureOpenAiClientFactory clientFactory)
    {
        _endpoint = configuration["AZURE_OPENAI_ENDPOINT"];
        _deploymentName = configuration["AZURE_OPENAI_DEPLOYMENT"]
            ?? configuration["AZURE_OPENAI_DEPLOYMENT_NAME"];
        _clientFactory = clientFactory;
    }

    public async Task<ProductImageAnalysis> AnalyzeAsync(
        byte[] image,
        string contentType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_endpoint) ||
            string.IsNullOrWhiteSpace(_deploymentName))
        {
            throw new AiProviderNotConfiguredException(
                "AZURE_OPENAI_ENDPOINT와 AZURE_OPENAI_DEPLOYMENT를 설정해야 이미지 분석을 사용할 수 있습니다.");
        }

        if (!Uri.TryCreate(_endpoint, UriKind.Absolute, out var endpoint))
        {
            throw new AiProviderNotConfiguredException(
                "AZURE_OPENAI_ENDPOINT에 유효한 Azure OpenAI endpoint를 설정해야 합니다.");
        }

        var client = _clientFactory.Create(endpoint)
            .GetChatClient(_deploymentName);
        var message = new UserChatMessage(
        [
            ChatMessageContentPart.CreateTextPart(AnalysisPrompt),
            ChatMessageContentPart.CreateImagePart(
                BinaryData.FromBytes(image),
                contentType,
                ChatImageDetailLevel.High),
        ]);
        var completion = await client.CompleteChatAsync(
            [message],
            cancellationToken: cancellationToken);
        var responseText = completion.Content
            .Select(part => part.Text)
            .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text));

        if (responseText is null)
        {
            throw new AiImageAnalysisException(
                "Azure OpenAI returned an empty image analysis response.");
        }

        ProductImageAnalysis? analysis;
        try
        {
            analysis = JsonSerializer.Deserialize<ProductImageAnalysis>(
                responseText,
                new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }
        catch (JsonException exception)
        {
            throw new AiImageAnalysisException(
                "Azure OpenAI returned an invalid image analysis response.",
                exception);
        }

        if (analysis is null)
        {
            throw new AiImageAnalysisException(
                "Azure OpenAI returned an empty image analysis response.");
        }

        return analysis with
        {
            VisibleText = analysis.VisibleText ?? [],
            NeedsConfirmation = analysis.NeedsConfirmation ?? [],
        };
    }
}

public sealed class AiImageAnalysisException(string message, Exception? innerException = null)
    : Exception(message, innerException);
