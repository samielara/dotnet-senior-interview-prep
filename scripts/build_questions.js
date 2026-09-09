const fs = require('fs');

// Load current questions
global.window = {};
eval(fs.readFileSync('js/data/questions.js', 'utf8'));
const current = window.INTERVIEW_QUESTIONS;

// Map questions to the 7 modules
const newQuestions = [];

current.forEach(q => {
  let moduleName = q.pillar;
  // Map frontend -> ui
  if (moduleName === 'frontend') {
    moduleName = 'ui';
  }

  // Check if it's an EF Core question currently under sql
  if (q.id === 'q-sql-5' || q.id === 'q-sql-7' || q.id === 'q-sql-8' || q.id === 'q-sql-9' || q.id === 'q-sql-11') {
    moduleName = 'efcore';
  }
  // Check if it's a LINQ question currently under sql
  else if (q.id === 'q-sql-6') {
    moduleName = 'linq';
  }

  newQuestions.push({
    ...q,
    pillar: moduleName
  });
});

// Add extra high-yield LINQ questions
const linqQuestions = [
  {
    id: "q-linq-1",
    pillar: "linq",
    seniority: "Senior",
    tags: ["IEnumerable", "IQueryable", "Expression Trees", "Deferred Execution"],
    title: "IEnumerable<T> vs. IQueryable<T>: In-Memory Client Filtering vs SQL Expression Trees",
    pitch: "IEnumerable<T> operates in-memory on in-process collections using compiled delegates (Func<T, bool>). Every filtering operation evaluates in the CLR on the client machine. IQueryable<T> inherits from IEnumerable but evaluates out-of-process against an external data source (like SQL Server) using Expression Trees (Expression<Func<T, bool>>). The query provider parses the expression tree and translates it into native SQL, executing filtering directly on the database engine.",
    deepDive: `Under the Hood Differences:
1. Method Signatures:
   - Enumerable.Where takes Func<TSource, bool> (compiled C# IL delegate).
   - Queryable.Where takes Expression<Func<TSource, bool>> (data structure representing code).
2. The Fatal Performance Anti-Pattern:
   - If an EF Core query is cast to IEnumerable<T> before applying Where or Take:
     IEnumerable<Order> orders = dbContext.Orders; // Still IQueryable
     var filtered = orders.Where(o => o.Status == "Completed").Take(10);
   - Because Where() is invoked on IEnumerable, EF Core issues: SELECT * FROM Orders;
   - All 5,000,000 order rows are transferred across the network to client RAM, where the CLR filters in-memory!
   - Invoking Where() on IQueryable compiles to: SELECT TOP (10) * FROM Orders WHERE Status = 'Completed';
3. When to use each:
   - Use IQueryable while building the database query pipeline (paging, filtering, sorting, projection).
   - Use IEnumerable once data has been materialized (.ToList(), .AsEnumerable()) for C# domain computations that SQL cannot express.`,
    codeSnippet: `// ❌ JUNIOR MISTAKE: Pulls all 5 million rows into memory!
public List<OrderDto> BadGetOrders(AppDbContext db)
{
    IEnumerable<Order> query = db.Orders; // Casts to IEnumerable!
    return query
        .Where(o => o.Total > 500)       // Executes in C# memory, NOT in SQL!
        .Take(20)
        .Select(o => new OrderDto(o.Id, o.Total))
        .ToList();
}

// ✅ SENIOR PATTERN: Generates optimal SQL with WHERE and TOP
public async Task<List<OrderDto>> GoodGetOrdersAsync(AppDbContext db, CancellationToken ct)
{
    IQueryable<Order> query = db.Orders.AsNoTracking();
    return await query
        .Where(o => o.Total > 500)       // Translated to SQL: WHERE Total > 500
        .Take(20)                        // Translated to SQL: TOP (20)
        .Select(o => new OrderDto(o.Id, o.Total))
        .ToListAsync(ct);
}`,
    redFlags: [
      "Calling '.ToList()' or '.AsEnumerable()' early in an EF query pipeline before applying filters or pagination.",
      "Stating that IQueryable and IEnumerable execute the same way."
    ],
    proTips: [
      "Keep method return types as IQueryable<T> inside Repository/Query specifications only if you want callers to append further SQL clauses; otherwise, return Task<List<TDto>> to prevent leaky query logic."
    ]
  },
  {
    id: "q-linq-2",
    pillar: "linq",
    seniority: "Senior",
    tags: ["Deferred Execution", "Multiple Enumeration", "Re-evaluation", "Yield"],
    title: "LINQ Deferred Execution vs. Immediate Execution: The Multiple Enumeration Bug",
    pitch: "LINQ queries use deferred execution by default: defining a query does not execute it or allocate collection memory; execution occurs only when the sequence is iterated (via foreach, .ToList(), .Count(), etc.). However, this introduces the critical 'Multiple Enumeration' performance bug: iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database roundtrip or calculation) to re-execute every single time.",
    deepDive: `Core Mechanics of Deferred Execution:
1. Iterators & Yield:
   - Operators like Where, Select, and Skip return custom iterator structs/classes implementing IEnumerator<T>.
   - Code executes on each call to MoveNext().
2. The Multiple Enumeration Hazard:
   public void Process(IEnumerable<User> users)
   {
       if (users.Any()) // Enumeration 1: Runs SQL query or generator
       {
           int count = users.Count(); // Enumeration 2: Re-runs entire query!
           foreach (var u in users) { ... } // Enumeration 3: Re-runs again!
       }
   }
3. Immediate Execution Operators:
   - Operators that produce a non-sequence value: Count(), Any(), First(), Single(), Sum(), Average().
   - Operators that buffer into a collection: ToList(), ToArray(), ToDictionary(), ToLookup().`,
    codeSnippet: `// ❌ MULTIPLE ENUMERATION: Re-executes HTTP/DB or LINQ stream twice
public void SendAlerts(IEnumerable<SensorReading> readings)
{
    // Multiple enumeration warning!
    if (readings.Any(r => r.Temperature > 100))
    {
        var critical = readings.Where(r => r.Temperature > 100);
        _logger.LogWarning("Found {Count} critical readings", critical.Count()); // Re-enumerates!
    }
}

// ✅ MATERIALIZED EVALUATION: Single pass iteration
public void SendAlertsOptimal(IEnumerable<SensorReading> readings)
{
    // Materialize into memory once if multiple iterations are required
    var critical = readings.Where(r => r.Temperature > 100).ToList();
    if (critical.Count > 0)
    {
        _logger.LogWarning("Found {Count} critical readings", critical.Count);
    }
}`,
    redFlags: [
      "Ignoring JetBrains ReSharper / Roslyn 'Possible multiple enumeration of IEnumerable' compiler warnings.",
      "Calling .ToList() prematurely on huge streams that only require a single streaming forward-pass."
    ],
    proTips: [
      "In .NET 6+, use 'reading.TryGetNonEnumeratedCount(out int count)' to check element count without forcing an enumeration if the sequence implements ICollection."
    ]
  },
  {
    id: "q-linq-4",
    pillar: "linq",
    seniority: "Senior",
    tags: ["SelectMany", "Cross Join", "Hierarchy Flattening", "Projection"],
    title: "SelectMany vs. Select: Flattening Hierarchies, 1:N Relationships, and Cross Joins",
    pitch: "Select() projects each element of a sequence into a new form, producing a 1-to-1 output sequence (IEnumerable<TOut>). SelectMany() projects each element to an intermediate sequence and flattens the resulting sequences into a single one-dimensional collection (1-to-many relationship). In relational databases and EF Core, SelectMany translates to an SQL CROSS APPLY or INNER JOIN, avoiding nested collection objects.",
    deepDive: `Understanding the Mechanics:
1. Select:
   - Input: List of Authors (each author has List<Book>).
   - authors.Select(a => a.Books) returns IEnumerable<List<Book>> (a collection of collections).
2. SelectMany:
   - authors.SelectMany(a => a.Books) returns IEnumerable<Book> (a single flat list of all books from all authors).
3. Cross Product / Cartesian Generation:
   - SelectMany can take a second result selector to combine parent and child attributes:
     authors.SelectMany(a => a.Books, (author, book) => new { author.Name, book.Title });
4. EF Core Translation:
   - Translates into SQL: 'FROM Authors a CROSS APPLY Books b' or 'INNER JOIN Books b ON a.Id = b.AuthorId'.`,
    codeSnippet: `public class Department
{
    public string Name { get; set; } = "";
    public List<Employee> Employees { get; set; } = new();
}

public class ReportingService
{
    public List<EmployeeDto> GetAllActiveEmployees(List<Department> departments)
    {
        // Flattens departments into a single stream of active employees
        return departments
            .SelectMany(dept => dept.Employees)
            .Where(emp => emp.IsActive)
            .Select(emp => new EmployeeDto(emp.Id, emp.FullName, emp.Salary))
            .ToList();
    }
}`,
    redFlags: [
      "Using nested foreach loops to append child items to a new List instead of a declarative SelectMany.",
      "Confusing SelectMany with Concat or Union."
    ],
    proTips: [
      "SelectMany is the monadic 'bind' (flatMap) operation in functional programming, enabling railway-oriented programming when chaining Result<T> types."
    ]
  },
  {
    id: "q-linq-5",
    pillar: "linq",
    seniority: "Senior",
    tags: ["GroupBy", "ToLookup", "ToDictionary", "Memory"],
    title: "LINQ GroupBy vs. ToLookup vs. ToDictionary: Performance and Memory Trade-Offs",
    pitch: "GroupBy produces a deferred, lazy-evaluated sequence of IGrouping<TKey, TElement> where each group is streamed. ToLookup() immediately executes and creates an immutable 1-to-many lookup structure (ILookup<TKey, TElement>) where duplicate keys are supported and querying a missing key returns an empty sequence rather than throwing an exception. ToDictionary() creates a mutable 1-to-1 map where duplicate keys throw ArgumentException.",
    deepDive: `Comparison Table:
1. GroupBy(k):
   - Execution: Deferred (iterated on demand).
   - Keys: Multiple values per key.
   - Missing key: N/A (linear search through groups).
2. ToLookup(k):
   - Execution: Immediate (materialized in RAM).
   - Keys: Multiple values per key.
   - Missing key: Returns Enumerable.Empty<T>() (safe, never throws KeyNotFoundException).
3. ToDictionary(k, v):
   - Execution: Immediate (materialized in RAM).
   - Keys: Strictly UNIQUE keys only!
   - Missing key: Throws KeyNotFoundException unless using TryGetValue. Duplicate key on creation throws ArgumentException.`,
    codeSnippet: `var orders = GetOrders();

// 1. ToDictionary: Fails if duplicate CustomerId exists!
// var dict = orders.ToDictionary(o => o.CustomerId); // 💥 ArgumentException!

// 2. ToLookup: Ideal for 1-to-many in-memory indexing
ILookup<int, Order> ordersByCustomer = orders.ToLookup(o => o.CustomerId);

// Safe lookup: Never throws KeyNotFoundException
IEnumerable<Order> customerOrders = ordersByCustomer[999]; // Returns empty sequence if not found!
Console.WriteLine($"Customer 999 order count: {customerOrders.Count()}");`,
    redFlags: [
      "Using ToDictionary on columns with potential duplicates without grouping first.",
      "Iterating GroupBy multiple times without materializing with ToLookup or ToList."
    ],
    proTips: [
      "When building in-memory multi-value caches, prefer ILookup<K, V> over Dictionary<K, List<V>> for cleaner, thread-safe, immutable reads."
    ]
  },
  {
    id: "q-linq-6",
    pillar: "linq",
    seniority: "Senior",
    tags: ["Expression Trees", "Roslyn", "Dynamic LINQ", "IQueryProvider"],
    title: "Expression Trees Under the Hood: Func<T, bool> vs. Expression<Func<T, bool>>",
    pitch: "In C#, a lambda passed to Func<T, bool> compiles into executable IL code (a delegate). When the identical lambda syntax is assigned to Expression<Func<T, bool>>, the Roslyn compiler lowers it into a tree data structure composed of Expression nodes (ParameterExpression, BinaryExpression, MemberExpression). This expression tree represents the code structure as data, allowing database providers like EF Core to inspect nodes at runtime and translate them into SQL.",
    deepDive: `Why Expression Trees are Essential for Senior .NET Developers:
1. Inspection as Data:
   - An Expression tree can be visited using the Visitor Pattern (ExpressionVisitor).
   - EF Core walks the tree to translate 'user.Age > 18' into SQL 'WHERE [u].[Age] > 18'.
2. Dynamic Query Generation:
   - For advanced search screens with 15 optional filter inputs, instead of writing 15 nested if statements or string SQL concatenation, senior engineers dynamically combine Expression trees using Expression.AndAlso and Expression.Lambda.
3. Compiling Expressions:
   - You can compile an Expression tree back into an executable delegate at runtime via 'expr.Compile()', though compilation incurs high CPU overhead and should be cached.`,
    codeSnippet: `// Programmatic Dynamic Filter Construction using Expression Trees
public static Expression<Func<T, bool>> CombineWithAnd<T>(
    Expression<Func<T, bool>> first, 
    Expression<Func<T, bool>> second)
{
    var parameter = Expression.Parameter(typeof(T), "x");

    // Replace parameters in both expressions with unified parameter
    var leftVisitor = new ParameterReplacer(first.Parameters[0], parameter);
    var left = leftVisitor.Visit(first.Body);

    var rightVisitor = new ParameterReplacer(second.Parameters[0], parameter);
    var right = rightVisitor.Visit(second.Body);

    // Combine with logical AND: x => left && right
    var body = Expression.AndAlso(left!, right!);
    return Expression.Lambda<Func<T, bool>>(body, parameter);
}

public class ParameterReplacer : ExpressionVisitor
{
    private readonly ParameterExpression _from, _to;
    public ParameterReplacer(ParameterExpression from, ParameterExpression to) => (_from, _to) = (from, to);
    protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);
}`,
    redFlags: [
      "Compiling Expression trees in a tight loop with .Compile() (causes severe JIT CPU spikes).",
      "Attempting to invoke arbitrary C# methods inside EF Core Expressions that have no SQL equivalent."
    ],
    proTips: [
      "Use System.Linq.Expressions with compiled lambdas for high-speed dynamic object mapping that matches manual assignment speed while avoiding Reflection overhead."
    ]
  }
];

