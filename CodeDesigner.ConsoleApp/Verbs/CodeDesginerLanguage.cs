using CodeDesigner.Languages.CDS;
using CodeDesigner.Languages.Logging;
using CommandLine;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.ConsoleApp.Verbs
{
    [Verb("CDS", HelpText = "Compile/De-compile code designer source code.")]
    public class CodeDesignerLanguage
    {
        [Option('c', "Compile", HelpText = "Compile code designer source code.")]
        public bool Compile { get; set; }
        [Option('d', "Decompile", HelpText = "Decompile code designer source code.")]
        public bool Decompile { get; set; }
        [Option('s', "Source", HelpText = "A string of the code designer source code.")]
        public string Source { get; set; }
        [Option('f', "FilePath", HelpText = "Will load a Codes Designer Source file(.cds).")]
        public string FilePath { get; set; }

        public static int Run(CodeDesignerLanguage cdlOptions)
        {
            if (cdlOptions.Compile)
            {
                var logger = new ConsoleLogger();
                
                logger.Debug($"[DEBUG] Current Directory: {Directory.GetCurrentDirectory()}");

                var cds = new CDSFile(logger, $@"{Directory.GetCurrentDirectory()}\{cdlOptions.FilePath.Replace("\"", "")}");

                logger.Debug($"[DEBUG] FilePath: " + $@"{Directory.GetCurrentDirectory()}\{cdlOptions.FilePath.Replace("\"", "")}");

                logger.Log(cds.ToDebugOutput());
            }

            if (cdlOptions.Decompile)
            {

            }

            return 0;
        }
    }
}