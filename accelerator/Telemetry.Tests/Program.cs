using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using JamulaAccelerator.Telemetry;

const string secret = "private-prompt-document-and-exception";
var spans = new ConcurrentBag<Activity>();
var measurements = new ConcurrentBag<(string Name, double Value, KeyValuePair<string, object?>[] Tags, Activity? Activity)>();
using var spanListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStopped = spans.Add
};
ActivitySource.AddActivityListener(spanListener);
using var meterListener = new MeterListener
{
    InstrumentPublished = (instrument, listener) =>
    {
        if (instrument.Meter.Name == OperationTelemetry.InstrumentationName)
        {
            listener.EnableMeasurementEvents(instrument);
        }
    }
};
meterListener.SetMeasurementEventCallback<long>((instrument, value, tags, _) =>
    measurements.Add((instrument.Name, value, tags.ToArray(), Activity.Current)));
meterListener.SetMeasurementEventCallback<double>((instrument, value, tags, _) =>
    measurements.Add((instrument.Name, value, tags.ToArray(), Activity.Current)));
meterListener.Start();

void Check(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}

using (var parent = new Activity("parent").AddBaggage("private", secret).Start())
using (var telemetry = new OperationTelemetry())
{
    telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.FromMilliseconds(42));
    telemetry.RecordCompletion(OperationOutcome.Failure, TimeSpan.Zero);
    telemetry.RecordCompletion(OperationOutcome.Cancelled, TimeSpan.FromMilliseconds(5));
    Check(Activity.Current == parent, "Telemetry must not replace the ambient activity.");

    try
    {
        telemetry.RecordCompletion((OperationOutcome)123, TimeSpan.Zero);
        throw new InvalidOperationException("Unknown outcome was accepted.");
    }
    catch (ArgumentOutOfRangeException exception) when (exception.ParamName == "outcome")
    {
    }
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.FromTicks(-1));
        throw new InvalidOperationException("Negative duration was accepted.");
    }
    catch (ArgumentOutOfRangeException exception) when (exception.ParamName == "duration")
    {
    }
}

Check(spans.Count == 3, "Expected a span for each valid outcome.");
var outcomes = new[] { "success", "failure", "cancelled" };
foreach (var outcome in outcomes)
{
    var span = spans.Single(activity => (string?)activity.GetTagItem("outcome") == outcome);
    Check(span.OperationName == "accelerator.operation.completed", "Unexpected span name.");
    Check(span.ParentId is null && span.TraceStateString is null && !span.Baggage.Any(),
        "A span inherited request context.");
    Check(span.TagObjects.SequenceEqual(new[] { new KeyValuePair<string, object?>("outcome", outcome) }),
        "Unexpected span tags.");
    Check(!span.Events.Any() && span.StatusDescription is null, "A span exposed content or exception details.");
    Check(span.Status == (outcome == "failure" ? ActivityStatusCode.Error : ActivityStatusCode.Unset),
        "Unexpected span status.");
}

Check(measurements.Count == 6, "Expected one count and one duration per outcome.");
foreach (var (outcome, duration) in new[] { ("success", 42d), ("failure", 0d), ("cancelled", 5d) })
{
    var matching = measurements.Where(measurement => measurement.Tags.SequenceEqual(
        new[] { new KeyValuePair<string, object?>("outcome", outcome) })).ToArray();
    Check(matching.Length == 2, "Unexpected metric tags.");
    Check(matching.Any(measurement => measurement.Name == "jamula.accelerator.operations" && measurement.Value == 1),
        "Missing operation count.");
    Check(matching.Any(measurement => measurement.Name == "jamula.accelerator.duration" && measurement.Value == duration),
        "Missing operation duration.");
    var span = spans.Single(activity => (string?)activity.GetTagItem("outcome") == outcome);
    Check(matching.All(measurement => ReferenceEquals(measurement.Activity, span)),
        "A metric inherited the request activity instead of the detached span.");
}

spanListener.Dispose();
meterListener.Dispose();
var activitiesWithoutSpans = new ConcurrentBag<Activity?>();
using (var metricsWithoutSpans = new MeterListener
{
    InstrumentPublished = (instrument, listener) =>
    {
        if (instrument.Meter.Name == OperationTelemetry.InstrumentationName)
        {
            listener.EnableMeasurementEvents(instrument);
        }
    }
})
{
    metricsWithoutSpans.SetMeasurementEventCallback<long>((_, _, _, _) => activitiesWithoutSpans.Add(Activity.Current));
    metricsWithoutSpans.SetMeasurementEventCallback<double>((_, _, _, _) => activitiesWithoutSpans.Add(Activity.Current));
    metricsWithoutSpans.Start();
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").AddBaggage("private", secret).Start();
    telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
    telemetry.RecordCompletion(OperationOutcome.Failure, TimeSpan.Zero);
    Check(activitiesWithoutSpans.Count == 4 && activitiesWithoutSpans.All(activity => activity is null),
        "A metric inherited the request activity when no span was sampled.");
    Check(Activity.Current == parent, "Recording without a sampled span replaced the ambient activity.");
}

