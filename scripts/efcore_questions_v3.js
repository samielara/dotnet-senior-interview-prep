// ============================================================================
// PILLAR 3: LINQ & ENTITY FRAMEWORK CORE (12 Questions)
// Sourced directly from User's Layer 2 PDF Guide and real-world EF Core interview standards
// ============================================================================

const efcoreQuestions = [
  {
    title: "What is the difference between IEnumerable and IQueryable in LINQ?",
    seniority: "Mid-to-Senior",
    tags: ["LINQ", "IEnumerable", "IQueryable", "Expression Trees", "SQL Translation"],
    pitch: "IEnumerable represents in-memory iteration using compiled delegates (Func<T, bool>) where filtering executes on the client machine in CLR memory. IQueryable represents an out-of-process query using Expression Trees (Expression<Func<T, bool>>) that a provider like Entity Framework translates into native SQL for database-side execution. Calling .ToList() too early moves expensive filtering and sorting into application memory.",
    analogy: "IQueryable gives the librarian a precise request so they fetch only the 3 books you need; IEnumerable brings every single book in the library to your desk and forces you to search through them yourself.",
    deepDive: `Under the Hood Differences:
1. Method Signatures:
   - Enumerable.Where takes Func<TSource, bool> (compiled IL bytecode).
   - Queryable.Where takes Expression<Func<TSource, bool>> (data structure representing code).
2. The Fatal Performance Trap:
   - If an EF Core query is cast to IEnumerable before filtering:
     IEnumerable<Order> orders = db.Orders; // Still IQueryable under hood
     var top = orders.Where(o => o.Total > 500).Take(10);
   - Because Where is invoked on IEnumerable, EF Core generates: SELECT * FROM Orders;
   - All 5,000,000 rows are transferred across the network to client RAM, where the CLR filters in-memory!
   - On IQueryable, it generates: SELECT TOP (10) * FROM Orders WHERE Total > 500;`,
    codeSnippet: `// ❌ JUNIOR MISTAKE: Pulls all 2,000,000 orders into RAM before filtering!
public List<OrderDto> BadGetRecentOrders(AppDbContext db)
{
    IEnumerable<Order> query = db.Orders; // Cast to IEnumerable!
    return query
        .Where(o => o.Status == "Completed") // Filters in C# RAM, NOT in SQL!
        .Take(20)
        .Select(o => new OrderDto(o.Id, o.Total))
        .ToList();
}

// ✅ SENIOR PATTERN: Evaluates WHERE and TOP on SQL Server
public async Task<List<OrderDto>> GoodGetRecentOrdersAsync(AppDbContext db, CancellationToken ct)
{
    IQueryable<Order> query = db.Orders.AsNoTracking(); // Retains IQueryable
    return await query
        .Where(o => o.Status == "Completed") // SQL: WHERE [o].[Status] = N'Completed'
        .Take(20)                            // SQL: TOP (20)
        .Select(o => new OrderDto(o.Id, o.Total))
        .ToListAsync(ct);
}`,
    redFlags: [
      "Calling '.ToList()' or '.AsEnumerable()' before applying WHERE filters, pagination, or projections.",
      "Thinking IEnumerable and IQueryable execute in the exact same location.",
      "Writing business methods that return IEnumerable<T> from a repository while still constructing SQL."
    ],
    proTips: [
      "Keep query specifications as IQueryable<T> inside Repository layers only while building clauses; materialize to Task<List<TDto>> before returning to API controllers to prevent leaky abstraction bugs."
    ]
  },
  {
    title: "When do you use AsNoTracking in Entity Framework Core?",
    seniority: "Mid-to-Senior",
    tags: ["EF Core", "AsNoTracking", "Change Tracker", "Performance", "Read-Only Queries"],
    pitch: "Use AsNoTracking for read-only queries when you do not intend to modify, update, or delete the returned entities in the current DbContext. Bypassing the Change Tracker eliminates snapshot creation, identity map registration, and memory retention, providing a 40–60% performance and memory gain on large datasets.",
    analogy: "When reading a library book's title, you do not need a clipboard tracking every single page you touched.",
    deepDive: `Internal Change Tracker Mechanics:
1. Tracked Query Cost:
   - When EF Core queries tracked entities, it creates a snapshot copy of every property value in the DbContext's StateManager.
   - When SaveChanges() is called, EF Core compares the current entity values against the snapshot copies (DetectChanges).
2. AsNoTracking Benefits:
   - Completely bypasses snapshot creation and StateManager registration.
   - Garbage collector reclaims entity memory immediately after the request completes.
3. AsNoTrackingWithIdentityResolution (.NET 5+):
   - Bypasses tracking but retains the identity map, ensuring duplicate parent rows in JOINs share the same C# object reference.`,
    codeSnippet: `// ❌ WASTE OF MEMORY: Tracking 5,000 read-only report rows
public async Task<List<ProductReportDto>> BadGetReportAsync(AppDbContext db, CancellationToken ct)
{
    // Allocates snapshots in ChangeTracker for all 5,000 objects!
    return await db.Products
        .Select(p => new ProductReportDto(p.Id, p.Name, p.Price))
        .ToListAsync(ct);
}

// ✅ SENIOR PATTERN: Bypasses Change Tracker completely
public async Task<List<ProductReportDto>> GoodGetReportAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Products
        .AsNoTracking() // 40-60% faster, zero tracker memory
        .Select(p => new ProductReportDto(p.Id, p.Name, p.Price))
        .ToListAsync(ct);
}`,
    redFlags: [
      "Using AsNoTracking on entities that you subsequently modify and expect db.SaveChangesAsync() to persist (changes will be ignored!).",
      "Believing projection queries (.Select()) require explicit tracking when DTOs are already non-tracked by default.",
      "Leaving change tracking enabled for high-throughput public read APIs."
    ],
    proTips: [
      "Configure 'UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)' globally on DbContext in read-heavy applications, and explicitly call '.AsTracking()' only on update paths."
    ]
  },
  {
    title: "How do you avoid the N+1 query problem in Entity Framework Core?",
    seniority: "Mid-to-Senior",
    tags: ["EF Core", "N+1 Problem", "Projection", "Include", "AsSplitQuery"],
    pitch: "The N+1 problem occurs when an application executes 1 initial query to fetch parent rows, followed by N separate SQL queries inside a loop to fetch child rows for each parent. Avoid it by inspecting generated SQL and using direct DTO projection (.Select()), deliberate eager loading (.Include()), or purpose-built join queries instead of lazy loading navigations.",
    analogy: "Do not visit the grocery store once for each ingredient; make one complete shopping list and execute one planned trip.",
    deepDive: `Eager Loading vs Projection:
1. The Lazy Loading Trap:
   - Accessing 'customer.Orders' inside a foreach loop generates 1 query for customers + 100 individual queries for each customer's orders (101 round trips!).
2. Eager Loading (.Include):
   - Fetches parents and children in a single query via SQL JOINs.
   - ⚠️ Hazard: Multiple .Include() calls create Cartesian multiplication (10 orders * 5 items = 50 rows per customer).
3. The Ultimate Senior Fix: DTO Projection:
   - Using '.Select(c => new CustomerDto { Orders = c.Orders.Select(...) })' generates the exact optimal SQL, selects only required columns, and eliminates both N+1 and Cartesian explosion.`,
    codeSnippet: `// ❌ N+1 PROBLEM: Generates 1 query for customers + 100 queries for orders!
public async Task BadProcessCustomers(AppDbContext db)
{
    var customers = await db.Customers.ToListAsync(); // 1 query
    foreach (var c in customers)
    {
        var orderCount = c.Orders.Count; // Fires 1 new SQL query per customer!
    }
}

// ✅ SENIOR PATTERN: Single SQL query with direct DTO projection
public async Task<List<CustomerSummaryDto>> GoodGetCustomersAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Customers
        .AsNoTracking()
        .Select(c => new CustomerSummaryDto
        {
            CustomerId = c.Id,
            CustomerName = c.Name,
            OrderCount = c.Orders.Count // Translated to SQL COUNT(*) in 1 query!
        })
        .ToListAsync(ct);
}`,
    redFlags: [
      "Enabling Lazy Loading proxies in production ASP.NET Core APIs without monitoring SQL round trips.",
      "Solving every N+1 query by chaining 6 .Include() calls, causing massive Cartesian data duplication.",
      "Not inspecting EF Core SQL output using tools like EF Core logging, MiniProfiler, or SQL Server Profiler."
    ],
    proTips: [
      "Always prefer direct LINQ projection (.Select()) over .Include(): projection only pulls requested columns, bypassing the change tracker and generating optimal SQL subqueries."
    ]
  },
  {
    title: "What is the correct lifetime and usage of DbContext in ASP.NET Core?",
    seniority: "Mid-to-Senior",
    tags: ["DbContext", "Scoped Lifetime", "Thread Safety", "Unit of Work", "Captive Dependency"],
    pitch: "DbContext represents a short-lived Unit of Work and Identity Map that should typically be registered with a Scoped lifetime (one instance per HTTP request). DbContext is NOT thread-safe: it must never be shared across concurrent asynchronous operations, stored in static fields, or injected directly into a Singleton service.",
    analogy: "A DbContext is one student's assignment folder for one class period, not a school-wide cabinet edited by 500 students at the same moment.",
    deepDive: `Thread Safety & Scope Mechanics:
1. Thread Safety Invariant:
   - Any attempt to execute concurrent operations on the same DbContext instance (e.g. Task.WhenAll running two queries on the same context) throws 'InvalidOperationException: A second operation was started on this context instance before a previous operation completed'.
2. Scoped Cleanup:
   - When the HTTP request pipeline terminates, the DI container automatically calls Dispose() on the DbContext, closing the database connection and freeing tracked memory.
3. Background Worker Usage:
   - In Singleton workers (IHostedService), inject 'IServiceScopeFactory' and create an explicit 'using var scope = _scopeFactory.CreateScope()' to resolve a short-lived DbContext per iteration.`,
    codeSnippet: `// ❌ CONCURRENCY CRASH: Parallel queries on same DbContext instance
public async Task BadParallelQuery(AppDbContext db)
{
    var task1 = db.Customers.ToListAsync();
    var task2 = db.Orders.ToListAsync();
    await Task.WhenAll(task1, task2); // 💥 CRASH: Concurrent access on same DbContext!
}

// ✅ SENIOR PATTERN: Sequential awaits OR separate pooled contexts
public async Task GoodQuery(AppDbContext db, CancellationToken ct)
{
    var customers = await db.Customers.AsNoTracking().ToListAsync(ct);
    var orders = await db.Orders.AsNoTracking().ToListAsync(ct); // Safe sequential execution
}

// ✅ Resolving DbContext safely in Background Workers
public class ReportWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    public ReportWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Safe scoped work...
    }
}`,
    redFlags: [
      "Running Task.WhenAll with multiple LINQ queries on the exact same DbContext instance.",
      "Injecting AppDbContext directly into a Singleton service.",
      "Keeping a DbContext alive for hours in a desktop or background application without clearing the Change Tracker."
    ],
    proTips: [
      "Use 'AddDbContextPool<AppDbContext>' in high-throughput APIs: it pools reusable DbContext instances, reducing the memory allocation cost of instantiating contexts on every HTTP request."
    ]
  },
  {
    title: "When do you use a database transaction, and how do you implement it in EF Core?",
    seniority: "Mid-to-Senior",
    tags: ["Transactions", "ACID", "Atomic", "BeginTransactionAsync", "Rollback"],
    pitch: "Use an explicit database transaction when multiple database operations across one or more SaveChanges() calls or raw SQL commands must succeed or fail together as a single atomic unit. Keep the transaction as short as practical, choose an appropriate isolation level, and avoid slow external HTTP or filesystem calls while database locks are held.",
    analogy: "Buying a plane ticket and assigning its seat must happen together: you should not pay for the ticket and then discover the seat was given away.",
    deepDive: `Default vs Explicit Transactions:
1. SaveChanges() Default Behavior:
   - By default, a single call to 'context.SaveChangesAsync()' automatically wraps all tracked inserts, updates, and deletes inside an atomic transaction.
2. When to Use Explicit Transactions:
   - When an operation requires multiple SaveChanges() calls (e.g., generating an invoice number, then creating dependent ledger items).
   - When coordinating EF Core operations with raw ADO.NET / Dapper commands on the same connection.
3. The Golden Rule of Database Locks:
   - NEVER make an external HTTP call or send an email inside an open database transaction! Network timeouts will hold table locks, creating severe blocking and deadlocks.`,
    codeSnippet: `public async Task TransferFundsAsync(Guid fromAccountId, Guid toAccountId, decimal amount, CancellationToken ct)
{
    // ✅ EXPLICIT TRANSACTION: Ensures both balance updates succeed or fail atomically
    await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
    try
    {
        var fromAccount = await _db.Accounts.FindAsync(new object[] { fromAccountId }, ct);
        var toAccount = await _db.Accounts.FindAsync(new object[] { toAccountId }, ct);

        fromAccount.Debit(amount);
        toAccount.Credit(amount);

        await _db.SaveChangesAsync(ct);

        // Commit transaction after all operations succeed
        await transaction.CommitAsync(ct);
    }
    catch
    {
        // Automatically rolled back on dispose if not committed
        await transaction.RollbackAsync(ct);
        throw;
    }
}`,
    redFlags: [
      "Making external HTTP requests or third-party payment calls inside an open SQL transaction block.",
      "Starting an explicit transaction for a single SaveChangesAsync() call (EF Core already does this automatically).",
      "Holding transactions open across user think-time or UI prompts."
    ],
    proTips: [
      "In modern C#, 'await using var tx = await db.Database.BeginTransactionAsync(ct);' guarantees an automatic rollback upon disposal if CommitAsync was not reached due to an exception."
    ]
  },
  {
    title: "How do you handle concurrent updates in EF Core? (Optimistic vs. Pessimistic Concurrency)",
    seniority: "Mid-to-Senior",
    tags: ["Concurrency", "Optimistic Concurrency", "RowVersion", "DbUpdateConcurrencyException", "Pessimistic Locks"],
    pitch: "Choose the concurrency control based on conflict frequency: Optimistic Concurrency works best when collisions are rare, using a SQL Server RowVersion / byte[] column to detect if another session changed the row before committing. If changed, EF Core throws DbUpdateConcurrencyException. Pessimistic Concurrency uses database locks (e.g. sp_getapplock or UPDLOCK) when collisions are frequent or for critical workflow operations where retries are unacceptable.",
    analogy: "Optimistic concurrency is checking whether the shared document changed before clicking save; a workflow lock is the physical key to a shared equipment room that only one person can hold at a time.",
    deepDive: `Optimistic Concurrency Under the Hood:
1. RowVersion / Timestamp:
   - In SQL Server, 'ROWVERSION' is an 8-byte auto-incrementing binary counter that changes automatically on every row UPDATE.
2. The Generated SQL:
   - 'UPDATE Accounts SET Balance = @b WHERE Id = @id AND RowVersion = @originalRowVersion;'
   - If another transaction committed first, the RowVersion no longer matches, resulting in 0 rows affected.
3. Catching Concurrency Conflicts:
   - EF Core checks rows affected: if 0, it throws 'DbUpdateConcurrencyException'.
   - The application can catch the exception, reload 'entry.GetDatabaseValuesAsync()', and resolve the conflict.`,
    codeSnippet: `public class BankAccount
{
    public Guid Id { get; set; }
    public decimal Balance { get; set; }

    [Timestamp] // Concurrency token
    public byte[] RowVersion { get; set; } = default!;
}

// Resolving concurrency conflicts gracefully
public async Task<bool> UpdateBalanceAsync(Guid accountId, decimal amount, CancellationToken ct)
{
    var account = await _db.Accounts.FindAsync(new object[] { accountId }, ct);
    account.Balance += amount;

    try
    {
        await _db.SaveChangesAsync(ct);
        return true;
    }
    catch (DbUpdateConcurrencyException ex)
    {
        var entry = ex.Entries.Single();
        var databaseValues = await entry.GetDatabaseValuesAsync(ct);
        if (databaseValues == null)
        {
            throw new InvalidOperationException("Account was deleted by another user.");
        }

        // Senior conflict resolution: Reload database values and retry
        entry.OriginalValues.SetValues(databaseValues);
        return false; // Signal conflict to caller for retry
    }
}`,
    redFlags: [
      "Assuming that C# 'lock' statements protect database updates across multiple load-balanced web servers.",
      "Overwriting concurrent database changes blindly with Last-Write-Wins without auditing or detection.",
      "Promising zero deadlocks when implementing high-volume concurrent updates."
    ],
    proTips: [
      "For financial workflows or state transitions where retries are dangerous, combine optimistic RowVersion checks with SQL Server application locks ('sp_getapplock') to serialize critical execution paths."
    ]
  },
  {
    title: "EF Core Split Queries (.AsSplitQuery): Mitigating Cartesian Product Explosions",
    seniority: "Senior",
    tags: ["EF Core", "Split Queries", "AsSplitQuery", "Cartesian Explosion", "Performance"],
    pitch: "When eagerly loading multiple 1:N child collections in a single LINQ query via .Include(), SQL Server creates a Cartesian product JOIN that duplicates parent columns for every child combination. .AsSplitQuery() splits the operation into multiple distinct SQL queries (one for the parent table, one for each child collection), drastically reducing transferred data volume and database memory grants.",
    analogy: "If a student has 10 classes and 5 clubs, sending one spreadsheet pairing every class with every club creates 50 redundant rows; sending one class list and one club list sends only 15 rows.",
    deepDive: `Cartesian Explosion Mathematics:
1. The Problem:
   - 1 Order with 10 OrderItems and 5 OrderShipments.
   - A single SQL query with JOINs returns: 1 * 10 * 5 = 50 rows, duplicating customer address and order details 50 times across the network!
2. How .AsSplitQuery() Resolves It:
   - Query 1: SELECT * FROM Orders WHERE Id = @id;
   - Query 2: SELECT * FROM OrderItems WHERE OrderId = @id;
   - Query 3: SELECT * FROM OrderShipments WHERE OrderId = @id;
   - Total rows returned: 1 + 10 + 5 = 16 rows!
3. The Trade-Off:
   - Split queries execute multiple network round-trips. If not wrapped in a transaction, concurrent updates between queries can produce inconsistent reads.`,
    codeSnippet: `public async Task<Order?> GetOrderWithFullGraphAsync(AppDbContext db, Guid orderId, CancellationToken ct)
{
    return await db.Orders
        .AsNoTracking()
        // ✅ SENIOR PATTERN: Splits multiple collection joins into separate SELECT queries
        .AsSplitQuery()
        .Include(o => o.Items)
            .ThenInclude(i => i.Product)
        .Include(o => o.Shipments)
        .Include(o => o.Discounts)
        .FirstOrDefaultAsync(o => o.Id == orderId, ct);
}`,
    redFlags: [
      "Including 3 or more child collections in a single LINQ query without using .AsSplitQuery().",
      "Using split queries blindly on single-table queries where no collections are included.",
      "Ignoring the EF Core compiler warning 'Compiling a query which loads related collections for more than one collection navigation'."
    ],
    proTips: [
      "Configure 'UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)' globally in Program.cs for applications that frequently load multi-collection aggregates."
    ]
  },
  {
    title: "First vs. FirstOrDefault vs. Single vs. SingleOrDefault: SQL Generation (TOP 1 vs TOP 2)",
    seniority: "Mid-to-Senior",
    tags: ["First", "FirstOrDefault", "Single", "SingleOrDefault", "TOP 1 vs TOP 2"],
    pitch: "First and FirstOrDefault generate 'SELECT TOP (1)' in SQL Server, stopping index traversal immediately on the first match. Single and SingleOrDefault generate 'SELECT TOP (2)' because SQL Server must verify that a second matching row does NOT exist to guarantee uniqueness. If more than one row matches, Single throws InvalidOperationException.",
    analogy: "FirstOrDefault is finding the first student wearing a red shirt and stopping; SingleOrDefault checks the entire classroom to make sure NO OTHER student is wearing a red shirt.",
    deepDive: `Under the Hood Differences:
1. SQL Generation:
   - 'FirstOrDefaultAsync' -> SELECT TOP (1) ... (Terminates scan at first row).
   - 'SingleOrDefaultAsync' -> SELECT TOP (2) ... (Forces query engine to scan until finding a second row or reaching the end of the table).
2. Exception Behavior:
   - First(): Throws if sequence is EMPTY.
   - FirstOrDefault(): Returns default/null if sequence is EMPTY.
   - Single(): Throws if EMPTY, and throws if > 1 match exists.
   - SingleOrDefault(): Returns default/null if EMPTY, but throws if > 1 match exists!`,
    codeSnippet: `// ❌ PERFORMANCE PENALTY: Scans for TOP (2) on non-unique indexed column
public async Task<User?> BadGetUserByEmail(AppDbContext db, string email, CancellationToken ct)
{
    // If Email has no unique index, SQL scans until it finds 2 rows or scans the entire table!
    return await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
}

// ✅ OPTIMAL: Stops immediately at first row
public async Task<User?> GoodGetUserByEmail(AppDbContext db, string email, CancellationToken ct)
{
    return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, ct);
}`,
    redFlags: [
      "Using SingleOrDefault on large, non-unique tables when business logic only requires FirstOrDefault.",
      "Calling First() on an empty list without handling InvalidOperationException.",
      "Not knowing that Single generates 'TOP (2)' in SQL."
    ],
    proTips: [
      "In .NET 6+, use 'FirstOrDefault(predicate, defaultValue)' to specify an explicit non-null fallback object instead of checking for null after execution."
    ]
  },
  {
    title: "Eager Loading vs. Explicit Loading vs. Lazy Loading in EF Core",
    seniority: "Mid-to-Senior",
    tags: ["Eager Loading", "Explicit Loading", "Lazy Loading", "Navigation Properties"],
    pitch: "Eager loading (.Include()) loads related entities upfront in the initial query via SQL JOINs. Explicit loading (entry.Collection().LoadAsync()) loads navigations on-demand for an entity that is already tracked. Lazy loading automatically loads related data when a virtual navigation property is accessed, which introduces hidden N+1 query storms and circular JSON serialization crashes.",
    analogy: "Eager loading is packing all travel luggage into the car before leaving; Explicit loading is stopping at a store to buy an item only if needed; Lazy loading is driving back home every time you realize you forgot a toothbrush.",
    deepDive: `Comparison & Hazards:
1. Eager Loading (.Include):
   - Best for APIs returning composite parent-child DTOs.
2. Explicit Loading (db.Entry(order).Collection(...).LoadAsync()):
   - Ideal for conditional branches: only fetch items if business validation passes.
3. Lazy Loading Hazards:
   - Requires marking properties 'virtual' and installing Microsoft.EntityFrameworkCore.Proxies.
   - Accessing 'user.Orders' in a loop executes N hidden SQL queries.
   - Passing lazy-loaded entities into System.Text.Json causes infinite recursive loops and stack overflow crashes.`,
    codeSnippet: `public class LoadingDemo
{
    // 1. Eager Loading (Best Practice)
    public async Task<Order?> EagerLoadAsync(AppDbContext db, Guid id, CancellationToken ct)
    {
        return await db.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    // 2. Explicit Loading (Conditional)
    public async Task ExplicitLoadAsync(AppDbContext db, Order order, CancellationToken ct)
    {
        if (order.Total > 1000)
        {
            // Only loads discounts when condition is met
            await db.Entry(order).Collection(o => o.Discounts).LoadAsync(ct);
        }
    }
}`,
    redFlags: [
      "Enabling Lazy Loading proxies in production Web APIs without knowing how to prevent N+1 queries.",
      "Returning untracked lazy-loading proxy entities directly to JSON serializers.",
      "Using multiple .Include() calls without testing for Cartesian explosion."
    ],
    proTips: [
      "In high-performance REST APIs, prefer direct DTO projection (.Select()) over .Include(): EF Core will only query the exact columns requested and completely bypass entity tracking overhead."
    ]
  },
  {
    title: "Code-First vs. Database-First: Scaffolding, Migrations, and Team Schema Governance",
    seniority: "Mid-to-Senior",
    tags: ["Code-First", "Database-First", "Migrations", "Scaffold", "Schema Governance"],
    pitch: "Code-First defines database models using C# classes and Fluent API configurations, automating incremental schema evolution via 'dotnet ef migrations add'. Database-First begins with an existing relational database and generates C# entities using 'dotnet ef dbcontext scaffold'. For enterprise production deployments, never run Database.Migrate() at application startup; use idempotent SQL migration bundles in CI/CD pipelines.",
    analogy: "Code-First is architecting a house from modern architectural software blueprints; Database-First is scanning an existing building to produce architectural drawings.",
    deepDive: `Production Governance Best Practices:
1. The Startup Migration Race Condition:
   - Calling 'context.Database.Migrate()' inside Program.cs causes race conditions, table locks, and crashes when multiple Kubernetes pods or App Service instances boot simultaneously.
2. Idempotent Migration Scripts:
   - Generate idempotent SQL scripts in CI/CD pipelines:
     'dotnet ef migrations script --idempotent --output migrate.sql'
   - Allows database administrators (DBAs) to review DDL changes before execution.
3. Migration Bundles (.NET 6+):
   - Generates a standalone, lightweight executable containing only the migrations:
     'dotnet ef migrations bundle'`,
    codeSnippet: `// Fluent API Best Practice: Implement IEntityTypeConfiguration<T>
public class OrderConfig : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders", "sales");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(32)
            .IsUnicode(false); // VARCHAR(32) instead of NVARCHAR(32)

        builder.Property(o => o.RowVersion)
            .IsRowVersion();

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();
    }
}

// Program.cs: Auto-apply all configurations in assembly
// modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`,
    redFlags: [
      "Running 'context.Database.EnsureCreated()' in a production environment (bypasses migration history and cannot evolve schema).",
      "Executing Database.Migrate() in application startup across multi-instance cloud deployments.",
      "Modifying an already-applied migration snapshot file after it has been deployed to production."
    ],
    proTips: [
      "Use 'dotnet ef migrations bundle' in Docker-based CI/CD pipelines: it creates a self-contained executable that applies migrations without requiring the full .NET SDK to be installed on the deployment agent."
    ]
  },
  {
    title: "LINQ Deferred Execution vs. Immediate Execution and the Multiple Enumeration Bug",
    seniority: "Mid-to-Senior",
    tags: ["LINQ", "Deferred Execution", "Multiple Enumeration", "Re-evaluation", "Yield"],
    pitch: "LINQ query definitions (Where, Select, Skip, Take) use deferred execution: defining the query does not execute it or allocate collection memory. Execution occurs only when the sequence is enumerated (via foreach, .ToList(), .Count(), etc.). However, iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database round-trip or calculation) to re-execute every single time.",
    analogy: "A recipe is deferred execution: writing the recipe does not bake the cake; following the instructions bakes the cake. If you bake the cake every time someone asks if you have one, you waste hours.",
    deepDive: `The Multiple Enumeration Hazard:
1. Iterators & Yield:
   - Operators like Where and Select return custom enumerator structs implementing IEnumerator<T>.
   - Code executes one item at a time upon MoveNext().
2. The Bug in Action:
   public void Process(IEnumerable<User> users)
   {
       if (users.Any()) // Enumeration 1: Runs SQL query or generator
       {
           foreach (var u in users) // Enumeration 2: Re-runs the entire SQL query!
           { ... }
       }
   }
3. The Fix:
   - If a sequence will be enumerated multiple times, materialize it upfront using '.ToList()' or '.ToArray()'.`,
    codeSnippet: `// ❌ MULTIPLE ENUMERATION BUG: Executes database query twice!
public async Task BadProcessOrdersAsync(IQueryable<Order> ordersQuery)
{
    // Enumeration 1: Executes SQL query to check existence
    if (await ordersQuery.AnyAsync())
    {
        // Enumeration 2: Re-executes the entire SQL query from scratch!
        var orders = await ordersQuery.ToListAsync();
        SendNotifications(orders);
    }
}

// ✅ SENIOR PATTERN: Materializes once into memory
public async Task GoodProcessOrdersAsync(IQueryable<Order> ordersQuery, CancellationToken ct)
{
    // Executes SQL once and materializes into memory list
    var orders = await ordersQuery.AsNoTracking().ToListAsync(ct);

    if (orders.Count > 0)
    {
        SendNotifications(orders); // Iterates in-memory list with zero SQL overhead
    }
}`,
    redFlags: [
      "Iterating an IEnumerable parameter multiple times without knowing whether it is a deferred generator or database query.",
      "Calling '.ToList()' inside a loop on a deferred LINQ query.",
      "Ignoring JetBrains / Roslyn analyzer warning 'Possible multiple enumeration of IEnumerable'."
    ],
    proTips: [
      "In API contracts, if a method returns an already-materialized collection, specify 'IReadOnlyList<T>' or 'List<T>' as the return type instead of 'IEnumerable<T>' to communicate that the sequence is safe to enumerate repeatedly."
    ]
  },
  {
    title: "LINQ Any() vs. Count() > 0: Short-Circuiting vs. Full Table Scans",
    seniority: "Mid-to-Senior",
    tags: ["Any()", "Count()", "Short-Circuiting", "SQL Execution Plan", "Performance"],
    pitch: "To check for the presence of elements, .Any() is asymptotically superior because it short-circuits on the very first match: in-memory, it calls MoveNext() once and returns true immediately. In EF Core, it compiles to 'IF EXISTS (SELECT 1 FROM ...)', terminating index traversal at row 1. In contrast, .Count() > 0 forces an eager evaluation of the entire sequence: in SQL, it generates 'SELECT COUNT(*)', reading all matching pages.",
    analogy: "Any() is checking if a restaurant has an open table and taking the first one you see; Count() > 0 is counting every empty chair in the entire building before deciding to sit down.",
    deepDive: `Under the Hood Execution:
1. In-Memory:
   - '.Any()': O(1) best case. Stops at element 0 if matching.
   - '.Count() > 0': O(N) guaranteed. Must count all items in collection.
2. EF Core SQL Translation:
   - 'db.Orders.Any(o => o.Status == "Pending")' ->
     SELECT CASE WHEN EXISTS (SELECT 1 FROM [Orders] WHERE [Status] = 'Pending') THEN 1 ELSE 0 END.
   - 'db.Orders.Count(o => o.Status == "Pending") > 0' ->
     SELECT COUNT(*) FROM [Orders] WHERE [Status] = 'Pending' (reads entire index or table!).
3. List<T>.Exists Optimization:
   - On in-memory List<T>, '.Exists(predicate)' is slightly faster than '.Any()' because it avoids allocating an enumerator object on the heap.`,
    codeSnippet: `// ❌ SLOW: Scans all 1,000,000 records to count total
public async Task<bool> BadHasOrdersAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Orders.CountAsync(o => o.Status == "Pending", ct) > 0;
}

// ✅ FAST: Generates IF EXISTS (SELECT 1 ...), stops immediately at row 1
public async Task<bool> GoodHasOrdersAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Orders.AnyAsync(o => o.Status == "Pending", ct);
}`,
    redFlags: [
      "Using '.Count() > 0' or '.Count() != 0' to check if a collection or query has items.",
      "Calling '.ToList()' before calling '.Any()' on an IQueryable.",
      "Assuming SQL Server always rewrites COUNT(*) > 0 into an EXISTS."
    ],
    proTips: [
      "For in-memory List<T>, use 'list.Exists(match)' instead of 'list.Any(match)': Exists is an optimized struct-based internal loop that does not allocate an enumerator instance on the heap."
    ]
  }
];

console.log('Total EF Core & LINQ questions:', efcoreQuestions.length);

module.exports = { efcoreQuestions };
