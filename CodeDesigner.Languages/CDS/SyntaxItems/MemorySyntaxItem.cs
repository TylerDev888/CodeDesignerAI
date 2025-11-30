using CodeDesigner.Languages.MipsR5900.BaseTypes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class MemorySyntaxItem : SyntaxItem
    {
        public string? Offset { get; set; }  // Memory location, e.g., "0x100"
        public string? Register { get; set; }    // Register, e.g., "t0"
        public string? Operation { get; set; }   // Operation, e.g., "+="
        public string? AssignmentOperand { get; set; }     // Operand, e.g., "0x01"
        public string? OperationOperand { get; set; } // Operand for operation (optional)
        public uint Address { get; set; }
        public HexString AddressHex { get; set; }
        public List<OperationSyntaxItem> Operations { get; set; } = new List<OperationSyntaxItem>();
    }
}
