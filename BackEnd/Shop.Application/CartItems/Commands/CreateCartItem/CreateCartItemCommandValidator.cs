using FluentValidation;

namespace Shop.Application.CartItems.Commands.CreateCartItem;

public class CreateCartItemCommandValidator : AbstractValidator<CreateCartItemCommand>
{
    public CreateCartItemCommandValidator()
    {
        RuleFor(ci => ci.UserId)
            .NotEmpty();

        RuleFor(ci => ci.Quantity)
            .NotEmpty();

        RuleFor(ci => ci.ProductId)
            .NotEmpty();
    }
}
