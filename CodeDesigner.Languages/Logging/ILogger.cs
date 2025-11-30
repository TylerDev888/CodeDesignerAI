using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.Logging
{
    public interface ILogger
    {
        List<string> Messages { get; set; }
        void Log(string message, LogLevel level = LogLevel.Info);
        void Info(string message);
        void Warning(string message);
        void Error(string message);
        void Debug(string message);
    }
}
