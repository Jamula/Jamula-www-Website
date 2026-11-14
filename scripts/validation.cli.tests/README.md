# Validation CLI checks

From the repository root, run the dependency-free, offline CLI checks with:

```powershell
dotnet run --project scripts\validation.cli.tests\JamulaValidation.Cli.Tests.csproj --configuration Release
```

Each check runs the real validation executable in a separate process with its
own temporary working directory. Preview URL checks stop at URL or missing
configuration validation before any network request.
