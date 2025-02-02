using System.Text;
using Learnst.Api.Services;
using Learnst.Dao;
using Learnst.Dao.Abstraction;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

const string policyName = "CORS";
const string apiName = "Learnst API v.1";
const string connectionStringName = "DefaultConnection";
string[] trustedOrigins = ["https://learnst.runasp.net"];

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRequestTimeouts(options => options.DefaultPolicy = new RequestTimeoutPolicy { Timeout = TimeSpan.FromMinutes(5) });

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString(connectionStringName)));

builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));

builder.Services.AddScoped<IEmailSender, SmtpEmailSender>()
                .AddScoped<IValidationService, ValidationService>()
                .AddScoped<ICertificateService, CertificateService>();

builder.Services.AddCors(options => options.AddPolicy(policyName,
    policyBuilder => policyBuilder.WithOrigins(trustedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidAudience = builder.Configuration["Jwt:Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
});

builder.Services.AddAuthorization();

builder.Services.AddHttpClient(apiName, client => client.Timeout = TimeSpan.FromMinutes(5));

builder.Services.AddOpenApi()
                .AddSwaggerGen()
                .AddDistributedMemoryCache()
                .AddSession()
                .AddControllers();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors(policyName);
app.UseSession();

//if (app.Environment.IsDevelopment())
    app.UseSwagger()
       .UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", apiName));

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    var origin = context.Request.Headers.Origin.ToString();

    /*if (path.StartsWith("/error") || path.StartsWith("/api/oauth2")
        || trustedOrigins.Any(trustedOrigin => origin.StartsWith(trustedOrigin)))
    {*/
        await next();
        return;/*
    }

    await File.AppendAllTextAsync("events.log", $"""
    ** Запрещен доступ источнику "{(string.IsNullOrEmpty(origin) ? "Пустой" : origin)}", так как он не является доверенным. **

    """);
    context.Response.Redirect("/error");
    await context.Response.CompleteAsync();*/
});

app.MapGet("/error", () => Results.Content(
    """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Блокировка</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f4f4f4;
                font-family: Roboto, Helvetica-Neue, Consolas, system-ui, Arial, sans-serif;
            }
            .container {
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                background-color: white;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #d9534f;
            }
            p {
                color: #555;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Ошибка доступа</h1>
            <p>Вы не имеете право доступа к этому сайту.</p>
        </div>
    </body>
    </html>
    """,
    contentType: "text/html",
    contentEncoding: Encoding.UTF8,
    statusCode: 403)
);

app.UseAuthorization();

app.MapControllers();

app.Run();
