using System.Collections.Frozen;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace JamulaAccelerator.Authorization;

public enum CustomerContextDenial
{
    None,
    Authentication,
    Identity,
    DirectoryTenant,
    Membership
}

public sealed class CustomerMembership(
    Guid tenantId,
    Guid userId,
    Guid directoryTenantId,
    Guid directoryObjectId,
    bool active,
    DateTimeOffset validFrom,
    DateTimeOffset validUntil,
    IEnumerable<string> roles)
{
    public Guid TenantId { get; } = tenantId;
    public Guid UserId { get; } = userId;
    public Guid DirectoryTenantId { get; } = directoryTenantId;
    public Guid DirectoryObjectId { get; } = directoryObjectId;
    public bool Active { get; } = active;
    public DateTimeOffset ValidFrom { get; } = validFrom;
    public DateTimeOffset ValidUntil { get; } = validUntil;
    public IReadOnlySet<string> Roles { get; } =
        (roles ?? throw new ArgumentNullException(nameof(roles))).ToFrozenSet(StringComparer.Ordinal);
}

public interface ICustomerMembershipStore
{
    ValueTask<IReadOnlyList<CustomerMembership>> FindActiveAsync(
        Guid directoryTenantId,
        Guid directoryObjectId,
        CancellationToken cancellationToken);
}

public sealed class CustomerContext
{
    private readonly ClaimsIdentity _identity;
    private readonly TimeProvider _clock;

    internal CustomerContext(
        CustomerMembership membership,
        ClaimsIdentity identity,
        IReadOnlySet<string> authenticatedRoles,
        DateTimeOffset? tokenValidFrom,
        DateTimeOffset tokenExpires,
        TimeProvider clock)
    {
        TenantId = membership.TenantId;
        UserId = membership.UserId;
        DirectoryTenantId = membership.DirectoryTenantId;
        DirectoryObjectId = membership.DirectoryObjectId;
        ValidFrom = tokenValidFrom is not null && tokenValidFrom.Value > membership.ValidFrom
            ? tokenValidFrom.Value
            : membership.ValidFrom;
        ValidUntil = tokenExpires < membership.ValidUntil ? tokenExpires : membership.ValidUntil;
        Roles = authenticatedRoles
            .Where(membership.Roles.Contains)
            .ToFrozenSet(StringComparer.Ordinal);
        _identity = identity;
        _clock = clock;
    }

    public Guid TenantId { get; }
    public Guid UserId { get; }
    public Guid DirectoryTenantId { get; }
    public Guid DirectoryObjectId { get; }
    public DateTimeOffset ValidFrom { get; }
    public DateTimeOffset ValidUntil { get; }
    public IReadOnlySet<string> Roles { get; }

    internal bool Allows(ClaimsIdentity identity, string role)
    {
        var now = _clock.GetUtcNow();
        return ReferenceEquals(_identity, identity)
            && now >= ValidFrom
            && now < ValidUntil
            && IdentityKeys.TryRead(identity, out var tenantId, out var objectId)
            && tenantId == DirectoryTenantId
            && objectId == DirectoryObjectId
            && Roles.Contains(role)
            && identity.HasClaim(identity.RoleClaimType, role);
    }
}

public sealed class CustomerContextResolution
{
    private CustomerContextResolution(CustomerContext? context, CustomerContextDenial denial)
    {
        Context = context;
        Denial = denial;
    }

    public CustomerContext? Context { get; }
    public CustomerContextDenial Denial { get; }
    public bool Succeeded => Context is not null;

    internal static CustomerContextResolution Resolved(CustomerContext context) =>
        new(context, CustomerContextDenial.None);

    internal static CustomerContextResolution Denied(CustomerContextDenial reason) =>
        new(null, reason);
}

public sealed class CustomerContextResolver
{
    private readonly Guid _tenantId;
    private readonly Guid _directoryTenantId;
    private readonly string _authenticationScheme;
    private readonly ICustomerMembershipStore _memberships;
    private readonly TimeProvider _clock;

