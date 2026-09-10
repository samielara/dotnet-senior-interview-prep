const fs = require('fs');
const path = require('path');

// Load current unique questions
global.window = {};
eval(fs.readFileSync('js/data/questions.js', 'utf8'));
const existing = window.INTERVIEW_QUESTIONS || [];

// Deduplicate existing by title
const uniqueExistingMap = new Map();
existing.forEach(q => {
  if (!uniqueExistingMap.has(q.title)) {
    uniqueExistingMap.set(q.title, q);
  }
});

console.log('Unique existing questions:', uniqueExistingMap.size);

// Re-map existing questions to standard clean IDs and pillars
const csharpList = [];
const aspnetList = [];
const linqList = [];
const efcoreList = [];
const sqlList = [];
const uiList = [];
const cloudList = [];

uniqueExistingMap.forEach(q => {
  let p = q.pillar;
  if (p === 'frontend') p = 'ui';
  if (q.title.includes('EF Core Change Tracker') ||
      q.title.includes('EF Core Split Queries') ||
      q.title.includes('Optimistic Concurrency') ||
      q.title.includes('Dapper and EF Core') ||
      q.title.includes('EF Core Compiled Queries') ||
      q.title.includes('EF Core Migrations')) {
    p = 'efcore';
  } else if (q.title.includes('N+1 Queries and Cartesian') ||
             q.title.includes('IEnumerable<T> vs. IQueryable') ||
             q.title.includes('Deferred Execution') ||
             q.title.includes('SelectMany vs. Select') ||
             q.title.includes('GroupBy vs. ToLookup') ||
             q.title.includes('Expression Trees Under')) {
    p = 'linq';
  }

  const sanitized = { ...q, pillar: p };
  if (p === 'csharp') csharpList.push(sanitized);
  else if (p === 'aspnet') aspnetList.push(sanitized);
  else if (p === 'linq') linqList.push(sanitized);
  else if (p === 'efcore') efcoreList.push(sanitized);
  else if (p === 'sql') sqlList.push(sanitized);
  else if (p === 'ui') uiList.push(sanitized);
  else if (p === 'cloud') cloudList.push(sanitized);
});

console.log('Existing distribution:', {
  csharp: csharpList.length,
  aspnet: aspnetList.length,
  linq: linqList.length,
  efcore: efcoreList.length,
  sql: sqlList.length,
  ui: uiList.length,
  cloud: cloudList.length
});

// --- NEW QUESTIONS FROM VENKATESH-BHARATH GITHUB REPO ---

