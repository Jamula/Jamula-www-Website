using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using JamulaValidation;

var runner = new TestRunner();
runner.Run("Governance_ValidFixture_Passes", GovernanceValidFixturePasses);
runner.Run("Governance_MalformedJson_Fails", GovernanceMalformedJsonFails);
runner.Run("Governance_MalformedVscodeJson_Fails", GovernanceMalformedVscodeJsonFails);
runner.Run("Governance_MissingRequiredFile_Fails", GovernanceMissingRequiredFileFails);
runner.Run("Governance_MissingLocalSkillLink_Fails", GovernanceMissingLocalSkillLinkFails);
runner.Run("Governance_EnvironmentFileIgnoreBoundary_IsEnforced", GovernanceIgnoreBoundaryIsEnforced);
runner.Run("Governance_PrepareJobSecret_IsRejected", () => GovernanceWorkflowMutationFails("prepare:", "secret: bad", "The PR prepare job"));
runner.Run("Governance_BuildJobEnvironment_IsRejected", () => GovernanceWorkflowMutationFails("  build:\n    steps: []", "  build:\n    environment: swa-deployment", "The PR build job"));
runner.Run("Governance_DeployRequiresManualMainEnvironment_IsEnforced", () => GovernanceWorkflowMutationFails(
    "  deploy:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    "  deploy:\n    if: github.event_name == 'pull_request'", "deploy must require"));
runner.Run("Governance_DeployRequiresMainBranch_IsEnforced", () => GovernanceWorkflowMutationFails(
    "  deploy:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    "  deploy:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/other'", "deploy must require"));
runner.Run("Governance_DeployEnvironment_IsRequired", () => GovernanceWorkflowMutationFails(
    "  deploy:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'\n    environment: swa-deployment",
    "  deploy:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'\n    environment: other",
    "deploy must require"));
runner.Run("Governance_DeployComRequiresManualMainEnvironment_IsEnforced", () => GovernanceWorkflowMutationFails(
    "  deploy-com:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'\n    environment: swa-deployment",
    "  deploy-com:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'\n    environment: other",
    "deploy-com must require"));
runner.Run("Governance_DeployComRequiresMainBranch_IsEnforced", () => GovernanceWorkflowMutationFails(
    "  deploy-com:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    "  deploy-com:\n    if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/other'", "deploy-com must require"));
runner.Run("Governance_PushDeployment_IsRejected", GovernancePushDeploymentIsRejected);
runner.Run("Governance_PublicationRequiresBothDeployments", GovernancePublicationDependencyIsEnforced);
runner.Run("Governance_PreviewMustUseTrustedWorkflowRun", GovernancePreviewTriggerIsEnforced);
runner.Run("Governance_PreviewMustCheckoutWorkflowRevision", GovernancePreviewRevisionIsEnforced);
runner.Run("Governance_PreviewMustUseDeploymentEnvironment", GovernancePreviewEnvironmentIsEnforced);
runner.Run("Governance_PreviewCannotInstallUntrustedDependencies", GovernancePreviewInstallIsRejected);
runner.Run("Governance_OldTokenFallback_IsRejected", GovernanceOldTokenIsRejected);
runner.Run("Governance_EnvironmentScopedTokens_AreRequired", GovernanceScopedTokensAreRequired);

runner.Run("Artifact_ValidArchive_ExtractsStaticFiles", ArtifactValidArchiveExtracts);
runner.Run("Artifact_RegularDirectoryEntry_IsAllowed", ArtifactDirectoryEntryAllowed);
runner.Run("Artifact_UnsafePaths_AreRejectedBeforeWrites", ArtifactUnsafePathsRejected);
runner.Run("Artifact_ControlCharacters_AreRejected", ArtifactControlCharacterRejected);
runner.Run("Artifact_ExactAndCaseCollidingPaths_AreRejected", ArtifactDuplicatesRejected);
runner.Run("Artifact_UnicodeCaseFoldCollisions_AreRejected", ArtifactUnicodeCaseFoldCollisionRejected);
runner.Run("Artifact_DuplicateDirectoryEntries_AreRejected", ArtifactDuplicateDirectoryEntriesRejected);
runner.Run("Artifact_TraversalDirectoryEntry_IsRejectedBeforeWrites", ArtifactTraversalDirectoryEntryRejected);
runner.Run("Artifact_MalformedZipDirectories_AreRejectedBeforeWrites", ArtifactMalformedZipDirectoriesRejected);
runner.Run("Artifact_SymlinkEntry_IsRejected", ArtifactSymlinkEntryRejected);
runner.Run("Artifact_EncryptedEntry_IsRejectedBeforeWrites", ArtifactEncryptedEntryRejected);
runner.Run("Artifact_DeclaredSizeMismatch_IsRejectedBeforeWrites", ArtifactDeclaredSizeMismatchRejected);
runner.Run("Artifact_CompressedSizeLimit_IsEnforced", ArtifactCompressedSizeLimitEnforced);
runner.Run("Artifact_ExpandedSizeLimit_IsEnforced", ArtifactExpandedSizeLimitEnforced);
runner.Run("Artifact_ExpandedSizeAtLimit_PassesSizeCheck", ArtifactExpandedSizeAtLimitAccepted);
runner.Run("Artifact_FileCountLimit_IsEnforcedAtBoundary", ArtifactFileCountBoundaryEnforced);
runner.Run("Artifact_EmptyArchive_IsRejected", ArtifactEmptyArchiveRejected);
runner.Run("Artifact_RequiredFiles_AreEnforced", ArtifactRequiredFilesEnforced);
runner.Run("Artifact_TrustedConfigurationParity_IsEnforced", ArtifactConfigParityEnforced);
runner.Run("Artifact_JsonObjectPropertyOrder_IsNotMaterial", ArtifactConfigPropertyOrderIgnored);
runner.Run("Artifact_NonRegularEntry_IsRejected", ArtifactNonRegularEntryRejected);
runner.Run("Artifact_FileDirectoryCollision_IsRejected", ArtifactTreeConflictRejected);
runner.Run("Artifact_NonEmptyDestination_IsPreserved", ArtifactNonEmptyDestinationPreserved);
runner.Run("Artifact_FileDestination_IsRejected", ArtifactFileDestinationRejected);
runner.Run("Artifact_SymlinkDestination_IsRejected", ArtifactSymlinkDestinationRejected);

runner.Run("Preview_AllowedIsolatedHostnameAndRoot_AreAccepted", PreviewAllowedUrlAccepted);
runner.Run("Preview_ProductionExternalPortQueryAndFragmentUrls_AreRejected", PreviewInvalidUrlsRejected);
runner.Run("Preview_HttpClientUsesTimeoutAndDisablesRedirects", PreviewClientPolicyIsConfigured);
runner.Run("Preview_ValidResponseContract_IsVerified", PreviewValidResponseVerified);
runner.Run("Preview_TitleMismatch_IsRejected", () => PreviewResponseFailure("title", "unexpected title"));
runner.Run("Preview_ConfiguredHeaderMismatch_IsRejected", () => PreviewResponseFailure("header", "X-Frame-Options"));
runner.Run("Preview_MissingHsts_IsRejected", () => PreviewResponseFailure("hsts", "Strict-Transport-Security"));
runner.Run("Preview_MissingNoindex_IsRejected", () => PreviewResponseFailure("noindex", "X-Robots-Tag"));
runner.Run("Preview_RobotsMimeMismatch_IsRejected", () => PreviewResponseFailure("robots-mime", "MIME type"));
runner.Run("Preview_RobotsServerError_IsRejected", PreviewRobotsServerErrorRejected);
runner.Run("Preview_MissingRouteSuccess_IsRejected", () => PreviewResponseFailure("missing-route-success", "did not return 404"));
runner.Run("Preview_MissingRouteWrongBody_IsRejected", () => PreviewResponseFailure("missing-route-body", "expected 404 page"));
runner.Run("Preview_ReadinessRetries_AreBoundedAndVisible", PreviewReadinessRetriesBounded);
runner.Run("Preview_Redirects_AreNotFollowed", PreviewRedirectIsNotFollowed);
Console.WriteLine($"{runner.Count} deterministic offline checks passed.");

void GovernanceValidFixturePasses()
{
    using var fixture = new GovernanceFixture();
    GovernanceValidator.Validate(fixture.Root);
}

void GovernanceMalformedJsonFails()
{
    using var fixture = new GovernanceFixture();
    File.WriteAllText(Path.Combine(fixture.Root, ".copilot", "bad.json"), "{broken");
    Throws<JsonException>(() => GovernanceValidator.ValidateJson(fixture.Root));
}

void GovernanceMalformedVscodeJsonFails()
{
    using var fixture = new GovernanceFixture();
    File.WriteAllText(Path.Combine(fixture.Root, ".vscode", "bad.json"), "{broken");
    Throws<JsonException>(() => GovernanceValidator.ValidateJson(fixture.Root));
}

void GovernanceMissingRequiredFileFails()
{
    using var fixture = new GovernanceFixture();
    File.Delete(Path.Combine(fixture.Root, "LICENSE"));
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateRequiredFiles(fixture.Root), "Required governance files are missing");
}

void GovernanceMissingLocalSkillLinkFails()
{
    using var fixture = new GovernanceFixture();
    File.WriteAllText(Path.Combine(fixture.Root, ".github", "skills", "cloud-solution-architect", "SKILL.md"), "See [missing](./references/not-here.md)");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateMicrosoftSkillLinks(fixture.Root), "Microsoft skill references are missing");
}

void GovernanceIgnoreBoundaryIsEnforced()
{
    using var fixture = new GovernanceFixture();
    File.WriteAllText(Path.Combine(fixture.Root, ".gitignore"), "!.env.example\n");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateGitignore(fixture.Root), ".env.local");
    File.WriteAllText(Path.Combine(fixture.Root, ".gitignore"), ".env.*\n");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateGitignore(fixture.Root), ".env.example");
    File.WriteAllText(Path.Combine(fixture.Root, ".gitignore"), ".env.*\n!.env.example\n");
    GovernanceValidator.ValidateGitignore(fixture.Root);
}

void GovernanceWorkflowMutationFails(string marker, string replacement, string expectedMessage)
{
    using var fixture = new GovernanceFixture();
    fixture.MutateBuild(marker, replacement);
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), expectedMessage);
}

