using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS.SyntaxItems
{
    public abstract class SyntaxItem
    {
        public int LineNumber { get; set; }
        public string? LineText { get; set; }
    }
}
