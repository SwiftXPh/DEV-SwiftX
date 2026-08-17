using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SwiftX.Services
{
    public interface IAuditLogger
    {
        void LogAuthEvent(string eventType, string? userId, string? username, string ipAddress, bool success, string? detail = null);
        void LogAdminAction(string action, string adminUser, string? targetEntity, int? targetId, string? detail = null);
        void LogAccountChange(string changeType, int userId, string? detail = null);
    }

    public class AuditLogger : IAuditLogger
    {
        private readonly ILogger<AuditLogger> _logger;

        public AuditLogger(ILogger<AuditLogger> logger) => _logger = logger;

        public void LogAuthEvent(string eventType, string? userId, string? username, string ipAddress, bool success, string? detail = null)
        {
            _logger.LogInformation("AUDIT:AUTH | Event={Event} UserId={UserId} Username={Username} IP={IP} Success={Success} Detail={Detail}",
                eventType, userId ?? "—", username ?? "—", ipAddress, success, detail ?? "—");
        }

        public void LogAdminAction(string action, string adminUser, string? targetEntity, int? targetId, string? detail = null)
        {
            _logger.LogInformation("AUDIT:ADMIN | Action={Action} Admin={Admin} Entity={Entity} TargetId={TargetId} Detail={Detail}",
                action, adminUser, targetEntity ?? "—", targetId, detail ?? "—");
        }

        public void LogAccountChange(string changeType, int userId, string? detail = null)
        {
            _logger.LogInformation("AUDIT:ACCOUNT | Change={Change} UserId={UserId} Detail={Detail}",
                changeType, userId, detail ?? "—");
        }
    }
}