void GovernancePushDeploymentIsRejected()
{
    using var fixture = new GovernanceFixture();
    fixture.MutateBuild("  workflow_dispatch:\n", "  workflow_dispatch:\n  push:\n    branches: [main]\n");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "must not run on push");
}

void GovernancePublicationDependencyIsEnforced()
{
    using var fixture = new GovernanceFixture();
    fixture.MutateBuild("needs: [prepare, build, deploy, deploy-com]", "needs: [prepare, build]");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "Publication must require both");
}

void GovernancePreviewTriggerIsEnforced()
{
    using var fixture = new GovernanceFixture();
    fixture.MutatePreview("workflow_run:", "pull_request:");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "trusted workflow_run");
}

void GovernancePreviewRevisionIsEnforced()
{
    using var fixture = new GovernanceFixture();
    fixture.MutatePreview("ref: ${{ github.workflow_sha }}", "ref: ${{ github.event.workflow_run.head_sha }}");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "trusted deployment tools");
}

void GovernancePreviewEnvironmentIsEnforced()
{
    using var fixture = new GovernanceFixture();
    fixture.MutatePreview("environment: swa-deployment", "environment: preview");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "main-only secrets");
}

void GovernancePreviewInstallIsRejected()
{
    using var fixture = new GovernanceFixture();
    fixture.MutatePreview("steps:", "steps:\n      - run: npm install");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "never execute PR dependency scripts");
}

