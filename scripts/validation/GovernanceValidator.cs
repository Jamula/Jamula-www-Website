using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JamulaValidation;

public static class GovernanceValidator
{
    private static readonly string[] RequiredFiles =
    [
        "LICENSE",
        "LICENSE_SCOPE.md",
        "TRADEMARKS.md",
        "CONTRIBUTING.md",
        "THIRD_PARTY_NOTICES.md",
        "docs/README.md",
        "docs/planning/evaluation-plan.md",
        "docs/legal/license-inventory.md",
        ".github/skills/cloud-solution-architect/SKILL.md"
    ];

    public static void Validate(string root)
    {
        var fullRoot = Path.GetFullPath(root);
        ValidateJson(fullRoot);
        ValidateRequiredFiles(fullRoot);
        ValidateMicrosoftSkillLinks(fullRoot);
        ValidateGitignore(fullRoot);
        ValidateDeploymentBoundary(fullRoot);
    }

    public static void ValidateJson(string root)
    {
        foreach (var directory in new[] { ".copilot", ".vscode" })
        {
            var path = Path.Combine(root, directory);
            if (!Directory.Exists(path))
            {
                continue;
            }

            foreach (var file in Directory.EnumerateFiles(path, "*.json", SearchOption.TopDirectoryOnly))
            {
                using var _ = JsonDocument.Parse(File.ReadAllText(file));
            }
        }
    }

    public static void ValidateRequiredFiles(string root)
    {
        var missing = RequiredFiles
            .Where(file => !File.Exists(Path.Combine(root, file.Replace('/', Path.DirectorySeparatorChar))))
            .ToArray();
        if (missing.Length != 0)
        {
            throw new InvalidOperationException($"Required governance files are missing: {string.Join(", ", missing)}");
        }
    }

    public static void ValidateMicrosoftSkillLinks(string root)
    {
        var skill = Path.Combine(root, ".github", "skills", "cloud-solution-architect", "SKILL.md");
        var text = File.ReadAllText(skill);
        var references = Regex.Matches(text, @"\]\(\./(references/[^)]+)\)")
            .Select(match => match.Groups[1].Value)
            .Where(reference => !File.Exists(Path.Combine(Path.GetDirectoryName(skill)!, reference.Replace('/', Path.DirectorySeparatorChar))))
            .ToArray();
        if (references.Length != 0)
        {
            throw new InvalidOperationException($"Microsoft skill references are missing: {string.Join(", ", references)}");
        }
    }

    public static void ValidateGitignore(string root)
    {
        if (CheckIgnore(root, ".env.local") != 0)
        {
            throw new InvalidOperationException(".env.local and other environment variants must be ignored");
        }

        if (CheckIgnore(root, ".env.example") == 0)
        {
            throw new InvalidOperationException("Safe .env.example templates must remain trackable");
        }
    }

    public static void ValidateDeploymentBoundary(string root)
    {
        var build = File.ReadAllText(Path.Combine(root, ".github", "workflows", "azure-static-web-apps.yml"));
        var preview = File.ReadAllText(Path.Combine(root, ".github", "workflows", "azure-static-web-apps-preview.yml"));
        var jobsMarker = Regex.Match(build, @"(?m)^jobs:\r?\n");
        if (!jobsMarker.Success)
        {
            throw new InvalidOperationException("Production deployment jobs are missing");
        }

        var jobsText = build[(jobsMarker.Index + jobsMarker.Length)..];
        var jobHeaders = Regex.Matches(jobsText, @"(?m)^  ([a-z][a-z0-9-]*):\r?$");
        var jobs = new Dictionary<string, string>(StringComparer.Ordinal);
        for (var index = 0; index < jobHeaders.Count; index++)
        {
            var jobHeader = jobHeaders[index];
            var contentStart = jobHeader.Index + jobHeader.Length;
            if (contentStart < jobsText.Length && jobsText[contentStart] == '\n')
            {
                contentStart++;
            }

            var contentEnd = index + 1 < jobHeaders.Count ? jobHeaders[index + 1].Index : jobsText.Length;
            jobs.Add(jobHeader.Groups[1].Value, jobsText[contentStart..contentEnd]);
        }

        foreach (var name in new[] { "prepare", "build" })
        {
            if (!jobs.TryGetValue(name, out var job) || job.Contains("secrets.", StringComparison.Ordinal) ||
                job.Contains("environment:", StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"The PR {name} job must not access a deployment secret or environment");
            }
        }

        foreach (var name in new[] { "deploy", "deploy-com" })
        {
            var job = jobs.GetValueOrDefault(name, "");
            if (!job.Contains("github.event_name == 'workflow_dispatch'", StringComparison.Ordinal) ||
                !job.Contains("github.ref == 'refs/heads/main'", StringComparison.Ordinal) ||
                !job.Contains("environment: swa-deployment", StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"{name} must require a manual main release and the main-only environment");
            }
        }

        var header = build[..jobsMarker.Index];
        if (header.Contains("\n  push:", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Production deployment must not run on push");
        }

        if (!jobs.GetValueOrDefault("publish", "").Contains("needs: [prepare, build, deploy, deploy-com]", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Publication must require both verified deployments");
        }

        if (!preview.Contains("workflow_run:", StringComparison.Ordinal) ||
            preview.Contains("\n  pull_request:", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Preview deployment must run as a trusted workflow_run");
        }

        if (!preview.Contains("environment: swa-deployment", StringComparison.Ordinal) ||
            !preview.Contains("ref: ${{ github.workflow_sha }}", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Preview deployment must use main-only secrets and trusted deployment tools");
        }

        if (preview.Contains("npm ci", StringComparison.Ordinal) || preview.Contains("npm install", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The trusted preview workflow must never execute PR dependency scripts");
        }

        if ((build + preview).Contains("AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Deployment workflows must not fall back to old repository-level token names");
        }

        var workflows = build + preview;
        if (!workflows.Contains("SWA_NET_DEPLOYMENT_TOKEN", StringComparison.Ordinal) ||
            !build.Contains("SWA_COM_DEPLOYMENT_TOKEN", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Deployment workflows must use the environment-scoped token names");
        }
    }

    private static int CheckIgnore(string root, string path)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "git",
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            }
        };
        process.StartInfo.ArgumentList.Add("check-ignore");
        process.StartInfo.ArgumentList.Add("--no-index");
        process.StartInfo.ArgumentList.Add("--quiet");
        process.StartInfo.ArgumentList.Add(path);
        process.Start();
        process.WaitForExit();
        return process.ExitCode;
    }
}
