using CodeDesigner.Languages.MipsR5900.BaseTypes;
using CodeDesigner.Languages.MipsR5900;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class OperationSyntaxItem : SyntaxItem
    {
        public uint Address { get; set; }
        public HexString? AddressHex { get; set; }
        public Instruction? Instruction { get; set; }
        public HexString? Hex { get; set; }
    }
}