// 1. C# Additions
csharpList.push(
  {
    title: "ref vs. out vs. in vs. ref readonly: Parameter Passing Semantics and Memory Safety",
    seniority: "Senior",
    tags: ["ref", "out", "in", "ref readonly", "Memory Safety", "IL Lowering"],
    pitch: "In C#, 'ref' passes an existing variable by reference (must be initialized before passing, allows both read and write). 'out' passes by reference to return multiple values (the callee is required to assign a value before returning). 'in' passes a value type by read-only reference ('ref readonly'), eliminating stack-copy overhead for large structs while the compiler strictly forbids mutation. In IL bytecode, all four emit managed pointers (&), but 'in' emits [in] modreq and generates defensive copies if non-readonly members are invoked.",
    deepDive: `Under the Hood & IL Mechanics:
1. IL Lowering:
   - 'ref', 'out', and 'in' all pass a 32-bit or 64-bit managed pointer on the stack, identical to passing a pointer in C++.
   - 'out' generates the same IL parameter signature as 'ref' but adds a ParamArray/Out attribute metadata instructing the compiler and Roslyn to enforce definite assignment.
2. The 'in' Modifier and Defensive Copies:
   - When passing a large struct with 'in', C# enforces read-only access.
   - ⚠️ CRITICAL TRAP: If the struct is NOT declared as 'readonly struct', invoking any method or property on it causes Roslyn to create a hidden defensive copy on the stack first to guarantee that the method doesn't mutate fields!
   - Always declare large structs as 'readonly struct' when pairing with 'in' parameters!
3. 'ref readonly' Return Types:
   - Introduced in C# 7.2, methods can return 'ref readonly T', allowing callers to access large in-memory struct elements without allocating or copying memory, while guaranteeing immutability.`,
    codeSnippet: `// Struct must be readonly to prevent hidden defensive copies with 'in'
public readonly struct Vector4D
{
    public readonly double X, Y, Z, W; // 32 bytes (4 * 8 bytes)
    public Vector4D(double x, double y, double z, double w) => (X, Y, Z, W) = (x, y, z, w);
}

public class ParameterPassingBenchmark
{
    // ✅ SENIOR PATTERN: Zero-copy read-only reference for large struct
    public static double CalculateMagnitude(in Vector4D v)
    {
        // v.X = 10; // ❌ Compile error: Cannot assign to variable 'in Vector4D'
        return Math.Sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z + v.W * v.W);
    }

    // Modern 'out' declaration with discards
    public static bool TryParseCoords(string input, out double lat, out double lon)
    {
        lat = 0; lon = 0; // Callee MUST assign before returning!
        var parts = input.Split(',');
        if (parts.Length != 2) return false;
        return double.TryParse(parts[0], out lat) && double.TryParse(parts[1], out lon);
    }
}`,
    redFlags: [
      "Saying that 'in' and 'out' create new copies of objects on the heap.",
      "Using 'in' on small primitive types like int, float, or bool (creates pointer indirection overhead worse than copying 4 bytes directly in CPU registers).",
      "Failing to declare structs as 'readonly struct' when using 'in', leading to silent defensive copy performance degradation."
    ],
    proTips: [
      "Use 'in' only for structs larger than IntPtr.Size * 2 (16 bytes on 64-bit systems); for primitives like int or guid, pass by value directly into CPU registers."
    ]
  },
  {
    title: "Abstract Classes vs. Interfaces: Polymorphism, State, and C# 8+ Default Interface Methods",
    seniority: "Senior",
    tags: ["Abstract Class", "Interface", "Polymorphism", "DIM", "Multiple Inheritance"],
    pitch: "An abstract class defines an 'is-a' identity hierarchy, can encapsulate mutable state fields, constructors, and access modifiers, but C# enforces single class inheritance. An interface defines a 'can-do' behavioral contract with multiple inheritance support. Modern C# 8+ introduced Default Interface Methods (DIM) allowing interface trait composition and backward-compatible API evolution without breaking existing implementers; however, DIM methods cannot be overridden via traditional polymorphism unless the class is explicitly cast to the interface.",
    deepDive: `Architectural Breakdown:
1. State vs Contract:
   - Abstract classes can have instance fields, constructors that enforce initialization invariants, and protected internal members.
   - Interfaces cannot have instance fields or non-static constructors; they represent pure capability abstractions.
2. Default Interface Methods (DIM) Internals:
   - DIM allows adding new methods with default implementations to existing interfaces without breaking legacy classes implementing them.
   - ⚠️ TRAP: DIM methods are NOT inherited by implementing classes as public methods! They can ONLY be called when the object is cast to the interface reference:
     ((ILogger)myClass).LogDebug("msg");
3. Diamond Problem Resolution:
   - If a class implements two interfaces with identical DIM signatures, the C# compiler produces an ambiguity error unless the implementing class explicitly implements the method to resolve the conflict.`,
    codeSnippet: `public interface IRepository<T>
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);

    // ✅ C# 8+ Default Interface Method (DIM)
    // Legacy implementations don't break when this method is added!
    Task<T> GetRequiredAsync(Guid id, CancellationToken ct = default)
    {
        return GetByIdAsync(id, ct).ContinueWith(t => 
            t.Result ?? throw new KeyNotFoundException($"Entity {id} not found!"));
    }
}

// Abstract base class: Holds state & constructor invariants
public abstract class AuditableEntity
{
    public Guid Id { get; protected init; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    protected AuditableEntity() { } // Enforces controlled instantiation
}

public class Order : AuditableEntity, IRepository<Order>
{
    public Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult<Order?>(this);
    // Note: GetRequiredAsync is available via ((IRepository<Order>)order).GetRequiredAsync(id)
}`,
    redFlags: [
      "Claiming that interfaces and abstract classes are now identical because of C# 8 Default Interface Methods (DIM).",
      "Attempting to declare instance state fields inside an interface.",
      "Not knowing that DIM methods are not directly accessible on the class instance without casting to the interface."
    ],
    proTips: [
      "Use Interfaces for defining public API surface contracts and enabling dependency injection mocking; use Abstract Classes within internal domain models to share invariant state and Template Method patterns."
    ]
  },
  {
    title: "The Standard IDisposable and IAsyncDisposable Pattern with Finalizers",
    seniority: "Senior",
    tags: ["IDisposable", "IAsyncDisposable", "Finalizer", "GC.SuppressFinalize", "SafeHandle"],
    pitch: "The standard Dispose pattern provides deterministic cleanup of unmanaged OS resources (file handles, network sockets, unmanaged pointers) before the non-deterministic Garbage Collector runs. Implementing IDisposable with Dispose(bool disposing) and GC.SuppressFinalize(this) tells the GC to remove the object from the Finalization Queue, avoiding costly Gen 2 finalizer promotion. Modern .NET also requires IAsyncDisposable with DisposeAsync() for non-blocking asynchronous flushing of streams, buffers, and network connections via 'await using'.",
    deepDive: `Resource Management Under the Hood:
1. Deterministic vs Non-Deterministic:
   - Managed memory is freed by GC non-deterministically.
   - Native OS handles (file descriptors, database connections, GDI handles) must be released deterministically via Dispose().
2. The Finalizer Cost:
   - Objects with a Finalizer (~ClassName) that are NOT suppressed survive Gen 0/1 collection, get promoted to Gen 2, and are placed on the Finalizer Queue.
   - The CLR's single-threaded Finalizer thread must run before their memory can be reclaimed on the NEXT GC cycle!
   - Calling GC.SuppressFinalize(this) completely bypasses the finalizer thread.
3. IAsyncDisposable (.NET Core 3.0+):
   - Traditional Dispose() is synchronous: closing a network socket or flushing a buffered stream synchronously causes ThreadPool blocking.
   - DisposeAsync() returns a ValueTask, enabling non-blocking asynchronous cleanup: 'await using var stream = ...;'`,
    codeSnippet: `public class ProductionResourceHolder : IDisposable, IAsyncDisposable
{
    private SafeHandle? _unmanagedHandle; // OS handle
    private FileStream? _bufferedFile;     // Managed disposable
    private int _disposed = 0;              // Interlocked flag

    public ProductionResourceHolder(string path)
    {
        _bufferedFile = new FileStream(path, FileMode.OpenOrCreate);
    }

    // Standard synchronous dispose
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this); // Remove from GC Finalization Queue!
    }

    protected virtual void Dispose(bool disposing)
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0) return;

        if (disposing)
        {
            // Free managed disposables
            _bufferedFile?.Dispose();
            _bufferedFile = null;
        }

        // Free unmanaged resources
        _unmanagedHandle?.Dispose();
        _unmanagedHandle = null;
    }

    // Modern asynchronous dispose
    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0) return;

        if (_bufferedFile is not null)
        {
            await _bufferedFile.DisposeAsync().ConfigureAwait(false);
            _bufferedFile = null;
        }

        Dispose(disposing: false);
        GC.SuppressFinalize(this);
    }

    ~ProductionResourceHolder() => Dispose(disposing: false); // Finalizer fallback
}`,
    redFlags: [
      "Forgetting GC.SuppressFinalize(this) in Dispose(), forcing the object onto the slow Gen 2 finalizer queue.",
      "Accessing managed disposable objects inside the Finalizer (the managed objects may have already been collected by the GC!).",
      "Calling synchronous .Dispose() on streams and network handles in high-throughput async pipelines instead of 'await using'."
    ],
    proTips: [
      "Wrap native OS pointers with SafeHandle instead of raw IntPtr: SafeHandle derives from CriticalFinalizerObject and guarantees cleanup even during thread aborts or out-of-memory exceptions."
    ]
  },
  {
    title: "Delegates vs. Events vs. Multicast Delegates: Encapsulation and Memory Leak Traps",
    seniority: "Senior",
    tags: ["Delegates", "Events", "MulticastDelegate", "Memory Leaks", "Action/Func"],
    pitch: "A delegate is a type-safe object-oriented function pointer inheriting from System.MulticastDelegate with an internal linked invocation list. An 'event' is a compiler-enforced encapsulation wrapper over a delegate: it restricts external consumers to only adding (+=) or removing (-=) handlers, preventing external code from invoking the delegate directly or accidentally resetting subscribers with '= null'. The classic senior bug is the 'Lapsed Listener' memory leak: subscribing a short-lived object's method to a long-lived publisher prevents the subscriber from ever being collected by GC.",
    deepDive: `Internal Architecture & Lowering:
1. System.MulticastDelegate Anatomy:
   - Holds '_target' (the instance object) and '_methodPtr' (the native function pointer).
   - If multiple methods are hooked (+=), it allocates a new MulticastDelegate with an internal array '_invocationList'.
2. Why the 'event' Keyword Exists:
   - A public delegate field can be cleared by anyone: 'myClass.OnSave = null;' destroying all other subscribers!
   - A public delegate can also be invoked externally: 'myClass.OnSave(data);'.
   - The 'event' keyword turns the field into two accessor methods in IL: add_EventName and remove_EventName, locking down invocation to the declaring class only.
3. The Lapsed Listener Memory Leak:
   - When object B subscribes to publisher A: publisher A's delegate invocation list holds a strong reference to B!
   - If A is a Singleton (or static) and B is a short-lived UI view or scoped service, B will NEVER be garbage collected until unsubscribed or until WeakEventManager is used.`,
    codeSnippet: `public class OrderPublisher
{
    // ✅ SENIOR PATTERN: Event encapsulates delegate against external tampering
    public event EventHandler<OrderEventArgs>? OrderCompleted;

    public void CompleteOrder(Guid orderId)
    {
        // Thread-safe invocation via null-conditional copy
        OrderCompleted?.Invoke(this, new OrderEventArgs(orderId));
    }
}

// Subscriber demonstrating clean unsubscription
public class OrderAuditLogger : IDisposable
{
    private readonly OrderPublisher _publisher;

    public OrderAuditLogger(OrderPublisher publisher)
    {
        _publisher = publisher;
        _publisher.OrderCompleted += HandleOrderCompleted; // Subscribes strong reference
    }

    private void HandleOrderCompleted(object? sender, OrderEventArgs e)
    {
        Console.WriteLine($"Order {e.OrderId} completed.");
    }

    // MUST unsubscribe to prevent Lapsed Listener memory leak!
    public void Dispose()
    {
        _publisher.OrderCompleted -= HandleOrderCompleted;
    }
}`,
    redFlags: [
      "Declaring public delegate fields instead of 'event', allowing external callers to wipe out other subscribers.",
      "Failing to unsubscribe from events in long-lived publishers, leading to massive memory leaks.",
      "Not knowing that delegates in C# are immutable (calling += creates a brand-new MulticastDelegate instance)."
    ],
    proTips: [
      "In modern C#, favor built-in Action<T> and Func<T, TResult> over custom delegate types unless you need 'ref' parameters or custom parameter names in API signatures."
    ]
  },
  {
    title: "const vs. readonly vs. static readonly: Compile-Time Inlining and Assembly Versioning",
    seniority: "Senior",
    tags: ["const", "readonly", "static readonly", "IL Inlining", "Assembly Versioning"],
    pitch: "'const' is evaluated at compile-time: the Roslyn compiler literally inlines the literal primitive or string value directly into the calling assembly's IL bytecode. If assembly A changes a 'const' and is redeployed without recompiling assembly B, assembly B silently retains the stale hardcoded value. In contrast, 'readonly' and 'static readonly' fields are evaluated at runtime (in instance constructors or the static class constructor .cctor), referencing the live memory address and supporting reference types and cross-assembly updates without breaking changes.",
    deepDive: `Compilation and Execution Mechanics:
1. Roslyn IL Lowering of 'const':
   - 'public const int MaxRetries = 3;'
   - When referenced from another assembly: 'ldc.i4.3' (literal constant 3) is hardcoded directly into the caller's IL!
   - There is NO runtime field lookup. If MaxRetries is changed to 5 in a shared NuGet library, the consumer will keep using 3 until recompiled!
2. 'static readonly' Evaluation:
   - Evaluated during the execution of the class's static constructor (.cctor) when the type is first initialized by the CLR.
   - Emits 'ldsfld' (load static field) in the caller's IL, ensuring the current value from memory is always loaded.
   - Allows constructing complex reference objects: 'public static readonly HttpClient Client = new();'
3. Instance 'readonly':
   - Can only be assigned at declaration or within instance constructors. Once construction completes, the CLR runtime enforces immutability.`,
    codeSnippet: `public static class ApiConfig
{
    // ⚠️ DANGEROUS ACROSS ASSEMBLIES: Value is inlined into caller assembly IL!
    public const string DefaultBaseUrl = "https://api.domain.com/v1";

    // ✅ SENIOR PATTERN FOR PUBLIC LIBRARIES: Evaluated at runtime via ldsfld
    public static readonly string SafeBaseUrl = "https://api.domain.com/v1";

    // ✅ Supports complex reference types and environment lookups
    public static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(
        int.TryParse(Environment.GetEnvironmentVariable("HTTP_TIMEOUT"), out var t) ? t : 30
    );
}`,
    redFlags: [
      "Exposing 'public const' in public shared NuGet packages for configuration values that could ever change.",
      "Believing that 'readonly' reference fields make the referenced object immutable (it only prevents reassigning the reference itself, not its properties).",
      "Attempting to assign a 'const' to a reference type other than string or null."
    ],
    proTips: [
      "Rule of thumb: Only use 'const' for true mathematical or unchanging constants (like Math.PI, DaysInWeek = 7). For configuration defaults and URLs across assemblies, always use 'static readonly'."
    ]
  }
);

