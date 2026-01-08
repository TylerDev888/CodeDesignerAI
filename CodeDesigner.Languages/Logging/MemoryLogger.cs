using CodeDesigner.Languages.CDS;
using System.Collections.Generic;
using System.Text;

namespace CodeDesigner.Languages.Logging
{
    public class MemoryLogger : ILogger
    {
        public List<string> Messages { get; set; } = new List<string>();
        List<string> ILogger.Messages { get => Messages; set => throw new NotImplementedException(); }

        private readonly StringBuilder _buffer = new();

        public void Log(string message, LogLevel level = LogLevel.Info)
        {
            var formatted = $"[{level.ToString().ToUpper()}] {message}";

            Messages.Add(formatted);
            _buffer.AppendLine(formatted);
        }

        public void Info(string message) => Log(message, LogLevel.Info);
        public void Warning(string message) => Log(message, LogLevel.Warning);
        public void Error(string message) => Log(message, LogLevel.Error);
        public void Debug(string message) => Log(message, LogLevel.Debug);

        /// <summary>
        /// Returns all log output as a single string.
        /// </summary>
        public string GetLogText() => _buffer.ToString();

        /// <summary>
        /// Clears all stored logs.
        /// </summary>
        public void Clear()
        {
            Messages.Clear();
            _buffer.Clear();
        }
    }
}
