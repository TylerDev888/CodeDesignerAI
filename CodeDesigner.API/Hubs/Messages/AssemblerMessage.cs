namespace CodeDesigner.WebAPI.Hubs.Messages
{
    public class AssemblerMessage : ClientMessage
    {
        public string? FilePath { get; set; }
        public string? Source { get; set; }
    }
}