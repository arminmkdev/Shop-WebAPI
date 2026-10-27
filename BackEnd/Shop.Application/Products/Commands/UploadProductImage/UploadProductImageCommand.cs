using MediatR;

namespace Shop.Application.Products.Commands.UploadProductImage;

public sealed record UploadProductImageCommand(
    int ProductId,
    Stream Content,
    string FileName,
    long Length
) : IRequest<string>;
