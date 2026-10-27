using FluentValidation;
using Shop.Domain.Entities.Catalog;

namespace Shop.Application.Products.Queries.GetAllProducts;

public class GetAllProductsQueryValidator : AbstractValidator<GetAllProductsQuery>
{
    private readonly int[] AllowPageSizes = [5, 10, 15, 30];
    private readonly string[] AllowSortByColumnNames =
        [nameof(Product.Name).ToLower(),
        nameof(Product.Description).ToLower(),
        nameof(Product.Price).ToLower(),
        nameof(Product.Quantity).ToLower()];

    public GetAllProductsQueryValidator()
    {
        RuleFor(p => p.PageNumber)
            .GreaterThanOrEqualTo(1);

        RuleFor(p => p.PageSize)
            .Must(value => AllowPageSizes.Contains(value))
            .WithMessage($"Page size must be in [{string.Join(",", AllowPageSizes)}]");

        RuleFor(p => p.SortBy)
            .Must(value => AllowSortByColumnNames.Contains(value?.ToLower()))
            .When(value => value.SortBy != null)
            .WithMessage(
                $"Sort by is optional, or must be in [{string.Join(",", AllowSortByColumnNames)}]");
    }
}
