using AiMcpService.Ai;
using AiMcpService.Tools;
using Azure;
using ModelContextProtocol.AspNetCore;
using ModelContextProtocol.Server;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);
const long maxImageSizeBytes = 10 * 1024 * 1024;
var frontendOrigins = (builder.Configuration["FRONTEND_ORIGINS"]
        ?? "http://localhost:5500;http://127.0.0.1:5500")
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddServiceDiscovery();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(frontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxImageSizeBytes;
});
builder.Services.AddHttpClient<SmartStoreApiClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["SMARTSTORE_API_URL"] ?? "http://localhost:3000");
}).AddServiceDiscovery();

builder.Services.AddTransient<SmartStoreTools>();
builder.Services.AddSingleton<AzureOpenAiClientFactory>();
builder.Services.AddTransient<IAiAssistant, AgentFrameworkAssistant>();
builder.Services.AddTransient<IProductImageAnalyzer, AzureOpenAiProductImageAnalyzer>();
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<SmartStoreTools>();

var app = builder.Build();

app.UseCors("Frontend");
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapMcp();
if (app.Environment.IsDevelopment())
{
    app.MapPost(
        "/api/agent/product-image/analyze-sample",
        async (
            IProductImageAnalyzer analyzer,
            CancellationToken cancellationToken) =>
        {
            var sampleImagePath = Path.Combine(AppContext.BaseDirectory, "image.png");
            if (!File.Exists(sampleImagePath))
            {
                return Results.Problem(
                    title: "샘플 이미지를 찾을 수 없습니다.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var image = await File.ReadAllBytesAsync(
                sampleImagePath,
                cancellationToken);
            return await AnalyzeImageAsync(
                image,
                "image/png",
                analyzer,
                cancellationToken);
        });
}

app.MapPost(
    "/api/agent/product-image/analyze",
    async (
        HttpRequest request,
        IProductImageAnalyzer analyzer,
        CancellationToken cancellationToken) =>
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new
            {
                message = "multipart/form-data 요청에 image 파일을 포함해야 합니다.",
            });
        }

        var form = await request.ReadFormAsync(cancellationToken);
        var image = form.Files.GetFile("image");

        if (image is null || image.Length == 0)
        {
            return Results.BadRequest(new
            {
                message = "image 파일을 선택해야 합니다.",
            });
        }

        if (image.Length > maxImageSizeBytes)
        {
            return Results.StatusCode(StatusCodes.Status413PayloadTooLarge);
        }

        var allowedContentTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp",
        };
        if (!allowedContentTypes.Contains(
                image.ContentType,
                StringComparer.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new
            {
                message = "JPEG, PNG 또는 WebP 이미지 파일만 지원합니다.",
            });
        }

        await using var stream = image.OpenReadStream();
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, cancellationToken);

        return await AnalyzeImageAsync(
            buffer.ToArray(),
            image.ContentType,
            analyzer,
            cancellationToken);
    })
    .WithRequestSizeLimit(maxImageSizeBytes + 64 * 1024);
app.MapPost(
    "/api/agent/chat",
    async (AgentChatRequest request, IAiAssistant assistant, CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 4000)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["message"] = ["message는 1자 이상 4000자 이하의 문자열이어야 합니다."],
            });
        }

        try
        {
            var response = await assistant.ChatAsync(request.Message, cancellationToken);
            return Results.Ok(response);
        }
        catch (AiProviderNotConfiguredException exception)
        {
            return Results.Problem(
                title: "AI 서비스가 설정되지 않았습니다.",
                detail: exception.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    });

app.Run();

public sealed record AgentChatRequest(string Message);

static async Task<IResult> AnalyzeImageAsync(
    byte[] image,
    string contentType,
    IProductImageAnalyzer analyzer,
    CancellationToken cancellationToken)
{
    try
    {
        var analysis = await analyzer.AnalyzeAsync(
            image,
            contentType,
            cancellationToken);
        return Results.Ok(new
        {
            analysis,
            provider = "azure-openai",
            reviewRequired = true,
        });
    }
    catch (AiProviderNotConfiguredException exception)
    {
        return Results.Problem(
            title: "AI 서비스가 설정되지 않았습니다.",
            detail: exception.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (RequestFailedException)
    {
        return Results.Problem(
            title: "이미지 분석에 실패했습니다.",
            detail: "Azure OpenAI 연결과 배포 모델의 이미지 입력 지원 여부를 확인해 주세요.",
            statusCode: StatusCodes.Status502BadGateway);
    }
    catch (AiImageAnalysisException)
    {
        return Results.Problem(
            title: "이미지 분석 응답을 처리하지 못했습니다.",
            statusCode: StatusCodes.Status502BadGateway);
    }
}
