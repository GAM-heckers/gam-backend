using System.ComponentModel;
using ModelContextProtocol.Server;

namespace AiMcpService.Tools;

[McpServerToolType]
public sealed class SmartStoreTools(SmartStoreApiClient apiClient)
{
    [McpServerTool(Name = "get_smartstore_registration_sample")]
    [Description("프론트엔드 상품 등록 폼에 쓰는 SmartStore 목업 데이터를 조회합니다.")]
    public Task<string> GetRegistrationSampleAsync(
        CancellationToken cancellationToken) =>
        apiClient.GetRegistrationSampleAsync(cancellationToken);
}
