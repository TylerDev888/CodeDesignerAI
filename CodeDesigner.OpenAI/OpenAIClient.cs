using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Headers;
using System.Net.NetworkInformation;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CodeDesigner.OpenAI
{

    public class OpenAIClient
    {
        protected static string Url = "https://api.openai.com/v1/chat/completions";
        protected static string AIModel = "gpt-4o";
        protected static string BearerToken = "**";
        protected static string OrganizationToken = "org-DjOleLORGMacy5ApXDO4zb5d";
        protected static int MaxTokens = 100;
        protected static double Temperature = 0.7;

        private static readonly HttpClient httpClient = new HttpClient();

        public void Authorization()
        {
            httpClient.DefaultRequestHeaders.Clear();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", BearerToken);
            httpClient.DefaultRequestHeaders.Add("OpenAI-Organization", OrganizationToken);
        }

        public async Task<Choice[]> AskQuestionsAsync(Message[] messages)
        {
            var requestBody = new
            {
                model = AIModel,
                messages,
                max_tokens = MaxTokens,
                temperature = Temperature
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(Url, httpContent);
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync();

            var completion = JsonSerializer.Deserialize<ChatCompletionResponse>(responseString);

            if (completion != null)
            {
                return completion.Choices;
            }
            else
            {
                return Array.Empty<Choice>();
            }
        }
    }
}
