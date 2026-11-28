using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace JamulaAccelerator.Authorization;

public static class CustomerPolicies
{
    public const string Viewer = "customer_viewer";
    public const string Member = "customer_member";
    public const string Admin = "customer_admin";

    public static IServiceCollection AddCustomerPolicies(this IServiceCollection services)
    {
        var deny = new AuthorizationPolicyBuilder()
            .RequireAssertion(_ => false)
            .Build();

        services.AddAuthorizationBuilder()
            .SetDefaultPolicy(deny)
            .SetFallbackPolicy(deny)
            .AddPolicy(Viewer, policy => RequireRole(policy, Viewer))
            .AddPolicy(Member, policy => RequireRole(policy, Member))
            .AddPolicy(Admin, policy => RequireRole(policy, Admin));

        return services;
    }

    private static void RequireRole(AuthorizationPolicyBuilder policy, string role)
    {
        policy.RequireAssertion(context =>
        {
            var identities = context.User.Identities.Where(identity => identity.IsAuthenticated).Take(2).ToArray();
            return identities.Length == 1
                && context.Resource is CustomerContext customerContext
                && customerContext.Allows(identities[0], role);
        });
    }
}
