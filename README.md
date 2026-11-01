# Shop-Api

ASP.NET Core 10 Web API for an online shop, built with Clean Architecture and CQRS.

## Demo

[https://github.com/user-attachments/assets/YOUR-VIDEO-ID](https://github.com/user-attachments/assets/2f7bbe18-20bf-48b3-b460-190a1bad6bd7)

## Technologies & Features

- ASP.NET Core 10
- Clean Architecture
- RESTful Web API
- Entity Framework Core with Fluent API
- CQRS and Mediator
- Serilog
- Authentication and Authorization
- ASP.NET Core Identity (Users and Roles)
- Dependency Injection
- AutoMapper
- FluentValidation
- Swagger and Postman API Documentation

## Entities

- Product
- Category
- Cart
- Order
- Identity User
- Role

## Frontend

The React frontend lives in [`FrontEnd/`](./FrontEnd). See
[`FrontEnd/README.md`](./FrontEnd/README.md) for setup, scripts, and architecture.

Quick start:

```bash
cd FrontEnd
npm ci
cp .env.example .env      # set VITE_API_BASE_URL
npm run dev
```

## Test Accounts

**Admin**
- Username: `admin@gmail.com`
- Password: `Test123?`

**User**
- Username: `user@gmail.com`
- Password: `Test123?`




