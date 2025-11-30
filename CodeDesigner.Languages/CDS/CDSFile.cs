using CodeDesigner.Languages.CDS.SyntaxItems;
using CodeDesigner.Languages.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Languages.CDS
{
    public class CDSFile : IDisposable
    {
        private ILogger _logger;
        private string _path { get; set; }
        private string _source { get; set; }
        private static readonly string FileExtension = "cds";
        private SyntaxParser _parser;

        public CDSFile(ILogger logger, string path)
        {
            _path = path;
            _logger = logger;
            _parser = new SyntaxParser(logger);
            _source = string.Empty;
        }
        public CDSFile(ILogger logger, string path, string source)
        {
            _path = path;
            _logger = logger;
            _parser = new SyntaxParser(logger);
            _source = source;
        }
        public List<SyntaxItem> Read()
        {
            if (Exists())
            {
                var sourceCode = File.ReadAllText(_path);
                return _parser.Parse(sourceCode);
            }
            else
            {
                if (!string.IsNullOrEmpty(_source))
                {
                    File.WriteAllText(_path, _source);
                    var sourceCode = File.ReadAllText(_path);
                    return _parser.Parse(sourceCode);
                }
                _logger.Error("The file could not be created or loaded from the path supplied.");
            }

            return new();
        }
        public void Write(List<SyntaxItem> items)
        {
            // generate all statements for each syntax item
        }
        public List<string> ToDebugOutput()
        {
            var syntaxItems = Read();

            var includedItems = syntaxItems.OfType<IncludeSyntaxItem>().ToList();

            foreach (var includedItem in includedItems)
            {
                if (includedItem != null && !string.IsNullOrEmpty(includedItem.FilePath))
                {
                    var includedSourceFile = new CDSFile(_logger, includedItem.FilePath);
                    syntaxItems.AddRange(includedSourceFile.Read());
                }
            }

            foreach (var item in syntaxItems)
            {
                var type = item.GetType().ToString();
                var parts = type.Split('.');

                var debugMessageHeader = $"[Line #{item.LineNumber}]\t{parts[parts.Length - 1],-25}\t[{item.LineText}]";
                _logger.Info(debugMessageHeader);

                switch (item)
                {
                    case OperationSyntaxItem operation:
                        _logger.Debug($">>{operation.AddressHex} {operation.Hex}");
                        break;
                    case HexCodeSyntaxItem hcs:
                        _logger.Debug($">>{hcs.AddressHex} {hcs.Value}");
                        break;
                    case SetRegSyntaxItem setReg:
                        setReg.Operations.ForEach(x => _logger.Debug($">>{x.AddressHex} {x.Hex}"));
                        break;
                    case StringSyntaxItem ssi:
                        ssi.HexCodeSyntaxItems.ForEach(x => _logger.Debug($">>{x.AddressHex} {x.Value}"));
                        break;
                    case MemorySyntaxItem mem:
                        mem.Operations.ForEach(x => _logger.Debug($">>{x.AddressHex} {x.Hex}"));
                        break;
                }
            }

            return _logger.Messages;
        }

        public string ToCheatCode()
        {
            var syntaxItems = Read();

            var includedItems = syntaxItems.OfType<IncludeSyntaxItem>().ToList();

            foreach (var includedItem in includedItems)
            {
                if (includedItem != null && !string.IsNullOrEmpty(includedItem.FilePath)) {
                    var includedSourceFile = new CDSFile(_logger, includedItem.FilePath);
                    syntaxItems.AddRange(includedSourceFile.Read());
                }
            }

            var resultBuffer = new StringBuilder();
            foreach(var item in syntaxItems)
            {
                switch (item)
                {
                    case OperationSyntaxItem operation:
                        resultBuffer.AppendLine($"{operation.AddressHex} {operation.Hex}");
                        break;
                    case HexCodeSyntaxItem hcs:
                        resultBuffer.AppendLine($"{hcs.AddressHex} {hcs.Value}");
                        break;
                    case SetRegSyntaxItem setReg:
                        setReg.Operations.ForEach(x => resultBuffer.AppendLine($"{x.AddressHex} {x.Hex}"));
                        break;
                    case StringSyntaxItem ssi:
                        ssi.HexCodeSyntaxItems.ForEach(x => resultBuffer.AppendLine($"{x.AddressHex} {x.Value}"));
                        break;
                    case MemorySyntaxItem mem:
                        mem.Operations.ForEach(x => resultBuffer.AppendLine($"{x.AddressHex} {x.Hex}"));
                        break;
                }
            }

            return resultBuffer.ToString();
        }
        public bool Exists()
        {
            return _path.EndsWith(FileExtension) && File.Exists(_path);
        }

        public void Dispose()
        {
            
        }
    }
}
