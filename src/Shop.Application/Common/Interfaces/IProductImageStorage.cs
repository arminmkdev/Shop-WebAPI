namespace Shop.Application.Common.Interfaces;

public interface IProductImageStorage
{
    Task<string> SaveAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken);
}
