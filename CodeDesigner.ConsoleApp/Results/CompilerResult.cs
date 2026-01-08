using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CodeDesigner.ConsoleApp.Results
{
    public class CompilerResult
    {
        [JsonPropertyName("cheatCodes")]
        public string? CheatCodes { get; set; }

        [JsonPropertyName("debugMessages")]
        public string[]? DebugMessages { get; set; }
    }
}
