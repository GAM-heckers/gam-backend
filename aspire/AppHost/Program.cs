var builder = DistributedApplication.CreateBuilder(args);

var backend = builder
    .AddExecutable("express-api", "npm", "../../backend", "run", "dev")
    .WithHttpEndpoint(port: 3000, targetPort: 3000, name: "http")
    .WithEnvironment("PORT", "3000");

var aiService = builder
    .AddProject<Projects.AiMcpService>("ai-mcp")
    .WithReference(backend)
    .WaitFor(backend)
    .WithEnvironment(
        "FRONTEND_ORIGINS",
        builder.Configuration["FRONTEND_ORIGINS"]
            ?? "http://localhost:5500;http://127.0.0.1:5500");

var azureOpenAiEndpoint = builder.Configuration["AZURE_OPENAI_ENDPOINT"];
if (!string.IsNullOrWhiteSpace(azureOpenAiEndpoint))
{
    aiService = aiService.WithEnvironment(
        "AZURE_OPENAI_ENDPOINT",
        azureOpenAiEndpoint);
}

var azureOpenAiDeployment = builder.Configuration["AZURE_OPENAI_DEPLOYMENT"]
    ?? builder.Configuration["AZURE_OPENAI_DEPLOYMENT_NAME"];
if (!string.IsNullOrWhiteSpace(azureOpenAiDeployment))
{
    aiService = aiService.WithEnvironment(
        "AZURE_OPENAI_DEPLOYMENT",
        azureOpenAiDeployment);
}

var azureOpenAiApiKey = builder.Configuration["AZURE_OPENAI_API_KEY"];
if (!string.IsNullOrWhiteSpace(azureOpenAiApiKey))
{
    aiService = aiService.WithEnvironment(
        "AZURE_OPENAI_API_KEY",
        azureOpenAiApiKey);
}

builder.Build().Run();