// Add extra high-yield EF Core questions
const efQuestions = [
  {
    id: "q-efcore-5",
    pillar: "efcore",
    seniority: "Senior",
    tags: ["Migrations", "CI/CD", "Bundle", "Zero-Downtime"],
    title: "EF Core Migrations in CI/CD: Migration Bundles vs Database.Migrate() at Startup",
    pitch: "Calling 'context.Database.Migrate()' during application startup is dangerous in production: in horizontally scaled environments with multiple containers starting concurrently, race conditions corrupt the __EFMigrationsHistory table or cause deadlocks. The enterprise standard is using self-contained Migration Bundles (dotnet ef migrations bundle) executed as a dedicated gated step in CI/CD pipelines before application deployment, paired with expand/contract schema design for zero downtime.",
    deepDive: `Why Migrate() at Startup Fails at Scale:
1. Concurrency Race: Multiple App Service or Kubernetes pods booting simultaneously execute ALTER TABLE at the same time.
2. Permission Violation: Web app database users should have DML permissions (SELECT, INSERT, UPDATE, DELETE) only, NEVER DDL permissions (CREATE TABLE, ALTER TABLE, DROP TABLE).
3. Health Check Failure: Migrations running on 100M-row tables cause startup timeouts and crash-loops.

The CI/CD Migration Bundle Pattern:
1. Generate Bundle during CI build:
   dotnet ef migrations bundle --output ./bundle.exe --self-contained -r linux-x64
2. Execute in Release Pipeline:
   Run bundle.exe against the staging/production database using elevated DBA credentials.
3. Expand / Contract Pattern for Zero Downtime:
   - Phase 1 (Expand): Add new nullable columns or tables. Deploy new code.
   - Phase 2 (Backfill): Populate data asynchronously.
   - Phase 3 (Contract): After old code is fully decommissioned, remove deprecated columns in a future migration.`,
    codeSnippet: `# Azure DevOps Release Pipeline Migration Step
- task: AzureCLI@2
  displayName: 'Execute EF Core Migration Bundle'
  inputs:
    azureSubscription: 'Production-Azure-Connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      chmod +x $(Pipeline.Workspace)/drop/bundle
      # Execute idempotent migration binary with elevated connection string
      $(Pipeline.Workspace)/drop/bundle --connection "$(PROD_DB_CONNECTION_STRING)"`,
    redFlags: [
      "Running 'context.Database.EnsureCreated()' in production (bypasses migration history completely).",
      "Renaming a column in a single migration on a live system without expand/contract (causes instant 500 errors for running containers)."
    ],
    proTips: [
      "Generate idempotent SQL scripts via 'dotnet ef migrations script --idempotent' to allow DBA inspection and auditing before deployment."
    ]
  }
];

