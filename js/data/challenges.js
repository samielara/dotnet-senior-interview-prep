// ============================================================================
// CODE & BUG LAB CHALLENGES DATA
// Production-grade interactive debugging and refactoring exercises
// ============================================================================

window.INTERVIEW_CHALLENGES = [
  {
    id: "captive-dependency",
    title: "1. Eliminate Captive Dependency in ASP.NET Core DI",
    pillar: "aspnet",
    difficulty: "Senior",
    scenario: `In a high-throughput ASP.NET Core 8 Web API, you encounter sporadic \`InvalidOperationException: Cannot consume scoped service 'AppDbContext' from singleton 'ReportCacheWorker'\` errors during startup, and concurrent thread access corruption in production when validation is turned off. 

The \`ReportCacheWorker\` is registered as a **Singleton** (hosted background service), but it directly injects **Scoped** \`AppDbContext\` in its constructor. 

Refactor the class to safely resolve the scoped \`AppDbContext\` using \`IServiceScopeFactory\` on demand within \`ProcessPendingReportsAsync\`, preventing captive dependency and lifetime mismatch.`,
    initialCode: `public class ReportCacheWorker : BackgroundService
{
    private readonly ILogger<ReportCacheWorker> _logger;
    // BUG: Captive Dependency! Scoped service injected into Singleton
    private readonly AppDbContext _dbContext;

    public ReportCacheWorker(
        ILogger<ReportCacheWorker> logger,
        AppDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessPendingReportsAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task ProcessPendingReportsAsync(CancellationToken ct)
    {
        // BUG: Using singleton-captured dbContext across async iterations!
        var pending = await _dbContext.Reports
            .Where(r => !r.IsProcessed)
            .ToListAsync(ct);

        foreach (var report in pending)
        {
            report.IsProcessed = true;
            report.ProcessedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(ct);
    }
}`,
    tests: [
      {
        name: "Injects IServiceScopeFactory in constructor",
        validate: (code) => {
          return /IServiceScopeFactory\s+[\w_]+/.test(code) &&
                 !/public\s+ReportCacheWorker\s*\([^\)]*AppDbContext\s+[\w_]+/.test(code);
        },
        failureMessage: "Remove AppDbContext from constructor and inject 'IServiceScopeFactory' instead."
      },
      {
        name: "Does NOT retain AppDbContext as a singleton field",
        validate: (code) => {
          return !/private\s+(?:readonly\s+)?AppDbContext\s+_\w+;/.test(code);
        },
        failureMessage: "Do not store AppDbContext in a class field on a Singleton background service."
      },
      {
        name: "Creates scope with 'using var scope = ...CreateScope()'",
        validate: (code) => {
          return /using\s+(?:var\s+[\w_]+|IServiceScope\s+[\w_]+)\s*=\s*[\w_]+\.CreateScope\(\)/.test(code) ||
                 /using\s*\(\s*(?:var\s+[\w_]+|IServiceScope\s+[\w_]+)\s*=\s*[\w_]+\.CreateScope\(\)\s*\)/.test(code);
        },
        failureMessage: "Must create an explicit scope using 'using var scope = _scopeFactory.CreateScope();'."
      },
      {
        name: "Resolves AppDbContext from scope.ServiceProvider",
        validate: (code) => {
          return /scope\.ServiceProvider\.GetRequiredService<AppDbContext>\(\)/.test(code) ||
                 /scope\.ServiceProvider\.GetService<AppDbContext>\(\)/.test(code);
        },
        failureMessage: "Resolve AppDbContext using 'scope.ServiceProvider.GetRequiredService<AppDbContext>()'."
      }
    ],
    hints: [
      "In ASP.NET Core, Singletons live for the entire application lifetime. Scoped services (like EF Core DbContext) are meant to live per-request. Injecting a Scoped service into a Singleton creates a 'Captive Dependency', keeping that DbContext alive forever and breaking thread-safety.",
      "Inject 'IServiceScopeFactory' into ReportCacheWorker's constructor, then in 'ProcessPendingReportsAsync', create a temporary scope: 'using var scope = _scopeFactory.CreateScope();'."
    ],
    solution: `public class ReportCacheWorker : BackgroundService
{
    private readonly ILogger<ReportCacheWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public ReportCacheWorker(
        ILogger<ReportCacheWorker> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessPendingReportsAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task ProcessPendingReportsAsync(CancellationToken ct)
    {
        // Clean resolution: Create a dedicated scope per unit-of-work
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await dbContext.Reports
            .Where(r => !r.IsProcessed)
            .ToListAsync(ct);

        foreach (var report in pending)
        {
            report.IsProcessed = true;
            report.ProcessedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);
    }
}`,
    explanation: `**Senior Architecture Rationale**:
1. **Thread-Safety**: EF Core's \`DbContext\` is not thread-safe. Singletons are accessible by multiple threads simultaneously. A captive \`DbContext\` will throw concurrent execution exceptions under load.
2. **Memory Leak**: The EF Core Change Tracker keeps tracked entities in memory. A captive \`DbContext\` will continuously accumulate tracked entity snapshots until an \`OutOfMemoryException\` occurs.
3. **Best Practice**: Use \`IServiceScopeFactory.CreateScope()\` inside background services, message consumers, and job runners to ensure proper disposal of scoped resources.`
  },
  {
    id: "eliminate-n-plus-one",
    title: "2. Eliminate N+1 Queries & Cartesian Explosion in EF Core",
    pillar: "sql",
    difficulty: "Senior",
    scenario: `A dashboard endpoint is timing out in production. Profiling reveals 1,000 SQL queries being executed for a single request (classic N+1 query problem). The developer attempted to fix it with multiple nested \`.Include()\` statements, which caused a massive **Cartesian Explosion** (10,000 duplicated rows over the network).

Refactor the query to use **projection via \`.Select()\`** to fetch only the required DTO fields, combined with \`.AsNoTracking()\` for maximum throughput.`,
    initialCode: `public async Task<List<OrderSummaryDto>> GetOrderSummariesAsync(
    AppDbContext db, 
    int customerId, 
    CancellationToken ct)
{
    // BUG 1: Loads entire entities into Change Tracker for read-only query
    // BUG 2: N+1 or Cartesian explosion when fetching related collections!
    var orders = await db.Orders
        .Where(o => o.CustomerId == customerId && o.Status == OrderStatus.Completed)
        .ToListAsync(ct);

    var dtos = new List<OrderSummaryDto>();
    foreach (var order in orders)
    {
        // NAIVE N+1: Lazy-loading / separate DB queries per order!
        var customerName = order.Customer.FullName;
        var itemCount = order.Items.Count;
        var total = order.Items.Sum(i => i.Quantity * i.UnitPrice);

        dtos.Add(new OrderSummaryDto(
            order.Id,
            customerName,
            order.CreatedAt,
            itemCount,
            total));
    }

    return dtos;
}`,
    tests: [
      {
        name: "Uses .AsNoTracking() to bypass EF Change Tracker",
        validate: (code) => {
          return /\.AsNoTracking\(\)/.test(code);
        },
        failureMessage: "Include '.AsNoTracking()' to prevent unnecessary change tracker memory overhead."
      },
      {
        name: "Uses direct LINQ projection via .Select()",
        validate: (code) => {
          return /\.Select\s*\(\s*o\s*=>\s*new\s+OrderSummaryDto/.test(code) ||
                 /\.Select\s*\(\s*order\s*=>\s*new\s+OrderSummaryDto/.test(code);
        },
        failureMessage: "Project directly into 'new OrderSummaryDto(...)' using LINQ .Select() before executing the query."
      },
      {
        name: "Eliminates foreach loop and multiple roundtrips",
        validate: (code) => {
          return !/foreach\s*\(\s*(?:var|Order)\s+order\s+in\s+orders\s*\)/.test(code);
        },
        failureMessage: "Remove the foreach loop and let the single SQL query project directly into the DTO list."
      },
      {
        name: "Executes single ToListAsync(ct)",
        validate: (code) => {
          return /\.ToListAsync\s*\(\s*ct\s*\)/.test(code);
        },
        failureMessage: "Materialize the final projected query with 'await ... .ToListAsync(ct);'."
      }
    ],
    hints: [
      "Instead of loading Order entities and looping over their navigation properties in C#, project directly in the database query using '.Select(o => new OrderSummaryDto(...))'.",
      "EF Core translates LINQ aggregates like 'o.Items.Count()' and 'o.Items.Sum(i => i.Quantity * i.UnitPrice)' directly into SQL subqueries / joins in a single database roundtrip."
    ],
    solution: `public async Task<List<OrderSummaryDto>> GetOrderSummariesAsync(
    AppDbContext db, 
    int customerId, 
    CancellationToken ct)
{
    // Senior Pattern: Pure database projection + AsNoTracking
    return await db.Orders
        .AsNoTracking()
        .Where(o => o.CustomerId == customerId && o.Status == OrderStatus.Completed)
        .OrderByDescending(o => o.CreatedAt)
        .Select(o => new OrderSummaryDto(
            o.Id,
            o.Customer.FullName,
            o.CreatedAt,
            o.Items.Count,
            o.Items.Sum(i => i.Quantity * i.UnitPrice)
        ))
        .ToListAsync(ct);
}`,
    explanation: `**Senior Query Optimization Principles**:
1. **Projection Pushdown**: LINQ \`.Select()\` causes the SQL query generator to only output \`SELECT o.Id, c.FullName, o.CreatedAt, (SELECT COUNT(1)...), (SELECT SUM(...))\`. Zero unneeded columns are transferred over TDS.
2. **AsNoTracking()**: Bypasses the EF Core identity map and snapshot dictionary. Reduces memory allocations by 40–60% and execution time by ~35%.
3. **Cartesian Explosion Avoided**: Avoid multiple \`.Include().Include()\` which create duplicate rows across 1:N relations. When loading entity graphs, always consider \`.AsSplitQuery()\` or direct DTO projection.`
  },
  {
    id: "async-deadlock-threadpool",
    title: "3. Resolve Async/Await Deadlock & ThreadPool Starvation",
    pillar: "csharp",
    difficulty: "Senior",
    scenario: `A legacy service method uses \`.Result\` and \`Task.Wait()\` to synchronously wrap asynchronous I/O calls. Under 500 concurrent users, the application freezes: CPU is at 5%, but all requests queue up and HTTP 504 timeouts cascade. 

Diagnosis: **ThreadPool Starvation** and **SynchronizationContext Deadlock** caused by synchronous blocking on async tasks (Sync-over-Async).

Refactor the code into pure non-blocking \`async/await\`, replace \`lock\` with \`SemaphoreSlim\`, and pass the \`CancellationToken\` properly.`,
    initialCode: `public class PaymentGatewayClient
{
    private readonly HttpClient _httpClient;
    // BUG: lock cannot be held across await boundaries!
    private readonly object _syncLock = new object();

    public PaymentGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public PaymentResult ProcessPaymentSync(PaymentRequest request)
    {
        // BUG 1: Sync-over-Async! Blocks thread pool worker thread.
        // Causes deadlock if SynchronizationContext is present.
        return ProcessPaymentAsync(request).Result;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        lock (_syncLock)
        {
            // BUG 2: Calling .Result inside a lock statement!
            var response = _httpClient.PostAsJsonAsync("https://api.payment.com/v1/charge", request)
                .GetAwaiter()
                .GetResult();

            return response.Content.ReadFromJsonAsync<PaymentResult>().Result;
        }
    }
}`,
    tests: [
      {
        name: "Replaces object lock with SemaphoreSlim",
        validate: (code) => {
          return /SemaphoreSlim\s+[\w_]+\s*=\s*new\s+SemaphoreSlim\s*\(\s*1\s*,\s*1\s*\)/.test(code);
        },
        failureMessage: "Replace 'object _syncLock' with 'private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);'."
      },
      {
        name: "Uses await semaphore.WaitAsync(ct) in try/finally",
        validate: (code) => {
          return /await\s+[\w_]+\.WaitAsync\s*\([^\)]*\)/.test(code) &&
                 /finally\s*\{[\s\S]*?[\w_]+\.Release\(\);[\s\S]*?\}/.test(code);
        },
        failureMessage: "Must acquire semaphore with 'await _semaphore.WaitAsync(ct);' and release in a 'finally' block."
      },
      {
        name: "Eliminates all .Result and .GetResult() calls",
        validate: (code) => {
          return !/\.Result\b/.test(code) && !/\.GetResult\(\)/.test(code);
        },
        failureMessage: "Eliminate all '.Result' and '.GetResult()' sync-over-async blockers."
      },
      {
        name: "Awaits HTTP calls asynchronously with CancellationToken",
        validate: (code) => {
          return /await\s+[\w_]+(?:\s*\.\s*|\.)PostAsJsonAsync\s*\(/.test(code);
        },
        failureMessage: "Use 'await _httpClient.PostAsJsonAsync(..., ct);' for asynchronous I/O."
      }
    ],
    hints: [
      "In C#, 'lock' only works for synchronous execution on the same thread. Since an 'await' resumption may execute on a different ThreadPool thread, 'lock' cannot wrap an await. Use 'SemaphoreSlim(1, 1)' instead.",
      "Never block an asynchronous Task with '.Result' or '.GetAwaiter().GetResult()'. Always propagate async/await all the way up the call stack."
    ],
    solution: `public class PaymentGatewayClient
{
    private readonly HttpClient _httpClient;
    // Async-safe mutual exclusion throttle
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public PaymentGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    // Modern async API: Eliminates sync wrapper completely
    public async Task<PaymentResult> ProcessPaymentAsync(
        PaymentRequest request, 
        CancellationToken ct = default)
    {
        // Asynchronously wait for the lock without blocking the thread
        await _semaphore.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var response = await _httpClient
                .PostAsJsonAsync("https://api.payment.com/v1/charge", request, ct)
                .ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            var result = await response.Content
                .ReadFromJsonAsync<PaymentResult>(cancellationToken: ct)
                .ConfigureAwait(false);

            return result ?? throw new InvalidOperationException("Empty response payload");
        }
        finally
        {
            // Guarantee release of semaphore slot
            _semaphore.Release();
        }
    }
}`,
    explanation: `**Senior Deep Dive: Why Sync-Over-Async Kills Production Systems**:
1. **ThreadPool Starvation**: When a request thread blocks on \`.Result\`, the CLR ThreadPool detects an inactive worker and only injects new threads at a slow rate (~1-2 threads/sec). A sudden spike of 200 blocked threads exhausts the pool, halting all health checks and incoming requests.
2. **SemaphoreSlim(1,1)**: Provides asynchronous mutual exclusion. While waiting, the thread is returned to the ThreadPool.
3. **ConfigureAwait(false)**: Bypasses capturing the \`SynchronizationContext\` or \`ExecutionContext\` for library code, saving allocation overhead and context restoration hops.`
  },
  {
    id: "sargable-sql-refactor",
    title: "4. Refactor Non-SARGable Query to High-Performance Index Seek",
    pillar: "sql",
    difficulty: "Senior",
    scenario: `A mission-critical financial report query is pegging SQL Server CPU at 100%. The DBA reports that although an index on \`Orders(CreatedAt)\` and \`Orders(Status)\` exists, the query optimizer performs a **Clustered Index Scan** of 50 million rows instead of an **Index Seek**.

The problem: The query uses functions and type mismatches on the indexed columns (\`YEAR(CreatedAt)\`, \`UPPER(Status)\`, \`ISNULL(Discount, 0)\`), making the predicates **non-SARGable** (Search ARGument ABLE).

Refactor the SQL query to be completely SARGable so the query optimizer uses index seek.`,
    initialCode: `-- SLOW NON-SARGABLE QUERY (Full Table Scan over 50M rows):
SELECT 
    o.OrderId,
    o.CustomerId,
    o.TotalAmount,
    o.CreatedAt
FROM Orders o
WHERE 
    -- BUG 1: Function on indexed column prevents Index Seek!
    YEAR(o.CreatedAt) = 2024
    -- BUG 2: String function prevents Seek!
    AND UPPER(o.Status) = 'SHIPPED'
    -- BUG 3: ISNULL function breaks index usage on nullable column!
    AND ISNULL(o.Discount, 0) > 0.05
ORDER BY o.CreatedAt DESC;`,
    tests: [
      {
        name: "Uses date range boundary condition (o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01')",
        validate: (code) => {
          return /o\.CreatedAt\s*>=\s*['"]2024-01-01['"]/i.test(code) &&
                 /o\.CreatedAt\s*<\s*['"]2025-01-01['"]/i.test(code) &&
                 !/YEAR\s*\(\s*o\.CreatedAt\s*\)/i.test(code);
        },
        failureMessage: "Replace 'YEAR(o.CreatedAt) = 2024' with 'o.CreatedAt >= \\'2024-01-01\\' AND o.CreatedAt < \\'2025-01-01\\' to enable index range seek."
      },
      {
        name: "Removes UPPER() function from Status predicate",
        validate: (code) => {
          return !/UPPER\s*\(\s*o\.Status\s*\)/i.test(code) &&
                 /o\.Status\s*=\s*['"]Shipped['"]/i.test(code);
        },
        failureMessage: "Remove 'UPPER()' from 'o.Status' to allow SQL Server to seek the index directly with the exact casing."
      },
      {
        name: "Replaces ISNULL(o.Discount, 0) > 0.05 with direct comparison",
        validate: (code) => {
          return !/ISNULL\s*\(\s*o\.Discount/i.test(code) &&
                 /o\.Discount\s*>\s*0\.05/i.test(code);
        },
        failureMessage: "Remove 'ISNULL()' - In SQL, if o.Discount is NULL, 'o.Discount > 0.05' evaluates to UNKNOWN (falsy), so 'o.Discount > 0.05' is directly SARGable."
      }
    ],
    hints: [
      "A predicate is SARGable if the column sits alone on one side of the operator without wrapping functions or calculations.",
      "For dates: 'YEAR(Col) = 2024' forces SQL Server to evaluate YEAR() for every single row in the 50 million table. A range condition 'Col >= \\'2024-01-01\\' AND Col < \\'2025-01-01\\'' jumps straight to the B-tree leaf via an index seek!"
    ],
    solution: `-- HIGH-PERFORMANCE SARGABLE REFACTOR:
-- Enables Index Seek + Key Lookup (or Index Seek on covering index)
SELECT 
    o.OrderId,
    o.CustomerId,
    o.TotalAmount,
    o.CreatedAt
FROM Orders o
WHERE 
    -- 1. SARGable half-open date interval enables B-Tree Seek
    o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01'
    -- 2. Direct equality match relies on index collation (no function evaluation)
    AND o.Status = 'Shipped'
    -- 3. SARGable null-safe filter (NULL > 0.05 is UNKNOWN / discarded)
    AND o.Discount > 0.05
ORDER BY o.CreatedAt DESC;`,
    explanation: `**Senior SQL Optimization Mechanics**:
1. **SARGability Rule**: The column must appear bare: \`Column Operator Constant\`. Any scalar expression \`f(Column)\` converts an O(log N) B-Tree Seek into an O(N) Clustered Index Scan.
2. **Half-Open Interval Pattern**: Always write \`col >= '2024-01-01' AND col < '2025-01-01'\` instead of \`BETWEEN\` for \`datetime\` columns to avoid milliseconds rounding edge cases (e.g. \`23:59:59.997\` in SQL Server \`datetime\`).
3. **Covering Index Recommendation**: For maximum performance:
\`CREATE NONCLUSTERED INDEX IX_Orders_CreatedAt_Status ON Orders(CreatedAt, Status) INCLUDE (OrderId, CustomerId, TotalAmount, Discount);\` to eliminate key lookups completely.`
  },
  {
    id: "channel-backpressure",
    title: "5. High-Throughput Producer-Consumer with System.Threading.Channels",
    pillar: "csharp",
    difficulty: "Senior",
    scenario: `An audit logging pipeline uses an unbounded \`ConcurrentQueue<T>\` with a \`Thread.Sleep(10)\` polling loop. During flash sales, the queue grows to 3 million items, consuming 4GB of RAM and leading to GC Gen 2 fragmentation and latency spikes.

Refactor the producer-consumer pipeline using **\`System.Threading.Channels\`** with bounded capacity (\`10,000\` items), backpressure handling (\`BoundedChannelFullMode.Wait\`), and non-blocking asynchronous streaming (\`ReadAllAsync\`).`,
    initialCode: `public class AuditLogPipeline
{
    // BUG 1: Unbounded queue causes OutOfMemoryException under spike!
    private readonly ConcurrentQueue<AuditEntry> _queue = new();
    private bool _isRunning = true;

    public void EnqueueAudit(AuditEntry entry)
    {
        _queue.Enqueue(entry);
    }

    public async Task StartConsumerAsync(CancellationToken ct)
    {
        while (_isRunning && !ct.IsCancellationRequested)
        {
            // BUG 2: Busy-polling loop burns CPU cycles and blocks thread!
            if (_queue.TryDequeue(out var entry))
            {
                await ProcessEntryAsync(entry, ct);
            }
            else
            {
                Thread.Sleep(10); // Thread blocking!
            }
        }
    }

    private async Task ProcessEntryAsync(AuditEntry entry, CancellationToken ct)
    {
        await Task.Delay(5, ct); // Simulated disk/network write
    }
}`,
    tests: [
      {
        name: "Instantiates Bounded Channel with capacity",
        validate: (code) => {
          return /Channel\.CreateBounded\s*<\s*AuditEntry\s*>\s*\(/i.test(code);
        },
        failureMessage: "Use 'Channel.CreateBounded<AuditEntry>(...)' to establish a bounded channel."
      },
      {
        name: "Configures BoundedChannelFullMode.Wait for backpressure",
        validate: (code) => {
          return /BoundedChannelFullMode\.Wait/.test(code);
        },
        failureMessage: "Set 'FullMode = BoundedChannelFullMode.Wait' in BoundedChannelOptions."
      },
      {
        name: "Uses await _channel.Writer.WriteAsync(...) for asynchronous enqueue",
        validate: (code) => {
          return /await\s+[\w_]+\.Writer\.WriteAsync\s*\(/i.test(code);
        },
        failureMessage: "Use 'await _channel.Writer.WriteAsync(entry, ct);' to apply backpressure to producers."
      },
      {
        name: "Consumes with await foreach (... in _channel.Reader.ReadAllAsync())",
        validate: (code) => {
          return /await\s+foreach\s*\(\s*(?:var|AuditEntry)\s+[\w_]+\s+in\s+[\w_]+\.Reader\.ReadAllAsync\s*\(/i.test(code);
        },
        failureMessage: "Consume entries using 'await foreach (var entry in _channel.Reader.ReadAllAsync(ct))'."
      }
    ],
    hints: [
      "System.Threading.Channels is .NET's high-performance lock-free primitive designed specifically for producer-consumer workflows.",
      "Initialize with: Channel.CreateBounded<AuditEntry>(new BoundedChannelOptions(10_000) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true }).",
      "Consume cleanly with: await foreach (var entry in _channel.Reader.ReadAllAsync(ct)) { ... } - this cleanly terminates when Writer.Complete() is called!"
    ],
    solution: `public class AuditLogPipeline
{
    private readonly Channel<AuditEntry> _channel;

    public AuditLogPipeline(int capacity = 10_000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait, // Backpressure: pause producer if buffer is full
            SingleReader = true,                   // Optimization hint for internal ring-buffer
            SingleWriter = false
        };

        _channel = Channel.CreateBounded<AuditEntry>(options);
    }

    public async ValueTask EnqueueAuditAsync(AuditEntry entry, CancellationToken ct = default)
    {
        // Non-blocking asynchronous write with backpressure
        await _channel.Writer.WriteAsync(entry, ct);
    }

    public void Complete()
    {
        _channel.Writer.TryComplete();
    }

    public async Task StartConsumerAsync(CancellationToken ct)
    {
        // Asynchronously stream without thread-blocking or busy-wait polling
        await foreach (var entry in _channel.Reader.ReadAllAsync(ct))
        {
            await ProcessEntryAsync(entry, ct);
        }
    }

    private async Task ProcessEntryAsync(AuditEntry entry, CancellationToken ct)
    {
        await Task.Delay(5, ct); // Simulated async I/O
    }
}`,
    explanation: `**Senior Concurrency Architecture**:
1. **Zero Busy-Waiting**: \`ReadAllAsync()\` uses \`ValueTask\` and asynchronous callbacks when the buffer is empty, keeping the OS thread idle and unallocated until new items arrive.
2. **Backpressure**: When the consumer cannot keep up with the producer (e.g. disk slowdown), \`WriteAsync\` asynchronously pauses the producer instead of filling RAM and crashing the server.
3. **Lock-Free Ring Buffer**: Under the hood, \`Channel<T>\` uses interlocked CAS (Compare-And-Swap) operations and avoids heavy kernel lock synchronization (\`Monitor\` / \`lock\`).`
  }
];
