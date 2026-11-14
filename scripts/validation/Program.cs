namespace JamulaValidation;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        try
        {
            switch (args)
            {
                case ["validate-governance"]:
                    GovernanceValidator.Validate(Directory.GetCurrentDirectory());
                    Console.WriteLine("Governance validation passed.");
                    return 0;
                case ["validate-governance", var root]:
                    GovernanceValidator.Validate(root);
                    Console.WriteLine("Governance validation passed.");
                    return 0;
                case ["validate-artifact", var archive, var destination, var config]:
                    PreviewArtifactValidator.ExtractPreview(archive, destination, config);
                    Console.WriteLine("Preview artifact paths, size, static files, and trusted configuration verified.");
                    return 0;
                case ["verify-site", var url]:
                    await VerifySiteAsync(url, "www/public/staticwebapp.config.json");
                    return 0;
                case ["verify-site", var url, var config]:
                    await VerifySiteAsync(url, config);
                    return 0;
                default:
                    Console.Error.WriteLine(
                        "Usage: validate-governance [ROOT] | validate-artifact ARCHIVE DESTINATION TRUSTED_CONFIG | verify-site HTTPS_PREVIEW_URL [CONFIG]");
                    return 2;
            }
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }

    private static async Task VerifySiteAsync(string url, string configPath)
    {
        using var client = PreviewSiteVerifier.CreateHttpClient();
        await PreviewSiteVerifier.VerifyAsync(url, configPath, client, Console.Error);
        Console.WriteLine("Live preview headers, noindex, robots MIME type, and 404 response verified.");
    }
}