var concurrentSpans = new ConcurrentBag<Activity>();
using (var concurrentListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStopped = concurrentSpans.Add
})
using (var telemetry = new OperationTelemetry())
{
    ActivitySource.AddActivityListener(concurrentListener);
    await Task.WhenAll(Enumerable.Range(0, 16).Select(async index =>
    {
        using var parent = new Activity($"parent-{index}").AddBaggage("private", secret).Start();
        await Task.Yield();
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        Check(Activity.Current == parent, "Concurrent caller lost its ambient activity.");
    }));
    Check(concurrentSpans.Count == 16 && concurrentSpans.All(span =>
        span.ParentId is null && !span.Baggage.Any()), "Concurrent spans inherited request context.");
}

var startedSpans = new ConcurrentBag<Activity>();
var stoppedSpans = new ConcurrentBag<Activity>();
using (var trackingListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStarted = startedSpans.Add,
    ActivityStopped = stoppedSpans.Add
})
using (var failingStartListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStarted = _ => throw new InvalidOperationException(secret)
})
{
    ActivitySource.AddActivityListener(trackingListener);
    ActivitySource.AddActivityListener(failingStartListener);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Start listener failure was swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == secret)
    {
    }
    Check(startedSpans.Count == 1 && stoppedSpans.Count == 1
        && ReferenceEquals(startedSpans.Single(), stoppedSpans.Single()),
        "A span was not stopped after an activity-start listener failed.");
    Check(Activity.Current == parent, "Start listener failure replaced the ambient activity.");
}

using (var failingSampleListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => throw new InvalidOperationException(secret)
})
{
    ActivitySource.AddActivityListener(failingSampleListener);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Sampling failure was swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == secret)
    {
    }
    Check(Activity.Current == parent, "Sampling failure replaced the ambient activity.");
}

using (var failingStartAndStop = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStarted = _ => throw new InvalidOperationException("span-start failure"),
    ActivityStopped = _ => throw new InvalidOperationException("span-stop failure")
})
{
    ActivitySource.AddActivityListener(failingStartAndStop);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Listener failures were swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == "span-stop failure")
    {
    }
    Check(Activity.Current == parent, "Start and stop listener failures replaced the ambient activity.");
}

using (var failingListener = new MeterListener
{
    InstrumentPublished = (instrument, listener) =>
    {
        if (instrument.Meter.Name == OperationTelemetry.InstrumentationName)
        {
            listener.EnableMeasurementEvents(instrument);
        }
    }
})
using (var spanWithFailingMetric = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded
})
{
    failingListener.SetMeasurementEventCallback<long>((_, _, _, _) => throw new InvalidOperationException(secret));
    failingListener.Start();
    ActivitySource.AddActivityListener(spanWithFailingMetric);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Listener failure was swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == secret)
    {
    }
    Check(Activity.Current == parent, "Listener failure replaced the ambient activity.");
}

using (var failingSpanListener = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStopped = _ => throw new InvalidOperationException(secret)
})
{
    ActivitySource.AddActivityListener(failingSpanListener);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Span listener failure was swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == secret)
    {
    }
    Check(Activity.Current == parent, "Span listener failure replaced the ambient activity.");
}

using (var failingMeter = new MeterListener
{
    InstrumentPublished = (instrument, listener) =>
    {
        if (instrument.Meter.Name == OperationTelemetry.InstrumentationName)
        {
            listener.EnableMeasurementEvents(instrument);
        }
    }
})
using (var failingSpan = new ActivityListener
{
    ShouldListenTo = source => source.Name == OperationTelemetry.InstrumentationName,
    Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
    ActivityStopped = _ => throw new InvalidOperationException("span-stop failure")
})
{
    failingMeter.SetMeasurementEventCallback<long>((_, _, _, _) => throw new InvalidOperationException("metric failure"));
    failingMeter.Start();
    ActivitySource.AddActivityListener(failingSpan);
    using var telemetry = new OperationTelemetry();
    using var parent = new Activity("parent").Start();
    try
    {
        telemetry.RecordCompletion(OperationOutcome.Success, TimeSpan.Zero);
        throw new InvalidOperationException("Listener failures were swallowed.");
    }
    catch (InvalidOperationException exception) when (exception.Message == "span-stop failure")
    {
    }
    Check(Activity.Current == parent, "Combined listener failures replaced the ambient activity.");
}

Console.WriteLine("Content-minimized telemetry tests passed.");
