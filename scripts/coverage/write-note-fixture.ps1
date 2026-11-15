param(
    [Parameter(Mandatory)][string]$Template,
    [Parameter(Mandatory)][string]$FixtureDirectory
)

$ErrorActionPreference = 'Continue'
$env:PATH = $FixtureDirectory
$scenario = [System.Text.Encoding]::UTF8.GetString(
    [Convert]::FromBase64String($env:WRITE_NOTE_SCENARIO)
) | ConvertFrom-Json
$global:writeNoteStepIndex = 0
$global:writeNoteLogPath = Join-Path $FixtureDirectory 'events.jsonl'

function Record-Event($event) {
    $event | ConvertTo-Json -Compress -Depth 20 | Add-Content -LiteralPath $global:writeNoteLogPath -Encoding utf8
}

function git {
    $actual = @($args | ForEach-Object { "$_" })
    $kind = if ($actual.Count -ge 5 -and $actual[2] -eq 'notes') {
        "notes-$($actual[4])"
    } elseif ($actual.Count -ge 3) {
        $actual[2]
    } else {
        'invalid'
    }

    if ($global:writeNoteStepIndex -ge $scenario.steps.Count -or
        $scenario.steps[$global:writeNoteStepIndex].kind -ne $kind) {
        throw "Unexpected git command: $($actual -join ' ')"
    }
    $step = $scenario.steps[$global:writeNoteStepIndex]
    $global:writeNoteStepIndex++
    Record-Event @{ kind = $kind; args = $actual }
    $global:LASTEXITCODE = [int]$step.exitCode
    if ($step.output) { Write-Output $step.output }
}

function Get-Random {
    param($Minimum, $Maximum)
    if ($Minimum -ne 0 -or $Maximum -ne 1000) {
        throw 'Unexpected random range'
    }
    return 0
}

function Start-Sleep {
    param($Seconds)
    Record-Event @{ kind = 'sleep'; seconds = $Seconds }
}

$parameters = @{
    Agent = $scenario.agent
    Type = $scenario.type
    Content = $scenario.content
    Commit = $scenario.commit
    RepoPath = $FixtureDirectory
    Remote = $scenario.remote
}
foreach ($flag in @('Promote', 'Archive', 'NoPush', 'Quiet')) {
    if ($scenario.flags -contains $flag) { $parameters[$flag] = $true }
}

try {
    & $Template @parameters
    if (-not $?) { exit 1 }
} catch {
    [Console]::Error.WriteLine($_.ScriptStackTrace)
    throw
}
if ($global:writeNoteStepIndex -ne $scenario.steps.Count) {
    throw "Unused git fixture steps: $($scenario.steps.Count - $global:writeNoteStepIndex)"
}
