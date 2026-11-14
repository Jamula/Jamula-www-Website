using System.Diagnostics;

internal sealed class Child : IAsyncDisposable
{
    private readonly Process process;
    private readonly Task drainOutput;
    private readonly Task drainError;
    private Child(Process process, Task drainOutput, Task drainError, Uri? address)
    {
        this.process = process;
        this.drainOutput = drainOutput;
        this.drainError = drainError;
        Address = address;
    }
    public int Id => process.Id;
    public bool Exited => process.HasExited;
    public Uri? Address { get; }

    public static async Task<Child> StartAsync(string executable, string directory,
        IEnumerable<string> arguments, bool host, TimeSpan? readinessTimeout = null,
        Action<int>? started = null, bool instrumentForCoverage = false)
    {
        var info = new ProcessStartInfo(executable)
        {
            WorkingDirectory = directory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        // Do not pass the calling session's tokens, configuration or logging settings.
        var allowed = new[] { "PATH", "PATHEXT", "SystemRoot", "WINDIR", "DOTNET_ROOT", "TEMP", "TMP",
            "USERPROFILE", "APPDATA", "LOCALAPPDATA", "HOME", "ProgramFiles",
            "ProgramFiles(x86)", "ProgramData", "ALLUSERSPROFILE" };
        var coverageEnvironment = instrumentForCoverage
            ? new[]
            {
                "CORECLR_ENABLE_PROFILING",
                "CORECLR_PROFILER",
                "CORECLR_PROFILER_PATH",
                "CORECLR_PROFILER_PATH_32",
                "CORECLR_PROFILER_PATH_64",
                "CORECLR_PROFILER_PATH_ARM64",
                "COR_ENABLE_PROFILING",
                "COR_PROFILER",
                "COR_PROFILER_PATH",
                "COR_PROFILER_PATH_32",
                "COR_PROFILER_PATH_64",
                "CODE_COVERAGE_DATA_PREFIX",
                "CODE_COVERAGE_FLAGS",
                "CODE_COVERAGE_PIPE_COUNT",
                "CODE_COVERAGE_SESSION_NAME",
                "DOTNET_STARTUP_HOOKS",
                "MicrosoftInstrumentationEngine_ConfigPath32_VanguardInstrumentationProfiler",
                "MicrosoftInstrumentationEngine_ConfigPath64_VanguardInstrumentationProfiler",
                "MicrosoftInstrumentationEngine_ConfigPathARM64_VanguardInstrumentationProfiler",
                "MicrosoftInstrumentationEngine_DisableCodeSignatureValidation",
            }.Select(name => (Name: name, Value: Environment.GetEnvironmentVariable(name)))
            .Where(item => item.Value is not null)
            .ToArray()
            : [];
        info.Environment.Clear();
        foreach (var name in allowed)
            if (Environment.GetEnvironmentVariable(name) is { } value)
                info.Environment[name] = value;
        foreach (var (name, value) in coverageEnvironment)
            info.Environment[name] = value!;
        info.Environment["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1";
        info.Environment["DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE"] = "true";
        info.Environment["DOTNET_SKIP_FIRST_TIME_EXPERIENCE"] = "1";
        foreach (var argument in arguments) info.ArgumentList.Add(argument);
        var process = Process.Start(info) ?? throw new InvalidOperationException("Child start failed.");
        // Consume and discard stderr immediately: no private host/build output in reports.
        var error = DrainAsync(process.StandardError);
        Child? child = null;
        Task<string?>? readiness = null;
        try
        {
            started?.Invoke(process.Id);
            Uri? address = null;
            if (host)
            {
                readiness = process.StandardOutput.ReadLineAsync();
                var line = await readiness.WaitAsync(readinessTimeout ?? TimeSpan.FromSeconds(15));
                if (line is null || !line.StartsWith("READY:", StringComparison.Ordinal) ||
                    !Uri.TryCreate(line[6..], UriKind.Absolute, out address) ||
                    address.Scheme != "http" || address.Host != "127.0.0.1" || address.Port == 0)
                    throw new InvalidOperationException("Child did not report loopback readiness.");
            }
            child = new Child(process, DrainAsync(process.StandardOutput), error, address);
            if (!host)
            {
                await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(120));
                if (process.ExitCode != 0)
                    throw new InvalidOperationException($"Offline release command failed (exit {process.ExitCode}).");
            }
            return child;
        }
        catch
        {
            if (child is not null) await child.DisposeAsync();
            else
            {
                if (!process.HasExited) process.Kill(entireProcessTree: true);
                try
                {
                    await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
                    if (readiness is not null) await readiness.WaitAsync(TimeSpan.FromSeconds(10));
                    await error.WaitAsync(TimeSpan.FromSeconds(10));
                }
                finally { process.Dispose(); }
            }
            throw;
        }
    }

    public async Task StopAsync()
    {
        if (!process.HasExited) process.Kill(entireProcessTree: true);
        await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
        await Task.WhenAll(drainOutput, drainError).WaitAsync(TimeSpan.FromSeconds(10));
    }

    public async ValueTask DisposeAsync()
    {
        try { await StopAsync(); }
        finally { process.Dispose(); }
    }
    private static async Task DrainAsync(StreamReader reader)
    {
        while (await reader.ReadLineAsync() is not null) { }
    }
}
