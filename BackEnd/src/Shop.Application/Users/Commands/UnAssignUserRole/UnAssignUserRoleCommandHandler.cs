using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Shop.Domain.Entities;
using Shop.Domain.Exceptions;

namespace Shop.Application.Users.Commands.UnAssignUserRole;

public class UnAssignUserRoleCommandHandler(
    ILogger<UnAssignUserRoleCommandHandler> logger,
    UserManager<User> userManager,
    RoleManager<IdentityRole> roleManager
    ) : IRequestHandler<UnAssignUserRoleCommand>
{
    public async Task Handle(UnAssignUserRoleCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("UnAssigning user role {@Request}", request);

        User user = await userManager.FindByEmailAsync(request.UserEmail)
            ?? throw new NotFoundException(nameof(User), request.UserEmail);

        IdentityRole role = await roleManager.FindByNameAsync(request.UserRole)
            ?? throw new NotFoundException(nameof(IdentityRole), request.UserRole);

        await userManager.RemoveFromRoleAsync(user, role.Name!);
    }
}