// 2. ASP.NET Core Additions
aspnetList.push(
  {
    title: "Action Filters vs. Middleware in ASP.NET Core: Pipeline Architecture and Execution Context",
    seniority: "Senior",
    tags: ["Middleware", "Action Filters", "HTTP Pipeline", "ModelState", "Execution Order"],
    pitch: "Middleware executes in the outer HTTP pipeline before routing reaches the endpoint: it has access only to raw HttpContext and operates globally across all requests (WebSockets, static files, gRPC, REST). Filters (Authorization, Resource, Action, Exception, Result) execute inside the MVC/Routing endpoint pipeline after model binding: they possess full context of the invoked Controller, action parameters, ModelState, and metadata attributes. Senior engineers use middleware for cross-cutting infrastructure concerns (CORS, logging, rate limiting) and Action Filters for business-level request validation, audit trails, and response formatting.",
    deepDive: `Pipeline Execution Order:
1. Request Ingress:
   - Request -> Middleware 1 -> Middleware 2 (Routing) -> Endpoint Selected ->
   - Authorization Filter -> Resource Filter -> Model Binding ->
   - Action Filter (OnActionExecuting) -> Controller Action -> Action Filter (OnActionExecuted) ->
   - Result Filter -> Action Result Executed -> Resource Filter (Post) ->
   - Middleware 2 -> Middleware 1 -> Response Egress.
2. Context Differences:
   - Middleware has 'HttpContext' only: no knowledge of which controller/action was chosen, no access to parsed DTOs, and no access to ModelState errors.
   - Action Filter receives 'ActionExecutingContext': provides 'context.ActionArguments', 'context.Controller', 'context.ModelState', and can short-circuit by setting 'context.Result'.
3. Performance Considerations:
   - Resource Filters run before Model Binding and can short-circuit cached requests without paying the CPU cost of deserializing large JSON request bodies!`,
    codeSnippet: `// 1. Action Filter: Has access to ActionArguments and ModelState
public class ValidateModelStateFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ModelState.IsValid)
        {
            // Short-circuit with RFC 7807 ProblemDetails
            context.Result = new BadRequestObjectResult(new ValidationProblemDetails(context.ModelState));
            return;
        }

        // Execute controller action
        var executedContext = await next();

        // Post-execution logic (e.g., response auditing)
    }
}

// 2. Middleware: Cross-cutting infrastructure concern
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    public RequestTimingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ILogger<RequestTimingMiddleware> logger)
    {
        var sw = Stopwatch.StartNew();
        await _next(context); // Passes down the pipeline
        sw.Stop();
        logger.LogInformation("HTTP {Method} {Path} finished in {ElapsedMs}ms", 
            context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
    }
}`,
    redFlags: [
      "Using Action Filters for global authentication or CORS (should always be handled early in the middleware pipeline).",
      "Attempting to read and deserialize the request body inside an Action Filter multiple times without enabling request buffering.",
      "Not knowing the 5 filter types and their order of execution (Authorization -> Resource -> Action -> Exception -> Result)."
    ],
    proTips: [
      "Use Resource Filters for performance-critical caching: they execute before model binding, allowing you to return cached responses without allocating DTO objects or running JSON serializers."
    ]
  },
  {
    title: "CORS Architecture: Same-Origin Policy, Preflight OPTIONS, and Middleware Ordering",
    seniority: "Senior",
    tags: ["CORS", "Same-Origin Policy", "OPTIONS Preflight", "Middleware Pipeline", "Security"],
    pitch: "CORS (Cross-Origin Resource Sharing) is a browser-enforced security mechanism preventing malicious scripts on one origin from making unauthorized cross-origin requests. Browsers send an HTTP OPTIONS preflight request with Origin and Access-Control-Request-Method headers before non-simple requests (custom headers, PUT/DELETE, JSON). In ASP.NET Core, app.UseCors() MUST be placed in the exact pipeline position: after app.UseRouting() but before app.UseAuthentication(), app.UseAuthorization(), and app.UseResponseCaching(). A classic senior pitfall is configuring AllowAnyOrigin() together with AllowCredentials(), which browsers reject outright.",
    deepDive: `Internal Browser & Middleware Protocol:
1. Simple vs Preflighted Requests:
   - Simple requests (GET/POST with standard headers and Content-Type: text/plain, multipart/form-data, or application/x-www-form-urlencoded) do NOT send preflight requests.
   - Any request with 'application/json', custom headers (Authorization, X-Api-Key), or PUT/DELETE triggers an automatic browser OPTIONS preflight.
2. The Fatal AllowAnyOrigin + AllowCredentials Conflict:
   - If an API sets 'AllowAnyOrigin()' (*), the browser refuses to send cookies or Authorization headers.
   - Setting 'AllowCredentials()' with '*' is blocked by the W3C spec for security reasons.
   - Solution: Use '.SetIsOriginAllowed(origin => ...)' or specify explicit trusted origins: '.WithOrigins("https://app.domain.com")'.
3. Middleware Order Pitfall:
   - 'app.UseCors()' MUST precede 'app.UseResponseCaching()', or cached responses for one origin will be returned to another origin without CORS headers!`,
    codeSnippet: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionCorsPolicy", policy =>
    {
        policy.WithOrigins("https://app.company.com", "https://admin.company.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials() // ✅ Allowed only because explicit origins are defined!
              .SetPreflightMaxAge(TimeSpan.FromHours(2)); // Caches OPTIONS preflight in browser
    });
});

var app = builder.Build();

// ⚠️ CRITICAL MIDDLEWARE ORDER:
app.UseRouting();

app.UseCors("ProductionCorsPolicy"); // ✅ AFTER UseRouting, BEFORE Auth & Endpoints!

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();`,
    redFlags: [
      "Using 'builder.Services.AddCors()' with AllowAnyOrigin() and AllowCredentials() simultaneously (browsers reject response with CORS error).",
      "Placing app.UseCors() before app.UseRouting() or after app.UseAuthorization().",
      "Assuming CORS is a server-side firewall (CORS is purely a client-side browser instruction; Postman or curl completely bypass CORS)."
    ],
    proTips: [
      "Set .SetPreflightMaxAge(TimeSpan.FromHours(2)) in production CORS policies to prevent browsers from issuing a wasteful HTTP OPTIONS round-trip before every single API call."
    ]
  },
  {
    title: "Background Tasks with IHostedService and BackgroundService: Scopes and Graceful Shutdown",
    seniority: "Senior",
    tags: ["IHostedService", "BackgroundService", "Captive Dependency", "CancellationToken", "Graceful Shutdown"],
    pitch: "IHostedService and BackgroundService allow ASP.NET Core web servers to run asynchronous background workers (message queue consumers, cache warming, periodic synchronizations). Because BackgroundService is registered as a Singleton, injecting a Scoped service (such as EF Core's DbContext) directly into its constructor creates a Captive Dependency that either crashes on startup or causes concurrency exceptions and memory leaks. The senior pattern injects IServiceScopeFactory, creating an explicit 'using var scope = _scopeFactory.CreateScope()' per processing iteration and honoring the CancellationToken for graceful 30-second shutdown.",
    deepDive: `Under the Hood Lifecycle:
1. Lifecycle Orchestration:
   - When ASP.NET Core boots, the Host calls 'StartAsync(CancellationToken)' on all registered IHostedService instances sequentially before accepting incoming HTTP requests.
   - BackgroundService implements IHostedService by executing 'ExecuteAsync(CancellationToken)' in an unawaited background Task.
2. Graceful Shutdown & HostOptions:
   - When SIGTERM / SIGINT occurs, the Host calls 'StopAsync(CancellationToken)'.
   - The default shutdown timeout is 30 seconds (configurable via HostOptions.ShutdownTimeout).
   - If ExecuteAsync does not check 'stoppingToken.IsCancellationRequested' or pass it to async APIs, the host forcibly terminates the process, causing data corruption.
3. Captive Scope Resolution:
   - Singleton services live for the entire process lifetime.
   - EF Core DbContext is Scoped and NOT thread-safe.
   - Always create a temporary scope inside the worker loop to retrieve a fresh DbContext instance.`,
    codeSnippet: `public class QueueProcessorWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<QueueProcessorWorker> _logger;

    public QueueProcessorWorker(IServiceScopeFactory scopeFactory, ILogger<QueueProcessorWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("QueueProcessorWorker started.");

        // Loop until host triggers graceful shutdown
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // ✅ SENIOR PATTERN: Create scope per work batch to resolve Scoped DbContext
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var pendingJobs = await db.Jobs
                        .Where(j => j.Status == JobStatus.Queued)
                        .Take(10)
                        .ToListAsync(stoppingToken);

                    foreach (var job in pendingJobs)
                    {
                        job.Process();
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }

                // Throttle poll interval honoring cancellation
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break; // Graceful shutdown requested, exit loop cleanly
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing job queue batch.");
            }
        }

        _logger.LogInformation("QueueProcessorWorker cleanly shut down.");
    }
}`,
    redFlags: [
      "Injecting AppDbContext directly into the constructor of a BackgroundService (Captive Dependency bug).",
      "Ignoring the stoppingToken in Task.Delay or async calls, preventing Docker / Kubernetes from shutting down containers gracefully.",
      "Swallowing OperationCanceledException and continuing the loop during host shutdown."
    ],
    proTips: [
      "Configure 'HostOptions.ShutdownTimeout' in Program.cs to give long-running background tasks adequate time to drain in-flight batches before SIGKILL."
    ]
  }
);

// 3. LINQ Additions
linqList.push(
  {
    title: "LINQ Any() vs. Count() > 0 vs. Exists(): Short-Circuiting vs. Full Table Scans",
    seniority: "Senior",
    tags: ["Any()", "Count()", "Exists()", "Short-Circuiting", "SQL Execution Plan"],
    pitch: "To check for the presence of elements, '.Any()' is asymptotically superior because it short-circuits on the very first match: in-memory, it calls MoveNext() once; in EF Core / SQL, it compiles to 'IF EXISTS(SELECT 1 FROM ...)' which terminates index traversal immediately. In contrast, '.Count() > 0' forces an eager evaluation of the entire sequence: in SQL, it generates 'SELECT COUNT(*)', reading all matching leaf pages and incurring severe disk I/O and network latency on million-row tables.",
    deepDive: `Under the Hood Differences:
1. In-Memory Execution:
   - 'collection.Any(predicate)': Enumerates until the first match is found, then immediately returns true (O(1) best case).
   - 'collection.Count(predicate) > 0': Must enumerate the entire collection to count every element (O(N) guaranteed), allocating CPU cycles needlessly.
2. EF Core SQL Translation:
   - 'db.Orders.Any(o => o.Status == "Pending")' ->
     SELECT CASE WHEN EXISTS (SELECT 1 FROM [Orders] AS [o] WHERE [o].[Status] = N'Pending') THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END
     (Engine performs an Index Seek and stops at row 1).
   - 'db.Orders.Count(o => o.Status == "Pending") > 0' ->
     SELECT COUNT(*) FROM [Orders] AS [o] WHERE [o].[Status] = N'Pending'
     (Engine must count ALL 5,000,000 rows!).
3. List<T>.Exists vs Any:
   - For List<T>, '.Exists(predicate)' is an instance method that avoids allocating an IEnumerator<T> object, making it slightly faster than the LINQ extension method '.Any()'.`,
    codeSnippet: `// ❌ JUNIOR ANTI-PATTERN: Forces full index scan to count all 2,000,000 orders!
public async Task<bool> BadHasPendingOrdersAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Orders.CountAsync(o => o.Status == "Pending", ct) > 0;
}

// ✅ SENIOR PATTERN: Generates IF EXISTS (SELECT 1 ...), stops on row 1
public async Task<bool> GoodHasPendingOrdersAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Orders.AnyAsync(o => o.Status == "Pending", ct);
}

