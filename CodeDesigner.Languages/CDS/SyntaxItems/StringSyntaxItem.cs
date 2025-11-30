using CodeDesigner.Languages.MipsR5900.BaseTypes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public class StringSyntaxItem : SyntaxItem
    {
        public uint Address { get; set; }
        public HexString? AddressHex { get; set; }
        public HexString? Value { get; set; }
        public string? Text { get; set; }
        public List<HexCodeSyntaxItem> HexCodeSyntaxItems { get; set; } = new List<HexCodeSyntaxItem>();
    }
}
