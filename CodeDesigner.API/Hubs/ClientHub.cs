using CodeDesigner.Languages.Logging;
using Microsoft.AspNetCore.SignalR;
using ILogger = CodeDesigner.Languages.Logging.ILogger;

namespace CodeDesigner.WebAPI.Hubs
{
    public class ClientMessage
    {
        public ClientMessage() { }
    }
    public class ClientHub : Hub
    {
        private ILogger _logger { get; set; }
        public ClientHub(ILogger logger) : base() => _logger = logger;
    }
}