// In-Memory List optimization:
List<User> userList = GetUsers();
bool hasAdmin = userList.Exists(u => u.IsAdmin); // Faster than userList.Any(): No enumerator allocation!`,
    redFlags: [
      "Using '.Count() > 0' or '.Count() != 0' to check if a sequence has any items.",
      "Calling '.ToList()' before '.Any()' on an IQueryable, pulling data into client RAM first.",
      "Assuming that SQL Server optimizes 'COUNT(*) > 0' into an EXISTS automatically in all query scenarios."
    ],
    proTips: [
      "On in-memory List<T>, use 'list.Exists(match)' instead of 'list.Any(match)': Exists is an optimized struct-based internal loop that does not allocate an enumerator instance on the heap."
    ]
  },
  {
    title: "Inner Join vs. Left Outer Join in LINQ: GroupJoin and DefaultIfEmpty Mechanics",
    seniority: "Senior",
    tags: ["Inner Join", "Left Outer Join", "GroupJoin", "DefaultIfEmpty", "SQL Translation"],
    pitch: "A standard LINQ 'join ... in ... on ... equals ...' compiles to an inner join, dropping records with no match. To express a SQL 'LEFT OUTER JOIN' in LINQ query syntax, developers must combine 'join ... into' (which creates a GroupJoin) with '.DefaultIfEmpty()' on the grouped collection: 'from o in orders join c in customers on o.CustomerId equals c.Id into custGroup from c in custGroup.DefaultIfEmpty()'. In EF Core, this compiles cleanly to 'LEFT OUTER JOIN Customers ON ...', returning null for non-matching customer fields.",
    deepDive: `How LINQ Translates Left Joins:
1. GroupJoin Architecture:
   - The 'into groupName' clause groups all matching right-hand elements into an IEnumerable<TRight> for each left-hand element.
2. The Role of DefaultIfEmpty():
   - 'DefaultIfEmpty()' yields a sequence with a single default element (null for reference types, 0 for ints) if the grouped sequence is empty.
   - Flattening this sequence via a secondary 'from' clause instructs the EF Core query provider to emit a SQL 'LEFT OUTER JOIN'.
3. Navigation Property Alternative:
   - In EF Core, if foreign key navigation properties exist, explicit LINQ joins are rarely needed!
   - Simply querying: 'db.Orders.Select(o => new { o.Id, CustomerName = o.Customer.Name })' automatically generates an optimal SQL LEFT JOIN if the relationship is optional, or INNER JOIN if required.`,
    codeSnippet: `// Explicit LINQ Left Outer Join Syntax
public async Task<List<OrderReportDto>> GetOrderReportsAsync(AppDbContext db, CancellationToken ct)
{
    var query = from o in db.Orders
                join c in db.Customers on o.CustomerId equals c.Id into customerGroup
                from c in customerGroup.DefaultIfEmpty() // Emits LEFT OUTER JOIN
                select new OrderReportDto
                {
                    OrderId = o.Id,
                    OrderTotal = o.Total,
                    CustomerName = c != null ? c.Name : "Anonymous Guest" // Handles NULL side of join
                };

    return await query.ToListAsync(ct);
}

// Generated SQL:
// SELECT [o].[Id] AS [OrderId], [o].[Total] AS [OrderTotal], 
//        COALESCE([c].[Name], N'Anonymous Guest') AS [CustomerName]
// FROM [Orders] AS [o]
// LEFT JOIN [Customers] AS [c] ON [o].[CustomerId] = [c].[Id]`,
    redFlags: [
      "Attempting to do a Left Join without calling '.DefaultIfEmpty()', which accidentally converts the query into an Inner Join.",
      "Writing manual complex LINQ joins when navigation properties already exist on the DbContext entities.",
      "Accessing properties on the nullable right-hand object without null-checking, throwing NullReferenceException in in-memory LINQ."
    ],
    proTips: [
      "In modern EF Core, prefer navigation properties over manual 'join' syntax: EF Core automatically knows whether the relationship is optional (nullable FK -> LEFT JOIN) or mandatory (non-null FK -> INNER JOIN)."
    ]
  },
  {
    title: "First vs. FirstOrDefault vs. Single vs. SingleOrDefault: SQL Generation (TOP 1 vs TOP 2)",
    seniority: "Senior",
    tags: ["First", "FirstOrDefault", "Single", "SingleOrDefault", "TOP 1 vs TOP 2"],
    pitch: "First() and FirstOrDefault() take the earliest matching item and generate 'SELECT TOP (1)' in SQL Server, terminating query execution immediately upon finding a match. Single() and SingleOrDefault() assert that EXACTLY ONE match exists in the entire table: to verify uniqueness, EF Core generates 'SELECT TOP (2)'. If more than one row matches, Single() throws an InvalidOperationException. In high-throughput APIs, using SingleOrDefault() on non-unique indexed columns wastes database CPU checking for secondary rows when business logic only requires FirstOrDefault().",
    deepDive: `Under the Hood Mechanics & Exception Matrix:
1. The 4 Combinations:
   - First(): Returns item 1. Throws InvalidOperationException if sequence is EMPTY. (SQL: TOP 1)
   - FirstOrDefault(): Returns item 1, or default/null if EMPTY. Never throws on count. (SQL: TOP 1)
   - Single(): Returns item 1. Throws if EMPTY, and throws if > 1 items match! (SQL: TOP 2)
   - SingleOrDefault(): Returns item 1, or default/null if EMPTY. Throws if > 1 items match! (SQL: TOP 2)
2. The Database Performance Penalty:
   - Why does Single emit 'SELECT TOP (2)'? Because the database must inspect whether a 2nd row exists!
   - If the column is NOT backed by a Unique Index, SQL Server cannot stop after finding 1 row—it must continue scanning the table or index until it finds a second row or reaches the end of the table!
3. When to use Single vs First:
   - Use 'SingleOrDefaultAsync' ONLY when encountering multiple records indicates critical database corruption (e.g., fetching a User by Unique National Id).
   - Use 'FirstOrDefaultAsync' for general lookups (e.g., GetLatestOrderByUserId).`,
    codeSnippet: `// ❌ PERFORMANCE MISTAKE: Non-unique column forces TOP (2) and continues scanning
public async Task<User?> BadGetUserAsync(AppDbContext db, string email, CancellationToken ct)
{
    // If Email does NOT have a UNIQUE constraint, SQL scans until it finds 2 rows!
    return await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
}

// ✅ SENIOR PATTERN: Terminates immediately at first row
public async Task<User?> GoodGetUserAsync(AppDbContext db, Guid id, CancellationToken ct)
{
    // Id is the Clustered Primary Key; FirstOrDefaultAsync emits TOP (1) and stops immediately
    return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
}`,
    redFlags: [
      "Using SingleOrDefault() blindly on queries that can return hundreds of rows, expecting it to behave like FirstOrDefault().",
      "Calling First() without handling or anticipating an InvalidOperationException when the sequence might be empty.",
      "Not knowing that Single and SingleOrDefault generate 'TOP (2)' in SQL."
    ],
    proTips: [
      "In .NET 6+, use the overload 'FirstOrDefault(predicate, defaultValue)' to specify an explicit fallback object instead of checking for null after evaluation."
    ]
  },
  {
    title: "LINQ Aggregate() (Fold / Reduce): Functional Accumulators and Seed States",
    seniority: "Senior",
    tags: ["Aggregate", "Fold", "Reduce", "Functional Programming", "In-Memory vs SQL"],
    pitch: "Aggregate() is LINQ's functional fold/reduce operator, accumulating sequence values into a single summary output via an accumulator function. It supports an initial seed value, a transformation step, and a final projection selector. While powerful for computing running state, custom string concatenation, and mathematical reductions, using Aggregate() on unmaterialized IQueryable cannot be translated to SQL by EF Core and throws runtime translation exceptions, requiring in-memory client evaluation.",
    deepDive: `Internal Accumulation Cycle:
1. Overloads of Aggregate:
   - Aggregate(Func<TSource, TSource, TSource>): Uses element 0 as initial seed. Throws if empty!
   - Aggregate(TAccumulate seed, Func<TAccumulate, TSource, TAccumulate>): Starts with explicit seed. Safe on empty collections.
   - Aggregate(TAccumulate seed, Func<TAccumulate, TSource, TAccumulate>, Func<TAccumulate, TResult>): Projects final accumulator to result type.
2. EF Core Translation Limitation:
   - SQL Server does not have an arbitrary higher-order fold operator.
   - EF Core cannot translate custom C# lambda delegates inside Aggregate() to T-SQL.
   - Attempting to run '.Aggregate()' on a DbSet<T> throws 'InvalidOperationException: The LINQ expression could not be translated'.
   - You must materialize with '.ToListAsync()' or '.AsEnumerable()' before invoking Aggregate().`,
    codeSnippet: `public class CartCalculationService
{
    // ✅ SENIOR PATTERN: Functional fold over in-memory domain items
    public decimal CalculateDiscountedTotal(IEnumerable<CartItem> items, decimal baseDiscountRate)
    {
        // Computes compound progressive discount
        return items.Aggregate(
            seed: 0m, // Initial total
            func: (currentTotal, item) => currentTotal + (item.Price * item.Quantity * (1 - baseDiscountRate)),
            resultSelector: finalTotal => Math.Round(finalTotal, 2)
        );
    }

    // String builder accumulation
    public string BuildCsvLine(IEnumerable<string> values)
    {
        return values.Aggregate(new StringBuilder(), 
            (sb, val) => sb.Append(sb.Length == 0 ? "" : ",").Append(val), 
            sb => sb.ToString());
    }
}`,
    redFlags: [
      "Calling Aggregate() directly on an EF Core IQueryable expecting it to run inside SQL Server.",
      "Using the seedless overload of Aggregate on potentially empty collections (throws InvalidOperationException).",
      "Using string concatenation (s1 + ',' + s2) inside Aggregate on large collections, generating O(N^2) heap allocations instead of using StringBuilder."
    ],
    proTips: [
      "For string concatenation across collections, always prefer 'string.Join(',', sequence)' over Aggregate(): string.Join uses internal high-performance zero-allocation FastAllocateString mechanisms."
    ]
  }
);

