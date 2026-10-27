namespace Shop.Application.Interfaces;

public interface IProductImageStorage
{
    Task<string> SaveAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken);
}