void GovernanceOldTokenIsRejected()
{
    using var fixture = new GovernanceFixture();
    fixture.MutatePreview("SWA_NET_DEPLOYMENT_TOKEN", "AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_NET");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "old repository-level token names");
}

void GovernanceScopedTokensAreRequired()
{
    using var fixture = new GovernanceFixture();
    fixture.MutateBuild("SWA_COM_DEPLOYMENT_TOKEN", "SWA_OLD_TOKEN");
    Throws<InvalidOperationException>(() => GovernanceValidator.ValidateDeploymentBoundary(fixture.Root), "environment-scoped token names");
}

void ArtifactValidArchiveExtracts()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive(("assets/site.js", "static content"));
    var destination = Path.Combine(fixture.Root, "dist");
    PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath);
    Equal("static content", File.ReadAllText(Path.Combine(destination, "assets", "site.js")));
    Equal("<title>Jamula</title>", File.ReadAllText(Path.Combine(destination, "index.html")));
}

void ArtifactDirectoryEntryAllowed()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive((IEnumerable<ZipEntryFixture>)[
        new ZipEntryFixture("assets/", "", 0x4000),
        new ZipEntryFixture("assets/icon.svg", "icon")
    ]);
    var destination = Path.Combine(fixture.Root, "dist");
    PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath);
    Equal("icon", File.ReadAllText(Path.Combine(destination, "assets", "icon.svg")));
}

void ArtifactUnsafePathsRejected()
{
    using var fixture = new ArtifactFixture();
    foreach (var path in new[] { "../escape", "/escape", "a/../../escape", "a\\escape", "C:/escape", "a//b", ".", "a/./b", "a/.." })
    {
        var archive = fixture.CreateArchive((path, "bad"));
        var destination = Path.Combine(fixture.Root, "dist");
        Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath));
        Check(!Directory.Exists(destination), "unsafe-path-validation-created-no-output");
    }
}

void ArtifactControlCharacterRejected()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive(("asset\u0001.js", "bad"));
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, Path.Combine(fixture.Root, "dist"), fixture.ConfigPath));
}

void ArtifactDuplicatesRejected()
{
    using var fixture = new ArtifactFixture();
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(("index.html", "duplicate")), Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "duplicated");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(("INDEX.HTML", "case collision")), Path.Combine(fixture.Root, "other"), fixture.ConfigPath), "duplicated");
}

void ArtifactUnicodeCaseFoldCollisionRejected()
{
    using var fixture = new ArtifactFixture();
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(("asset-ß.txt", "one"), ("asset-ss.txt", "two")),
        Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "duplicated");
}

void ArtifactDuplicateDirectoryEntriesRejected()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive((IEnumerable<ZipEntryFixture>)[
        new ZipEntryFixture("assets/", "", 0x4000),
        new ZipEntryFixture("assets/", "", 0x4000)
    ]);
    var destination = Path.Combine(fixture.Root, "dist");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath), "duplicated");
    Check(!Directory.Exists(destination), "duplicate-directory-validation-created-no-output");
}

void ArtifactTraversalDirectoryEntryRejected()
{
    using var fixture = new ArtifactFixture();
    var destination = Path.Combine(fixture.Root, "dist");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(Entry("../outside/", "", 0x4000)), destination, fixture.ConfigPath));
    Check(!Directory.Exists(destination), "traversal-directory-validation-created-no-output");
    Check(!Directory.Exists(Path.Combine(fixture.Root, "outside")), "traversal-directory-created-no-outside-path");
}

