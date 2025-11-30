using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommandLine;
using CodeDesigner.ConsoleApp.Verbs;
using CodeDesigner.Languages.CDS;
using CodeDesigner.Languages.Logging;
using CodeDesigner.Library.Editors;
using CodeDesigner.Languages.MipsR5900;

namespace CodeDesigner.ConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine(File.ReadAllText("Resources/WelcomeMsg.txt"));

            //            var client = new OpenAI.OpenAIClient();

            //            // Assuming this method sets up the API key or auth headers
            //            client.Authorization();

            //            var readme = @"
            //## 1. Basic usage structure
            //```powershell
            //CodeDesigner<Verb>[Options]
            //```

            //## 2. Detailed Usage
            //```powershell

            //CodeDesigner MipsR900
            //    options: 
            //			 - a--Assemble
            //             - h--OperationHex
            //             - d--Disassemble
            //             - o--Operation

            //CodeDesigner Pcsx2
            //    options: 
            //			 - r--ReadOperation
            //             - o--Operation
            //             - w--WriteOperation
            //             - a--Address
            //             - s--StartProcess
            //             - i--InstallAndConfig
            //             - p--Pcsx2 version

            //CodeDesigner CDL

            //    options:
            //            - c--Compile
            //            - d--Decompile
            //            - s--Source

            //CodeDesigner CheatEngine
            //```";

            //var message = new Message
            //{
            //    Role = "user",
            //    Content = $"Hi AI, I am going to provide you the command line structure of my program, can you show me examples of how to use it with fake data. Here is the readme \n {readme}"
            //};

            //var messages = new List<Message> { message };

            //Choice[] results = await client.AskQuestionsAsync(messages.ToArray());

            //foreach (var answer in results) {
            //    Console.WriteLine($"AI Response: {answer.Message.Content}");
            //}

            var commandArgs = args;

            if (!commandArgs.Any())
            {
                commandArgs = new string[] { "help" };
            }

            var endMainLoop = false;

            while (!endMainLoop)
            {
                _ = Parser.Default.ParseArguments<MipsR9500, CodeDesignerLanguage, Pcsx2, Verbs.CheatEngine, MemoryDump>(commandArgs)
                  .MapResult(
                    (MipsR9500 opts) => MipsR9500.Run(opts),
                    (CodeDesignerLanguage opts) => CodeDesignerLanguage.Run(opts),
                    (Pcsx2 opts) => Pcsx2.Run(opts),
                    (Verbs.CheatEngine opts) => Verbs.CheatEngine.Run(opts),
                    (MemoryDump opts) => MemoryDump.Run(opts),
                    errs => 1);

                Console.WriteLine("_________________________________________________________________________________________");
                Console.WriteLine("Input a command: ");
                commandArgs = Console.ReadLine()?.Split(' ');
            }
        }
    }
}