using CodeDesigner.Languages.Logging;
using CodeDesigner.WebAPI.Hubs;

namespace CodeDesigner.WebAPI.API
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Webserver starting...");

            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSignalR();
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("http://localhost:4200")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // dependency injection
            builder.Services.AddSingleton<CodeDesigner.Languages.Logging.ILogger, CodeDesigner.Languages.Logging.ConsoleLogger>();

            var app = builder.Build();

            app.UseCors(); // Enable CORS middleware

            app.MapHub<CodeDesignerHub>("/ws");

            await app.RunAsync();
        }
    }
}
