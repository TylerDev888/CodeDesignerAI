using CodeDesigner.Languages.CDS;
using CodeDesigner.WebAPI.Hubs.Answers;
using CodeDesigner.WebAPI.Hubs.Messages;
using ILogger = CodeDesigner.Languages.Logging.ILogger;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CodeDesigner.Languages.MipsR5900;

namespace CodeDesigner.WebAPI.Hubs
{
    public class CodeDesignerHub : ClientHub
    {
        private readonly ILogger _logger;

        public CodeDesignerHub(ILogger logger) : base(logger)
        {
            _logger = logger;
        }

        public AssemblerAnswer SendAssemblerMessage(AssemblerMessage message)
        {
            var currentDirectory = Directory.GetCurrentDirectory();
            _logger.Debug($"Current Directory: {currentDirectory}");
            

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), message.FilePath);
            _logger.Debug($"FilePath: {filePath}");

            var cds = new CDSFile(_logger, filePath, message.Source);

            return new AssemblerAnswer
            {
                CheatCodes = cds.ToCheatCode(),
                DebugMessages = cds.ToDebugOutput().ToArray()
            };
        }

        public DisassemblerAnswer SendDisassemblerMessage(DisassemblerMessage message)
        {
            return new DisassemblerAnswer
            {
                // populate response
            };
        }
    }
}
