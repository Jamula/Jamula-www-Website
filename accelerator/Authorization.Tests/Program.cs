using System.Security.Claims;
using JamulaAccelerator.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

const string scheme = "client-entra";
var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
var directoryId = Guid.Parse("33333333-3333-3333-3333-333333333333");
var objectId = Guid.Parse("44444444-4444-4444-4444-444444444444");
var otherId = Guid.Parse("55555555-5555-5555-5555-555555555555");
var now = new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);
var roles = new[] { CustomerPolicies.Viewer, CustomerPolicies.Member, CustomerPolicies.Admin };
var clock = new TestClock(now);
var store = new TestMembershipStore();
var resolver = new CustomerContextResolver(tenantId, directoryId, scheme, store, clock);
using var services = new ServiceCollection()
    .AddLogging()
    .AddCustomerPolicies()
    .BuildServiceProvider();
var policyProvider = services.GetRequiredService<IAuthorizationPolicyProvider>();
var authorization = services.GetRequiredService<IAuthorizationService>();

void Check(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}

ClaimsIdentity Identity(
    string? tid = null,
    string? oid = null,
    IEnumerable<string>? assignedRoles = null,
    bool authenticated = true,
    string roleClaimType = ClaimTypes.Role)
{
    var claims = new List<Claim>();
    if (tid is not null) claims.Add(new Claim("tid", tid));
    if (oid is not null) claims.Add(new Claim("oid", oid));
    claims.AddRange((assignedRoles ?? []).Select(role => new Claim(roleClaimType, role)));
    return new ClaimsIdentity(claims, authenticated ? "test" : null, ClaimTypes.Name, roleClaimType);
}

ClaimsIdentity ValidIdentity(IEnumerable<string>? assignedRoles = null) =>
    Identity(directoryId.ToString("D"), objectId.ToString("D"), assignedRoles);

AuthenticateResult Ticket(
    ClaimsPrincipal principal,
    string ticketScheme = scheme,
    DateTimeOffset? expires = null,
    DateTimeOffset? validFrom = null,
    bool includeExpiry = true) =>
    AuthenticateResult.Success(new AuthenticationTicket(principal, new AuthenticationProperties
    {
        ExpiresUtc = includeExpiry ? expires ?? now.AddMinutes(2) : null,
        IssuedUtc = validFrom
    }, ticketScheme));

CustomerMembership Membership(
    Guid? tenant = null,
    Guid? user = null,
    Guid? directory = null,
    Guid? subject = null,
    bool active = true,
    DateTimeOffset? from = null,
    DateTimeOffset? until = null,
    IEnumerable<string>? assignedRoles = null) =>
    new(tenant ?? tenantId, user ?? userId, directory ?? directoryId, subject ?? objectId,
        active, from ?? now.AddMinutes(-1), until ?? now.AddMinutes(1), assignedRoles ?? roles);

async Task<CustomerContext> Resolve(ClaimsPrincipal principal)
{
    var result = await resolver.ResolveAsync(Ticket(principal));
    Check(result.Succeeded && result.Denial == CustomerContextDenial.None && result.Context is not null,
        "Expected an active, bound customer context.");
    return result.Context!;
}

async Task ExpectDenied(AuthenticateResult authentication, CustomerContextDenial denial, string scenario)
{
    var result = await resolver.ResolveAsync(authentication);
    Check(!result.Succeeded && result.Context is null && result.Denial == denial, scenario);
}

async Task ExpectRole(ClaimsPrincipal principal, object? resource, string role, bool allowed, string scenario)
{
    var result = await authorization.AuthorizeAsync(principal, resource, role);
    Check(result.Succeeded == allowed, scenario);
}

async Task ExpectThrowsAsync<T>(Func<Task> action, string scenario) where T : Exception
{
    try
    {
        await action();
    }
    catch (T)
    {
        return;
    }
    throw new InvalidOperationException(scenario);
}

void ExpectThrows<T>(Action action, string scenario) where T : Exception
{
    try
    {
        action();
    }
    catch (T)
    {
        return;
    }
    throw new InvalidOperationException(scenario);
}

ExpectThrows<ArgumentException>(() => new CustomerContextResolver(Guid.Empty, directoryId, scheme, store, clock),
    "An empty customer tenant was accepted.");
