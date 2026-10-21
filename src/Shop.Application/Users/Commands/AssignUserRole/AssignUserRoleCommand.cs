using MediatR;

namespace Shop.Application.Users.Commands.AssignUserRole;

public class AssignUserRoleCommand : IRequest
{
    public string UserEmail { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
}
