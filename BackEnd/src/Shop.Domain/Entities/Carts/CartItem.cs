using System.ComponentModel.DataAnnotations.Schema;
using Shop.Domain.Entities.Catalog;

namespace Shop.Domain.Entities.Carts;

public class CartItem
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CartId { get; set; }

    [ForeignKey(nameof(CartId))]
    public Cart Cart { get; set; } = default!;

    public int ProductId { get; set; }

    public Product Product { get; set; } = default!;

    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