ExpectThrows<ArgumentException>(() => new CustomerContextResolver(tenantId, Guid.Empty, scheme, store, clock),
    "An empty directory tenant was accepted.");
ExpectThrows<ArgumentException>(() => new CustomerContextResolver(tenantId, directoryId, " ", store, clock),
    "An empty authentication scheme was accepted.");
ExpectThrows<ArgumentNullException>(() => new CustomerContextResolver(tenantId, directoryId, scheme, null!, clock),
    "A missing membership store was accepted.");
ExpectThrows<ArgumentNullException>(() => new CustomerContextResolver(tenantId, directoryId, scheme, store, null!),
    "A missing clock was accepted.");
ExpectThrows<ArgumentNullException>(() => new CustomerMembership(tenantId, userId, directoryId, objectId,
    true, now, now.AddMinutes(1), null!), "Missing membership roles were accepted.");
await ExpectThrowsAsync<ArgumentNullException>(async () => await resolver.ResolveAsync(null!),
    "A missing authentication result was accepted.");

store.Memberships = [Membership()];
var duplicateTenant = ValidIdentity();
duplicateTenant.AddClaim(new Claim("tid", directoryId.ToString("D")));
var duplicateSubject = ValidIdentity();
duplicateSubject.AddClaim(new Claim("oid", objectId.ToString("D")));
var wrongCase = Identity(null, objectId.ToString("D"));
wrongCase.AddClaim(new Claim("Tid", directoryId.ToString("D")));
var identityCases = new (AuthenticateResult Authentication, CustomerContextDenial Denial, string Name)[]
{
    (AuthenticateResult.NoResult(), CustomerContextDenial.Authentication, "No authentication"),
    (AuthenticateResult.Fail("invalid"), CustomerContextDenial.Authentication, "Failed authentication"),
    (Ticket(new ClaimsPrincipal(ValidIdentity()), "other-scheme"), CustomerContextDenial.Authentication, "Wrong scheme"),
    (Ticket(new ClaimsPrincipal(ValidIdentity()), includeExpiry: false), CustomerContextDenial.Authentication, "Missing token expiry"),
    (Ticket(new ClaimsPrincipal(ValidIdentity()), expires: now), CustomerContextDenial.Authentication, "Expired token"),
    (Ticket(new ClaimsPrincipal(ValidIdentity()), validFrom: now.AddSeconds(1)),
        CustomerContextDenial.Authentication, "Token not yet valid"),
    (Ticket(new ClaimsPrincipal(Identity(directoryId.ToString("D"), objectId.ToString("D"), authenticated: false))),
        CustomerContextDenial.Identity, "Unauthenticated identity"),
    (Ticket(new ClaimsPrincipal([ValidIdentity(), ValidIdentity()])), CustomerContextDenial.Identity, "Ambiguous identities"),
    (Ticket(new ClaimsPrincipal(Identity(null, objectId.ToString("D")))), CustomerContextDenial.Identity, "Missing tenant"),
    (Ticket(new ClaimsPrincipal(Identity(directoryId.ToString("D"), null))), CustomerContextDenial.Identity, "Missing subject"),
    (Ticket(new ClaimsPrincipal(Identity("not-a-guid", objectId.ToString("D")))), CustomerContextDenial.Identity, "Invalid tenant"),
    (Ticket(new ClaimsPrincipal(Identity(directoryId.ToString("D"), "not-a-guid"))), CustomerContextDenial.Identity, "Invalid subject"),
    (Ticket(new ClaimsPrincipal(Identity(Guid.Empty.ToString("D"), objectId.ToString("D")))),
        CustomerContextDenial.Identity, "Empty tenant"),
    (Ticket(new ClaimsPrincipal(Identity(directoryId.ToString("D"), Guid.Empty.ToString("D")))),
        CustomerContextDenial.Identity, "Empty subject"),
    (Ticket(new ClaimsPrincipal(duplicateTenant)), CustomerContextDenial.Identity, "Duplicate tenant"),
    (Ticket(new ClaimsPrincipal(duplicateSubject)), CustomerContextDenial.Identity, "Duplicate subject"),
    (Ticket(new ClaimsPrincipal(wrongCase)), CustomerContextDenial.Identity, "Wrong claim name"),
    (Ticket(new ClaimsPrincipal(Identity(otherId.ToString("D"), objectId.ToString("D")))),
        CustomerContextDenial.DirectoryTenant, "Unexpected directory tenant")
};
foreach (var (authentication, denial, name) in identityCases)
{
    var callsBefore = store.Calls;
    await ExpectDenied(authentication, denial, name);
    Check(store.Calls == callsBefore, $"{name} consulted the membership store.");
}

