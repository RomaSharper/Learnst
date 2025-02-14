using Learnst.Api;
using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Application.Interfaces;
using Learnst.Domain.Mappings;
using Learnst.Domain.Models;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

const string policy = "CORS";
const string apiName = "Learnst API v.1";
const string swaggerUrl = "/swagger/v1/swagger.json";
const string connectionStringName = "DefaultConnection";
string[] trustedOrigins = ["https://learnst.runasp.net"];
string[] trustedPaths = ["/error", "/oauth2", "/apps", "/account", "/sessions"];

var builder = WebApplication.CreateBuilder(args);

// Настройка CORS
builder.Services.AddCustomCors(trustedOrigins: null);

// Настройка AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<FullUpdateProfile<Activity, Guid>>();
    cfg.AddProfile<ApplicationUpdateProfile>();
    cfg.AddProfile<FullUpdateProfile<InfoCard, int>>();
    cfg.AddProfile<FullUpdateProfile<Lesson, Guid>>();
    cfg.AddProfile<FullUpdateProfile<Question, Guid>>();
    cfg.AddProfile<FullUpdateProfile<SocialMediaProfile, int>>();
    cfg.AddProfile<FullUpdateProfile<Ticket, Guid>>();
    cfg.AddProfile<FullUpdateProfile<User, Guid>>();
}, typeof(Program));

// Регистрация сервисов
builder.Services.AddScoped<JwtService>()
    .AddScoped<IEmailSender, SmtpEmailSender>()
    .AddScoped<IValidationService, ValidationService>()
    .AddScoped<ICertificateService, CertificateService>()
    .AddScoped(typeof(IRepository<,>), typeof(Repository<,>))
    .AddScoped(typeof(IBulkRepository<,>), typeof(BulkRepository<,>))
    .AddScoped(typeof(IAsyncRepository<,>), typeof(AsyncRepository<,>))
    .AddScoped(typeof(ISoftDeleteRepository<,>), typeof(SoftDeleteRepository<,>));

// Конфигурация настроек из appsettings.json
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

// Настройка базы данных и аутентификации
builder.Services.AddRequestTimeout(TimeSpan.FromMinutes(5))
    .AddDbContext<ApplicationDbContext>(options => options
        .UseSqlServer(builder.Configuration.GetConnectionString(connectionStringName)), ServiceLifetime.Transient)
    .AddJwtAuthentication(builder.Configuration)
    .AddAuthorization()
    .AddHttpClient(apiName, client => client.Timeout = TimeSpan.FromMinutes(5));

// Добавление остальных служб
builder.Services.AddOpenApi()
    .AddSwaggerGen()
    .AddDistributedMemoryCache()
    .AddSession()
    .AddControllers();

var app = builder.Build();

// Middleware
app.UseRouting()
    .UseCookieAccessToken()
    .UseAuthentication()
    .UseAuthorization()
    .UseHttpsRedirection()
    .UseStaticFiles()
    .UseCors(policy)
    .UseSession()
    .UseCustomSecurity(onError: async (context, _, origin) => // Middleware для безопасности
     {
         await LogService.WriteLine(
             $"** Запрещен доступ источнику \"{(string.IsNullOrEmpty(origin) ? "Пустой" : origin)}\", так как он не является доверенным. **");
         context.Response.Redirect("/error");
     });

app.UseCustomSwagger(apiName, swaggerUrl, willUse: true); // Используем метод для настройки Swagger
app.MapControllers();
app.Run();