// 4. EF Core Additions
efcoreList.push(
  {
    title: "Eager Loading (Include/ThenInclude) vs. Explicit Loading vs. Lazy Loading",
    seniority: "Senior",
    tags: ["Include", "ThenInclude", "Lazy Loading", "Explicit Loading", "N+1 Query"],
    pitch: "Eager loading (.Include(), .ThenInclude()) fetches related entity graphs in the initial SQL query via JOINs or split queries. Explicit loading (entry.Collection().LoadAsync()) retrieves navigations on-demand for already tracked entities. Lazy loading (UseLazyLoadingProxies()) automatically fetches child entities upon property access using Castle DynamicProxy subclassing. While convenient, lazy loading is notorious in enterprise systems for introducing hidden N+1 query storms and circular reference JSON serialization crashes.",
    deepDive: `Mechanics & Architectural Hazards:
1. Eager Loading (.Include):
   - Generates SQL JOINs in the initial query.
   - ⚠️ Hazard: Multiple collection .Include() calls produce a Cartesian product explosion unless paired with .AsSplitQuery().
2. Explicit Loading (entry.Reference / entry.Collection):
   - Useful when relationship loading is conditional on business logic:
     await db.Entry(order).Collection(o => o.Items).LoadAsync(ct);
   - Only runs the query if business rules dictate loading child data.
3. Lazy Loading (Virtual Proxies):
   - Requires marking navigation properties as 'virtual'.
   - ⚠️ Hazard: Accessing 'order.Items' inside a foreach loop generates 1 query for the orders + N individual queries for each order's items (N+1 query storm).
   - ⚠️ Hazard: Passing lazy-loaded entities into System.Text.Json triggers infinite recursion and stack overflow exceptions.`,
    codeSnippet: `public class OrderService
{
    // 1. Eager Loading with Split Query (Best for APIs returning parent + children)
    public async Task<Order?> GetOrderWithDetailsAsync(AppDbContext db, Guid orderId, CancellationToken ct)
    {
        return await db.Orders
            .AsNoTracking()
            .AsSplitQuery() // Prevents Cartesian explosion across multiple includes
            .Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
    }

    // 2. Explicit Loading (Best for conditional branch loading)
    public async Task LoadDiscountsIfVipAsync(AppDbContext db, Order order, CancellationToken ct)
    {
        if (order.IsVipCustomer)
        {
            // Only loads discounts when condition is satisfied
            await db.Entry(order)
                .Collection(o => o.Discounts)
                .LoadAsync(ct);
        }
    }
}`,
    redFlags: [
      "Enabling Lazy Loading proxies in production Web APIs without knowing how to prevent N+1 queries.",
      "Including multiple child collections in eager loading without .AsSplitQuery(), creating massive Cartesian multiplication on SQL Server.",
      "Returning untracked lazy-loading proxy entities to JSON serializers."
    ],
    proTips: [
      "In high-performance REST APIs, prefer direct DTO Projection (.Select(o => new OrderDto { ... })) over .Include(): EF Core will only query the exact columns requested and completely bypass entity tracking overhead."
    ]
  },
  {
    title: "Code-First vs. Database-First: Reverse Engineering, Migrations, and Schema Governance",
    seniority: "Senior",
    tags: ["Code-First", "Database-First", "Migrations", "Scaffold", "Schema Governance"],
    pitch: "Code-First models the database schema using C# classes and Fluent API configurations, automating incremental schema evolution via 'dotnet ef migrations add'. Database-First begins with an existing relational schema and generates C# entities using 'dotnet ef dbcontext scaffold'. For enterprise applications with dedicated DBAs, strict security auditing, or legacy schemas, Database-First or Migration Bundles with reviewable idempotent SQL scripts (--idempotent) prevent breaking production changes.",
    deepDive: `Schema Evolution Comparison:
1. Code-First with Migrations:
   - Developers write C# domain entities and Fluent API mappings.
   - EF Core creates migration snapshot files (__EFMigrationsHistory).
   - Ideal for greenfield microservices where the development team owns the database lifecycle entirely.
2. Database-First / Reverse Engineering:
   - Database schema is owned by DBAs or defined via SSDT (SQL Server Data Tools).
   - Command: 'dotnet ef dbcontext scaffold "Server=...;" Microsoft.EntityFrameworkCore.SqlServer -o Models'
   - Ideal for brownfield enterprise databases shared across multiple legacy applications.
3. Production Migration Governance:
   - Never run 'context.Database.Migrate()' inside application startup in production (causes race conditions in container clusters).
   - Best practice: Generate idempotent SQL scripts in CI/CD pipeline:
     'dotnet ef migrations script --idempotent --output migrate.sql'`,
    codeSnippet: `// Fluent API Entity Configuration (Code-First Best Practice)
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders", "sales");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(32)
            .IsUnicode(false); // VARCHAR(32) instead of NVARCHAR

        builder.Property(o => o.RowVersion)
            .IsRowVersion(); // Optimistic concurrency token (ROWVERSION / TIMESTAMP)

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();
    }
}`,
    redFlags: [
      "Running 'context.Database.EnsureCreated()' in a production environment (ignores migrations completely and cannot evolve schema).",
      "Allowing multiple microservice instances to run migrations simultaneously on startup.",
      "Placing database connection strings with DDL 'sa' privileges in application appsettings.json."
    ],
    proTips: [
      "Use 'IEntityTypeConfiguration<T>' classes with 'modelBuilder.ApplyConfigurationsFromAssembly(typeof(MyDbContext).Assembly)' to keep DbContext.OnModelCreating clean and modular."
    ]
  },
  {
    title: "Shadow Properties, Complex Types, and Owned Entity Types in EF Core 8",
    seniority: "Senior",
    tags: ["Shadow Properties", "Owned Entities", "Complex Types", "EF Core 8", "DDD"],
    pitch: "Shadow properties are database columns not defined in the C# entity class (e.g., LastUpdatedUtc, TenantId), configured via Fluent API and accessed using EF.Property<T>(entity, 'Name'). Owned Entity Types (OwnsOne(), OwnsMany()) and modern EF Core 8 Complex Types (ComplexProperty()) enable Domain-Driven Design (DDD) Value Objects: they have no independent identity or primary key, flattening columns directly into the owner table without requiring foreign key JOINs.",
    deepDive: `Deep Dive into DDD Mapping:
1. Shadow Properties:
   - Kept in EF Core's StateManager without polluting domain models.
   - Example: 'builder.Property<DateTime>("LastModifiedUtc");'
   - Querying: 'db.Orders.OrderByDescending(o => EF.Property<DateTime>(o, "LastModifiedUtc"))'.
2. Owned Entity Types vs EF Core 8 Complex Types:
   - Owned Entities: Implemented as hidden entity types with shared primary keys. Can be null in database.
   - EF Core 8 Complex Types (ComplexProperty): True value objects. Cannot have identity, cannot be shared across multiple entities, and support immutable C# record types seamlessly.
3. Column Flattening:
   - An Address complex object (Street, City, Zip) on a Customer entity is stored as Customer.Street, Customer.City, Customer.Zip in the single 'Customers' table.`,
    codeSnippet: `// Domain Model: Pure DDD Value Object (Immutable Record)
public record Address(string Street, string City, string PostalCode, string Country);

public class Customer
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public Address ShippingAddress { get; set; } = default!; // Value Object
}

// EF Core 8 Configuration
public class CustomerConfig : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);

        // ✅ EF Core 8 Complex Type (DDD Value Object mapped into same table)
        builder.ComplexProperty(c => c.ShippingAddress, addressBuilder =>
        {
            addressBuilder.Property(a => a.Street).HasMaxLength(120);
            addressBuilder.Property(a => a.PostalCode).HasMaxLength(10);
        });

        // ✅ Shadow Property: Auditing field not exposed in C# class
        builder.Property<DateTime>("LastModifiedUtc").HasDefaultValueSql("GETUTCDATE()");
    }
}`,
    redFlags: [
      "Creating artificial Primary Keys (AddressId) on DDD Value Objects that have no independent lifecycle.",
      "Polluting domain models with infrastructure auditing properties instead of using EF Core Shadow Properties.",
      "Modifying an Owned Entity instance directly without replacing the immutable record, violating value object semantics."
    ],
    proTips: [
      "In EF Core 8+, use 'ComplexProperty()' instead of 'OwnsOne()' for value objects: Complex Types are natively treated as values rather than hidden entities, eliminating surrogate key tracking overhead."
    ]
  },
  {
    title: "EF Core Interceptors: Auditing, Soft Deletes, and Multi-Tenant Query Filtering",
    seniority: "Senior",
    tags: ["Interceptors", "SaveChangesInterceptor", "Global Query Filters", "Soft Delete", "Auditing"],
    pitch: "EF Core Interceptors (ISaveChangesInterceptor, IDbCommandInterceptor) hook directly into the database execution lifecycle, allowing cross-cutting operations like automatic audit timestamping (CreatedAt, ModifiedAt), user ID injection, and SQL telemetry logging. Combined with Global Query Filters (modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _currentTenant)), interceptors ensure data isolation and soft delete enforcement without repeating WHERE clauses across every LINQ query.",
    deepDive: `Execution Lifecycle Hooking:
1. SaveChangesInterceptor Flow:
   - Executes inside the DbContext transaction right before 'SaveChanges' or 'SaveChangesAsync'.
   - Iterates through 'ChangeTracker.Entries<IAuditableEntity>()'.
   - Sets CreatedAtUtc / ModifiedAtUtc automatically based on EntityState.Added / EntityState.Modified.
2. Global Query Filters:
   - Automatically appends a WHERE clause to every SQL query targeting the entity.
   - Example: 'WHERE [e].[IsDeleted] = 0 AND [e].[TenantId] = @__tenantId_0'
   - Can be temporarily bypassed for admin workflows using '.IgnoreQueryFilters()'.
3. DbCommandInterceptor:
   - Allows mutating SQL text or parameters right before sending the command over the TDS protocol. Useful for query tagging, security auditing, and query performance tracing.`,
    codeSnippet: `// 1. Production SaveChanges Interceptor for Automatic Auditing
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUser;
    public AuditSaveChangesInterceptor(ICurrentUserService currentUser) => _currentUser = currentUser;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        var context = eventData.Context;
        if (context == null) return base.SavingChangesAsync(eventData, result, ct);

        var now = DateTime.UtcNow;
        var userId = _currentUser.UserId ?? "SYSTEM";

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
                entry.Entity.CreatedBy = userId;
            }
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedUtc = now;
                entry.Entity.LastModifiedBy = userId;
            }
        }

        return base.SavingChangesAsync(eventData, result, ct);
    }
}`,
    redFlags: [
      "Manually setting 'CreatedAt' and 'ModifiedAt' in every API controller or repository instead of an Interceptor.",
      "Forgetting that Global Query Filters are applied to navigation property includes, which can cause related entities to silently return null.",
      "Calling SaveChangesAsync recursively inside a SaveChangesInterceptor (creates infinite loops)."
    ],
    proTips: [
      "Use 'query.IgnoreQueryFilters()' when writing admin restoration tools or undelete operations that need to query soft-deleted records."
    ]
  }
);