    public CustomerContextResolver(
        Guid tenantId,
        Guid directoryTenantId,
        string authenticationScheme,
        ICustomerMembershipStore memberships,
        TimeProvider clock)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant ID must not be empty.", nameof(tenantId));
        }
        if (directoryTenantId == Guid.Empty)
        {
            throw new ArgumentException("Directory tenant ID must not be empty.", nameof(directoryTenantId));
        }
        ArgumentException.ThrowIfNullOrWhiteSpace(authenticationScheme);
        ArgumentNullException.ThrowIfNull(memberships);
        ArgumentNullException.ThrowIfNull(clock);

        _tenantId = tenantId;
        _directoryTenantId = directoryTenantId;
        _authenticationScheme = authenticationScheme;
        _memberships = memberships;
        _clock = clock;
    }

    public async ValueTask<CustomerContextResolution> ResolveAsync(
        AuthenticateResult authentication,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authentication);
        cancellationToken.ThrowIfCancellationRequested();

        var ticket = authentication.Ticket;
        if (!authentication.Succeeded || ticket is null ||
            !string.Equals(ticket.AuthenticationScheme, _authenticationScheme, StringComparison.Ordinal))
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Authentication);
        }

        var tokenExpires = ticket.Properties.ExpiresUtc;
        var tokenValidFrom = ticket.Properties.IssuedUtc;
        var now = _clock.GetUtcNow();
        if (tokenExpires is null || now >= tokenExpires.Value ||
            (tokenValidFrom is not null && now < tokenValidFrom.Value))
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Authentication);
        }

        var identities = ticket.Principal.Identities.Where(identity => identity.IsAuthenticated).Take(2).ToArray();
        if (identities.Length != 1 || !IdentityKeys.TryRead(identities[0], out var directoryTenantId, out var objectId))
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Identity);
        }
        if (directoryTenantId != _directoryTenantId)
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.DirectoryTenant);
        }
        var authenticatedRoles = IdentityKeys.ReadRoles(identities[0]);

        var memberships = await _memberships.FindActiveAsync(directoryTenantId, objectId, cancellationToken)
            .ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();
        if (memberships is null)
        {
            throw new InvalidOperationException("The membership store returned no collection.");
        }
        now = _clock.GetUtcNow();
        if (now >= tokenExpires.Value || (tokenValidFrom is not null && now < tokenValidFrom.Value))
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Authentication);
        }
        var currentIdentities = ticket.Principal.Identities.Where(identity => identity.IsAuthenticated).Take(2).ToArray();
        if (currentIdentities.Length != 1 || !ReferenceEquals(currentIdentities[0], identities[0]) ||
            !IdentityKeys.TryRead(currentIdentities[0], out var currentTenantId, out var currentObjectId) ||
            currentTenantId != directoryTenantId || currentObjectId != objectId ||
            !authenticatedRoles.SetEquals(IdentityKeys.ReadRoles(currentIdentities[0])))
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Identity);
        }
        if (memberships.Count != 1)
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Membership);
        }

        var membership = memberships[0];
        if (membership is null || !membership.Active || membership.TenantId != _tenantId ||
            membership.UserId == Guid.Empty || membership.DirectoryTenantId != directoryTenantId ||
            membership.DirectoryObjectId != objectId || now < membership.ValidFrom || now >= membership.ValidUntil)
        {
            return CustomerContextResolution.Denied(CustomerContextDenial.Membership);
        }

        return CustomerContextResolution.Resolved(
            new CustomerContext(membership, identities[0], authenticatedRoles, tokenValidFrom, tokenExpires.Value, _clock));
    }
}

internal static class IdentityKeys
{
    internal static FrozenSet<string> ReadRoles(ClaimsIdentity identity) =>
        new[] { CustomerPolicies.Viewer, CustomerPolicies.Member, CustomerPolicies.Admin }
            .Where(role => identity.HasClaim(identity.RoleClaimType, role))
            .ToFrozenSet(StringComparer.Ordinal);

    internal static bool TryRead(ClaimsIdentity identity, out Guid directoryTenantId, out Guid objectId)
    {
        directoryTenantId = Guid.Empty;
        objectId = Guid.Empty;
        var tenants = identity.Claims.Where(claim => claim.Type == "tid").Take(2).ToArray();
        var objects = identity.Claims.Where(claim => claim.Type == "oid").Take(2).ToArray();
        return tenants.Length == 1 && objects.Length == 1
            && Guid.TryParseExact(tenants[0].Value, "D", out directoryTenantId)
            && Guid.TryParseExact(objects[0].Value, "D", out objectId)
            && directoryTenantId != Guid.Empty
            && objectId != Guid.Empty;
    }
}
