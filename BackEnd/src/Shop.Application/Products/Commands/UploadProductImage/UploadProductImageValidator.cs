using FluentValidation;

namespace Shop.Application.Products.Commands.UploadProductImage;

public sealed class UploadProductImageValidator
    : AbstractValidator<UploadProductImageCommand>
{
    public UploadProductImageValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0);

        RuleFor(x => x.Length)
            .GreaterThan(0)
            .LessThanOrEqualTo(5 * 1024 * 1024);

        RuleFor(x => x.FileName)
            .Must(name =>
            {
                var extension = Path.GetExtension(name)
                    .ToLowerInvariant();

                return new[] { ".jpg", ".jpeg", ".png", ".webp" }
                    .Contains(extension);
            });
    }
}
