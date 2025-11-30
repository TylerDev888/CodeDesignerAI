using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class OperationJumpSyntaxItem : OperationSyntaxItem
    {
        public bool HasLabel { get; set; }
        public string? Label { get; set; }
        public uint LabelAddress { get; set; }
        public string? TargetAddress { get; set; }
    }
}