void ArtifactMalformedZipDirectoriesRejected()
{
    using var fixture = new ArtifactFixture();
    var malformedArchives = new List<string>();
    var missingEndRecord = fixture.CreateArchive();
    using (var stream = new FileStream(missingEndRecord, FileMode.Open, FileAccess.Write))
    {
        stream.SetLength(stream.Length - 22);
    }
    malformedArchives.Add(missingEndRecord);

    var invalidCentralDirectory = fixture.CreateArchive();
    var bytes = File.ReadAllBytes(invalidCentralDirectory);
    var endRecord = FindSignature(bytes, 0x06054b50);
    var centralOffset = BitConverter.ToInt32(bytes, endRecord + 16);
    bytes[centralOffset] = 0;
    File.WriteAllBytes(invalidCentralDirectory, bytes);
    malformedArchives.Add(invalidCentralDirectory);

    foreach (var archive in malformedArchives)
    {
        var destination = Path.Combine(fixture.Root, "dist-" + Path.GetFileName(archive));
        Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath), "invalid ZIP directory");
        Check(!Directory.Exists(destination), "malformed-zip-validation-created-no-output");
    }
}

void ArtifactSymlinkEntryRejected()
{
    using var fixture = new ArtifactFixture();
    var link = Entry("link", "../escape", 0xA000);
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(link), Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "non-regular");
}

void ArtifactEncryptedEntryRejected()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive(("assets/encrypted.txt", "secret"));
    SetEncryptedBit(archive);
    var destination = Path.Combine(fixture.Root, "dist");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath));
    Check(!Directory.Exists(destination), "encrypted-entry-validation-created-no-output");
}

void ArtifactDeclaredSizeMismatchRejected()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive();
    SetFirstEntrySizeToZero(archive);
    var destination = Path.Combine(fixture.Root, "dist");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath));
    Check(!Directory.Exists(destination), "invalid-size-validation-created-no-output");
}

void ArtifactCompressedSizeLimitEnforced()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive();
    using (var stream = new FileStream(archive, FileMode.Open, FileAccess.Write))
    {
        stream.SetLength(PreviewArtifactValidator.MaxBytes + 1);
    }
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "compressed");
}

void ArtifactExpandedSizeLimitEnforced()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchive(("large.bin", new byte[PreviewArtifactValidator.MaxBytes]));
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "expanded");
}

void ArtifactExpandedSizeAtLimitAccepted()
{
    using var fixture = new ArtifactFixture();
    var archive = fixture.CreateArchiveWithEntries([
        new ZipEntryFixture("large.bin", new byte[PreviewArtifactValidator.MaxBytes])
    ]);
    var destination = Path.Combine(fixture.Root, "dist");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, destination, fixture.ConfigPath), "required static files");
    Check(!Directory.Exists(destination), "at-limit-preflight-reaches-required-file-check-without-output");
}

void ArtifactFileCountBoundaryEnforced()
{
    using var fixture = new ArtifactFixture();
    var atLimit = fixture.CreateArchiveWithEntryCount(PreviewArtifactValidator.MaxFiles);
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(atLimit, Path.Combine(fixture.Root, "at-limit"), fixture.ConfigPath), "missing required static files");
    var overLimit = fixture.CreateArchiveWithEntryCount(PreviewArtifactValidator.MaxFiles + 1);
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(overLimit, Path.Combine(fixture.Root, "over-limit"), fixture.ConfigPath), "invalid file count");
}

void ArtifactEmptyArchiveRejected()
{
    using var fixture = new ArtifactFixture();
    var archive = Path.Combine(fixture.Root, "empty.zip");
    using (ZipFile.Open(archive, ZipArchiveMode.Create)) { }
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(archive, Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "invalid file count");
}

void ArtifactRequiredFilesEnforced()
{
    using var fixture = new ArtifactFixture();
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchiveWithEntries([new ZipEntryFixture("index.html", "only")]),
        Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "required static files");
}

void ArtifactConfigParityEnforced()
{
    using var fixture = new ArtifactFixture();
    var changed = JsonSerializer.Serialize(new { globalHeaders = new { X_Frame_Options = "SAMEORIGIN" } });
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(config: changed), Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "trusted default branch");
}

void ArtifactConfigPropertyOrderIgnored()
{
    using var fixture = new ArtifactFixture();
    var orderChanged = """{"globalHeaders":{"X-Frame-Options":"DENY","X-Content-Type-Options":"nosniff"}}""";
    File.WriteAllText(fixture.ConfigPath, """{"globalHeaders":{"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY"}}""");
    var destination = Path.Combine(fixture.Root, "dist");
    PreviewArtifactValidator.ExtractPreview(fixture.CreateArchive(config: orderChanged), destination, fixture.ConfigPath);
    Check(File.Exists(Path.Combine(destination, "index.html")), "json-object-property-order-does-not-change-configuration");
}

void ArtifactNonRegularEntryRejected()
{
    using var fixture = new ArtifactFixture();
    var device = Entry("device", "x", 0x2000);
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(device), Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "non-regular");
}

