using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Shop.Application.Users;
using Shop.Domain.Exceptions;

namespace Shop.Infrastructure.Users;

public class UserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
{
    public CurrentUser? GetCurrentUser()
    {
        ClaimsPrincipal? user = httpContextAccessor?.HttpContext?.User;

        if (user is null)
        {
            throw new InvalidOperationException("User context is not present");
        }

        if (user.Identity == null || !user.Identity.IsAuthenticated)
        {
            throw new UnauthorizedException();
        }

        var userId = user.FindFirst(ClaimTypes.NameIdentifier)!.Value;
        var email = user.FindFirst(ClaimTypes.Email)!.Value;
        IEnumerable<string> roles = user
            .Claims
            .Where(c => c.Type == ClaimTypes.Role)!
            .Select(c => c.Value);

        return new CurrentUser(userId, email, roles);
    }
}
