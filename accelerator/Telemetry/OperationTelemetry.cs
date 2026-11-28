using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace JamulaAccelerator.Telemetry;

public enum OperationOutcome
{
    Success,
    Failure,
    Cancelled
}

public sealed class OperationTelemetry : IDisposable
{
    public const string InstrumentationName = "Jamula.Accelerator";
    private readonly ActivitySource _activities = new(InstrumentationName);
    private readonly Meter _meter = new(InstrumentationName);
    private readonly Counter<long> _completed;
    private readonly Histogram<double> _duration;

    public OperationTelemetry()
    {
        _completed = _meter.CreateCounter<long>("jamula.accelerator.operations");
        _duration = _meter.CreateHistogram<double>("jamula.accelerator.duration", "ms");
    }

    public void RecordCompletion(OperationOutcome outcome, TimeSpan duration)
    {
        var outcomeLabel = outcome switch
        {
            OperationOutcome.Success => "success",
            OperationOutcome.Failure => "failure",
            OperationOutcome.Cancelled => "cancelled",
            _ => throw new ArgumentOutOfRangeException(nameof(outcome))
        };
        ArgumentOutOfRangeException.ThrowIfLessThan(duration, TimeSpan.Zero);

        // A root span avoids inheriting untrusted baggage or trace state from a request.
        var parent = Activity.Current;
        Activity? activity;
        try
        {
            Activity.Current = null;
            activity = _activities.StartActivity("accelerator.operation.completed", ActivityKind.Internal);
        }
        finally
        {
            Activity.Current = parent;
        }

        try
        {
            using (activity)
            {
                if (outcome == OperationOutcome.Failure)
                {
                    activity?.SetStatus(ActivityStatusCode.Error);
                }
                activity?.SetTag("outcome", outcomeLabel);
                var tag = new KeyValuePair<string, object?>("outcome", outcomeLabel);
                _completed.Add(1, tag);
                _duration.Record(duration.TotalMilliseconds, tag);
            }
        }
        finally
        {
            Activity.Current = parent;
        }
    }

    public void Dispose()
    {
        _activities.Dispose();
        _meter.Dispose();
    }

}
