using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Shop.Application.Constants;
using Shop.Application.Repositories;
using Shop.Domain.Entities.Catalog;
using Shop.Infrastructure.Persistence;

namespace Shop.Infrastructure.Repositories;

internal class ProductRepository(ShopDbContext dbContext) : IProductRepository
{
    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        IEnumerable<Product> products = await dbContext.Products.ToListAsync();

        return products;
    }

    public async Task<(IEnumerable<Product>, int)> GetAllMatchingAsync(
        string? searchPhrase,
        int pageSize,
        int pageNumber,
        string? sortBy,
        SortDirection sortDirection
        )
    {
        var searchPhraseLower = searchPhrase?.ToLower();

        IQueryable<Product> baseQuery = dbContext.Products
            .Where(p => searchPhraseLower == null ||
                p.Name.ToLower().Contains(searchPhraseLower) ||
                p.Description.ToLower().Contains(searchPhraseLower));

        if (sortBy != null)
        {
            var columnsSelector = new Dictionary<string, Expression<Func<Product, object>>>
            {
                {nameof(Product.Name).ToLower() ,p=>p.Name },
                {nameof(Product.Description).ToLower(),p=> p.Description },
                {nameof(Product.Price).ToLower(),p=>p.Price },
                {nameof(Product.Quantity).ToLower(),p=>p.Quantity }
            };

            Expression<Func<Product, object>> selectedColumn = columnsSelector[sortBy.ToLower()];

            baseQuery = sortDirection == SortDirection.Ascending
                ? baseQuery.OrderBy(selectedColumn)
                : baseQuery.OrderByDescending(selectedColumn);
        }

        var itemsCount = await baseQuery.CountAsync();

        IEnumerable<Product> products = await baseQuery
            .Skip(pageSize * (pageNumber - 1))
            .Take(pageSize)
            .ToListAsync();

        return (products, itemsCount);
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        Product? product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);

        return product;
    }

    public async Task DeleteAsync(Product entity)
    {
        dbContext.Products.Remove(entity);
        await dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await dbContext.SaveChangesAsync();
    }

    public async Task<Product> AddAsync(Product entity)
    {
        await dbContext.AddAsync(entity);
        await dbContext.SaveChangesAsync();
        return entity;
    }
}
