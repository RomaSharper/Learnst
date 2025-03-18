using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Learnst.Api;

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
            if (trustedOrigins is { Length: > 0 })
                configBuilder.WithOrigins(trustedOrigins)
                    .AllowCredentials()
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .SetIsOriginAllowedToAllowWildcardSubdomains()
                    .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
            else
                configBuilder.AllowAnyOrigin()
                    .AllowAnyHeader()
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
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["auth-token"];
                        return Task.CompletedTask;
                    }
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
}