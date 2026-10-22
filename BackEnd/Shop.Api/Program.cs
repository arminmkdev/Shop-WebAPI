using Serilog;
using Shop.Api.Extensions;
using Shop.Api.Middlewares;
using Shop.Application.Extensions;
using Shop.Domain.Entities;
using Shop.Infrastructure.Extensions;
using Shop.Infrastructure.Seeders;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.AddPresentation();
builder.Services.AddApplication();
builder.Services.AddInfrastrucure(builder.Configuration);

WebApplication app = builder.Build();

IServiceScope scope = app.Services.CreateScope();
IShopSeeder seeder = scope.ServiceProvider.GetRequiredService<IShopSeeder>();

await seeder.Seed();

app.UseCors();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestTimeLoggingMiddleware>();

app.UseSerilogRequestLogging();

app.UseSwagger();
app.UseSwaggerUI();

app.MapOpenApi();

app.UseHttpsRedirection();

app.MapGroup("identity")
    .WithTags("Identity")
    .MapIdentityApi<User>();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
