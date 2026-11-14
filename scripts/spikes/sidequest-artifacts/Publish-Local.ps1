[CmdletBinding(DefaultParameterSetName = 'Independent')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Independent')]
    [ValidateSet('Admin', 'Finance', 'Tech', 'Gateway')]
    [string] $Section,
    [Parameter(Mandatory, ParameterSetName = 'Collective')]
    [switch] $All,
    [ValidatePattern('^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$')]
    [string] $Version = '1.0.0',
    [string] $OutputRoot = (Join-Path $PSScriptRoot "artifacts\releases\$([Guid]::NewGuid().ToString('N'))")
)
$ErrorActionPreference = 'Stop'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = 'true'
$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$components = if ($All) { @('Admin', 'Finance', 'Tech', 'Gateway') } else { @($Section) }
foreach ($component in $components) {
    $destination = Join-Path $OutputRoot "$component\$Version"
    if (Test-Path $destination) { throw 'A local release directory cannot be reused.' }
}
foreach ($component in $components) {
    $destination = Join-Path $OutputRoot "$component\$Version"
    $project = Join-Path $PSScriptRoot "$component\$component.csproj"
    # Framework-only restore, with all package feeds explicitly removed.
    & dotnet publish $project --configuration Release --output $destination --nologo --disable-build-servers `
        "-p:Version=$Version" "-p:RestoreConfigFile=$(Join-Path $PSScriptRoot 'offline.nuget.config')" `
        '-p:NuGetAudit=false' '-p:UseAppHost=false' *> $null
    if ($LASTEXITCODE -ne 0) { throw "Offline publish failed for $component." }
    Write-Output "RELEASED:$component/$Version"
}