var membershipCases = new (IReadOnlyList<CustomerMembership> Memberships, string Name)[]
{
    ([], "Missing membership"),
    ([Membership(), Membership()], "Ambiguous memberships"),
    ([null!], "Null membership"),
    ([Membership(active: false)], "Revoked membership"),
    ([Membership(tenant: otherId)], "Wrong customer tenant"),
    ([Membership(user: Guid.Empty)], "Empty internal user"),
    ([Membership(directory: otherId)], "Wrong directory tenant in membership"),
    ([Membership(subject: otherId)], "Wrong directory subject in membership"),
    ([Membership(from: now.AddTicks(1))], "Membership not yet valid"),
    ([Membership(until: now)], "Expired membership"),
    ([Membership(from: now.AddMinutes(1), until: now.AddMinutes(-1))], "Invalid membership interval")
};
foreach (var (memberships, name) in membershipCases)
{
    store.Memberships = memberships;
    await ExpectDenied(Ticket(new ClaimsPrincipal(ValidIdentity(roles))), CustomerContextDenial.Membership, name);
}

store.Memberships = [Membership()];
var changingSubject = ValidIdentity([CustomerPolicies.Viewer]);
store.OnFind = () =>
{
    changingSubject.RemoveClaim(changingSubject.FindFirst("oid")!);
    changingSubject.AddClaim(new Claim("oid", otherId.ToString("D")));
};
await ExpectDenied(Ticket(new ClaimsPrincipal(changingSubject)), CustomerContextDenial.Identity,
    "Subject changed during membership lookup.");
var changingRoles = ValidIdentity([CustomerPolicies.Viewer]);
var pendingMembership = new TaskCompletionSource<IReadOnlyList<CustomerMembership>>(
    TaskCreationOptions.RunContinuationsAsynchronously);
store.OnFind = null;
store.Pending = pendingMembership;
var pendingResolution = resolver.ResolveAsync(Ticket(new ClaimsPrincipal(changingRoles))).AsTask();
Check(!pendingResolution.IsCompleted, "The membership read did not suspend.");
changingRoles.AddClaim(new Claim(ClaimTypes.Role, CustomerPolicies.Admin));
pendingMembership.SetResult([Membership()]);
var changedRoleResult = await pendingResolution;
Check(!changedRoleResult.Succeeded && changedRoleResult.Denial == CustomerContextDenial.Identity,
    "Roles changed while the membership read was suspended.");
store.Pending = null;
var changingPrincipal = new ClaimsPrincipal(ValidIdentity([CustomerPolicies.Viewer]));
store.OnFind = () => changingPrincipal.AddIdentity(ValidIdentity());
await ExpectDenied(Ticket(changingPrincipal), CustomerContextDenial.Identity,
    "An authenticated identity was added during membership lookup.");
store.OnFind = () => clock.Now = now.AddMinutes(2);
await ExpectDenied(Ticket(new ClaimsPrincipal(ValidIdentity())), CustomerContextDenial.Authentication,
    "Token expired during membership lookup.");
clock.Now = now;
store.OnFind = null;

var callsBeforeCancellation = store.Calls;
await ExpectThrowsAsync<OperationCanceledException>(
    async () => await resolver.ResolveAsync(Ticket(new ClaimsPrincipal(ValidIdentity())), new CancellationToken(true)),
    "Pre-cancelled resolution did not cancel.");
