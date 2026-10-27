using MediatR;

namespace Shop.Application.Users.Commands.UnAssignUserRole;

public class UnAssignUserRoleCommand : IRequest
{
    public string UserRole { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
}
