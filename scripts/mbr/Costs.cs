using System.ComponentModel;
using System.Text.Json;

namespace JamulaMbr;

/// <summary>One manually attributed measurement, with evidence and exact coverage.</summary>
public sealed record CostMeasurement(string Key, decimal Value, string Basis, string Source,
    string Scope, DateTimeOffset AsOf, DateTimeOffset CoveredFrom, DateTimeOffset CoveredThrough,
    string? PricingSource = null, string? PricingDate = null);

/// <summary>A local import for one repository and UTC month.</summary>
public sealed record CostImport(string Repo, string Month, List<CostMeasurement> Measurements);

/// <summary>Cost data with explicit health; absent data remains unknown.</summary>
public sealed record CostResult(string Status, string Detail, List<CostMeasurement> Measurements,
    string ActionsStatus = "not-connected", string? ActionsDetail = null);

/// <summary>Combines strictly repository-filtered Actions billing with optional attributed imports.</summary>
public static class Costs
{
    /// <summary>Supported independent measures. Monetary values are USD, not token multipliers.</summary>
    public static readonly string[] Keys = ["aiInputTokens", "aiOutputTokens", "aiCacheReadTokens",
        "aiCacheWriteTokens", "actionsElapsedMinutes", "actionsRunnerMinutes", "actionsBillableMinutes", "aiUsd", "actionsUsd",
        "hostingUsd", "domainUsd"];

    /// <summary>Reads only this repository's monthly Actions summary; never requests account-wide billing.</summary>
    public static async Task<CostResult> CollectAsync(CostResult imported, ReviewMonth month,
        DateTimeOffset now, CancellationToken cancellationToken = default,
        Func<string, Task<string>>? read = null)
    {
        if (month.Start >= now)
            return imported with { ActionsStatus = "not-applicable", ActionsDetail = "Future period; no usage observations." };
        var endpoint = $"organizations/Jamula/settings/billing/usage/summary?year={month.Start.Year}&month={month.Start.Month}&repository=Jamula%2FJamula-www-Website&product=actions";
        try
        {
            var measurements = ReadActions(await (read is null
                ? GitHub.RunGhAsync(endpoint, cancellationToken) : read(endpoint)), month, now);
            var keys = measurements.Select(m => m.Key).ToHashSet();
            return new(imported.Status == "invalid" ? "invalid" : "collected",
                "Repository-filtered Actions billing plus optional imports. AI tokens need a repository-attributed provider export. Total spend remains unknown.",
                imported.Measurements.Where(m => !keys.Contains(m.Key)).Concat(measurements).ToList(),
                "ok", "GitHub billing summary; reported usage may lag and is not a final invoice. Net charges include reported discounts.");
        }
        catch (Exception ex) when (ex is IOException or Win32Exception or JsonException or InvalidOperationException or OverflowException)
        {
            Console.Error.WriteLine($"MBR: repository Actions billing unavailable ({ex.GetType().Name}).");
            return imported with
            {
                ActionsStatus = "unavailable",
                ActionsDetail = "Repository-filtered billing unavailable or unverified. Check existing gh access/network or provide a scoped import; no broader permissions requested."
            };
        }
    }

    /// <summary>Rejects mismatched scope, period, units or malformed amounts rather than inventing zero.</summary>
    public static List<CostMeasurement> ReadActions(string json, ReviewMonth month, DateTimeOffset now)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object ||
            !root.TryGetProperty("repository", out var repository) || repository.GetString() != GitHub.Repo ||
            !root.TryGetProperty("organization", out var organization) || organization.GetString() != "Jamula" ||
            !root.TryGetProperty("product", out var product) || !string.Equals(product.GetString(), "Actions", StringComparison.OrdinalIgnoreCase) ||
            !root.TryGetProperty("timePeriod", out var period) || period.ValueKind != JsonValueKind.Object ||
            !period.TryGetProperty("year", out var year) || !year.TryGetInt32(out var y) || y != month.Start.Year ||
            !period.TryGetProperty("month", out var periodMonth) || !periodMonth.TryGetInt32(out var m) || m != month.Start.Month ||
            period.TryGetProperty("day", out _) ||
            !root.TryGetProperty("usageItems", out var rows) || rows.ValueKind != JsonValueKind.Array ||
            rows.GetArrayLength() == 0)
            throw new JsonException("Unverified repository billing scope or period.");
        decimal runner = 0, billable = 0, dollars = 0;
        var hasMinutes = false;
        foreach (var row in rows.EnumerateArray())
        {
            if (row.ValueKind != JsonValueKind.Object ||
                !row.TryGetProperty("product", out var rowProduct) ||
                !string.Equals(rowProduct.GetString(), "Actions", StringComparison.OrdinalIgnoreCase) ||
                !row.TryGetProperty("unitType", out var unit) ||
                unit.GetString() is not ("minutes" or "gigabyte-hours") ||
                !row.TryGetProperty("grossQuantity", out var grossValue) || !grossValue.TryGetDecimal(out var gross) || gross < 0 ||
                !row.TryGetProperty("netQuantity", out var netValue) || !netValue.TryGetDecimal(out var net) || net < 0 || net > gross ||
                !row.TryGetProperty("netAmount", out var amount) || !amount.TryGetDecimal(out var netAmount) || netAmount < 0)
                throw new JsonException("Unverified Actions billing units or amounts.");
            dollars += netAmount;
            if (unit.GetString() == "minutes")
            {
                hasMinutes = true;
                runner += gross;
                billable += net;
            }
        }
        var end = now < month.End ? now : month.End;
        var source = "https://docs.github.com/en/rest/billing/usage#get-billing-usage-summary-for-an-organization; repository-filtered GitHub Actions summary. Gross minutes before discounts; net minutes after discounts; net USD includes reported runner and storage charges, not a final invoice.";
        CostMeasurement Measurement(string key, decimal value) =>
            new(key, value, "actual", source, GitHub.Repo, now, month.Start, end);
        var result = new List<CostMeasurement> { Measurement("actionsUsd", dollars) };
        if (hasMinutes)
        {
            result.Add(Measurement("actionsRunnerMinutes", runner));
            result.Add(Measurement("actionsBillableMinutes", billable));
        }
        return result;
    }

    /// <summary>Reads a strict import, rejecting invalid provenance, attribution, or coverage.</summary>
    public static async Task<CostResult> ReadAsync(string path, ReviewMonth month, DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(path))
            return new("unknown", "No cost import. AI tokens need a repository-attributed provider export. Missing measurements remain unknown.", []);
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