// 5. SQL Additions
sqlList.push(
  {
    title: "SQL Joins: Inner, Left Outer, Right Outer, Full Outer, Cross, and Self Joins",
    seniority: "Senior",
    tags: ["SQL Joins", "Nested Loops", "Hash Match", "Merge Join", "Venn Diagrams"],
    pitch: "SQL Joins combine data from two tables based on relational predicates. Inner Join returns only intersecting rows where the join predicate evaluates to true. Left Outer Join returns all left rows plus matching right rows (or NULLs). Full Outer Join returns the complete union with NULLs on either unmatched side. Cross Join produces the Cartesian product (M * N rows). Under the hood, SQL Server's cost-based optimizer selects between three join operators: Nested Loops (optimal for small outer table with indexed inner table), Merge Join (optimal when both inputs are pre-sorted on join keys), and Hash Match (optimal for massive unindexed datasets).",
    deepDive: `Internal Join Algorithms in SQL Server:
1. Nested Loops Join:
   - For every row in the outer table, SQL Server performs an index seek into the inner table.
   - Lightning fast (O(N log M)) when outer row count is small and inner table has a clustered/non-clustered index on the join key.
2. Merge Join:
   - Requires both inputs to be sorted on the join column.
   - Scans both inputs concurrently like a zipper: O(N + M) complexity. Extremely efficient for large sorted datasets.
3. Hash Match Join:
   - Builds an in-memory hash table on the smaller table's join keys, then probes it with rows from the larger table.
   - Resource intensive (requires memory grants in tempdb); used when tables lack indexes.
4. Self Join & Cross Join:
   - Self Join: Joining a table to itself to evaluate hierarchical relationships (e.g., Employees.ManagerId -> Employees.Id).
   - Cross Join: Produces M * N rows. Useful for generating date tally tables or matrix combinations.`,
    codeSnippet: `-- 1. Left Outer Join with NULL filter (Finding customers who NEVER ordered)
SELECT c.CustomerId, c.Name
FROM dbo.Customers c
LEFT JOIN dbo.Orders o ON c.CustomerId = o.CustomerId
WHERE o.OrderId IS NULL; -- Filters out any customer who has an order

-- 2. Self Join for Manager Hierarchy
SELECT 
    e.EmployeeId,
    e.FullName AS EmployeeName,
    ISNULL(m.FullName, 'CEO / Top Exec') AS ManagerName
FROM dbo.Employees e
LEFT JOIN dbo.Employees m ON e.ManagerId = m.EmployeeId;

-- 3. Full Outer Join (Auditing discrepancies between Billing and Shipping)
SELECT 
    COALESCE(b.AccountId, s.AccountId) AS AccountId,
    b.AmountDue,
    s.TrackingNumber
FROM dbo.Billing b
FULL OUTER JOIN dbo.Shipping s ON b.AccountId = s.AccountId;`,
    redFlags: [
      "Using a Cartesian CROSS JOIN by omitting the WHERE/ON clause, exhausting server RAM with billions of rows.",
      "Placing filtering predicates for the right table in the WHERE clause instead of the ON clause of a LEFT JOIN (accidentally converting it into an INNER JOIN).",
      "Not understanding why SQL Server chose a Hash Match instead of a Nested Loop join (indicates missing index)."
    ],
    proTips: [
      "Always put filters on the right-hand table inside the 'ON' clause of a LEFT JOIN: putting them in the 'WHERE' clause filters out NULL rows and silently turns the query into an INNER JOIN!"
    ]
  },
  {
    title: "Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE() with OVER()",
    seniority: "Senior",
    tags: ["Window Functions", "ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE", "OVER()"],
    pitch: "Window functions calculate running totals, rankings, and moving averages across a partitioned subset of rows without collapsing rows like GROUP BY. ROW_NUMBER() generates unique sequential integers (1, 2, 3, 4). RANK() assigns identical ranks to ties and leaves gaps (1, 2, 2, 4). DENSE_RANK() assigns identical ranks to ties without gaps (1, 2, 2, 3). NTILE(n) distributes rows into N approximately equal buckets. Sourcing the Nth highest salary or deduping records uses DENSE_RANK() OVER (ORDER BY Salary DESC) inside a CTE.",
    deepDive: `Differences and Memory Execution:
1. The Ranking Matrix (for values 100, 100, 80, 70):
   - ROW_NUMBER(): 1, 2, 3, 4 (Arbitrary tie-breaking based on ordering).
   - RANK(): 1, 1, 3, 4 (Ties share rank 1; rank 2 is skipped).
   - DENSE_RANK(): 1, 1, 2, 3 (Ties share rank 1; next rank is 2 without gaps).
2. The OVER() Clause Anatomy:
   - PARTITION BY: Divides the result set into distinct partitions (e.g., DepartmentId).
   - ORDER BY: Dictates the sequence of row evaluation inside each partition.
   - ROWS BETWEEN ...: Defines the rolling window frame for running aggregates (e.g., 7-day moving average).
3. The Classic Senior Interview Problem:
   - 'Find the Nth highest salary per department': Requires DENSE_RANK() inside a CTE, because RANK() skips ranks on ties!`,
    codeSnippet: `-- Classic Senior Interview Question: Find the 2nd Highest Salary per Department
WITH RankedSalaries AS
(
    SELECT 
        EmployeeId,
        DepartmentId,
        Salary,
        DENSE_RANK() OVER (
            PARTITION BY DepartmentId 
            ORDER BY Salary DESC
        ) AS SalaryRank
    FROM dbo.Employees
)
SELECT DepartmentId, EmployeeId, Salary
FROM RankedSalaries
WHERE SalaryRank = 2; -- Correctly handles ties without skipping!

-- Running Total with Window Framing
SELECT 
    OrderId, 
    OrderDate, 
    TotalAmount,
    SUM(TotalAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS RunningCustomerSpend
FROM dbo.Orders;`,
    redFlags: [
      "Using RANK() instead of DENSE_RANK() when solving 'Nth highest value' interview questions with ties.",
      "Attempting to filter by a Window Function directly in the WHERE clause (Window functions execute after WHERE; you MUST wrap in a CTE or subquery).",
      "Omitting the frame specification ('ROWS BETWEEN ...') on running SUM(), causing SQL Server to default to the slower RANGE specification."
    ],
    proTips: [
      "Always specify 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW' when computing running aggregates in SQL Server: the default 'RANGE' specification creates an on-disk worktable in tempdb that is significantly slower."
    ]
  },
  {
    title: "Common Table Expressions (CTEs) & Recursive Queries vs. Temp Tables vs. Table Variables",
    seniority: "Senior",
    tags: ["CTE", "Recursive CTE", "Temp Tables (#table)", "Table Variables (@table)", "tempdb"],
    pitch: "A CTE is a non-materialized inline view defined with WITH that exists only during query execution: if referenced multiple times in the outer query, SQL Server re-executes the CTE logic each time. Recursive CTEs enable hierarchical tree traversal (org charts, bill of materials). Temporary Tables (#table) are physically materialized in tempdb, have full column statistics, support indexes, and participate in parallel query plans. Table Variables (@table) live in tempdb as well, have NO statistics (optimizer historically assumes 1 row), do not support parallel plans, and do not rollback during transaction aborts.",
    deepDive: `Physical Architecture & tempdb Comparison:
1. CTEs (Common Table Expressions):
   - Scope: Single statement.
   - Materialization: NOT materialized! Evaluated inline like a view.
   - ⚠️ TRAP: If a CTE joins to itself or is queried twice, SQL Server executes the underlying query TWICE!
2. Temporary Tables (#table):
   - Scope: Current connection/session.
   - Materialization: Physical table in tempdb.
   - Features: Supports clustered/non-clustered indexes, triggers, and full distribution statistics. The query optimizer estimates rows accurately.
3. Table Variables (@table):
   - Scope: Current batch/stored procedure execution.
   - Materialization: Lives in tempdb as well (NOT in memory only!).
   - ⚠️ TRAP: Has NO column statistics. Prior to SQL Server 2019, the optimizer always estimated Cardinality = 1, leading to terrible execution plans on large datasets.`,
    codeSnippet: `-- 1. Recursive CTE: Traversal of Organizational Hierarchy
WITH OrgChartCTE AS
(
    -- Anchor member: The CEO / Top level (ManagerId is NULL)
    SELECT EmployeeId, FullName, ManagerId, 1 AS OrgLevel
    FROM dbo.Employees
    WHERE ManagerId IS NULL

    UNION ALL

    -- Recursive member: Subordinates joining to parent
    SELECT e.EmployeeId, e.FullName, e.ManagerId, o.OrgLevel + 1
    FROM dbo.Employees e
    INNER JOIN OrgChartCTE o ON e.ManagerId = o.EmployeeId
)
SELECT EmployeeId, FullName, OrgLevel
FROM OrgChartCTE
ORDER BY OrgLevel, FullName
OPTION (MAXRECURSION 100); -- Safety check against circular reporting loops!`,
    redFlags: [
      "Believing that Table Variables live exclusively in RAM (they spill to tempdb just like temp tables).",
      "Using a Table Variable for datasets larger than 100 rows, causing the optimizer to pick terrible nested loop plans due to 1-row cardinality assumptions.",
      "Joining a non-materialized CTE multiple times expecting cached results, causing duplicate database execution."
    ],
    proTips: [
      "For complex intermediate datasets (> 1,000 rows) used across multiple steps, use a '#temp' table with an explicit clustered index instead of a CTE or Table Variable."
    ]
  },
  {
    title: "Stored Procedures vs. User-Defined Functions (Scalar vs. Inline TVF) and Parameter Sniffing",
    seniority: "Senior",
    tags: ["Stored Procedures", "Scalar UDF", "Inline TVF", "Parameter Sniffing", "RBAR"],
    pitch: "Stored procedures compile into cached execution plans, support DML/DDL, output parameters, and explicit transactions, but can suffer from 'Parameter Sniffing' when the initial compiled plan is suboptimal for subsequent parameter distributions. Scalar User-Defined Functions (UDFs) historically forced Row-By-Agonizing-Row (RBAR) serial execution, disabling parallelism until SQL Server 2019 Scalar UDF Inlining. Inline Table-Valued Functions (iTVFs) expand directly into the calling query like parameterized views, allowing the query optimizer to choose index seeks and parallel join plans.",
    deepDive: `Internal Compilation & Optimization Differences:
1. Parameter Sniffing in Stored Procedures:
   - When a stored procedure is first executed, SQL Server 'sniffs' the parameter values and builds an execution plan optimized specifically for that parameter's cardinality.
   - If parameter 1 returns 2 rows (Index Seek), but parameter 2 returns 2,000,000 rows (Index Scan), parameter 2 suffers severe performance degradation using the Seek plan!
   - Solutions: 'OPTIMIZE FOR (@param UNKNOWN)', 'OPTION (RECOMPILE)', or local variable assignment.
2. Scalar UDFs & RBAR (Row-By-Agonizing-Row):
   - When a scalar UDF is called in a SELECT list or WHERE clause, the engine invokes the function separately for every single row, blocking parallel execution plans.
3. Inline TVFs (The Senior Pattern):
   - Functions defined as a single RETURN SELECT statement.
   - SQL Server treats inline TVFs as parameterized views, embedding the logic directly into the outer query's execution tree.`,
    codeSnippet: `-- 1. ❌ BAD: Multi-statement Scalar UDF (Forces RBAR serial execution)
CREATE FUNCTION dbo.fn_BadGetCustomerTotalSpend (@CustomerId INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Total DECIMAL(18,2);
    SELECT @Total = SUM(TotalAmount) FROM dbo.Orders WHERE CustomerId = @CustomerId;
    RETURN ISNULL(@Total, 0);
END;
GO

-- 2. ✅ SENIOR PATTERN: Inline Table-Valued Function (iTVF)
-- Inlines directly into calling query; supports index seeks and parallelism!
CREATE FUNCTION dbo.fn_GoodGetCustomerSpend (@CustomerId INT)
RETURNS TABLE
AS
RETURN
(
    SELECT ISNULL(SUM(TotalAmount), 0) AS TotalSpend
    FROM dbo.Orders
    WHERE CustomerId = @CustomerId
);
GO

-- Calling iTVF via CROSS APPLY:
SELECT c.CustomerId, c.Name, s.TotalSpend
FROM dbo.Customers c
CROSS APPLY dbo.fn_GoodGetCustomerSpend(c.CustomerId) s;`,
    redFlags: [
      "Using Multi-Statement Scalar UDFs in large queries without knowing they destroy parallelism and force serial RBAR execution.",
      "Not knowing what Parameter Sniffing is or how to resolve it when stored procedures intermittently stall.",
      "Attempting to modify database state (INSERT/UPDATE) inside a User-Defined Function (UDFs are read-only)."
    ],
    proTips: [
      "Always write User-Defined Functions as Inline Table-Valued Functions (iTVFs) using a single 'RETURN SELECT' statement: the query optimizer inlines them completely into the host query tree."
    ]
  },
  {
    title: "Primary Key vs. Unique Key vs. Clustered Index: Logical Constraints vs. Physical Storage",
    seniority: "Senior",
    tags: ["Primary Key", "Unique Key", "Clustered Index", "Heap Tables", "B-Tree Leaf"],
    pitch: "A Primary Key is a logical relational constraint enforcing entity integrity: it requires unique, non-null values, and SQL Server defaults to creating a Clustered Index (though it can be declared NONCLUSTERED). A Unique Constraint also enforces uniqueness but permits a single NULL value (in SQL Server) and defaults to a Non-Clustered Index. A Clustered Index is a physical storage structure: it dictates the physical order of leaf data pages on disk in the B-Tree (a table can have at most one clustered index; tables without one are Heaps).",
    deepDive: `Physical vs Logical Architecture:
1. Logical Constraints:
   - Primary Key: Disallows duplicate values AND disallows NULL values. Enforces entity identity.
   - Unique Constraint: Disallows duplicate non-null values. Under ANSI standard, multiple NULLs are allowed; in SQL Server, only one NULL is permitted (unless a filtered unique index 'WHERE Column IS NOT NULL' is used).
2. Physical Storage (B-Tree vs Heap):
   - A Clustered Index physically orders the table's data rows on disk at the leaf level of the B-Tree.
   - You can create a Primary Key as NONCLUSTERED:
     'ALTER TABLE Orders ADD CONSTRAINT PK_Orders PRIMARY KEY NONCLUSTERED (OrderId);'
   - This frees the single Clustered Index to be placed on a sequential business column (like CreatedAtUtc or TenantId) that optimizes range scans!`,
    codeSnippet: `-- Decoupling Logical Primary Key from Physical Clustered Index
CREATE TABLE dbo.TenantEvents
(
    EventGuid UNIQUEIDENTIFIER NOT NULL, -- Random UUID
    TenantId INT NOT NULL,
    CreatedAtUtc DATETIME2(3) NOT NULL,
    Payload NVARCHAR(MAX) NOT NULL,

    -- 1. Logical Identity: Enforces uniqueness, but NONCLUSTERED
    -- Prevents index fragmentation caused by random GUIDs!
    CONSTRAINT PK_TenantEvents PRIMARY KEY NONCLUSTERED (EventGuid)
);

-- 2. Physical Storage: Sequential CLUSTERED Index on Tenant & Date
-- Optimizes physical disk range queries for tenant analytics!
CREATE CLUSTERED INDEX CIX_TenantEvents_Tenant_Date
ON dbo.TenantEvents (TenantId, CreatedAtUtc);`,
    redFlags: [
      "Assuming that a Primary Key MUST always be the Clustered Index on a table.",
      "Using random 'Guid.NewGuid()' as the Clustered Primary Key, causing catastrophic 50% B-Tree page splits and disk fragmentation.",
      "Believing that Unique Keys and Primary Keys behave identically regarding NULL values."
    ],
    proTips: [
      "If you use GUID primary keys, create the Primary Key as NONCLUSTERED, and place the CLUSTERED index on a sequential column (e.g. CreatedAtUtc or sequential GUID via UuidCreateSequential / Guid Version 7) to eliminate page splits."
    ]
  }
);

