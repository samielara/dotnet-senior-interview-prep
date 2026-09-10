// ============================================================================
// PILLAR 2: ASP.NET CORE & WEB APIS (14 Questions)
// Sourced directly from User's Layer 2 PDF Guide and real-world .NET interview standards
// ============================================================================

const aspnetQuestions = [
  {
    title: "How do you keep an ASP.NET Core controller thin?",
    seniority: "Mid-to-Senior",
    tags: ["Controllers", "Thin Controller", "Clean Architecture", "Separation of Concerns"],
    pitch: "The controller should handle only HTTP-level concerns: route matching, model validation, authorization checks, and HTTP status code mapping. All business calculations, workflow coordination, domain rules, and data access should be delegated to a dedicated service or manager layer. This keeps workflow logic reusable, maintainable, and easily unit-testable without mocking HttpContext.",
    analogy: "A restaurant waiter takes the order and delivers the result; the kitchen contains the cooking rules and prepares the meal.",
    deepDive: `Architectural Boundaries:
1. Controller Responsibilities:
   - Accept [FromBody] DTOs and bind query/route parameters.
   - Return appropriate HTTP ActionResults (Ok, Created, NotFound, BadRequest).
   - Pass the request's CancellationToken to the service.
2. Service Layer Responsibilities:
   - Enforce business logic and transactional boundaries.
   - Coordinate multiple repositories or external integrations.
   - Return clean Result<T> or domain DTOs to the controller.
3. Common Anti-Pattern:
   - Moving 1,000 lines of controller code into a single 'God Service' method. Keep service methods focused around specific business use cases.`,
    codeSnippet: `[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService) => _orderService = orderService;

    // ✅ THIN CONTROLLER: Only maps HTTP input/output; delegates business logic to service
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken ct)
    {
        var result = await _orderService.CreateOrderAsync(request, ct);

        if (!result.IsSuccess)
        {
            return Problem(detail: result.Error, statusCode: StatusCodes.Status400BadRequest);
        }

        return CreatedAtAction(nameof(GetOrderById), new { id = result.Value.Id }, result.Value);
    }
}`,
    redFlags: [
      "Querying the DbContext directly inside the controller action methods.",
      "Writing 200-line controller actions filled with raw business calculations, email sending, and file writes.",
      "Moving all controller logic into one giant service method instead of preserving focused domain boundaries."
    ],
    proTips: [
      "Use CQRS with MediatR (IRequest<TResponse>) or Minimal API endpoint filters to keep endpoint handlers strictly under 15 lines of code."
    ]
  },
  {
    title: "What is dependency injection, and why use it?",
    seniority: "Mid-to-Senior",
    tags: ["Dependency Injection", "IoC", "Loose Coupling", "Testability", "IServiceCollection"],
    pitch: "Dependency Injection (DI) supplies a class with the dependencies it needs from the outside (typically via constructor injection) instead of letting the class construct them directly with 'new'. It reduces tight coupling, centralizes component configuration and lifetimes, and makes units trivial to test by substituting mock implementations.",
    analogy: "A school provides each classroom with approved supplies instead of every teacher building their own desks and printers from scratch.",
    deepDive: `Inversion of Control (IoC) Mechanics:
1. Constructor Injection:
   - The ASP.NET Core built-in container inspects class constructors via reflection, resolves registered service types, and instantiates the graph automatically.
2. Testability Benefits:
   - Allows unit tests to pass an in-memory 'Mock<IOrderRepository>' to 'OrderService' without standing up a real SQL database.
3. The Service Locator Anti-Pattern:
   - Injecting 'IServiceProvider' directly into classes and manually calling 'provider.GetService<T>()' is a major code smell: it hides actual class dependencies and breaks design contracts.`,
    codeSnippet: `// ❌ TIGHT COUPLING: Hardcodes concrete implementation
public class BadCustomerService
{
    private readonly SqlCustomerRepository _repo = new SqlCustomerRepository(); // Cannot mock!
}

// ✅ DEPENDENCY INJECTION: Injects interface contract
public class GoodCustomerService
{
    private readonly ICustomerRepository _repo;

    // ASP.NET Core DI resolves ICustomerRepository automatically
    public GoodCustomerService(ICustomerRepository repo)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
    }
}

// Registration in Program.cs
builder.Services.AddScoped<ICustomerRepository, SqlCustomerRepository>();
builder.Services.AddScoped<GoodCustomerService>();`,
    redFlags: [
      "Using 'new' to instantiate database repositories or HTTP clients inside business services.",
      "Injecting IServiceProvider as a Service Locator and resolving everything manually at runtime.",
      "Creating circular dependencies where ServiceA injects ServiceB and ServiceB injects ServiceA."
    ],
    proTips: [
      "Always program against interfaces (e.g. IEmailSender) rather than concrete classes: this makes swapping providers (e.g., SendGrid to AWS SES) a one-line change in Program.cs."
    ]
  },
  {
    title: "Explain transient, scoped, and singleton service lifetimes in ASP.NET Core.",
    seniority: "Mid-to-Senior",
    tags: ["DI Lifetimes", "Transient", "Scoped", "Singleton", "Captive Dependency"],
    pitch: "Transient creates a brand-new instance every single time the service is requested. Scoped creates one single instance per client HTTP request (shared across all components within that request). Singleton creates one instance the first time it is requested and reuses that same instance for the entire lifetime of the application. A scoped service (like DbContext) must NEVER be injected into a singleton.",
    analogy: "Transient is a fresh worksheet per use; Scoped is one shared folder for a student's office visit; Singleton is the school clock on the wall shared all year by everyone.",
    deepDive: `Lifetime Mechanics & The Captive Dependency Trap:
1. AddTransient:
   - Best for lightweight, stateless utility operations.
2. AddScoped:
   - Best for services with per-request state, such as EF Core's DbContext or current user context.
   - When the HTTP request completes, the container automatically calls Dispose() on all scoped instances.
3. AddSingleton:
   - Best for expensive, stateless resources or caches (e.g., IMemoryCache, HttpClient, connection multiplexers).
   - ⚠️ MUST be thread-safe! Singleton methods are accessed concurrently by hundreds of request threads.
4. The Captive Dependency Bug:
   - A Singleton service injecting a Scoped service captures it for the entire process, causing thread-safety crashes and memory leaks.
   - Enabled by default in Development: 'ValidateScopes = true'.`,
    codeSnippet: `var builder = WebApplication.CreateBuilder(args);

// 1. Transient: New instance every injection
builder.Services.AddTransient<ITokenGenerator, TokenGenerator>();

// 2. Scoped: One instance per HTTP request (DbContext default)
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(...));

// 3. Singleton: One instance for entire app lifetime
builder.Services.AddSingleton<IMemoryCache, MemoryCache>();

// ⚠️ Resolving Scoped inside Singleton (Background Worker Pattern):
public class QueueWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory; // Injected singleton

    public QueueWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope(); // Explicit scope!
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.ExecuteSqlRawAsync("...", stoppingToken);
    }
}`,
    redFlags: [
      "Injecting a Scoped service (like DbContext) into a Singleton (Captive Dependency).",
      "Assuming Singleton means thread-safe (you must write thread-safe code for singletons!).",
      "Using Transient for expensive objects like DbContext or HttpClient."
    ],
    proTips: [
      "Always leave 'builder.Host.UseDefaultServiceProvider(o => o.ValidateScopes = true)' enabled in development to fail fast on startup if a captive dependency is introduced."
    ]
  },
  {
    title: "What is the difference between middleware and filters in ASP.NET Core?",
    seniority: "Mid-to-Senior",
    tags: ["Middleware", "Filters", "HTTP Pipeline", "MVC Pipeline", "ActionFilter"],
    pitch: "Middleware participates in the global HTTP pipeline and executes for every incoming request (including static files, WebSockets, and health checks) before routing reaches an endpoint. It has access only to raw HttpContext. MVC Filters run inside the MVC routing pipeline after an endpoint is selected: they have access to controller context, action arguments, model binding, and ModelState.",
    analogy: "Middleware is school security at the main building entrance; a filter is a hall pass check applied inside a specific classroom.",
    deepDive: `Pipeline Sequencing:
1. Middleware Pipeline:
   - Request -> Middleware A -> Middleware B (UseRouting) -> Endpoint Selected ->
   - Filters (Authorization -> Resource -> Model Binding -> Action Filter) ->
   - Controller Action -> Result Filter -> Middleware B -> Middleware A -> Response.
2. When to Use Middleware:
   - Cross-cutting infrastructure concerns: CORS, Request logging, SSL enforcement, Rate limiting, Static file serving.
3. When to Use Filters:
   - Business request validation, action-level permission checks, audit logging with parameter values, custom action result transformation.`,
    codeSnippet: `// 1. Middleware: Operates on raw HttpContext globally
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    public RequestTimingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context); // Calls next middleware in chain
        sw.Stop();
        context.Response.Headers["X-Response-Time-Ms"] = sw.ElapsedMilliseconds.ToString();
    }
}

// 2. Action Filter: Operates inside MVC with model state & parameters
public class ValidateModelFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ModelState.IsValid)
        {
            context.Result = new BadRequestObjectResult(context.ModelState); // Short-circuit!
            return;
        }
        await next(); // Proceed to controller action
    }
}`,
    redFlags: [
      "Using Action Filters for global concerns like CORS or Global Exception Handling (should be middleware).",
      "Trying to read and deserialize request bodies inside middleware without calling 'context.Request.EnableBuffering()'.",
      "Not knowing that middleware executes in the exact order registered in Program.cs."
    ],
    proTips: [
      "Use Resource Filters for performance-sensitive caching: they execute before model binding, allowing you to return cached responses without paying the CPU cost of deserializing large JSON request bodies."
    ]
  },
  {
    title: "How do you design a REST API response and choose appropriate HTTP status codes?",
    seniority: "Mid-to-Senior",
    tags: ["REST", "HTTP Status Codes", "API Design", "ProblemDetails", "Idempotency"],
    pitch: "Use resource-oriented routes, validate input upfront, return a consistent JSON response shape, and choose HTTP status codes that accurately match the outcome: 200 for OK, 201 for Created (with Location header), 204 for No Content (successful update/delete), 400 for Bad Request (validation errors), 401 for Unauthorized, 403 for Forbidden, 404 for Not Found, and 409 for Conflict.",
    analogy: "A package tracking code should clearly say delivered, wrong address, missing package, or duplicate request instead of always saying 'something happened'.",
    deepDive: `Standardized REST Status Code Matrix:
1. Success Codes (2xx):
   - 200 OK: Standard successful GET/PUT.
   - 201 Created: POST that created a new resource. Returns 'Location' header pointing to new resource.
   - 204 No Content: Successful DELETE or PUT where no response body is needed.
2. Client Error Codes (4xx):
   - 400 Bad Request: Malformed payload or validation failure.
   - 401 Unauthorized: Caller is unauthenticated (missing or invalid JWT).
   - 403 Forbidden: Caller is authenticated but lacks required role/permission.
   - 404 Not Found: Requested resource ID does not exist.
   - 409 Conflict: State collision (e.g. optimistic concurrency failure or duplicate unique key).
3. The RFC 7807 Standard:
   - Always return error responses using the RFC 7807 ProblemDetails specification.`,
    codeSnippet: `[HttpPost]
public async Task<IActionResult> CreateProduct([FromBody] ProductDto dto, CancellationToken ct)
{
    if (await _repo.ExistsAsync(dto.Sku, ct))
    {
        // 409 Conflict: Duplicate unique resource
        return Conflict(new ProblemDetails { Title = "Duplicate SKU", Detail = $"SKU {dto.Sku} already exists." });
    }

    var product = await _repo.CreateAsync(dto, ct);

    // 201 Created with Location header pointing to GET endpoint
    return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
}

[HttpDelete("{id:guid}")]
public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
{
    var deleted = await _repo.DeleteAsync(id, ct);
    if (!deleted) return NotFound();

    return NoContent(); // 204 No Content
}`,
    redFlags: [
      "Returning HTTP 200 OK with a body containing '{ success: false, error: ... }' (violates REST conventions).",
      "Confusing 401 Unauthorized (unauthenticated) with 403 Forbidden (unauthorized/forbidden).",
      "Exposing internal exception messages or database table names in 500 error responses."
    ],
    proTips: [
      "In ASP.NET Core 7/8, call 'builder.Services.AddProblemDetails()' in Program.cs: it automatically standardizes all validation and runtime errors to the RFC 7807 ProblemDetails format."
    ]
  },
  {
    title: "What is idempotency, and why does it matter in web APIs and background jobs?",
    seniority: "Mid-to-Senior",
    tags: ["Idempotency", "REST", "HTTP Methods", "Retries", "Idempotency-Key"],
    pitch: "An operation is idempotent if executing it multiple times produces the exact same server state as executing it once. In REST, GET, PUT, and DELETE are idempotent by definition, while POST is not. Idempotency is critical for network reliability: when mobile clients or payment systems experience timeout retries, idempotent endpoints prevent duplicate orders, double billing, or corrupt data.",
    analogy: "Pressing an elevator button five times requests one elevator, not five elevators. Setting a thermostat to 72 degrees ten times still results in 72 degrees.",
    deepDive: `Implementing Idempotency in Production:
1. HTTP Methods & Idempotency:
   - GET: Safe and idempotent (read-only).
   - PUT: Idempotent (replaces entire resource state).
   - DELETE: Idempotent (resource is gone after 1st call; subsequent calls still result in resource being gone).
   - POST: Non-idempotent by default (creates new record every call).
2. The Idempotency Key Pattern (Stripe/Payment standard):
   - Client sends header: 'Idempotency-Key: <unique-uuid>'.
   - Server checks Redis or SQL table: if key exists, returns cached response without re-executing payment!
3. Background Jobs (Hangfire / Queues):
   - Workers must check if the job ID or business invoice has already been processed before mutating balances.`,
    codeSnippet: `// Idempotent Payment Handler using Idempotency Key
public async Task<PaymentResult> ChargeCustomerAsync(ChargeRequest request, string idempotencyKey, CancellationToken ct)
{
    // Check if operation was already completed
    var existingRecord = await _db.IdempotencyRecords
        .FirstOrDefaultAsync(r => r.Key == idempotencyKey, ct);

    if (existingRecord != null)
    {
        // Return original response without re-charging customer card!
        return JsonSerializer.Deserialize<PaymentResult>(existingRecord.ResponsePayload)!;
    }

    // Execute credit card charge...
    var result = await _paymentGateway.ExecuteChargeAsync(request, ct);

    // Persist idempotency record
    _db.IdempotencyRecords.Add(new IdempotencyRecord
    {
        Key = idempotencyKey,
        ResponsePayload = JsonSerializer.Serialize(result),
        CreatedAtUtc = DateTime.UtcNow
    });
    await _db.SaveChangesAsync(ct);

    return result;
}`,
    redFlags: [
      "Assuming database transactions alone make an external API request idempotent (external HTTP calls outside SQL will still duplicate!).",
      "Designing DELETE endpoints that increment a counter or perform non-idempotent side effects.",
      "Not handling client retry storms after network timeouts."
    ],
    proTips: [
      "Store idempotency keys with an expiration time (e.g. 24 hours) in Redis with atomic SETNX (Set if Not Exists) to prevent race conditions during rapid retries."
    ]
  },
  {
    title: "How do you handle exceptions in ASP.NET Core centrally?",
    seniority: "Mid-to-Senior",
    tags: ["Exception Handling", "ProblemDetails", "Middleware", "IExceptionHandler", "RFC 7807"],
    pitch: "Handle unexpected exceptions centrally using ASP.NET Core's UseExceptionHandler middleware or .NET 8's IExceptionHandler interface. Log sufficient diagnostics with correlation IDs, return safe standardized RFC 7807 ProblemDetails responses without exposing stack traces, and catch exceptions locally only when you can genuinely recover or enrich domain context.",
    analogy: "A school principal's office handles major campus emergencies consistently, while a teacher handles a missing pencil locally because the teacher can solve it immediately.",
    deepDive: `Modern Centralized Handling (.NET 8+):
1. IExceptionHandler Interface:
   - Registered via 'services.AddExceptionHandler<GlobalExceptionHandler>()'.
   - Receives HttpContext, Exception, and CancellationToken.
   - Returns true if the exception was handled, stopping further propagation.
2. Security Best Practice:
   - NEVER expose internal stack traces, connection strings, or SQL syntax to clients in production.
   - Include a unique 'traceId' (Activity.Current?.Id ?? HttpContext.TraceIdentifier) so users can quote the ID to customer support.
3. Distinguish Expected from Unexpected:
   - Expected validation failures (e.g. invalid email) should return 400 Bad Request directly without throwing expensive C# exceptions.`,
    codeSnippet: `// .NET 8 Standard Global Exception Handler
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Status = exception switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                InvalidOperationException => StatusCodes.Status409Conflict,
                _ => StatusCodes.Status500InternalServerError
            },
            Title = "An error occurred while processing your request.",
            Detail = httpContext.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment() 
                ? exception.Message 
                : "Internal server error. Please contact support with the trace ID.",
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

        httpContext.Response.StatusCode = problemDetails.Status.Value;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}`,
    redFlags: [
      "Wrapping every single controller action in identical try/catch blocks instead of using centralized middleware.",
      "Swallowing exceptions with empty catch blocks, hiding production bugs.",
      "Exposing full stack traces in production 500 error responses."
    ],
    proTips: [
      "In .NET 8, combine 'builder.Services.AddProblemDetails()' with 'builder.Services.AddExceptionHandler<GlobalExceptionHandler>()' and 'app.UseExceptionHandler()' for full RFC 7807 compliance."
    ]
  },
  {
    title: "Authentication versus Authorization: What is the difference and how do they work in ASP.NET Core?",
    seniority: "Mid-to-Senior",
    tags: ["Authentication", "Authorization", "JWT", "Claims", "Roles", "Policies"],
    pitch: "Authentication establishes WHO the caller is (verifying identity via credentials, tokens, or certificates). Authorization decides WHAT the authenticated caller is allowed to do (verifying permissions, roles, or claims). In ASP.NET Core, UseAuthentication() must precede UseAuthorization(), and authorization rules must always be enforced on the server regardless of what the UI hides.",
    analogy: "Authentication is checking your driver's license at airport security to verify your identity; Authorization is checking your boarding pass to see if you are allowed to enter the first-class lounge.",
    deepDive: `Pipeline Execution & ClaimsPrincipal:
1. Authentication Middleware (UseAuthentication):
   - Inspects the request (e.g. 'Bearer <token>' in Authorization header).
   - Validates token signature, expiration, and issuer.
   - If valid, constructs a 'ClaimsPrincipal' and attaches it to 'HttpContext.User'.
2. Authorization Middleware (UseAuthorization):
   - Inspects 'HttpContext.User.Claims' against endpoint requirements:
     [Authorize(Roles = "Admin")] or [Authorize(Policy = "CanApproveBudget")].
3. Policy-Based Authorization:
   - Superior to role-based authorization because policies evaluate custom requirement handlers (e.g. Must be department manager AND budget <= $50,000).`,
    codeSnippet: `// Policy Configuration in Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanApproveDiscounts", policy =>
        policy.RequireClaim("Permission", "discounts.approve")
              .RequireRole("Manager"));
});

// Enforcement on Controller
[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires authentication for all actions
public class DiscountsController : ControllerBase
{
    [HttpPost("approve")]
    [Authorize(Policy = "CanApproveDiscounts")] // Requires specific claim & role!
    public IActionResult ApproveDiscount()
    {
        return Ok(new { status = "Approved" });
    }
}`,
    redFlags: [
      "Placing app.UseAuthorization() before app.UseAuthentication() in Program.cs.",
      "Relying on frontend UI button hiding as a security control without server-side [Authorize] checks.",
      "Hardcoding role strings across 50 controllers instead of using reusable authorization policies."
    ],
    proTips: [
      "Use custom 'AuthorizationHandler<TRequirement>' for resource-based authorization (e.g., verifying that a user can only edit their OWN order: 'order.UserId == user.Id')."
    ]
  },
  {
    title: "Why pass a CancellationToken through backend code?",
    seniority: "Mid-to-Senior",
    tags: ["CancellationToken", "Cooperative Cancellation", "Async", "SQL Cancellation"],
    pitch: "A CancellationToken allows database queries, HTTP client calls, and long-running operations to stop immediately when the client aborts the request, closes their browser tab, or when a timeout policy triggers. Passing it through async layers prevents server CPU, memory, and database connection pools from being wasted on computations whose results will never be read.",
    analogy: "If a customer leaves the restaurant, the waiter should notify the kitchen to stop cooking the meal before wasting ingredients nobody will eat.",
    deepDive: `Cooperative Cancellation Mechanics:
1. Cancellation is Cooperative:
   - The CLR does not kill threads; downstream methods must check 'token.IsCancellationRequested' or pass the token to awaitable APIs.
2. What Happens in SQL Server:
   - When EF Core's 'ToListAsync(ct)' receives cancellation, it sends an attention packet over the TDS network connection, instructing SQL Server to cancel query execution and rollback locks immediately!
3. Controller Binding:
   - ASP.NET Core automatically binds 'HttpContext.RequestAborted' to any action parameter of type 'CancellationToken'.`,
    codeSnippet: `[HttpGet("heavy-report")]
public async Task<IActionResult> GenerateReport(CancellationToken ct)
{
    // If user cancels or navigates away, EF Core cancels SQL query execution!
    var data = await _db.Orders
        .AsNoTracking()
        .Where(o => o.Total > 500)
        .ToListAsync(ct);

    for (int i = 0; i < data.Count; i++)
    {
        // Periodic check in CPU-intensive processing
        ct.ThrowIfCancellationRequested();
        ProcessRow(data[i]);
    }

    return Ok(data);
}`,
    redFlags: [
      "Accepting CancellationToken in the controller action but failing to pass it to underlying EF Core or HttpClient calls.",
      "Swallowing OperationCanceledException in catch blocks without rethrowing or exiting.",
      "Assuming passing the token automatically stops synchronous CPU loops without calling 'token.ThrowIfCancellationRequested()'."
    ],
    proTips: [
      "Combine client tokens with server-side timeouts using 'CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutToken)' to enforce hard maximum execution limits."
    ]
  },
  {
    title: "How do you make a Hangfire or background job safe to retry?",
    seniority: "Mid-to-Senior",
    tags: ["Hangfire", "Background Jobs", "Idempotency", "Retries", "CorrelationId"],
    pitch: "Make the job idempotent, persist state changes to durable storage, log a correlation identifier, and separate retryable transient network failures from permanent validation errors. Inputs should be minimal and serializable (e.g. passing an entity ID rather than an entire object), with the job reloading fresh data from the database upon execution.",
    analogy: "A delivery driver may retry the route if a gate was locked, but the system must prevent the package from being delivered and charged twice.",
    deepDive: `Safe Background Processing Patterns:
1. Pass IDs, Not State:
   - Background job arguments are serialized to JSON in SQL/Redis.
   - Passing an entire OrderDto causes the job to execute against stale data if updated before the worker picks it up. Pass 'Guid orderId' and reload from DbContext.
2. Idempotency Guards:
   - If the job crashes midway through sending emails, a retry will rerun the method.
   - Check an atomic status flag (e.g., 'if (order.Status == Paid) return;') before performing side effects.
3. Separate Transient from Fatal Failures:
   - Network timeouts should retry with exponential backoff.
   - Validation errors (e.g. invalid credit card format) should fail permanently without burning retry cycles.`,
    codeSnippet: `public class InvoiceGenerationJob
{
    private readonly AppDbContext _db;
    private readonly IPdfGenerator _pdf;

    public InvoiceGenerationJob(AppDbContext db, IPdfGenerator pdf)
    {
        _db = db;
        _pdf = pdf;
    }

    // ✅ Safe, idempotent job accepting only a Guid ID
    public async Task ExecuteAsync(Guid invoiceId, CancellationToken ct)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { invoiceId }, ct);
        if (invoice == null || invoice.Status == InvoiceStatus.Generated)
        {
            return; // Already processed! Safe idempotent exit on retry
        }

        var pdfBytes = await _pdf.RenderAsync(invoice, ct);
        invoice.MarkGenerated(pdfBytes);

        await _db.SaveChangesAsync(ct);
    }
}`,
    redFlags: [
      "Passing complex domain objects with circular references as background job parameters.",
      "Assuming automatic retries are safe when the job performs non-idempotent operations like charging credit cards.",
      "Not handling database concurrency collisions when multiple background worker instances poll the same queue."
    ],
    proTips: [
      "Use the Hangfire attribute '[AutomaticRetry(Attempts = 3, OnAttemptsExceeded = AttemptsExceededAction.Fail)]' and log the Hangfire JobId as a correlation identifier in structured logs."
    ]
  },
  {
    title: "IHttpClientFactory: Solving TIME_WAIT socket exhaustion and stale DNS resolution",
    seniority: "Senior",
    tags: ["IHttpClientFactory", "HttpClient", "Socket Exhaustion", "TIME_WAIT", "DNS Refresh"],
    pitch: "Instantiating 'new HttpClient()' for every request exhausts operating system TCP sockets in the TIME_WAIT state under high traffic. Conversely, reusing a single static HttpClient indefinitely never honors DNS changes when backend IPs rotate. IHttpClientFactory solves both: it pools underlying HttpMessageHandler instances to eliminate socket exhaustion, while rotating them every 2 minutes to refresh DNS records.",
    analogy: "new HttpClient() is buying a new phone for every phone call; static HttpClient is never checking if your doctor's office changed their phone number; IHttpClientFactory is a shared company phone pool with an updated directory.",
    deepDive: `Under the Hood Architecture:
1. TCP Socket Exhaustion:
   - When HttpClient is disposed, the underlying TCP connection remains in TIME_WAIT for up to 240 seconds (RFC 793).
   - Under heavy load (e.g. 1,000 req/sec), all 65,535 outbound port numbers are exhausted, throwing SocketException.
2. The DNS Caching Trap:
   - A static HttpClient holds the connection open forever, never issuing new DNS lookups if the target server scales or fails over.
3. How IHttpClientFactory Works:
   - Decouples the user-facing HttpClient from the underlying HttpMessageHandler.
   - Handlers are pooled and expired after 2 minutes (PooledConnectionLifetime). Expired handlers are gracefully disposed once active requests drain.`,
    codeSnippet: `// Program.cs: Register Typed Client with resilience
builder.Services.AddHttpClient<IWeatherService, WeatherService>(client =>
{
    client.BaseAddress = new Uri("https://api.weather.com/");
    client.Timeout = TimeSpan.FromSeconds(10);
})
.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    PooledConnectionLifetime = TimeSpan.FromMinutes(2) // Refreshes DNS every 2 minutes!
});

// Typed Client consumed via DI
public class WeatherService : IWeatherService
{
    private readonly HttpClient _client;
    public WeatherService(HttpClient client) => _client = client;

    public async Task<WeatherData?> GetForecastAsync(string city, CancellationToken ct)
    {
        return await _client.GetFromJsonAsync<WeatherData>($"forecast/{city}", ct);
    }
}`,
    redFlags: [
      "Wrapping 'new HttpClient()' inside a 'using' statement in API controllers.",
      "Creating static HttpClient without setting PooledConnectionLifetime or SocketsHttpHandler.",
      "Not configuring timeouts on HttpClient, causing threads to hang indefinitely on stalled servers."
    ],
    proTips: [
      "In modern .NET Core / .NET 8, using a single SocketsHttpHandler with 'PooledConnectionLifetime = TimeSpan.FromMinutes(2)' achieves the exact same benefits as IHttpClientFactory without requiring the factory dependency."
    ]
  },
  {
    title: "CORS Architecture: Same-Origin Policy, Preflight OPTIONS, and Middleware Ordering",
    seniority: "Mid-to-Senior",
    tags: ["CORS", "Same-Origin Policy", "OPTIONS Preflight", "Middleware Order", "Security"],
    pitch: "CORS is a browser-enforced security policy preventing unauthorized cross-origin HTTP requests. For requests with custom headers, PUT/DELETE, or JSON, browsers send an HTTP OPTIONS preflight request. In ASP.NET Core, app.UseCors() must be placed strictly after app.UseRouting() and before app.UseAuthentication() and app.UseAuthorization(). A fatal trap is configuring AllowAnyOrigin() with AllowCredentials(), which browsers reject outright.",
    analogy: "CORS is the bouncer at the door checking an approved guest list; the preflight OPTIONS request is calling ahead to verify the dress code before arriving.",
    deepDive: `Protocol & Pipeline Order:
1. Browser Enforcement:
   - CORS is enforced by the client browser, NOT the server. Postman or curl completely bypass CORS.
2. Preflight Criteria:
   - Any request with 'application/json', Authorization headers, or non-GET/POST verbs triggers an automatic browser OPTIONS preflight.
3. The Credential Conflict:
   - If an API sets 'AllowCredentials()', the W3C spec forbids using wildcard '*' for AllowAnyOrigin. You must specify exact trusted origins.
4. Middleware Order:
   - app.UseRouting() -> app.UseCors() -> app.UseAuthentication() -> app.UseAuthorization().`,
    codeSnippet: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("TrustedAppOrigins", policy =>
    {
        policy.WithOrigins("https://portal.company.com", "https://admin.company.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials() // ✅ Allowed because explicit origins are defined!
              .SetPreflightMaxAge(TimeSpan.FromHours(2)); // Caches OPTIONS check in browser
    });
});

var app = builder.Build();

app.UseRouting();

// ✅ CRITICAL ORDER: After UseRouting, BEFORE Auth & Endpoints
app.UseCors("TrustedAppOrigins");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();`,
    redFlags: [
      "Configuring AllowAnyOrigin() and AllowCredentials() together.",
      "Placing app.UseCors() before app.UseRouting() or after app.UseAuthorization().",
      "Thinking CORS protects an API against hackers (CORS only protects browser users from cross-origin script forgery)."
    ],
    proTips: [
      "Set 'SetPreflightMaxAge(TimeSpan.FromHours(2))' in production CORS policies to prevent browsers from issuing a wasteful HTTP OPTIONS round-trip before every single API call."
    ]
  },
  {
    title: "Minimal APIs vs. Controller-Based APIs: Performance, Architecture, and Endpoint Filters",
    seniority: "Mid-to-Senior",
    tags: ["Minimal APIs", "Controllers", "Endpoint Routing", "Performance", "Endpoint Filters"],
    pitch: "Minimal APIs route HTTP requests directly to lambda handlers or static methods, completely bypassing MVC controller discovery, reflection overhead, and filter pipelines. This yields faster cold starts, lower memory usage, and higher throughput. Controller-based APIs provide structured conventions for large enterprise applications with dozens of endpoints. Minimal APIs in .NET 7/8 support Endpoint Filters, validation, and full OpenAPI documentation.",
    analogy: "A Controller is a multi-story department store with escalators and cashiers; a Minimal API is an express drive-thru window serving exactly what you ordered.",
    deepDive: `Under the Hood Differences:
1. Performance Mechanics:
   - Controllers require MVC infrastructure (ActionInvoker, ModelMetadataProvider, ControllerFactory).
   - Minimal APIs use Source Generators and direct RequestDelegate compilation, executing up to 3x faster with near-zero allocations.
2. Endpoint Filters (.NET 7+):
   - Replace MVC Action Filters for Minimal APIs:
     'app.MapPost(...).AddEndpointFilter<ValidationFilter>();'
3. Architectural Recommendation:
   - Use Minimal APIs for high-throughput microservices, event handlers, and lightweight services.
   - Use Controllers for massive monolithic applications where teams rely on established MVC scaffolding.`,
    codeSnippet: `var app = WebApplication.Create();

// High-Performance Minimal API with Endpoint Filter
app.MapPost("/api/users", async (CreateUserDto dto, IUserService service, CancellationToken ct) =>
{
    var user = await service.CreateAsync(dto, ct);
    return Results.Created($"/api/users/{user.Id}", user);
})
.AddEndpointFilter(async (invocationContext, next) =>
{
    var dto = invocationContext.GetArgument<CreateUserDto>(0);
    if (string.IsNullOrWhiteSpace(dto.Email))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["Email"] = new[] { "Email is required." }
        });
    }
    return await next(invocationContext);
});

