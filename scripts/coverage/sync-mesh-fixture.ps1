param(
    [Parameter(Mandatory)][string]$TemplatePath,
    [Parameter(Mandatory)][string]$FixtureDirectory,
    [Parameter(Mandatory)][string]$ScenarioPath,
    [Parameter(Mandatory)][string]$EventLogPath
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$expectedTemplate = [System.IO.Path]::GetFullPath(
    (Join-Path $repositoryRoot ".squad\templates\skills\distributed-mesh\sync-mesh.ps1")
)
$templateFullPath = [System.IO.Path]::GetFullPath($TemplatePath)
$temporaryRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$fixtureFullPath = [System.IO.Path]::GetFullPath($FixtureDirectory)
$temporaryRootWithSeparator = $temporaryRoot.TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar
) + [System.IO.Path]::DirectorySeparatorChar

if (-not [System.IO.File]::Exists($expectedTemplate) -or
    -not [string]::Equals(
        $templateFullPath,
        $expectedTemplate,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
    throw "Refusing to execute a source outside the tracked sync-mesh template."
}
if (-not $fixtureFullPath.StartsWith(
    $temporaryRootWithSeparator,
    [System.StringComparison]::OrdinalIgnoreCase
)) {
    throw "Fixture directory must be under the system temporary directory."
}

$scenario = Get-Content -LiteralPath $ScenarioPath -Raw | ConvertFrom-Json
$global:syncMeshFixtureEventLogPath = $EventLogPath
$global:syncMeshFixtureDirectory = $fixtureFullPath
$global:syncMeshFixtureScenario = $scenario
$env:PATH = $fixtureFullPath
Set-Location -LiteralPath $fixtureFullPath

$trustedZone = if ($scenario.trustedZone) { [string]$scenario.trustedZone } else { "local" }
$opaqueZone = if ($scenario.opaqueZone) { [string]$scenario.opaqueZone } else { "remote-opaque" }
$opaqueAuth = if ($scenario.opaqueAuth) { [string]$scenario.opaqueAuth } else { "none" }
$config = @{
    squads = @{
        "trusted-squad" = @{
            zone = $trustedZone
            source = "https://git.example.invalid/team/trusted.git"
            ref = "main"
            sync_to = "remotes/trusted"
        }
        "opaque-squad" = @{
            zone = $opaqueZone
            source = "https://partner.example.invalid/summary.md"
            sync_to = "remotes/opaque"
            auth = $opaqueAuth
        }
    }
}
$config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath "mesh.json"

if ($scenario.trustedMode -eq "pull") {
    New-Item -ItemType Directory -Force -Path "remotes/trusted/.git" | Out-Null
}

function Write-FixtureEvent($event) {
    $json = ConvertTo-Json -InputObject $event -Compress -Depth 10
    [System.IO.File]::AppendAllText(
        $global:syncMeshFixtureEventLogPath,
        $json + [System.Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )
}

function git {
    $gitArgs = @($args | ForEach-Object { [string]$_ })
    Write-FixtureEvent @{ kind = "git"; args = $gitArgs }
    $global:LASTEXITCODE = [int]$global:syncMeshFixtureScenario.gitExitCode
}

function Invoke-WebRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Uri,
        [Parameter(Mandatory)][string]$OutFile,
        [bool]$UseBasicParsing,
        [hashtable]$Headers
    )

    if ([System.IO.Path]::IsPathRooted($OutFile)) {
        throw "Refusing an absolute web fixture output path."
    }

    Write-FixtureEvent @{
        kind = "web"
        uri = $Uri
        outfile = $OutFile
        useBasicParsing = $UseBasicParsing
        headers = $Headers
    }

    $fullOutFile = [System.IO.Path]::GetFullPath(
        (Join-Path $global:syncMeshFixtureDirectory $OutFile)
    )
    $rootWithSeparator = $global:syncMeshFixtureDirectory.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    ) + [System.IO.Path]::DirectorySeparatorChar
    if (-not $fullOutFile.StartsWith(
        $rootWithSeparator,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Refusing to write a web fixture outside the temporary directory."
    }

    if ($global:syncMeshFixtureScenario.webFailure) {
        throw "Fixture web request failed."
    }
    Set-Content -LiteralPath $OutFile -Value "published fixture contract"
}

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$webRequestCommand = Get-Command Invoke-WebRequest -ErrorAction SilentlyContinue
if ($gitCommand.CommandType -ne [System.Management.Automation.CommandTypes]::Function -or
    $webRequestCommand.CommandType -ne [System.Management.Automation.CommandTypes]::Function) {
    throw "Refusing to execute the source without fake Git and web request functions."
}
$probePath = Join-Path $fixtureFullPath "command-resolution-probe.ps1"
@'
$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$webRequestCommand = Get-Command Invoke-WebRequest -ErrorAction SilentlyContinue
if ($gitCommand.CommandType -ne [System.Management.Automation.CommandTypes]::Function -or
    $webRequestCommand.CommandType -ne [System.Management.Automation.CommandTypes]::Function) {
    throw "Fake commands are not visible to a child script."
}
'@ | Set-Content -LiteralPath $probePath
& $probePath
if (-not $?) {
    throw "Refusing to execute the source without child-scope fake commands."
}
Remove-Item -LiteralPath $probePath
Write-FixtureEvent @{
    kind = "guard"
    gitCommandType = $gitCommand.CommandType.ToString()
    webRequestCommandType = $webRequestCommand.CommandType.ToString()
}

try {
    if ($scenario.init) {
        & $templateFullPath -Init -MeshJson "mesh.json"
    } else {
        & $templateFullPath -MeshJson "mesh.json"
    }
    if (-not $?) {
        throw "sync-mesh.ps1 returned an unsuccessful status."
    }
} catch {
    [System.Console]::Error.WriteLine($_.ToString())
    exit 1
}