void ArtifactTreeConflictRejected()
{
    using var fixture = new ArtifactFixture();
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(("assets", "file"), ("assets/icon.svg", "child")),
        Path.Combine(fixture.Root, "dist"), fixture.ConfigPath), "duplicated");
}

void ArtifactNonEmptyDestinationPreserved()
{
    using var fixture = new ArtifactFixture();
    var destination = Path.Combine(fixture.Root, "dist");
    Directory.CreateDirectory(destination);
    var existing = Path.Combine(destination, "index.html");
    File.WriteAllText(existing, "existing");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(), destination, fixture.ConfigPath), "destination must be empty");
    Equal("existing", File.ReadAllText(existing));
}

void ArtifactFileDestinationRejected()
{
    using var fixture = new ArtifactFixture();
    var destination = Path.Combine(fixture.Root, "dist");
    File.WriteAllText(destination, "keep");
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(), destination, fixture.ConfigPath), "destination must be empty");
    Equal("keep", File.ReadAllText(destination));
}

void ArtifactSymlinkDestinationRejected()
{
    using var fixture = new ArtifactFixture();
    var target = Path.Combine(fixture.Root, "target");
    Directory.CreateDirectory(target);
    var link = Path.Combine(fixture.Root, "linked");
    if (OperatingSystem.IsWindows())
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            }
        };
        process.StartInfo.ArgumentList.Add("-NoProfile");
        process.StartInfo.ArgumentList.Add("-NonInteractive");
        process.StartInfo.ArgumentList.Add("-Command");
        process.StartInfo.ArgumentList.Add($"New-Item -ItemType Junction -Path '{link}' -Target '{target}' | Out-Null");
        process.Start();
        process.WaitForExit();
        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Temporary junction fixture creation failed: {process.StandardError.ReadToEnd()}");
        }
    }
    else
    {
        Directory.CreateSymbolicLink(link, target);
    }
    Throws<InvalidDataException>(() => PreviewArtifactValidator.ExtractPreview(
        fixture.CreateArchive(), link, fixture.ConfigPath), "destination must be empty");
    Check(!Directory.EnumerateFileSystemEntries(target).Any(), "symlink-target-remains-untouched");
}

void PreviewAllowedUrlAccepted()
{
    Equal("ashy-beach-033c7d01e-74.7.azurestaticapps.net",
        PreviewSiteVerifier.ParseAllowedUrl("https://ashy-beach-033c7d01e-74.7.azurestaticapps.net/").Host);
    Equal("ashy-beach-033c7d01e-1.7.azurestaticapps.net",
        PreviewSiteVerifier.ParseAllowedUrl("https://ashy-beach-033c7d01e-1.7.azurestaticapps.net").Host);
}

void PreviewInvalidUrlsRejected()
{
    using var fixture = new PreviewFixture();
    var client = fixture.ValidClient();
    foreach (var url in new[]
    {
        "https://ashy-beach-033c7d01e.7.azurestaticapps.net",
        "https://ashy-beach-033c7d01e-0.7.azurestaticapps.net",
        "https://ashy-beach-033c7d01e-01.7.azurestaticapps.net",
        "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net/path",
        "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net?redirect=elsewhere",
        "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net#section",
        "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net:444",
        "http://ashy-beach-033c7d01e-74.7.azurestaticapps.net",
        "https://jamula.net",
        "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net.evil.example"
    })
    {
        Throws<ArgumentException>(() => PreviewSiteVerifier.ParseAllowedUrl(url));
        Throws<ArgumentException>(() => PreviewSiteVerifier.VerifyAsync(
            url, fixture.ConfigPath, client, TextWriter.Null, (_, _) => Task.CompletedTask)
            .GetAwaiter().GetResult());
    }
    Check(fixture.Requests.Count == 0, "invalid-preview-urls-trigger-no-http-requests");
}

void PreviewClientPolicyIsConfigured()
{
    using var handler = PreviewSiteVerifier.CreateHttpHandler();
    Check(!handler.AllowAutoRedirect, "http-handler-disables-automatic-redirects");
    using var client = PreviewSiteVerifier.CreateHttpClient();
    Equal(TimeSpan.FromSeconds(20), client.Timeout);
}

void PreviewValidResponseVerified()
{
    using var fixture = new PreviewFixture();
    var client = fixture.ValidClient();
    PreviewSiteVerifier.VerifyAsync(PreviewFixture.Url, fixture.ConfigPath, client, TextWriter.Null,
        (_, _) => Task.CompletedTask).GetAwaiter().GetResult();
    Equal(3, fixture.Requests.Count);
    Equal(PreviewFixture.Url + "/", fixture.Requests[0]);
    Equal(PreviewFixture.Url + "/robots.txt", fixture.Requests[1]);
    Equal(PreviewFixture.Url + "/__jamula_missing_route__", fixture.Requests[2]);
}

