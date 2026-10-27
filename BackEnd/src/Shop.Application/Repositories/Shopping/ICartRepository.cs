using Shop.Domain.Entities.Carts;

namespace Shop.Application.Repositories.Shopping;

public interface ICartRepository
{
    Task DeleteAsync(Cart entity);
    Task<Cart?> GetByUserIdAsync(string userId);
}