Check(store.Calls == callsBeforeCancellation, "Pre-cancelled resolution called the store.");
using (var cancellation = new CancellationTokenSource())
{
    store.OnFind = cancellation.Cancel;
    await ExpectThrowsAsync<OperationCanceledException>(
        async () => await resolver.ResolveAsync(Ticket(new ClaimsPrincipal(ValidIdentity())), cancellation.Token),
        "Cancellation during the membership read was ignored.");
    store.OnFind = null;
}
store.Failure = new InvalidOperationException("membership store unavailable");
await ExpectThrowsAsync<InvalidOperationException>(
    async () => await resolver.ResolveAsync(Ticket(new ClaimsPrincipal(ValidIdentity()))),
    "The membership store failure was hidden.");
store.Failure = null;
store.ReturnNull = true;
await ExpectThrowsAsync<InvalidOperationException>(
    async () => await resolver.ResolveAsync(Ticket(new ClaimsPrincipal(ValidIdentity()))),
    "A missing membership collection was hidden.");
store.ReturnNull = false;

var sourceRoles = new List<string> { CustomerPolicies.Viewer, CustomerPolicies.Member };
var snapshot = Membership(assignedRoles: sourceRoles);
sourceRoles.Clear();
store.Memberships = [snapshot];
var intersectedPrincipal = new ClaimsPrincipal(ValidIdentity([CustomerPolicies.Viewer, CustomerPolicies.Admin]));
var intersectedContext = await Resolve(intersectedPrincipal);
Check(intersectedContext.TenantId == tenantId && intersectedContext.UserId == userId &&
    intersectedContext.DirectoryTenantId == directoryId && intersectedContext.DirectoryObjectId == objectId,
    "Context did not preserve the server-resolved identifiers.");
Check(intersectedContext.Roles.SetEquals([CustomerPolicies.Viewer]),
    "Effective roles must be the immutable intersection of membership and authenticated roles.");
Check(store.LastDirectoryTenantId == directoryId && store.LastDirectoryObjectId == objectId,
    "The store lookup was not bound to the authenticated identity.");
await ExpectRole(intersectedPrincipal, intersectedContext, CustomerPolicies.Viewer, true, "Intersected viewer role denied.");
await ExpectRole(intersectedPrincipal, intersectedContext, CustomerPolicies.Admin, false, "Token-only admin role granted.");
await ExpectRole(intersectedPrincipal, intersectedContext, CustomerPolicies.Member, false, "Membership-only member role granted.");

store.Memberships = [Membership(from: now, until: now.AddMinutes(1))];
foreach (var role in roles)
{
    var identity = ValidIdentity([role]);
    var principal = new ClaimsPrincipal(identity);
    var context = await Resolve(principal);
    foreach (var candidate in roles)
    {
        await ExpectRole(principal, context, candidate, candidate == role, $"{role}: policy {candidate}.");
    }
    await ExpectRole(principal, null, role, false, $"{role}: missing context.");
    await ExpectRole(new ClaimsPrincipal(ValidIdentity([role])), context, role, false, $"{role}: cloned identity.");
    await ExpectRole(new ClaimsPrincipal([identity, ValidIdentity()]), context, role, false,
        $"{role}: multiple authenticated identities.");
    await ExpectRole(new ClaimsPrincipal(Identity(directoryId.ToString("D"), objectId.ToString("D"),
        [role], authenticated: false)), context, role, false, $"{role}: unauthenticated identity.");

    foreach (var policy in new[] { await policyProvider.GetDefaultPolicyAsync(),
        await policyProvider.GetFallbackPolicyAsync() ?? throw new InvalidOperationException("Missing fallback policy.") })
    {
        Check(!(await authorization.AuthorizeAsync(principal, context, policy)).Succeeded,
            $"{role}: unnamed policy did not deny.");
    }
}

var customRoleIdentity = Identity(directoryId.ToString("D"), objectId.ToString("D"),
    [CustomerPolicies.Viewer], roleClaimType: "roles");
var customRolePrincipal = new ClaimsPrincipal(customRoleIdentity);
var customRoleContext = await Resolve(customRolePrincipal);
await ExpectRole(customRolePrincipal, customRoleContext, CustomerPolicies.Viewer, true,
    "The configured identity role claim type was not honored.");
