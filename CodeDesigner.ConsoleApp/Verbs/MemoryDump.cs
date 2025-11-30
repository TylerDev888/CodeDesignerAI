using CodeDesigner.Languages.Logging;
using CodeDesigner.Languages.MipsR5900;
using CodeDesigner.Library.Editors;
using CommandLine;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.ConsoleApp.Verbs
{
    [Verb("MemoryDump", HelpText = "View/read/write snapshots of a game.")]
    public class MemoryDump
    {
        public string Operation { get; set; }
        [Option('f', "FilePath", HelpText = "The filepath to read the memory dump.")]
        public string FilePath { get; set; }
        [Option('n', "NextPage", HelpText = "get the next page of the memory")]
        public bool NextPage { get; set; }
        [Option('l', "LastPage", HelpText = "get the last page of the memory")]
        public bool LastPage { get; set; }
        [Option('p', "PlusAddress", HelpText = "go to next address")]
        public bool PlusAddress { get; set; }
        [Option('m', "MinusAddress", HelpText = "go to last address")]
        public bool MinusAddress { get; set; }

        private static ConsoleLogger _logger = new ConsoleLogger();
        private static Assembler _assembler = new Assembler();
        private static SnapShotEditor _snapShotEditor;

        public static int Run(MemoryDump memoryDump)
        {
            _snapShotEditor = new SnapShotEditor(memoryDump.FilePath.Replace("\"", ""));

            if (!string.IsNullOrEmpty(memoryDump.FilePath))
            {
                if (memoryDump.NextPage)
                {
                    _snapShotEditor.NextPage();
                }
                if (memoryDump.LastPage) 
                {
                    _snapShotEditor.LastPage();
                }
                if (memoryDump.PlusAddress)
                {
                    _snapShotEditor.NextAddress();
                }
                if (memoryDump.MinusAddress)
                {
                    _snapShotEditor.LastAddress();
                }
                //else
                //{
                //    var pageBytes = _snapShotEditor.Read(0x00000000, _snapShotEditor.PageLength * 4);

                //    for (int i = 0; i < pageBytes.Length - 4; i += 4)
                //    {
                //        byte[] word = [
                //                pageBytes[i + 3],
                //                pageBytes[i + 2],
                //                pageBytes[i + 1],
                //                pageBytes[i + 0]
                //             ];

                //        var wordString = $"{pageBytes[i + 3]:X2}{pageBytes[i + 2]:X2}{pageBytes[i + 1]:X2}{pageBytes[i + 0]:X2}";

                //        var operation = _assembler.Assemble(wordString);

                //        _logger.Log($"[{i:X8} {wordString}] | {operation}");
                //    }
                //}
            }

            return 0;
        }
    }
}
