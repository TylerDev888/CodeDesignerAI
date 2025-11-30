using CodeDesigner.Languages.CDS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.Logging
{
    public class ConsoleLogger : ILogger
    {
        public List<string> Messages { get; set; } = new List<string>();

        public void Log(string message, LogLevel level = LogLevel.Info)
        {
            ConsoleColor originalColor = Console.ForegroundColor;
            Console.ForegroundColor = GetColorForLevel(level);
            Messages.Add(message);
            Console.WriteLine(message);
            Console.ForegroundColor = originalColor;
        }

        public void Info(string message) => Log($"[INFO] {message}", LogLevel.Info);
        public void Warning(string message) => Log($"[WARNING] {message}", LogLevel.Warning);
        public void Error(string message) => Log($"[ERROR] {message}", LogLevel.Error);
        public void Debug(string message) => Log($"[DEBUG] {message}", LogLevel.Debug);

        private ConsoleColor GetColorForLevel(LogLevel level)
        {
            return level switch
            {
                LogLevel.Info => ConsoleColor.White,
                LogLevel.Warning => ConsoleColor.Yellow,
                LogLevel.Error => ConsoleColor.Red,
                LogLevel.Debug => ConsoleColor.Cyan,
                _ => ConsoleColor.White,
            };
        }
    }
}