var casePrincipal = new ClaimsPrincipal(ValidIdentity([CustomerPolicies.Viewer.ToUpperInvariant()]));
var caseContext = await Resolve(casePrincipal);
await ExpectRole(casePrincipal, caseContext, CustomerPolicies.Viewer, false, "A differently cased role was accepted.");
var wrongRoleIdentity = ValidIdentity();
wrongRoleIdentity.AddClaim(new Claim("roles", CustomerPolicies.Viewer));
var wrongRolePrincipal = new ClaimsPrincipal(wrongRoleIdentity);
var wrongRoleContext = await Resolve(wrongRolePrincipal);
await ExpectRole(wrongRolePrincipal, wrongRoleContext, CustomerPolicies.Viewer, false,
    "A role from an unconfigured claim type was accepted.");

var mutableIdentity = ValidIdentity([CustomerPolicies.Viewer]);
var mutablePrincipal = new ClaimsPrincipal(mutableIdentity);
var mutableContext = await Resolve(mutablePrincipal);
var roleClaim = mutableIdentity.FindFirst(ClaimTypes.Role)!;
mutableIdentity.RemoveClaim(roleClaim);
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, false, "A removed role remained authorized.");
mutableIdentity.AddClaim(roleClaim);
var oidClaim = mutableIdentity.FindFirst("oid")!;
mutableIdentity.RemoveClaim(oidClaim);
mutableIdentity.AddClaim(new Claim("oid", otherId.ToString("D")));
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, false, "A changed subject remained authorized.");
mutableIdentity.AddClaim(oidClaim);
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, false, "Duplicate subjects remained authorized.");
mutableIdentity.RemoveClaim(mutableIdentity.FindFirst("oid")!);
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, true, "Restored identity was denied.");

clock.Now = now.AddTicks(-1);
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, false, "A not-yet-valid context was authorized.");
clock.Now = now.AddMinutes(1);
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, false, "An expired context was authorized.");
clock.Now = now;
await ExpectRole(mutablePrincipal, mutableContext, CustomerPolicies.Viewer, true, "A valid context was denied.");

store.Memberships = [Membership()];
var tokenPrincipal = new ClaimsPrincipal(ValidIdentity([CustomerPolicies.Viewer]));
var tokenResult = await resolver.ResolveAsync(Ticket(tokenPrincipal, expires: now.AddSeconds(30), validFrom: now));
var tokenContext = tokenResult.Context ?? throw new InvalidOperationException("Expected token-bounded context.");
Check(tokenContext.ValidFrom == now && tokenContext.ValidUntil == now.AddSeconds(30),
    "Context validity must be bounded by the validated token.");
clock.Now = now.AddSeconds(29);
await ExpectRole(tokenPrincipal, tokenContext, CustomerPolicies.Viewer, true, "An unexpired token was denied.");
clock.Now = now.AddSeconds(30);
await ExpectRole(tokenPrincipal, tokenContext, CustomerPolicies.Viewer, false, "An expired token remained authorized.");
clock.Now = now.AddTicks(-1);
await ExpectRole(tokenPrincipal, tokenContext, CustomerPolicies.Viewer, false, "A not-yet-valid token was authorized.");
clock.Now = now;

Console.WriteLine("Customer identity, membership, and authorization tests passed.");

internal sealed class TestClock(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

internal sealed class TestMembershipStore : ICustomerMembershipStore
{
    public IReadOnlyList<CustomerMembership> Memberships { get; set; } = [];
    public Exception? Failure { get; set; }
    public bool ReturnNull { get; set; }
    public Action? OnFind { get; set; }
    public TaskCompletionSource<IReadOnlyList<CustomerMembership>>? Pending { get; set; }
    public int Calls { get; private set; }
    public Guid LastDirectoryTenantId { get; private set; }
    public Guid LastDirectoryObjectId { get; private set; }

    public ValueTask<IReadOnlyList<CustomerMembership>> FindActiveAsync(
        Guid directoryTenantId,
        Guid directoryObjectId,
        CancellationToken cancellationToken)
    {
        Calls++;
        LastDirectoryTenantId = directoryTenantId;
        LastDirectoryObjectId = directoryObjectId;
        OnFind?.Invoke();
        if (Failure is not null) return ValueTask.FromException<IReadOnlyList<CustomerMembership>>(Failure);
        if (Pending is not null) return new ValueTask<IReadOnlyList<CustomerMembership>>(Pending.Task);
        return ValueTask.FromResult(ReturnNull ? null! : Memberships);
    }
}
