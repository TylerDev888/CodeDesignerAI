using CodeDesigner.Languages.MipsR5900;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.Helpers
{
    public static class ValidationHelper
    {
        // Helper method to validate operations (+=, -=, *=, /=)
        public static bool IsValidOperation(string operation)
        {
            return operation == "=" || operation == "+=" || operation == "-=" || operation == "*=" || operation == "/=";
        }
        public static bool IsValidRegisterName(string regName)
        {
            var regNameLower = regName.ToLower();
            // Validate register name (example: t0, t1, s0, s1, etc.)
            return LanguageDefinition.EERegisters.Exists(x => x.TextDisplay == regNameLower) ||
                LanguageDefinition.COP0Registers.Exists(x => x.TextDisplay == regNameLower) ||
                LanguageDefinition.COP1Registers.Exists(x => x.TextDisplay == regNameLower);
        }
    }
}
