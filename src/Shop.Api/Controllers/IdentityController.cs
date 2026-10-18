using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Users;
using Shop.Application.Users.Commands;

namespace Shop.Api.Controllers;

[Route("identity")]
[ApiController]
public class IdentityController(IMediator mediator, IUserContext userContext) : ControllerBase
{
    [HttpPatch("user")]
    [Authorize]
    public async Task<IActionResult> UpdateUserDetails(UpdateUserDetailsCommand command)
    {
        await mediator.Send(command);
        return NoContent();
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserDetails()
    {
        var user = userContext.GetCurrentUser();

        return Ok(user);
    }
}
