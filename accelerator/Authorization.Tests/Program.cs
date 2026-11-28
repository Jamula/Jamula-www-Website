using System.Security.Claims;
using JamulaAccelerator.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection()
    .AddLogging()
    .AddCustomerPolicies()
    .BuildServiceProvider();
var policyProvider = services.GetRequiredService<IAuthorizationPolicyProvider>();
var authorization = services.GetRequiredService<IAuthorizationService>();
var roles = new[] { CustomerPolicies.Viewer, CustomerPolicies.Member, CustomerPolicies.Admin };

ClaimsIdentity Identity(bool authenticated, params string[] roleClaims) =>
    new(roleClaims.Select(role => new Claim(ClaimTypes.Role, role)), authenticated ? "test" : null);

async Task Check(AuthorizationPolicy policy, ClaimsPrincipal principal, bool allowed, string scenario)
{
    var result = await authorization.AuthorizeAsync(principal, null, policy);
    if (result.Succeeded != allowed)
    {
        throw new InvalidOperationException($"Unexpected authorization result: {scenario}");
    }
}

var noRoles = new ClaimsPrincipal(Identity(true));
var defaultPolicy = await policyProvider.GetDefaultPolicyAsync();
var fallbackPolicy = await policyProvider.GetFallbackPolicyAsync()
    ?? throw new InvalidOperationException("Fallback policy is missing.");
foreach (var policy in new[] { defaultPolicy, fallbackPolicy })
{
    await Check(policy, noRoles, false, "authenticated user without explicit policy");
    await Check(policy, new ClaimsPrincipal(Identity(true, roles)), false, "all roles without explicit policy");
    await Check(policy, new ClaimsPrincipal(Identity(false, roles)), false, "unauthenticated roles without explicit policy");
}

foreach (var role in roles)
{
    var policy = await policyProvider.GetPolicyAsync(role)
        ?? throw new InvalidOperationException($"Missing policy: {role}");
    await Check(policy, new ClaimsPrincipal(Identity(true, role)), true, $"{role}: matching authenticated role");
    await Check(policy, noRoles, false, $"{role}: no role");
    await Check(policy, new ClaimsPrincipal(Identity(false, role)), false, $"{role}: unauthenticated role");
    await Check(policy, new ClaimsPrincipal(new[] { Identity(true), Identity(false, role) }), false,
        $"{role}: role on a different unauthenticated identity");
    await Check(policy, new ClaimsPrincipal(new[] { Identity(true), Identity(true, role) }), false,
        $"{role}: role on a different authenticated identity");
    await Check(policy, new ClaimsPrincipal(new[] { Identity(true, role), Identity(true) }), false,
        $"{role}: matching role with another authenticated identity");
    await Check(policy, new ClaimsPrincipal(Identity(true, role.ToUpperInvariant())), false,
        $"{role}: differently cased role");
    await Check(policy, new ClaimsPrincipal(new ClaimsIdentity(
        new[] { new Claim("roles", role) }, "test", ClaimTypes.Name, "roles")), true,
        $"{role}: configured role claim type");
    await Check(policy, new ClaimsPrincipal(new ClaimsIdentity(
        new[] { new Claim("roles", role) }, "test", ClaimTypes.Name, ClaimTypes.Role)), false,
        $"{role}: unconfigured role claim type");
    foreach (var other in roles.Where(value => value != role))
    {
        await Check(policy, new ClaimsPrincipal(Identity(true, other)), false, $"{role}: other role {other}");
    }
}

Console.WriteLine("Customer authorization policy tests passed.");
