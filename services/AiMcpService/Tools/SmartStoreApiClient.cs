namespace AiMcpService.Tools;

public sealed class SmartStoreApiClient(HttpClient httpClient)
{
    public async Task<string> GetRegistrationSampleAsync(
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync(
            "/api/smartstore/products/registration-sample",
            cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}