void PreviewResponseFailure(string mutation, string expectedMessage)
{
    using var fixture = new PreviewFixture();
    var client = fixture.ClientFor(mutation);
    Throws<InvalidDataException>(() => PreviewSiteVerifier.VerifyAsync(
        PreviewFixture.Url, fixture.ConfigPath, client, TextWriter.Null, (_, _) => Task.CompletedTask)
        .GetAwaiter().GetResult(), expectedMessage);
}

void PreviewRobotsServerErrorRejected()
{
    using var fixture = new PreviewFixture();
    var client = fixture.ClientFor("robots-error");
    var error = Throws<HttpRequestException>(() => PreviewSiteVerifier.VerifyAsync(
        PreviewFixture.Url, fixture.ConfigPath, client, TextWriter.Null, (_, _) => Task.CompletedTask)
        .GetAwaiter().GetResult());
    Equal(HttpStatusCode.ServiceUnavailable, error.StatusCode);
    Equal(2, fixture.Requests.Count);
    Equal(PreviewFixture.Url + "/robots.txt", fixture.Requests[1]);
}

void PreviewReadinessRetriesBounded()
{
    using var fixture = new PreviewFixture();
    var client = fixture.ClientFor("not-ready");
    var errors = new StringWriter();
    var delays = new List<TimeSpan>();
    var error = Throws<HttpRequestException>(() => PreviewSiteVerifier.VerifyAsync(
        PreviewFixture.Url, fixture.ConfigPath, client, errors,
        (delay, _) => { delays.Add(delay); return Task.CompletedTask; }).GetAwaiter().GetResult());
    Check(error.Message.Contains("503", StringComparison.Ordinal), "readiness-final-failure-is-visible");
    Equal(18, fixture.Requests.Count);
    Equal(17, delays.Count);
    Check(delays.All(delay => delay == TimeSpan.FromSeconds(10)), "readiness-delay-is-ten-seconds");
    Check(errors.ToString().Contains("attempt 18 failed", StringComparison.Ordinal), "eighteenth-readiness-failure-is-logged");
}

void PreviewRedirectIsNotFollowed()
{
    using var fixture = new PreviewFixture();
    var client = fixture.ClientFor("redirect");
    var errors = new StringWriter();
    Throws<HttpRequestException>(() => PreviewSiteVerifier.VerifyAsync(
        PreviewFixture.Url, fixture.ConfigPath, client, errors, (_, _) => Task.CompletedTask)
        .GetAwaiter().GetResult());
    Check(fixture.Requests.All(request => request == PreviewFixture.Url + "/"), "redirect-target-is-never-requested");
    Equal(18, fixture.Requests.Count);
}

static void SetEncryptedBit(string archive)
{
    var bytes = File.ReadAllBytes(archive);
    var central = FindSignature(bytes, 0x02014b50);
    var local = FindSignature(bytes, 0x04034b50);
    bytes[central + 8] |= 1;
    bytes[local + 6] |= 1;
    File.WriteAllBytes(archive, bytes);
}

static void SetFirstEntrySizeToZero(string archive)
{
    var bytes = File.ReadAllBytes(archive);
    var central = FindSignature(bytes, 0x02014b50);
    var local = FindSignature(bytes, 0x04034b50);
    Array.Clear(bytes, central + 24, 4);
    Array.Clear(bytes, local + 22, 4);
    File.WriteAllBytes(archive, bytes);
}

static int FindSignature(byte[] bytes, uint signature)
{
    var marker = BitConverter.GetBytes(signature);
    for (var index = 0; index <= bytes.Length - marker.Length; index++)
    {
        if (bytes.AsSpan(index, marker.Length).SequenceEqual(marker))
        {
            return index;
        }
    }
    throw new InvalidDataException("ZIP signature not found.");
}

static ZipEntryFixture Entry(string name, string content, int fileType) => new(name, content, fileType);

static void Check(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}

static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
    {
        throw new InvalidOperationException($"Expected '{expected}', got '{actual}'.");
    }
}

static TException Throws<TException>(Action action, string? messagePart = null)
    where TException : Exception
{
    try
    {
        action();
    }
    catch (TException error)
    {
        if (messagePart is not null && !error.Message.Contains(messagePart, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Expected diagnostic containing '{messagePart}', got '{error.Message}'.");
        }
        return error;
    }
    throw new InvalidOperationException($"Expected {typeof(TException).Name}.");
}

sealed class TestRunner
{
    public int Count { get; private set; }

    public void Run(string name, Action test)
    {
        try
        {
            test();
            Count++;
            Console.WriteLine($"PASS: {name}");
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"FAIL: {name}: {error}");
            throw;
        }
    }
}

sealed class TemporaryDirectory : IDisposable
{
    public string Root { get; } = Path.Combine(Path.GetTempPath(), "jamula-validation-" + Guid.NewGuid().ToString("N"));
    public TemporaryDirectory() => Directory.CreateDirectory(Root);
    public void Dispose()
    {
        if (Directory.Exists(Root))
        {
            DeleteContents(Root);
            Directory.Delete(Root);
        }
    }

