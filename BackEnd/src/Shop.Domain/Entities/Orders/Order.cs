using Shop.Domain.Enums;

namespace Shop.Domain.Entities.Orders;

public class Order
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = string.Empty;

    public User User { get; set; } = default!;

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public decimal TotalPrice { get; set; }

    public List<OrderDetail> OrderDetails { get; set; } = [];
}
