using Microsoft.EntityFrameworkCore;
using Shop.Domain.Entities.Catalog;

namespace Shop.Infrastructure.Data;

public static class SeedData
{
    public static void Configure(ModelBuilder modelBuilder)
    {
        // Categories
        modelBuilder.Entity<Category>().HasData(
            new Category
            {
                Id = 1,
                Name = "men"
            },
            new Category
            {
                Id = 2,
                Name = "women"
            }
        );

        // Products
        modelBuilder.Entity<Product>().HasData(
    // Men's Collection
    new
    {
        Id = 1,
        Name = "Men's Classic Black Jacket",
        Description = "A stylish black jacket suitable for everyday wear and cool weather.",
        Price = 89,
        CategoryId = 1,
        ImageUrl = "/images/men/mens_jacket.jpg",
        Quantity = 12
    },
    new
    {
        Id = 2,
        Name = "Men's Performance Running Shoes",
        Description = "Lightweight running shoes designed for comfort, support, and daily workouts.",
        Price = 75,
        CategoryId = 1,
        ImageUrl = "/images/men/mens_shoes.jpg",
        Quantity = 18
    },
    new
    {
        Id = 3,
        Name = "Men's Urban Graphic Tee",
        Description = "A modern graphic T-shirt made for comfortable everyday outfits.",
        Price = 25,
        CategoryId = 1,
        ImageUrl = "/images/men/mens_tee.jpg",
        Quantity = 35
    },
    new
    {
        Id = 4,
        Name = "Men's Everyday White Sneakers",
        Description = "Versatile sneakers that pair easily with casual and sporty clothing.",
        Price = 64,
        CategoryId = 1,
        ImageUrl = "/images/men/mens_sneaker.jpg",
        Quantity = 22
    },

    // Women's Collection
    new
    {
        Id = 5,
        Name = "Women's Floral Summer Dress",
        Description = "A lightweight floral summer dress with a comfortable fit for warm-weather outings.",
        Price = 68,
        CategoryId = 2,
        ImageUrl = "/images/women/womens_dress.jpg",
        Quantity = 16
    },
    new
    {
        Id = 6,
        Name = "Women's Elegant Leather Handbag",
        Description = "An elegant everyday handbag with plenty of space for essential belongings.",
        Price = 95,
        CategoryId = 2,
        ImageUrl = "/images/women/womens_bag.jpg",
        Quantity = 9
    },
    new
    {
        Id = 7,
        Name = "Women's Everyday Canvas Tote",
        Description = "A spacious canvas tote bag ideal for shopping, work, and daily use.",
        Price = 32,
        CategoryId = 2,
        ImageUrl = "/images/women/womens_tote.jpg",
        Quantity = 28
    },
    new
    {
        Id = 8,
        Name = "Women's Modern Street Sneakers",
        Description = "Modern street-style sneakers combining everyday comfort with a sporty look.",
        Price = 72,
        CategoryId = 2,
        ImageUrl = "/images/women/womens_sneaker.jpg",
        Quantity = 14
    }
);
    }
}