    private static void DeleteContents(string path)
    {
        foreach (var child in Directory.EnumerateFileSystemEntries(path))
        {
            var attributes = File.GetAttributes(child);
            if (attributes.HasFlag(FileAttributes.ReparsePoint))
            {
                if (attributes.HasFlag(FileAttributes.Directory)) Directory.Delete(child);
                else File.Delete(child);
            }
            else if (attributes.HasFlag(FileAttributes.Directory))
            {
                DeleteContents(child);
                Directory.Delete(child);
            }
            else
            {
                File.Delete(child);
            }
        }
    }
}

sealed class GovernanceFixture : IDisposable
{
    private readonly TemporaryDirectory _directory = new();
    public string Root => _directory.Root;

    public GovernanceFixture()
    {
        foreach (var required in new[]
        {
            "LICENSE", "LICENSE_SCOPE.md", "TRADEMARKS.md", "CONTRIBUTING.md", "THIRD_PARTY_NOTICES.md",
            "docs/README.md", "docs/planning/evaluation-plan.md", "docs/legal/license-inventory.md",
            ".github/skills/cloud-solution-architect/references/source.md"
        })
        {
            Write(required, "fixture");
        }
        Write(".github/skills/cloud-solution-architect/SKILL.md", "See [source](./references/source.md).");
        Write(".copilot/settings.json", "{}");
        Write(".vscode/settings.json", "{}");
        Write(".gitignore", ".env.*\n!.env.example\n");
        Write(".github/workflows/azure-static-web-apps.yml", BuildWorkflow.Replace("\r\n", "\n", StringComparison.Ordinal));
        Write(".github/workflows/azure-static-web-apps-preview.yml", PreviewWorkflow.Replace("\r\n", "\n", StringComparison.Ordinal));
        RunGit("init", "-q");
    }

    public void MutateBuild(string marker, string replacement) => Mutate(".github/workflows/azure-static-web-apps.yml", marker, replacement);
    public void MutatePreview(string marker, string replacement) => Mutate(".github/workflows/azure-static-web-apps-preview.yml", marker, replacement);
    private void Mutate(string path, string marker, string replacement)
    {
        var file = Path.Combine(Root, path.Replace('/', Path.DirectorySeparatorChar));
        var text = File.ReadAllText(file);
        if (!text.Contains(marker, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Fixture mutation marker was not found.");
        }
        File.WriteAllText(file, text.Replace(marker, replacement, StringComparison.Ordinal));
    }
    private void Write(string relative, string text)
    {
        var path = Path.Combine(Root, relative.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path, text);
    }
    private void RunGit(params string[] args)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo { FileName = "git", WorkingDirectory = Root, UseShellExecute = false }
        };
        foreach (var arg in args) process.StartInfo.ArgumentList.Add(arg);
        process.Start();
        process.WaitForExit();
        if (process.ExitCode != 0) throw new InvalidOperationException("Temporary git fixture initialization failed.");
    }
    public void Dispose() => _directory.Dispose();

    private const string BuildWorkflow = """
        on:
          workflow_dispatch:
        jobs:
          prepare:
            steps: []
          build:
            steps: []
          deploy:
            if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'
            environment: swa-deployment
          deploy-com:
            if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'
            environment: swa-deployment
            token: SWA_COM_DEPLOYMENT_TOKEN
          publish:
            needs: [prepare, build, deploy, deploy-com]
        token: SWA_NET_DEPLOYMENT_TOKEN
        """;
    private const string PreviewWorkflow = """
        on:
          workflow_run:
        jobs:
          preview:
            environment: swa-deployment
            ref: ${{ github.workflow_sha }}
            token: SWA_NET_DEPLOYMENT_TOKEN
            steps:
              - run: trusted tools
        """;
}

sealed record ZipEntryFixture(string Name, object Content, int FileType = 0);

sealed class ArtifactFixture : IDisposable
{
    private readonly TemporaryDirectory _directory = new();
    public string Root => _directory.Root;
    public string ConfigPath { get; } = "";
    private readonly string _configPath;
    private readonly string _config = """{"globalHeaders":{"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY"}}""";

    public ArtifactFixture()
    {
        _configPath = Path.Combine(Root, "trusted.json");
        File.WriteAllText(_configPath, _config);
        ConfigPath = _configPath;
    }

    public string CreateArchive(IEnumerable<ZipEntryFixture>? extra = null, string? config = null)
    {
        var path = Path.Combine(Root, "site-" + Guid.NewGuid().ToString("N") + ".zip");
        using var archive = ZipFile.Open(path, ZipArchiveMode.Create);
        Add(archive, "index.html", "<title>Jamula</title>");
        Add(archive, "404.html", "Page not found");
        Add(archive, "robots.txt", "User-agent: *");
        Add(archive, "staticwebapp.config.json", config ?? _config);
        foreach (var entry in extra ?? [])
        {
            var zipEntry = Add(archive, entry.Name, entry.Content);
            if (entry.FileType != 0)
            {
                zipEntry.ExternalAttributes = (entry.FileType | 0x1FF) << 16;
            }
        }
        return path;
    }

    public string CreateArchive(ZipEntryFixture extra, string? config = null) =>
        CreateArchive((IEnumerable<ZipEntryFixture>)[extra], config);

