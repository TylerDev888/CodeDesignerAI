using CodeDesigner.Library.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeDesigner.Library.Editors
{
    public class SnapShotEditor : BaseEditor
    {
        private byte[] _fileBytes
        {
            get => this._bytes;
            set => this._bytes = value;
        }

        public SnapShotEditor(string filePath)
        {
            Console.WriteLine($"[DEBUG] Current Directory: {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"[DEBUG] Path: {filePath}");

            if (File.Exists(filePath))
            {
                _fileBytes = File.ReadAllBytes(@$"{Directory.GetCurrentDirectory()}\{filePath}");
            } else
            {
                Console.Error.WriteLine("The file path was incorrect.");
            }
        }   
    }
}
