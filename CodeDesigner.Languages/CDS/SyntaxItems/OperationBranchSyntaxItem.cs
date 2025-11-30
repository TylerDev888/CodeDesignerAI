using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class OperationBranchSyntaxItem : OperationSyntaxItem
    {
        public uint Offset { get; set; }
        public bool HasLabel { get; set; }
        public string? Label { get; set; }
        public uint LabelAddress { get; set; }
    }
}
