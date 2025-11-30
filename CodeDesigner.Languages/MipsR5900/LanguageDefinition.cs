using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.IO;

namespace CodeDesigner.Languages.MipsR5900
{
    public static class LanguageDefinition
    {
        public static List<EERegister> EERegisters { get; }
            = JsonConvert.DeserializeObject<List<EERegister>>(ReadEmbeddedResource("EERegisters.json"));

        public static List<COP0Register> COP0Registers { get; }
            = JsonConvert.DeserializeObject<List<COP0Register>>(ReadEmbeddedResource("COP0Registers.json"));

        public static List<COP1Register> COP1Registers { get; }
            = JsonConvert.DeserializeObject<List<COP1Register>>(ReadEmbeddedResource("COP1Registers.json"));

        public static List<Instruction> Instructions { get; }
            = JsonConvert.DeserializeObject<List<Instruction>>(ReadEmbeddedResource("Instructions.json"));
        
        public static List<Instruction> BranchInstructions 
        { 
            get 
            {
                return Instructions.FindAll(x => x.Description.Contains("Branch"));
            } 
        }

        public static List<Instruction> JumpInstructions 
        { 
            get
            {
                return Instructions.FindAll(x => x.Description.Contains("Jump"));
            } 
        }

        private static string ReadEmbeddedResource(string resourceName)
        {
            var assembly = typeof(LanguageDefinition).Assembly;
            var fullResourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(name => name.EndsWith(resourceName, StringComparison.OrdinalIgnoreCase));

            if (fullResourceName == null)
                throw new FileNotFoundException($"Embedded resource '{resourceName}' not found.");

            using var stream = assembly.GetManifestResourceStream(fullResourceName);
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
        public static class PlaceHolders
        {
            public static List<string> EERegisters { get; } = new List<string> { "base", "rs", "rt", "rd" };
            public static string COP0Registers { get; } = "reg";
            public static List<string> COP1Registers { get; } = new List<string> { "fs", "ft", "fd" };
            public static string JType { get; } = "target";
            public static List<string> IType { get; } = new List<string> { "immediate", "offset" };
            public static string SA { get; } = "sa";
            public static string Code { get; } = "code";
        }
    }
    public abstract class Register
    {
        public string TextDisplay { get; set; }
        public string Description { get; set; }
        public string Binary { get; set; }
        public int Value { get; set; }
    }
    public class EERegister : Register { }
    public class COP0Register : Register { }
    public class COP1Register : Register { }
    public class Instruction
    {
        public string TextDisplay { get; set; }
        public List<string> Syntax { get; set; }
        public string Binary { get; set; }
        public string Mask { get; set; }
        public string Description { get; set; }
        public List<InstructionArg> Args { get; set; }
        public class InstructionArg
        {
            public string Value { get; set; }
            public int Size { get; set; }
        }
    }
}
