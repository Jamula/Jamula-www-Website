using System.ComponentModel;
using System.Text.Json;
using ModelContextProtocol.Server;

namespace JamulaMcp;

[McpServerToolType]
public sealed class JamulaMcpTools(PublicCorpus corpus, McpTelemetry telemetry)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    [McpServerTool(
        Name = "get_jamula_overview",
        ReadOnly = true,
        Destructive = false,
        Idempotent = true,
        OpenWorld = false)]
    [Description("Returns Jamula's approved public capabilities, canonical URLs, and direct inquiry contact.")]
    public string GetJamulaOverview() =>
        telemetry.ExecuteTool("get_jamula_overview", () =>
        {
            var overview = corpus.Entries.First(entry => entry.Id == "overview");
            return JsonSerializer.Serialize(new
            {
                name = "Jamula",
                operatorName = "Jamula, Inc.",
                canonicalUrl = overview.CanonicalUrl,
                llmsIndexUrl = "https://jamula.net/llms.txt",
                inquiryEmail = "spam@jamula.net",
                disciplines = new[] { "AI Strategy", "Custom Software", "Cloud Consulting" },
                summary = overview.Summary
            }, JsonOptions);
        });

    [McpServerTool(
        Name = "list_tech_notes",
        ReadOnly = true,
        Destructive = false,
        Idempotent = true,
        OpenWorld = false)]
    [Description("Lists published technical notes on jamula.net with canonical URLs, dates, and summaries.")]
    public string ListTechNotes() =>
        telemetry.ExecuteTool("list_tech_notes", () =>
        {
            var notes = corpus.ListTechNotes()
                .Select(note => new
                {
                    id = note.Id,
                    title = note.Title,
                    canonicalUrl = note.CanonicalUrl,
                    publishedDate = note.PublishedDate,
                    summary = note.Summary
                })
                .ToArray();
            return JsonSerializer.Serialize(new { count = notes.Length, notes }, JsonOptions);
        });

    [McpServerTool(
        Name = "search_public_corpus",
        ReadOnly = true,
        Destructive = false,
        Idempotent = true,
        OpenWorld = false)]
    [Description("Searches Jamula's approved public content and returns grounded excerpts with canonical URLs.")]
    public string SearchPublicCorpus(
        [Description("Search terms (1 to 256 characters).")] string query,
        [Description("Maximum matches to return (1 to 10).")] int maxResults = 5) =>
        telemetry.ExecuteTool(
            "search_public_corpus",
            () =>
            {
                var matches = corpus.Search(query, maxResults);
                return (Matches: matches, Payload: JsonSerializer.Serialize(new
                {
                    matchCount = matches.Count,
                    matches
                }, JsonOptions));
            },
            result => result.Matches.Count == 0 ? "empty" : "ok").Payload;
}
