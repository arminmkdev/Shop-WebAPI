namespace Shop.Domain.Exceptions;

public class UnauthorizedException()
    : Exception("User not authenticated")
{
}