    public string CreateArchive((string Name, string Content) extra, string? config = null) =>
        CreateArchive([new ZipEntryFixture(extra.Name, extra.Content)], config);

    public string CreateArchive((string Name, byte[] Content) extra, string? config = null) =>
        CreateArchive(new ZipEntryFixture(extra.Name, extra.Content), config);

    public string CreateArchive((string Name, string Content) first, (string Name, string Content) second) =>
        CreateArchive((IEnumerable<ZipEntryFixture>)[
            new ZipEntryFixture(first.Name, first.Content),
            new ZipEntryFixture(second.Name, second.Content)
        ]);

    public string CreateArchiveWithEntryCount(int count)
    {
        var path = Path.Combine(Root, "count-" + count + ".zip");
        using var archive = ZipFile.Open(path, ZipArchiveMode.Create);
        for (var index = 0; index < count; index++)
        {
            Add(archive, $"entry-{index:D5}.txt", "x");
        }
        return path;
    }

    public string CreateArchiveWithEntries(IEnumerable<ZipEntryFixture> entries)
    {
        var path = Path.Combine(Root, "incomplete.zip");
        using var archive = ZipFile.Open(path, ZipArchiveMode.Create);
        foreach (var entry in entries)
        {
            var zipEntry = Add(archive, entry.Name, entry.Content);
            if (entry.FileType != 0)
            {
                zipEntry.ExternalAttributes = (entry.FileType | 0x1FF) << 16;
            }
        }
        return path;
    }

    private static ZipArchiveEntry Add(ZipArchive archive, string name, object value)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.Fastest);
        using var stream = entry.Open();
        switch (value)
        {
            case string text:
                using (var writer = new StreamWriter(stream, new UTF8Encoding(false), leaveOpen: true)) writer.Write(text);
                break;
            case byte[] bytes:
                stream.Write(bytes);
                break;
            default:
                throw new InvalidOperationException("Unsupported archive fixture content.");
        }
        return entry;
    }

    public void Dispose() => _directory.Dispose();
}

sealed class PreviewFixture : IDisposable
{
    public const string Url = "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net";
    private readonly TemporaryDirectory _directory = new();
    public List<string> Requests { get; } = [];
    public string ConfigPath { get; }
    private readonly Dictionary<string, string> _headers;

    public PreviewFixture()
    {
        var root = FindRepositoryRoot();
        ConfigPath = Path.Combine(root, "www", "public", "staticwebapp.config.json");
        _headers = JsonDocument.Parse(File.ReadAllText(ConfigPath)).RootElement.GetProperty("globalHeaders")
            .EnumerateObject().ToDictionary(property => property.Name, property => property.Value.GetString()!);
    }

    public HttpClient ValidClient() => ClientFor("valid");

    public HttpClient ClientFor(string mode)
    {
        Requests.Clear();
        return new HttpClient(new CallbackHandler(request =>
        {
            var path = request.RequestUri!.AbsolutePath;
            Requests.Add(request.RequestUri.ToString());
            if (path == "/" && mode == "not-ready")
            {
                return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
            }
            if (path == "/" && mode == "redirect")
            {
                var redirect = new HttpResponseMessage(HttpStatusCode.Redirect);
                redirect.Headers.Location = new Uri("https://outside.example/");
                return redirect;
            }
            if (path == "/")
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = TextContent(mode == "title" ? "<title>Unexpected</title>" : "<title>Jamula</title>")
                };
                foreach (var (name, value) in _headers)
                {
                    if (mode == "hsts" && name == "Strict-Transport-Security") continue;
                    response.Headers.TryAddWithoutValidation(name, mode == "header" && name == "X-Frame-Options" ? "SAMEORIGIN" : value);
                }
                if (mode != "hsts" && !_headers.ContainsKey("Strict-Transport-Security"))
                    response.Headers.TryAddWithoutValidation("Strict-Transport-Security", "max-age=31536000");
                if (mode != "noindex") response.Headers.TryAddWithoutValidation("X-Robots-Tag", "none");
                return response;
            }
            if (path == "/robots.txt")
            {
                if (mode == "robots-error")
                {
                    return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
                }
                var content = TextContent("");
                content.Headers.ContentType = new MediaTypeHeaderValue(mode == "robots-mime" ? "text/html" : "text/plain");
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = content };
            }
            return mode switch
            {
                "missing-route-success" => new HttpResponseMessage(HttpStatusCode.OK) { Content = TextContent("Page not found") },
                "missing-route-body" => new HttpResponseMessage(HttpStatusCode.NotFound) { Content = TextContent("Not Found") },
                _ => new HttpResponseMessage(HttpStatusCode.NotFound) { Content = TextContent("Page not found") }
            };
        }));
    }

    private static StringContent TextContent(string text) => new(text, Encoding.UTF8, "text/html");

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(Environment.CurrentDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, ".github", "workflows", "governance-validation.yml")))
            {
                return directory.FullName;
            }
        }
        throw new DirectoryNotFoundException("Repository root not found.");
    }

    public void Dispose() => _directory.Dispose();
}

sealed class CallbackHandler(Func<HttpRequestMessage, HttpResponseMessage> callback) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(callback(request));
}