// 6. UI / Frontend Additions
uiList.push(
  {
    title: "JavaScript Closures, Lexical Scope, and Detached DOM Memory Leaks in Single-Page Apps",
    seniority: "Senior",
    tags: ["Closures", "Lexical Scope", "Memory Leaks", "Garbage Collection", "Detached DOM"],
    pitch: "A closure is the combination of a function bundled together with references to its surrounding lexical environment (the scope chain). In modern single-page applications, closures power stateful callbacks, memoized hooks, and factory functions. However, if a closure references a large object or DOM element and is attached to a global event listener, timer (setInterval), or module-level cache, the garbage collector cannot reclaim that memory, resulting in 'Detached DOM Tree' memory leaks that degrade browser performance over time.",
    deepDive: `Engine Scope Chains & Memory Retention:
1. Lexical Scope Mechanics:
   - When a function is declared, the JavaScript engine assigns an internal [[Scopes]] property pointing to the parent Execution Context's Lexical Environment.
   - Even after the outer function finishes executing, any inner function that retains a reference keeps the entire lexical scope object alive in the heap.
2. The Detached DOM Memory Leak:
   - A DOM element is removed from the active document tree via 'document.body.removeChild(el)'.
   - However, if an event handler or timer callback holds a closure reference to 'el', the browser's Garbage Collector cannot free the element or any of its child nodes!
   - This creates a 'Detached HTMLDivElement' holding megabytes of memory in Chrome DevTools Memory Heap Snapshots.`,
    codeSnippet: `// ❌ LEAKY PATTERN: Closure retains reference to heavy DOM element in global interval
function setupPollingWidget() {
    const heavyContainer = document.getElementById('heavyWidget'); // DOM reference

    setInterval(() => {
        // Closure captures 'heavyContainer'
        if (heavyContainer) {
            heavyContainer.innerText = "Updated: " + new Date().toISOString();
        }
    }, 1000);
}

// ✅ SENIOR PATTERN: React cleanup ensures closure references are severed
import { useEffect, useRef } from 'react';

export function PollingWidget() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            if (containerRef.current) {
                containerRef.current.innerText = "Updated: " + new Date().toISOString();
            }
        }, 1000);

        // CLEANUP FUNCTION: Clears timer when component unmounts, allowing GC!
        return () => clearInterval(timer);
    }, []);

    return <div ref={containerRef} className="widget" />;
}`,
    redFlags: [
      "Defining setInterval or window.addEventListener inside React components without returning a cleanup function in useEffect.",
      "Not knowing how to identify Detached DOM nodes using Chrome DevTools Heap Snapshots.",
      "Believing that removing an element from the DOM with innerHTML = '' automatically garbage-collects its event listeners."
    ],
    proTips: [
      "Use WeakRef or WeakMap when caching objects associated with DOM elements or closures: Weak references do not prevent the Garbage Collector from freeing the underlying target."
    ]
  },
  {
    title: "The Browser Event Loop: Call Stack, Microtasks (Promises), and Macrotasks (Timers/I/O)",
    seniority: "Senior",
    tags: ["Event Loop", "Microtasks", "Macrotasks", "Promise.then()", "UI Freezing"],
    pitch: "JavaScript is single-threaded with a non-blocking event loop. The execution order is strictly prioritized: 1) Synchronous code runs on the Call Stack. 2) When the stack empties, the engine drains the entire Microtask Queue (Promise.then(), queueMicrotask(), MutationObserver). 3) The browser performs layout/repaint (if a screen refresh frame is due). 4) One single task from the Macrotask Queue (setTimeout, setInterval, I/O events) is dequeued. Because microtasks run continuously until empty, recursive promise chains starve the macrotask queue and completely freeze UI rendering.",
    deepDive: `Event Loop Priority Order:
1. Microtasks vs Macrotasks:
   - Microtasks: 'Promise.resolve().then()', 'queueMicrotask()', 'await' continuations.
   - Macrotasks (Tasks): 'setTimeout', 'setInterval', 'setImmediate' (Node), DOM events, network I/O.
2. The Starvation Hazard:
   - When a microtask schedules another microtask, the engine immediately executes the new microtask before returning to the event loop.
   - If microtasks run continuously in a loop, the browser NEVER reaches the Rendering Stage (60/120 FPS UI paint) and never runs macrotasks, causing the tab to hang.
3. Execution Trace Puzzle:
   - console.log('1');
   - setTimeout(() => console.log('2'), 0);
   - Promise.resolve().then(() => console.log('3'));
   - console.log('4');
   - Output: 1, 4, 3, 2 (Synchronous 1, 4 -> Microtask 3 -> Macrotask 2).`,
    codeSnippet: `// Demonstrating Event Loop Order & Non-Blocking Yielding
async function processLargeDataset(items: number[]) {
    console.log("Start processing");

    for (let i = 0; i < items.length; i++) {
        // Expensive CPU computation
        doHeavyMath(items[i]);

        // ✅ SENIOR PATTERN: Yield control back to browser to allow UI re-rendering!
        // Every 500 iterations, break out of microtask queue to allow 60fps paint
        if (i % 500 === 0) {
            await yieldToMain();
        }
    }

    console.log("Finished processing");
}

// Yields execution to the Macrotask queue via scheduler.yield() or setTimeout
function yieldToMain(): Promise<void> {
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
        return (window as any).scheduler.yield();
    }
    return new Promise(resolve => setTimeout(resolve, 0));
}`,
    redFlags: [
      "Stating that setTimeout(..., 0) executes immediately before resolved Promises.",
      "Running heavy synchronous loops in the main browser thread that block the call stack and drop frame rates.",
      "Not knowing the difference between the microtask queue and macrotask queue."
    ],
    proTips: [
      "Use modern 'scheduler.yield()' (or 'setTimeout(..., 0)') to chunk long tasks into discrete slices, allowing the browser to process clicks and maintain 60 FPS animations."
    ]
  },
  {
    title: "Controlled vs. Uncontrolled Components: React State vs. useRef DOM Performance",
    seniority: "Senior",
    tags: ["Controlled Components", "Uncontrolled Components", "useRef", "Form Performance", "Re-renders"],
    pitch: "Controlled components bind form inputs directly to React useState, updating state on every keystroke and making React the single source of truth; this simplifies conditional validation and instant UI updates but triggers re-rendering of the component on every character typed. Uncontrolled components keep internal state in the browser DOM and access values on submit using useRef; this eliminates per-keystroke re-renders and is essential for high-throughput inputs, canvas interactions, or large dynamic tables.",
    deepDive: `Architectural Trade-offs:
1. Controlled Components (useState):
   - Value is passed via prop 'value={text}' and changes are handled via 'onChange={e => setText(e.target.value)}'.
   - Advantage: Instant validation, dynamic disabling of submit buttons, formatting inputs on the fly (e.g. credit card masks).
   - Disadvantage: In a form with 50 inputs, typing triggers 50 re-render passes for the parent component unless child components are aggressively memoized.
2. Uncontrolled Components (useRef / FormData):
   - Value is managed by the browser DOM using 'defaultValue="foo"'.
   - Read values on submit: 'const value = inputRef.current.value;' or 'new FormData(formEvent.currentTarget)'.
   - Advantage: Zero re-renders while typing. Peak input latency.
3. React 19 Integration:
   - React 19 Server Actions and 'useActionState' favor uncontrolled native form submissions with progressive enhancement.`,
    codeSnippet: `import React, { useRef, useState } from 'react';

// 1. Uncontrolled High-Performance Form (Zero typing re-renders)
export function UncontrolledSearchForm({ onSearch }: { onSearch: (query: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Read directly from DOM on demand
        if (inputRef.current) {
            onSearch(inputRef.current.value);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input ref={inputRef} defaultValue="" placeholder="Search..." />
            <button type="submit">Search</button>
        </form>
    );
}

// 2. React 19 Native FormData Form (Cleanest modern pattern)
export function ModernNativeForm({ onSubmitAction }: { onSubmitAction: (fd: FormData) => void }) {
    return (
        <form action={onSubmitAction}>
            <input name="email" type="email" required />
            <input name="password" type="password" required />
            <button type="submit">Sign In</button>
        </form>
    );
}`,
    redFlags: [
      "Using controlled useState on every single input in massive 100-field forms, causing visible input lag on mobile devices.",
      "Passing 'value' without an 'onChange' handler in React (causes read-only input warning in console).",
      "Believing that uncontrolled components cannot have validation rules."
    ],
    proTips: [
      "For large complex forms, use libraries like React Hook Form: they leverage uncontrolled inputs with refs under the hood, delivering 60 FPS typing speed while providing full validation and dirty-state tracking."
    ]
  }
);

