using System.Text.Json;

namespace JamulaMbr;

/// <summary>One manually attributed measurement, with evidence and exact coverage.</summary>
public sealed record CostMeasurement(string Key, decimal Value, string Basis, string Source,
    string Scope, DateTimeOffset AsOf, DateTimeOffset CoveredFrom, DateTimeOffset CoveredThrough,
    string? PricingSource = null, string? PricingDate = null);

/// <summary>A local import for one repository and UTC month.</summary>
public sealed record CostImport(string Repo, string Month, List<CostMeasurement> Measurements);

/// <summary>Cost data with explicit health; absent data remains unknown.</summary>
public sealed record CostResult(string Status, string Detail, List<CostMeasurement> Measurements);

/// <summary>Validates imports without fetching account-wide usage or billing.</summary>
public static class Costs
{
    /// <summary>Supported independent measures. Monetary values are USD, not token multipliers.</summary>
    public static readonly string[] Keys = ["aiInputTokens", "aiOutputTokens", "aiCacheReadTokens",
        "aiCacheWriteTokens", "actionsElapsedMinutes", "actionsBillableMinutes", "aiUsd", "actionsUsd",
        "hostingUsd", "domainUsd"];

    /// <summary>Reads a strict import, rejecting invalid provenance, attribution, or coverage.</summary>
    public static async Task<CostResult> ReadAsync(string path, ReviewMonth month, DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(path))
            return new("unknown", "No cost import. AI tokens, Actions minutes and bills are unknown. No billing/account-wide APIs are called.", []);
        try
        {
            var import = JsonSerializer.Deserialize<CostImport>(await File.ReadAllTextAsync(path, cancellationToken),
                new JsonSerializerOptions(JsonSerializerDefaults.Web)
                {
                    UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow,
                    RespectRequiredConstructorParameters = true
                });
            if (import is null || import.Repo != GitHub.Repo || import.Month != month.Value || import.Measurements is null)
                throw new JsonException("Wrong import scope.");
            var keys = new HashSet<string>();
            foreach (var m in import.Measurements)
            {
                if (m is null || !Keys.Contains(m.Key) || !keys.Add(m.Key) || m.Value < 0 ||
                    m.Basis is not ("actual" or "estimated") || string.IsNullOrWhiteSpace(m.Source) ||
                    m.Source.Length > 500 || m.Scope != GitHub.Repo || m.AsOf > now ||
                    m.CoveredFrom < month.Start || m.CoveredThrough > month.End ||
                    m.CoveredThrough > now || m.CoveredThrough <= m.CoveredFrom || m.AsOf < m.CoveredThrough ||
                    (m.Key.EndsWith("Tokens", StringComparison.Ordinal) && m.Value != decimal.Truncate(m.Value)))
                    throw new JsonException("Invalid measurement.");
                if (m.Basis == "estimated" && m.Key.EndsWith("Usd", StringComparison.Ordinal) &&
                    (string.IsNullOrWhiteSpace(m.PricingSource) ||
                    !DateOnly.TryParseExact(m.PricingDate, "yyyy-MM-dd", out var pricingDate) ||
                    pricingDate > DateOnly.FromDateTime(now.UtcDateTime)))
                    throw new JsonException("Estimates require dated pricing evidence.");
            }
            return new("imported", "Manual repository-attributed import; verify its evidence. Missing rows remain unknown. No total spend is inferred.", import.Measurements);
        }
        catch (Exception ex) when (ex is JsonException or IOException or UnauthorizedAccessException)
        {
            Console.Error.WriteLine($"MBR: cost import rejected ({ex.GetType().Name}).");
            return new("invalid", "Cost import is unreadable or invalid. Check the README schema and attribution; then refresh.", []);
        }
    }
}
