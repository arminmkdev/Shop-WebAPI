using Shop.Domain.Entities.Catalog;

namespace Shop.Application.Repositories;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
}
