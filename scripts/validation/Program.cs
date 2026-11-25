namespace JamulaValidation;

public static class Program
{
    public static int Main(string[] args)
    {
        try
        {
            if (args.Length == 1 && args[0] == "validate-governance")
            {
                GovernanceValidator.Validate(Directory.GetCurrentDirectory());
                Console.WriteLine("Governance validation passed.");
                return 0;
            }

            if (args.Length == 2 && args[0] == "validate-governance")
            {
                GovernanceValidator.Validate(args[1]);
                Console.WriteLine("Governance validation passed.");
                return 0;
            }

            if (args.Length == 4 && args[0] == "validate-artifact")
            {
                PreviewArtifactValidator.ExtractPreview(args[1], args[2], args[3]);
                Console.WriteLine("Preview artifact paths, size, static files, and trusted configuration verified.");
                return 0;
            }

            Console.Error.WriteLine(
                "Usage: validate-governance [ROOT] | validate-artifact ARCHIVE DESTINATION TRUSTED_CONFIG");
            return 2;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }
}
