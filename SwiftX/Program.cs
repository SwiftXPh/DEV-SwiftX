using System;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SwiftX;
using SwiftX.Models;
using SwiftX.Services;

var builder = WebApplication.CreateBuilder(args);

// Render/Railway provide the listening port via the PORT env var; bind to it on all interfaces.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container. Antiforgery is validated on every unsafe request by default.
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

builder.Services.AddAntiforgery(options => 
{
    options.HeaderName = "RequestVerificationToken";
});

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(20);
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.Name = "SwiftX.Session";
    options.Cookie.IsEssential = true;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Supabase Storage for user-uploaded documents.
builder.Services.Configure<SupabaseOptions>(builder.Configuration.GetSection("Supabase"));
builder.Services.AddHttpClient<ISupabaseStorageService, SupabaseStorageService>();

// Google Maps Options
builder.Services.Configure<GoogleMapsOptions>(builder.Configuration.GetSection("GoogleMaps"));
builder.Services.AddHttpClient("GoogleMaps");

// Password hashing (PBKDF2 via the framework's PasswordHasher — no extra package).
builder.Services.AddSingleton<IPasswordHasher<UserModel>, PasswordHasher<UserModel>>();

builder.Services.AddAuthentication()
    .AddCookie("AdminScheme", options =>
    {
        options.LoginPath = "/Admin";
        options.AccessDeniedPath = "/Admin";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Cookie.Name = "SwiftX.Admin";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
    })
    .AddCookie("CustomerScheme", options =>
    {
        options.LoginPath = "/Customer/UserLogin";
        options.AccessDeniedPath = "/Customer/UserLogin";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Cookie.Name = "SwiftX.Customer";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events = new CookieAuthenticationEvents
        {
            OnValidatePrincipal = context =>
            {
                if (context.Properties.IssuedUtc.HasValue && 
                    DateTimeOffset.UtcNow.Subtract(context.Properties.IssuedUtc.Value) > TimeSpan.FromDays(30))
                {
                    context.RejectPrincipal();
                    return Task.CompletedTask;
                }
                return Task.CompletedTask;
            }
        };
    })
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
        options.CallbackPath = "/signin-google";
        options.Scope.Add("email");
        options.Scope.Add("profile");
        // Issue the cookie into CustomerScheme so the rest of the app sees the user.
        options.SignInScheme = "CustomerScheme";
        
        // Force the account selection screen every time the user clicks "Continue with Google"
        // Also handle the case where the user cancels the login prompt gracefully
        options.Events = new Microsoft.AspNetCore.Authentication.OAuth.OAuthEvents
        {
            OnRedirectToAuthorizationEndpoint = context =>
            {
                var uri = context.RedirectUri;
                uri += uri.Contains("?") ? "&prompt=select_account" : "?prompt=select_account";
                context.Response.Redirect(uri);
                return Task.CompletedTask;
            },
            OnRemoteFailure = context =>
            {
                // User cancelled the login or something went wrong at Google's end
                context.Response.Redirect("/Customer/UserLogin");
                context.HandleResponse();
                return Task.CompletedTask;
            }
        };
    });

// Throttle admin login attempts per client IP to blunt brute-force / credential stuffing.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5)
            }));
});

// Trust the X-Forwarded-* headers from Render/Railway's TLS-terminating proxy so the app
// sees the real scheme (https) and client IP. Proxy IPs are dynamic, so don't pin them.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Automatically apply pending EF Core migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

// Admin is now authenticated exclusively via environment variables.

// Must run before anything that inspects the scheme/host or client IP.
app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error/Error5xx");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Render nice branded pages for 4xx/5xx status codes (404, 403, etc.).
app.UseStatusCodePagesWithReExecute("/Error/Status", "?code={0}");

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
