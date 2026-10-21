using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Users.Commands.AssignUserRole;
using Shop.Application.Users.Commands.UnAssignUserRole;
using Shop.Application.Users.Commands.UpdateUserDetails;
using Shop.Domain.Constants;

namespace Shop.Api.Controllers;

[Route("identity")]
[ApiController]
[Authorize(Roles = UserRoles.Admin)]
public class IdentityController(IMediator mediator) : ControllerBase
{
    [HttpPatch("user")]
    public async Task<IActionResult> UpdateUserDetails(UpdateUserDetailsCommand command)
    {
        await mediator.Send(command);
        return NoContent();
    }

    [HttpPatch("userRole")]
    public async Task<IActionResult> AssignUserRole(AssignUserRoleCommand command)
    {
        await mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("userRole")]
    public async Task<IActionResult> UnAssignUserRole(UnAssignUserRoleCommand command)
    {
        await mediator.Send(command);
        return NoContent();
    }
}
