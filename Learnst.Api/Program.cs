using System.Text;
using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Dao;
using Learnst.Dao.Abstraction;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;

const string policyName = "CORS";
const string apiName = "Learnst API v.1";
const string connectionStringName = "DefaultConnection";
string[] trustedOrigins = ["https://learnst.runasp.net"];

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => options.AddPolicy(policyName,
    policyBuilder => policyBuilder.WithOrigins(trustedOrigins)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

builder.Services.AddScoped<JwtService>()
    .AddScoped<IEmailSender, SmtpEmailSender>()
    .AddScoped<IValidationService, ValidationService>()
    .AddScoped<ICertificateService, CertificateService>();

builder.Services.Configure<VkSettings>(builder.Configuration.GetSection("Vk"))
    .Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"))
    .Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"))
    .Configure<SftpSettings>(builder.Configuration.GetSection("Sftp"))
    .Configure<SteamSettings>(builder.Configuration.GetSection("Steam"))
    .Configure<GithubSettings>(builder.Configuration.GetSection("Github"))
    .Configure<MailRuSettings>(builder.Configuration.GetSection("MailRu"))
    .Configure<TikTokSettings>(builder.Configuration.GetSection("TikTok"))
    .Configure<TwitchSettings>(builder.Configuration.GetSection("Twitch"))
    .Configure<GoogleSettings>(builder.Configuration.GetSection("Google"))
    .Configure<YandexSettings>(builder.Configuration.GetSection("Yandex"))
    .Configure<DiscordSettings>(builder.Configuration.GetSection("Discord"))
    .Configure<TelegramSettings>(builder.Configuration.GetSection("Telegram"))
    .Configure<FacebookSettings>(builder.Configuration.GetSection("Facebook"))
    .Configure<MicrosoftSettings>(builder.Configuration.GetSection("Microsoft"))
    .Configure<EpicGamesSettings>(builder.Configuration.GetSection("EpicGames"));

builder.Services.AddRequestTimeouts(options => options.DefaultPolicy = new RequestTimeoutPolicy { Timeout = TimeSpan.FromMinutes(5) })
    .AddDbContext<ApplicationDbContext>(
        options => options.UseSqlServer(builder.Configuration.GetConnectionString(connectionStringName)),
        ServiceLifetime.Transient)
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    });

builder.Services.AddAuthorization()
    .AddHttpClient(apiName, client => client.Timeout = TimeSpan.FromMinutes(5));

builder.Services.AddOpenApi()
    .AddSwaggerGen(action => action.UseInlineDefinitionsForEnums())
    .AddSwaggerGenNewtonsoftSupport()
    .AddDistributedMemoryCache()
    .AddSession()
    .AddControllers();

var app = builder.Build();

app.UseRouting()
    .Use(async (context, next) =>
    {
        var token = context.Request.Cookies["access_token"];
        if (!string.IsNullOrEmpty(token))
            context.Request.Headers.Authorization = new StringValues($"Bearer {token}");
        await next();
    }).UseAuthentication()
    .UseAuthorization()
    .UseHttpsRedirection()
    .UseStaticFiles()
    .UseCors(policyName)
    .UseSession();

// if (app.Environment.IsDevelopment())
    app.UseSwagger()
       .UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", apiName));

/*app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    var origin = context.Request.Headers.Origin.ToString();

    if (path.StartsWith("/error") || path.StartsWith("/oauth2") || trustedOrigins.Any(trustedOrigin => origin.StartsWith(trustedOrigin)))
    {
        await next();
        return;
    }

    await LogService.WriteLine(
        $"** Запрещен доступ источнику \"{(string.IsNullOrEmpty(origin) ? "Пустой" : origin)}\", так как он не является доверенным. **");
    context.Response.Redirect("/error");
    await context.Response.CompleteAsync();
});*/

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