// 7. Cloud Additions
cloudList.push(
  {
    title: "Zero-Trust Secret Management: Azure Key Vault vs. GitHub Actions OIDC Federated Credentials",
    seniority: "Senior",
    tags: ["Azure Key Vault", "GitHub OIDC", "Workload Identity", "Zero-Trust", "DevSecOps"],
    pitch: "Traditional CI/CD pipelines relied on long-lived Service Principal client secrets or connection strings stored in repository settings, exposing systems to credential expiration outages and exfiltration risks. Modern enterprise DevSecOps implements OpenID Connect (OIDC) Workload Identity Federation: GitHub Actions exchanges short-lived JWT tokens directly with Microsoft Entra ID (Azure AD), issuing temporary, scoped access tokens without storing any passwords or secrets. Applications in Azure use Managed Identities to fetch secrets and certificates from Azure Key Vault at runtime with automatic rotation.",
    deepDive: `Architecture of OIDC Federated Credentials:
1. The Danger of Static Secrets:
   - Passwords and client secrets stored in GitHub Repository Secrets must be manually rotated, expire unexpectedly, and can be extracted by compromised workflow scripts.
2. OIDC Federation Handshake:
   - Step 1: GitHub Actions runner requests an OIDC token from the GitHub token service with claims (repo, branch, environment).
   - Step 2: The runner sends this token to Microsoft Entra ID (Azure AD).
   - Step 3: Entra ID validates the token signature against GitHub's public keys and verifies the federated credential trust policy.
   - Step 4: Entra ID returns a short-lived (1-hour) OAuth access token scoped strictly to the Azure subscription.
3. Runtime Key Vault Access:
   - Web App uses System-Assigned Managed Identity.
   - Key Vault uses Azure RBAC ('Key Vault Secrets User').
   - Zero secrets stored in appsettings.json or container environment variables!`,
    codeSnippet: `# .github/workflows/deploy.yml
name: Secure OIDC Azure Deployment

on:
  push:
    branches: [ main ]

permissions:
  id-token: write # Required for requesting the GitHub OIDC JWT token!
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ✅ SENIOR PATTERN: Zero Long-Lived Secrets! Federated Credential Handshake
      - name: Azure Login via OIDC
        uses: azure/login@v2
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy Container to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'prod-dotnet-api'
          images: 'myacr.azurecr.io/api:\${{ github.sha }}'`,
    redFlags: [
      "Storing SQL connection strings with plain-text passwords inside appsettings.json or GitHub Repository Secrets.",
      "Using long-lived Service Principal client secrets that expire every 6-12 months and crash CI/CD builds.",
      "Granting 'Key Vault Administrator' permissions instead of least-privilege 'Key Vault Secrets User' RBAC role."
    ],
    proTips: [
      "Always configure Azure Key Vault with Azure RBAC rather than legacy Vault Access Policies: RBAC integrates seamlessly with Entra ID Privileged Identity Management (PIM) and provides granular secret-level auditing."
    ]
  }
);

// Standardize IDs for all lists
function standardize(list, prefix) {
  return list.map((q, idx) => ({
    ...q,
    id: `q-${prefix}-${idx + 1}`,
    pillar: prefix === 'frontend' ? 'ui' : prefix
  }));
}

const finalCsharp = standardize(csharpList, 'csharp');
const finalAspnet = standardize(aspnetList, 'aspnet');
const finalLinq = standardize(linqList, 'linq');
const finalEfcore = standardize(efcoreList, 'efcore');
const finalSql = standardize(sqlList, 'sql');
const finalUi = standardize(uiList, 'ui');
const finalCloud = standardize(cloudList, 'cloud');

const allFinalQuestions = [
  ...finalCsharp,
  ...finalAspnet,
  ...finalLinq,
  ...finalEfcore,
  ...finalSql,
  ...finalUi,
  ...finalCloud
];

console.log('\nFinal standardized questions summary:');
console.log('- C# Language & CLR:', finalCsharp.length);
console.log('- ASP.NET Core & Web APIs:', finalAspnet.length);
console.log('- LINQ Mastery:', finalLinq.length);
console.log('- Entity Framework Core:', finalEfcore.length);
console.log('- SQL Server & Relational DB:', finalSql.length);
console.log('- UI & Frontend (React/TS):', finalUi.length);
console.log('- Azure DevOps & Cloud CI/CD:', finalCloud.length);
console.log('TOTAL QUESTIONS:', allFinalQuestions.length);

// Check unique IDs
const idSet = new Set();
let duplicates = 0;
allFinalQuestions.forEach(q => {
  if (idSet.has(q.id)) {
    console.error('DUPLICATE ID DETECTED:', q.id);
    duplicates++;
  }
  idSet.add(q.id);
});

if (duplicates > 0) {
  console.error('FAILED with duplicate IDs!');
  process.exit(1);
}

// Write to js/data/questions.js
const fileContent = `// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM
// Organized into 7 Focused Technical Modules + Top 10 Coding Questions Arena
// Sourced from top GitHub .NET repositories (Venkatesh-Bharath) & Reddit interview loops
// ============================================================================

window.INTERVIEW_QUESTIONS = ${JSON.stringify(allFinalQuestions, null, 2)};
`;

fs.writeFileSync('js/data/questions.js', fileContent, 'utf8');
console.log('✅ Successfully wrote js/data/questions.js with 0 errors!');
