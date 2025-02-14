using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.Extensions.Primitives;

namespace Learnst.Api;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

public static class StartupExtensions
{
    /// <summary>
    /// Метод для настройки CORS
    /// </summary>
    public static IServiceCollection AddCustomCors(this IServiceCollection services, params string[]? trustedOrigins)
    {
        const string corsPolicy = "CORS";
        services.AddCors(options => options.AddPolicy(corsPolicy, configBuilder =>
        {
            if (trustedOrigins is null or { Length: > 0 })
                configBuilder.AllowAnyOrigin();
            else
                configBuilder.WithOrigins(trustedOrigins)
                    .AllowCredentials();
            
            configBuilder.AllowAnyHeader()
                .AllowAnyMethod();
        }));
        return services;
    }

    /// <summary>
    /// Метод для настройки аутентификации JWT
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!))
                };
            });
        return services;
    }

    public static IServiceCollection AddRequestTimeout(this IServiceCollection services, TimeSpan timeout)
        => services.AddRequestTimeouts(options => options.DefaultPolicy = new RequestTimeoutPolicy { Timeout = timeout });

    /// <summary>
    /// Метод для настройки middleware безопасности
    /// </summary>
    public static IApplicationBuilder UseCustomSecurity(this IApplicationBuilder app, string[]? trustedOrigins = null, string[]? trustedPaths = null, Func<HttpContext, RequestDelegate, string?, Task>? onError = null) =>
        app.Use(async (context, next) =>
        {
            var origin = context.Request.Headers.Origin;
            var path = context.Request.Path.Value ?? string.Empty;

            if (trustedOrigins is not null && trustedPaths is not null && !trustedPaths.Any(path.StartsWith)
                 &&!trustedOrigins.Any(trustedOrigin => origin.ToString().StartsWith(trustedOrigin)))
            {
                if (onError is not null)
                    await onError(context, next, origin);
                await context.Response.CompleteAsync();
                return;
            }

            await next(context);
        });


    /// <summary>
    /// Метод для настройки Swagger.
    /// </summary>
    /// <param name="app">Приложение.</param>
    /// <param name="apiName">Наименование API.</param>
    /// <param name="swaggerUrl">Ссылка на swagger.json.</param>
    /// <param name="willUse">Собственноручно указывает, будет ли использовать Swagger</param>
    /// <returns>Приложение.</returns>
    public static IApplicationBuilder UseCustomSwagger(this WebApplication app, string apiName, string swaggerUrl, bool willUse = false)
    {
        if (willUse || app.Environment.IsDevelopment())
            app.UseDeveloperExceptionPage()
               .UseSwagger()
               .UseSwaggerUI(options => options.SwaggerEndpoint(swaggerUrl, apiName));
        return app;
    }

    /// <summary>
    /// Использовать куки-токен.
    /// </summary>
    /// <param name="app">Приложение.</param>
    /// <returns>Приложение.</returns>
    public static IApplicationBuilder UseCookieAccessToken(this IApplicationBuilder app) => app.Use(async (context, next) =>
    {
        var token = context.Request.Cookies["access_token"];
        context.Request.Headers.Authorization = new StringValues(string.IsNullOrEmpty(token) ? null : $"Bearer {token}");
        await next();
    });
}