using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Shop.Domain.Entities;
using Shop.Domain.Exceptions;

namespace Shop.Application.Users.Commands.AssignUserRole;

public class AssignUserRoleCommandHandler(
    ILogger<AssignUserRoleCommandHandler> logger,
    UserManager<User> userManager,
    RoleManager<IdentityRole> roleManager
    ) : IRequestHandler<AssignUserRoleCommand>
{
    public async Task Handle(AssignUserRoleCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Assigning user role {@Request}", request);

        User user = await userManager.FindByEmailAsync(request.UserEmail)
            ?? throw new NotFoundException(nameof(User), request.UserEmail);

        IdentityRole role = await roleManager.FindByNameAsync(request.UserRole)
            ?? throw new NotFoundException(nameof(IdentityRole), request.UserRole);

        await userManager.AddToRoleAsync(user, role.Name!);
    }
}