// Add extra high-yield SQL questions
const sqlQuestions = [
  {
    id: "q-sql-6",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Normalization", "Denormalization", "OLTP vs OLAP", "Database Design"],
    title: "Relational Normalization (1NF through 3NF/BCNF) vs. Pragmatic Denormalization",
    pitch: "Normalization organizes relational schemas to minimize data redundancy and eliminate insert, update, and delete anomalies by ensuring every non-key attribute depends on 'the key, the whole key, and nothing but the key' (3NF/BCNF). In high-throughput OLTP systems, 3NF ensures atomic, consistent writes. However, in read-heavy architectures with massive JOIN overhead, senior engineers pragmatically apply Denormalization (materialized views, read-model projections, and pre-aggregated summary tables) to trade write complexity for sub-millisecond query performance.",
    deepDive: `The Normal Forms Breakdown:
1. 1NF (First Normal Form): Atomic values only (no repeating groups, comma-separated lists, or arrays in a column).
2. 2NF (Second Normal Form): 1NF + No partial key dependencies (every non-key column must depend on the FULL composite primary key).
3. 3NF (Third Normal Form): 2NF + No transitive dependencies (non-key columns must not depend on other non-key columns).
4. BCNF (Boyce-Codd Normal Form): A stricter version of 3NF where every determinant must be a candidate key.

Pragmatic Denormalization Patterns in Modern .NET:
1. Summary Tables & Pre-Aggregation: Maintaining 'DailySalesSummary' updated asynchronously via background jobs or triggers.
2. Read-Model Projections (CQRS): Keeping normalized relational tables for write aggregates, while projecting denormalized JSON or DTO tables for read screens.
3. Indexed / Materialized Views: SQL Server automatically maintains the view output on disk when underlying tables change, allowing lightning-fast index seeks on complex aggregations.`,
    codeSnippet: `-- SQL Server Indexed View (Materialized Denormalization)
CREATE VIEW dbo.vw_CustomerOrderTotals
WITH SCHEMABINDING -- Required for indexing
AS
SELECT 
    c.CustomerId,
    c.CustomerName,
    COUNT_BIG(*) AS OrderCount,
    SUM(ISNULL(o.TotalAmount, 0)) AS LifetimeSpend
FROM dbo.Customers c
INNER JOIN dbo.Orders o ON c.CustomerId = o.CustomerId
GROUP BY c.CustomerId, c.CustomerName;
GO

-- Create unique clustered index to materialize view on disk
CREATE UNIQUE CLUSTERED INDEX CIX_vw_CustomerOrderTotals 
ON dbo.vw_CustomerOrderTotals (CustomerId);`,
    redFlags: [
      "Prematurely denormalizing tables during initial schema design before identifying read bottlenecks.",
      "Denormalizing transactional write models without establishing mechanisms to prevent data divergence."
    ],
    proTips: [
      "Use SQL Server Indexed Views with SCHEMABINDING for read-heavy aggregates: the query optimizer can automatically substitute the view index even when the query targets the underlying base tables!"
    ]
  }
];

// Combine all questions
const finalQuestions = [...newQuestions, ...linqQuestions, ...efQuestions, ...sqlQuestions];

// Write updated questions.js
const fileContent = `// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM
// Organized into 7 Focused Technical Modules + Top 10 Coding Questions Arena
// Sourced from top GitHub .NET repositories and Reddit r/dotnet interview patterns
// ============================================================================

window.INTERVIEW_QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};
`;

fs.writeFileSync('js/data/questions.js', fileContent, 'utf8');
console.log('Successfully updated questions.js! Total questions:', finalQuestions.length);

const pillarCounts = {};
finalQuestions.forEach(q => pillarCounts[q.pillar] = (pillarCounts[q.pillar] || 0) + 1);
console.log('Pillar Breakdown:', pillarCounts);
