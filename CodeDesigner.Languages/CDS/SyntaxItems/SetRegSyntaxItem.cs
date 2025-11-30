using CodeDesigner.Languages.MipsR5900.BaseTypes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class SetRegSyntaxItem : SyntaxItem
    {
        public uint Address { get; set; }
        public HexString? AddressHex { get; set; }
        public List<OperationSyntaxItem> Operations { get; set; } = new List<OperationSyntaxItem>();

    }
}
