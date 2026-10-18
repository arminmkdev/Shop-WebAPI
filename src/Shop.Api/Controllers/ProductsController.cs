using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Products.Commands.CreateProduct;
using Shop.Application.Products.Commands.DeleteProduct;
using Shop.Application.Products.Commands.UpdateProduct;
using Shop.Application.Products.Commands.UploadProductImage;
using Shop.Application.Products.Dtos;
using Shop.Application.Products.Queries.GetAllProducts;
using Shop.Application.Products.Queries.GetProductById;
using Shop.Domain.Constants;

namespace Shop.Api.Controllers;

[ApiController]
[Route("products")]
public class ProductsController(
    IMediator mediator
    ) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        IEnumerable<ProductDto> products = await mediator.Send(new GetAllProductsQuery());

        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct([FromRoute] int id)
    {
        ProductDto product = await mediator.Send(new GetProductByIdQuery(id));

        return Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateProduct(
       CreateProductCommand command)
    {
        ProductDto product = await mediator.Send(command);

        return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
    }

    [HttpPatch("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateProduct(
        [FromRoute] int id,
        [FromBody] UpdateProductCommand command)
    {
        command.Id = id;

        await mediator.Send(command);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult> DeleteProduct([FromRoute] int id)
    {
        await mediator.Send(new DeleteProductCommand(id));

        return NoContent();
    }

    [HttpPost("{id:int}/image")]
    public async Task<IActionResult> UploadImage(
    int id,
    IFormFile file,
    CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest("select image");

        await using var stream = file.OpenReadStream();

        var imageUrl = await mediator.Send(
            new UploadProductImageCommand(
                id,
                stream,
                file.FileName,
                file.Length),
            cancellationToken);

        return Ok(new { imageUrl });
    }

}
