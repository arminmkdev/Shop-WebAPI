using Shop.Application.Constants;
using Shop.Domain.Entities.Catalog;

namespace Shop.Application.Repositories;

public interface IProductRepository
{
    public Task<Product> AddAsync(Product entity);
    public Task DeleteAsync(Product entity);
    public Task<IEnumerable<Product>> GetAllAsync();
    public Task<(IEnumerable<Product>, int)> GetAllMatchingAsync(
        string? searchPhrase,
        int pageSize,
        int pageNumber,
        string? sortBy,
        SortDirection sortDirection
        );
    public Task<Product?> GetByIdAsync(int id);
    public Task SaveChangesAsync();
}
