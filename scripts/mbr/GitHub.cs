using System.ComponentModel;
using System.Diagnostics;
using System.Text.Json;

namespace JamulaMbr;

/// <summary>Read-only, fixed-repository GitHub collection through the user's gh authentication.</summary>
public static class GitHub
{
    /// <summary>The only repository this dashboard reads.</summary>
    public const string Repo = "Jamula/Jamula-www-Website";

    /// <summary>Collects every page, discarding the entire source if any page fails.</summary>
    public static async Task<SourceResult> CollectAsync(bool pulls, CancellationToken cancellationToken)
    {
        try
        {
            var rows = await ReadPagesAsync(async page =>
            {
                var endpoint = $"repos/{Repo}/{(pulls ? "pulls" : "issues")}?state=all&sort=created&direction=asc&per_page=100&page={page}";
                return await RunGhAsync(endpoint, cancellationToken);
            });
            return new(Metrics.ReadItems(rows, pulls), "ok",
                "GitHub REST via gh; all pages read. Live refresh is not an atomic historical snapshot.");
        }
        catch (Exception ex) when (ex is IOException or Win32Exception or JsonException or InvalidOperationException)
        {
            // gh stderr/response bodies can contain account details; never relay them to the browser or snapshot.
            Console.Error.WriteLine($"MBR: {(pulls ? "PR" : "issue")} collection failed ({ex.GetType().Name}).");
            return new(null, "unavailable", "GitHub read failed. Check gh authentication, repository read access, network and rate limits; then refresh.");
        }
    }

    /// <summary>Reads paged arrays until a short page; errors never produce partial counts.</summary>
    public static async Task<List<JsonElement>> ReadPagesAsync(Func<int, Task<string>> readPage)
    {
        var rows = new List<JsonElement>();
        for (var page = 1; page <= 200; page++)
        {
            using var document = JsonDocument.Parse(await readPage(page));
            if (document.RootElement.ValueKind != JsonValueKind.Array)
                throw new JsonException("Expected a GitHub array.");
            var batch = document.RootElement.EnumerateArray().Select(x => x.Clone()).ToArray();
            rows.AddRange(batch);
            if (batch.Length < 100) return rows;
        }
        throw new InvalidOperationException("Safety limit reached; completeness cannot be established.");
    }

    internal static async Task<string> RunGhAsync(string endpoint, CancellationToken cancellationToken)
    {
        var info = new ProcessStartInfo("gh")
        {
            UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true,
            CreateNoWindow = true
        };
        foreach (var argument in new[] { "api", "--hostname", "github.com", "--method", "GET",
            "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2026-03-10", endpoint })
            info.ArgumentList.Add(argument);
        info.Environment["GH_PROMPT_DISABLED"] = "1";
        info.Environment["GH_PAGER"] = "cat";
        using var process = Process.Start(info) ?? throw new IOException("Cannot start gh.");
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromMinutes(2));
        var stdout = process.StandardOutput.ReadToEndAsync(timeout.Token);
        var stderr = process.StandardError.ReadToEndAsync(timeout.Token);
        try
        {
            await process.WaitForExitAsync(timeout.Token);
            await stderr;
            var result = await stdout;
            if (process.ExitCode != 0) throw new IOException("GitHub read failed.");
            return result;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new IOException("GitHub read timed out.");
        }
        finally
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            await process.WaitForExitAsync();
        }
    }
}