app.Run();`,
    redFlags: [
      "Dumping 50 Minimal API endpoints into a single giant Program.cs file (use extension methods like 'app.MapUserEndpoints()' to organize).",
      "Stating that Minimal APIs lack validation or dependency injection (they support both via Endpoint Filters).",
      "Rewriting complex, working Controller apps to Minimal APIs without measuring performance bottlenecks first."
    ],
    proTips: [
      "Organize Minimal APIs in enterprise apps using 'ICarterModule' or extension methods on 'IEndpointRouteBuilder' to group endpoints by business aggregate."
    ]
  },
  {
    title: "Production JWT Authentication and Refresh Token Rotation with Reuse Detection",
    seniority: "Senior",
    tags: ["JWT", "Authentication", "Refresh Token", "Rotation", "Reuse Detection", "Security"],
    pitch: "Stateless JWT access tokens should be short-lived (e.g. 15 minutes) to minimize exposure if intercepted. Refresh Token Rotation issues a brand-new single-use refresh token every time the access token is refreshed, immediately invalidating the previous refresh token. Reuse Detection detects if an already-used refresh token is presented: if detected, the auth server identifies a token theft breach, revokes the entire token family, and forces re-authentication.",
    analogy: "An access token is a 15-minute visitor badge; a refresh token is a numbered claim ticket. Every time you show your claim ticket, it gets shredded and you receive a new one. If someone shows an already-shredded ticket, the alarm sounds because a clone exists.",
    deepDive: `Token Family & Reuse Detection Protocol:
1. Token Storage:
   - Access tokens kept in memory (or secure Authorization header).
   - Refresh tokens stored in HttpOnly, SameSite=Strict, Secure cookies to prevent XSS exfiltration.
2. The Theft Scenario:
   - Attacker steals Refresh Token R1.
   - Legitimate user uses R1 -> gets Access Token A2 + Refresh Token R2.
   - Attacker later tries to use R1 -> Server sees R1 has already been used!
   - Action: Server revokes R2, R1, and all tokens associated with that user session.`,
    codeSnippet: `public async Task<TokenResponse> RefreshTokenAsync(string oldRefreshToken, CancellationToken ct)
{
    var tokenRecord = await _db.RefreshTokens
        .FirstOrDefaultAsync(t => t.Token == oldRefreshToken, ct);

    if (tokenRecord == null) throw new SecurityException("Invalid token.");

    // 🚨 REUSE DETECTION: If already revoked, token theft has occurred!
    if (tokenRecord.IsRevoked)
    {
        // Compromised family: Revoke ALL tokens in this session!
        await _db.RefreshTokens
            .Where(t => t.TokenFamilyId == tokenRecord.TokenFamilyId)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true), ct);

        throw new SecurityException("Token theft detected. All sessions revoked.");
    }

    // Invalidate current refresh token
    tokenRecord.IsRevoked = true;

    // Issue new pair with same family ID
    var newAccess = GenerateJwt(tokenRecord.UserId);
    var newRefresh = new RefreshToken
    {
        UserId = tokenRecord.UserId,
        Token = Guid.NewGuid().ToString("N"),
        TokenFamilyId = tokenRecord.TokenFamilyId,
        ExpiresUtc = DateTime.UtcNow.AddDays(7)
    };
    _db.RefreshTokens.Add(newRefresh);
    await _db.SaveChangesAsync(ct);

    return new TokenResponse(newAccess, newRefresh.Token);
}`,
    redFlags: [
      "Creating JWT access tokens with 30-day expiration periods without revocation capabilities.",
      "Storing refresh tokens in browser localStorage where JavaScript XSS attacks can read them.",
      "Failing to implement Reuse Detection when using refresh token rotation."
    ],
    proTips: [
      "Always store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies: this makes them completely invisible to malicious client-side JavaScript."
    ]
  }
];

console.log('Total ASP.NET questions:', aspnetQuestions.length);

module.exports = { aspnetQuestions };
