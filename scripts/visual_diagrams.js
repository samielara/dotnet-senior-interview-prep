// ============================================================================
// IN-QUESTION VISUAL LEARNING BLUEPRINTS (96 Popular Questions)
// Monospace ASCII & architectural flowcharts for instant visual comprehension
// ============================================================================

const VISUAL_BLUEPRINTS = {
  csharp: {
    1: `┌─────────────────────────────────────────────────────────────┐
│                 OBJECT-ORIENTED PROGRAMMING                 │
├──────────────┬──────────────┬───────────────┬───────────────┤
│ ENCAPSULATION│ INHERITANCE  │ POLYMORPHISM  │  ABSTRACTION  │
│ [Private State│ [Base Class  │ [Same Method, │ [Interface/   │
│  Public API] │  Derived]    │  Many Forms]  │  Hide Detail] │
└──────────────┴──────────────┴───────────────┴───────────────┘
Car Analogy:
  Car Class ──► Abstraction: Exposes StartEngine(), Brake()
            ──► Encapsulation: Hides _fuelAirRatio, _sparkTiming
            ──► Inheritance: TeslaModel3 inherits from BaseVehicle
            ──► Polymorphism: Override Accelerate() for InstantTorque()`,

    2: `┌─────────────────────────────┬─────────────────────────────┐
│     METHOD OVERLOADING      │      METHOD OVERRIDING      │
├─────────────────────────────┼─────────────────────────────┤
│ Compile-time (Early bind)   │ Runtime (Late dynamic vtable│
│ Same name, different params │ Same signature, new logic   │
│ Within same or child class  │ Requires 'virtual' & 'override'
└─────────────────────────────┴─────────────────────────────┘
Dispatch:
  calc.Add(1, 2)         ──► Direct compile-time call to Add(int, int)
  animal.MakeSound()     ──► Runtime checks VTable ──► Dog.MakeSound()`,

    3: `┌─────────────────────────────┬─────────────────────────────┐
│          INTERFACE          │       ABSTRACT CLASS        │
├─────────────────────────────┼─────────────────────────────┤
│ Contract ONLY ('CAN-DO')    │ Base Identity ('IS-A')      │
│ Multiple implementations    │ Single inheritance only     │
│ No fields or instance state │ Can hold fields and state   │
│ Decoupled service contracts │ Code reuse & Template Method│
└─────────────────────────────┴─────────────────────────────┘`,

    4: `┌─────────────────────────────────────────────────────────────┐
│                    SOLID DESIGN PRINCIPLES                  │
├─────────────────────────────────────────────────────────────┤
│ S - Single Responsibility (One actor, one reason to change) │
│ O - Open / Closed (Open for extension, closed for mod)      │
│ L - Liskov Substitution (Subtypes substitute base type)     │
│ I - Interface Segregation (Small, client-specific contracts)│
│ D - Dependency Inversion (Depend on abstractions, not impl) │
└─────────────────────────────────────────────────────────────┘`,

    5: `       [ STACK MEMORY ]                 [ MANAGED HEAP ]
┌────────────────────────────┐      ┌─────────────────────────┐
│ struct Point { X=10, Y=20 }│      │ class Customer { ... }  │
│ • Direct value allocation  │      │ • Heap reference type   │
│ • Automatic LIFO cleanup   │      │ • Generational GC sweep │
│ Pointer: 0x7FFF12A0 ───────┼─────►│ Address: 0x7FFF12A0     │
└────────────────────────────┘      └─────────────────────────┘`,

    6: `Access Modifiers Scope:
public             ──► Everywhere across any referenced assembly
internal           ──► Current assembly (.dll) only
protected          ──► Containing class & derived subclasses
protected internal ──► Current assembly OR derived subclasses outside
private protected  ──► Derived subclasses WITHIN current assembly only
private            ──► Containing class only`,

    7: `Type Metadata (AppDomain)             Heap Instances
┌─────────────────────────┐      ┌────────────────────────┐
│ static class Config     │      │ Instance A (new())     │
│ • Static Fields         │      ├────────────────────────┤
│ • Static Ctor (Runs 1x) │      │ Instance B (new())     │
└─────────────────────────┘      └────────────────────────┘`,

    8: `Inheritance ('Is-A')          Composition ('Has-A')
┌─────────────────────┐      ┌────────────────────────┐
│ BaseReport          │      │ InvoiceReport          │
│  └─► TaxInvoice     │      │  ├─► IPrintEngine      │
│      (Tight coupling)      │  └─► ITaxCalculator    │
└─────────────────────┘      └────────────────────────┘
Favor Composition: Inject interfaces rather than building deep hierarchies.`,

    9: `Parameter Passing Semantics:
ref ──► Must be initialized BEFORE call; read/write inside method
out ──► Can be uninitialized before call; MUST be assigned in method
in  ──► Read-only reference; prevents copying large value-type structs`,

    10: `OS Kernel Thread vs ThreadPool Task:
OS Thread:      ~1MB stack memory reserved, expensive context switches
ThreadPool Task:Lightweight task (~few bytes), reuses worker pool threads`,

    11: `Async/Await Under the Hood:
Async Method Call
  │
  ├─► Task completed? ── YES ──► Fast Path: Return synchronously (0 alloc)
  └─► NO ──► Yield thread to ThreadPool ──► Lowers to IAsyncStateMachine
               └──► I/O completes ──► MoveNext() resumed on free thread`,

    12: `Task<T> vs ValueTask<T>:
Task<T>:      Reference type on Heap; allocates every single call
ValueTask<T>: Value type Struct; ZERO heap allocation on synchronous fast path
Hazard:       Never await ValueTask twice! Call .AsTask() if awaiting multi.`,

    13: `CLR Generational Garbage Collector:
Gen 0 ──► Ephemeral, brand new objects, sub-millisecond sweep
Gen 1 ──► Buffer zone for surviving Gen 0 objects
Gen 2 ──► Long-lived objects (Singletons, static caches, full sweep)
LOH   ──► Large Object Heap (>= 85,000 bytes, not compacted by default)
POH   ──► Pinned Object Heap (Fixed address for native P/Invoke)`,

    14: `Dispose Pattern & Finalizer:
using (var res = new Res()) { Work(); }
  │ (Compiles to try / finally)
  ▼
try { Work(); }
finally {
  res.Dispose(); ──► Frees unmanaged OS handles immediately
                     GC.SuppressFinalize(this); // Skips slow finalizer queue
}`,

    15: `Delegate vs Event:
Action<int> act;               public event Action<int> OnChange;
• Anyone can invoke: act(5)    • Outside code can ONLY += or -=
• Anyone can wipe: act = null  • Only declaring class can raise event`,

    16: `const vs readonly vs static readonly:
const:           Compile-time constant, inlined into caller assembly
readonly:        Per-instance, initialized in instance constructor
static readonly: Type-level, initialized once in static constructor`,

    17: `String Immutability vs StringBuilder:
s += " World";  ──► Discards old string, allocates NEW object on heap
sb.Append(...); ──► Modifies internal char buffer in-place (0 extra alloc)`,

    18: `Exception Stack Trace Preservation:
throw;          ──► PRESERVES original stack trace and root line number
throw ex;       ──► TRUNCATES stack trace, falsely marks catch block as origin`
  },
  aspnet: {
    1: `Thin Controller Architecture:
HTTP POST /orders ──► [ OrdersController ] (1-3 lines)
                            │
                            ▼
                      [ MediatR / Handler ]
                            ├─► FluentValidation Pipeline
                            ├─► Domain Business Logic
                            └─► DbContext.SaveChangesAsync()
                                  │
HTTP Response (201 Created) ◄─────┘`,

    2: `Inversion of Control (IoC):
Tightly Coupled (No DI):
  OrderService creates: new SqlOrderRepo(), new SmtpSender()
  (Impossible to unit test without real SQL and SMTP!)

Decoupled (With DI):
  builder.Services.AddScoped<IOrderRepo, SqlOrderRepo>();
  public OrderService(IOrderRepo repo) { _repo = repo; }
  (Easily mockable in xUnit / Moq)`,

    3: `ASP.NET Core DI Lifetimes:
Request 1:                       Request 2:
├─► Transient (New Instance A)   ├─► Transient (New Instance C)
├─► Scoped (Instance X)          ├─► Scoped (Instance Y)
├─► Scoped (Instance X shared)   ├─► Scoped (Instance Y shared)
└───────────────┬────────────────────────────────────────┘
                ▼
        Singleton (Instance Ω - Shared across entire App lifetime)`,

    4: `ASP.NET Core Middleware Pipeline Order:
Request ──► [ ExceptionHandler / ProblemDetails ]
        ──► [ HSTS / HTTPS Redirection ]
        ──► [ Routing ]
        ──► [ CORS ]
        ──► [ Authentication (Who are you?) ]
        ──► [ Authorization (Permissions check) ]
        ──► [ Action Filters / Controller Endpoint ]`,

    5: `HTTP REST Status Code Decision Tree:
Success: 200 OK | 201 Created (POST) | 204 No Content (DELETE)
Client:  400 Bad Request | 401 Unauth | 403 Forbidden | 404 Not Found
Server:  500 Internal Error | 503 Service Unavailable`,

    6: `Idempotency-Key Pattern:
POST /api/v1/payments (Header: Idempotency-Key: f47ac10b)
  │
  ├─► Key in Redis? ── YES ──► Return Cached HTTP 200 (Don't charge twice!)
  └─► NO ──► Lock Key ──► Charge Stripe ──► Cache Result ──► Return 201`,

    7: `RFC 7807 ProblemDetails Global Error Response:
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 400,
  "detail": "Quantity must be greater than zero",
  "instance": "/api/v1/orders/create",
  "traceId": "00-848293bd82390f-01"
}`,

    8: `Authentication vs Authorization:
401 Unauthorized ──► 'Who are you?' (Missing / expired JWT Bearer token)
403 Forbidden    ──► 'You cannot do this' (Insufficient user claims / roles)`,

    9: `CancellationToken Cooperative Propagation:
Client Disconnects (Closes tab)
  │
  ▼
HttpContext.RequestAborted
  └─► MediatR Handler(ct)
        ├─► dbContext.Orders.ToListAsync(ct) ──► Aborts query in SQL Server!
        └─► httpClient.GetAsync(url, ct)    ──► Aborts pending outbound socket!`,

    10: `Hangfire Distributed Job Processing:
Enqueue(() => SendEmail(id)) ──► [ SQL Server / Redis Job Queue ]
                                       │
                                       ▼
                             [ Dedicated Worker Pool ]
                             • Dequeue job
                             • Failed? Retry with Exponential Backoff (10x)`,

    11: `Socket Exhaustion vs IHttpClientFactory:
BAD:  new HttpClient() in loop ──► Stuck in TIME_WAIT for 4m, crashes OS ports
GOOD: IHttpClientFactory pool  ──► Reuses sockets, auto-refreshes DNS records`,

    12: `CORS Browser Preflight Check:
Browser (domain-a)                          Server (domain-b)
  ├─► OPTIONS /api/orders (Preflight) ─────────► Inspects CORS policy
  │◄─ 200 OK (Allow-Origin: domain-a) ─────────┘
  └─► POST /api/orders (Actual Request) ───────► Process order`,

    13: `MVC Controllers vs Minimal APIs:
MVC:     Heavy reflection, filters, action invokers, larger memory footprint
Minimal: Direct endpoint routing, source generators, zero-allocation pipeline`,

    14: `JWT Refresh Token Rotation:
POST /refresh { Token A }
  ├─► Invalidate Token A immediately
  ├─► Issue Access Token (15m) + Refresh Token B (Sliding expiration)
  └─► Attacker replays Token A? ──► Revoke ALL sessions for that user!`
  },
  efcore: {
    1: `IEnumerable vs IQueryable:
IEnumerable: In-Memory filtering (Fetches all rows, filters in C# app memory)
IQueryable:  Server-Side SQL Expression Tree (Translates to SQL WHERE clause)`,

    2: `AsNoTracking Read-Only Performance:
Default Query:   Allocates Change Tracker snapshots for every returned entity
.AsNoTracking(): Bypasses tracker, ~3x faster, cuts memory consumption by ~50%`,

    3: `N+1 Query Problem vs Elimination:
BAD (N+1 Queries):
  1 Query: SELECT * FROM Orders (100 rows)
  + 100 Queries: SELECT * FROM Items WHERE OrderId = @id (100 round-trips!)
GOOD (Eager Loading):
  .Include(o => o.Items) ──► Single SQL query with INNER/LEFT JOIN!`,

    4: `DbContext Lifetime & Unit of Work:
HTTP Request ──► Scoped DbContext instantiated
                 ├─► repoA.Add(entity)
                 ├─► repoB.Update(order)
                 └─► dbContext.SaveChangesAsync() (1 Atomic SQL Transaction)
HTTP Response ──► DbContext Disposed`,

    5: `Resilient Execution Strategy (Retry Logic):
options.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: 30s)
Transient Network Glitch ──► Exponential backoff retry in EF Core engine`,

    6: `Optimistic Concurrency with RowVersion:
User A & User B load RowVersion: 0x0001
User A saves ──► UPDATE ... WHERE RowVersion = 0x0001 (Success, bumps to 0x0002)
User B saves ──► UPDATE ... WHERE RowVersion = 0x0001 (0 rows affected)
                 EF Core throws DbUpdateConcurrencyException!`,

    7: `Split Queries (.AsSplitQuery()):
Cartesian Explosion: Order (1) x Items (10) x Logs (5) = 50 duplicate rows!
AsSplitQuery:        Query 1: SELECT Orders
                     Query 2: SELECT Items WHERE OrderId IN (...)
                     Query 3: SELECT Logs WHERE OrderId IN (...)`,

    8: `First vs Single SQL Translation:
.First():  Generates SELECT TOP(1) ... (Stops index scan at 1st match)
.Single(): Generates SELECT TOP(2) ... (Validates exactly 1; throws if > 1)`,

    9: `Loading Strategies:
Eager Loading:   .Include(x => x.Details) ──► Single JOIN query
Explicit Loading:db.Entry(post).Collection(p => p.Comments).Load()
Lazy Loading:    virtual navigation properties (High risk of accidental N+1)`,

    10: `Code-First vs Database-First:
Code-First: C# Entity Classes ──► EF Migrations ──► SQL Database
DB-First:   Existing Database ──► Scaffold-DbContext ──► C# Classes`,

    11: `LINQ Deferred Execution:
var query = db.Users.Where(u => u.IsActive); // 0 SQL executed yet!
// ... later in method ...
foreach (var u in query) // SQL executed HERE on iteration / ToList()`,

    12: `Any() vs Count() > 0 Performance:
Count() > 0: SELECT COUNT(*) FROM Users (Scans entire index / table)
Any():       SELECT CASE WHEN EXISTS(SELECT 1 FROM Users) THEN 1 (Stops at 1st!)`
  },
  sql: {
    1: `SQL JOIN Semantics:
INNER JOIN: Returns ONLY rows where keys match in both tables
LEFT JOIN:  Returns ALL left table rows + matching right rows (or NULL)`,

    2: `WHERE vs HAVING:
WHERE:  Filters raw rows BEFORE grouping (Cannot use aggregate functions)
HAVING: Filters summary groups AFTER GROUP BY (e.g. HAVING COUNT(*) > 5)`,

    3: `Window Functions vs GROUP BY:
GROUP BY:         Collapses 100 rows into 5 summarized rows
ROW_NUMBER() OVER:Keeps all 100 individual rows, adds rank column 1..N`,

    4: `Clustered vs Nonclustered Index:
Clustered:    Dictates the PHYSICAL order of rows on disk (1 per table)
Nonclustered: Separate B-Tree structure storing index keys + data pointers`,

    5: `Covering Index with INCLUDE Clause:
CREATE NONCLUSTERED INDEX IX_Cust ON Orders (CustomerId) INCLUDE (Total, Date)
  └─► All needed columns are in the index leaf node ──► 0 Key Lookups!`,

    6: `SARGable Query Predicates:
NON-SARGABLE: WHERE YEAR(CreatedAt) = 2025 ──► Forces full Index Scan!
SARGABLE:     WHERE CreatedAt >= '2025-01-01' AND CreatedAt < '2026-01-01'
              ──► Enables high-performance B-Tree Index Seek!`,

    7: `Execution Plan Hierarchy:
Index Seek (Best) ──► Index Scan ──► Clustered Scan ──► Table Scan (Worst)
Warning Signs: Thick data lines, Key Lookups, Hash Match spills to TempDB`,

    8: `Stored Procedures vs EF Core:
Stored Procs: Precompiled plans, batch DB execution, DB administration
EF Core:      C# strong typing, portable, developer velocity, migration safety`,

    9: `Parameter Sniffing Problem:
Run 1 (@City='SmallTown', 2 rows) ──► SQL creates Seek execution plan
Run 2 (@City='NewYork', 500k rows)──► Reuses Seek plan ──► Millions of lookups!
Fix: OPTION (RECOMPILE) or OPTION (OPTIMIZE FOR UNKNOWN)`,

    10: `ACID & RCSI (Read Committed Snapshot Isolation):
A - Atomic | C - Consistent | I - Isolated | D - Durable
RCSI: Readers do NOT block Writers; Writers do NOT block Readers (tempdb versioning)`,

    11: `Deadlock Circular Wait:
Session 1: Holds Lock Table A ──► Wants Lock Table B
Session 2: Holds Lock Table B ──► Wants Lock Table A
SQL Deadlock Monitor: Kills the lower-cost transaction with Error 1205!`,

    12: `sp_getapplock Distributed Mutex:
EXEC sp_getapplock @Resource = 'Nightly_Billing_Job', @LockMode = 'Exclusive'
  └─► Application-level mutual exclusion across multiple web servers`,

    13: `OFFSET/FETCH vs Keyset Pagination:
OFFSET 100000: Scans and discards 100,000 rows (Degrades to O(N))
Keyset:        WHERE Id > @lastSeenId ORDER BY Id (B-Tree Seek O(1))`,

    14: `CTE vs #TempTable vs @TableVariable:
CTE:            Inline named subquery, zero stats, re-evaluated per reference
#TempTable:     tempdb physical table, distribution stats & indexes allowed
@TableVariable: Small sets (<100 rows), estimated 1 row in older SQL engine`,

    15: `Set-Based Operations vs Cursors:
Set-Based: Relational algebra, optimized parallel plan, 1 operation
Cursor:    Iterates row-by-row in loop, locks pages, high latency`,

    16: `SQL Injection Prevention:
BAD:  'SELECT * FROM Users WHERE Name = '' + input + '''
GOOD: Parameterized SQL: command.Parameters.AddWithValue('@name', input)`,

    17: `Diagnosing Slow SQL Queries:
1. sys.dm_exec_query_stats (CPU time, execution count, logical reads)
2. sys.dm_os_wait_stats (PAGEIOLATCH = Disk I/O; LCK_M = Lock contention)
3. Extended Events trace session`,

    18: `Database Normalization:
1NF: Atomic values, no repeating column groups
2NF: 1NF + No partial dependencies on composite primary key
3NF: 2NF + No transitive dependencies (attributes depend ONLY on PK)`
  },
  ui: {
    1: `Props vs State:
Props: Immutable input passed down from parent (Unidirectional flow)
State: Mutable local reactive memory maintained inside the component`,

    2: `Controlled vs Uncontrolled Components:
Controlled:   <input value={val} onChange={e => setVal(e.target.value)} />
              (React state is the single source of truth)
Uncontrolled: <input ref={inputRef} /> (DOM handles value, read on submit)`,

    3: `Functional State Updates:
BAD:  setCount(count + 1); setCount(count + 1); // Increments only 1!
GOOD: setCount(c => c + 1); setCount(c => c + 1); // Increments by 2!`,

    4: `useEffect Lifecycle & Cleanup:
useEffect(() => {
  const sub = api.subscribe();
  return () => sub.unsubscribe(); // Cleanup on unmount or dep change!
}, [depId]);`,

    5: `useMemo vs useCallback vs React.memo:
useMemo:     Caches expensive calculated RESULT value
useCallback: Caches FUNCTION instance reference across re-renders
React.memo:  Skips component re-render if props have not changed`,

    6: `Keys in Lists:
BAD:  key={index} (Causes DOM state mismatches when items reorder/delete)
GOOD: key={item.id} (Provides stable identity for React reconciliation)`,

    7: `State Management Architecture:
Local Component State (useState / useReducer)
  └─► Prop Drilling (Avoid if > 2 levels)
        └─► React Context (Theme, auth, infrequent updates)
              └─► Zustand / Redux (High-frequency global state)`,

    8: `Custom Hooks Pattern:
function useWindowSize() {
  const [size, setSize] = useState(...);
  useEffect(() => { ... window.addEventListener('resize'); }, []);
  return size;
} (Reuses stateful logic without component wrapper hell)`,

    9: `TypeScript Generics:
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
} // Preserves exact return type safety for any input array`,

    10: `Type Safety Hierarchy:
never    ──► Bottom type (Exhaustive check, impossible code path)
specific ──► string, number, User
unknown  ──► Top type with safety (Must narrow with typeof / instanceof)
any      ──► Shuts off compiler type checking completely (Avoid!)`,

    11: `interface vs type:
interface: Supports declaration merging, ideal for OOP contracts & APIs
type:      Supports unions (|), primitives, tuples, mapped types`,

    12: `Discriminated Unions:
type AsyncState =
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };
// TypeScript guarantees data only exists when status === 'success'!`,

    13: `API State UI Matrix:
Loading ──► Skeleton shimmer / spinner
Error   ──► Retry button + user-friendly error description
Empty   ──► 'No items found' + Call to Action
Success ──► Render populated data list`,

    14: `Virtualized List (react-window):
10,000 Total Items ──► Only renders ~15 DOM nodes in viewport!
Recycles DOM elements on scroll ──► Keeps memory at O(1)`,

    15: `Component Testing (Vitest & React Testing Library):
Test user-observable behavior, NOT implementation details:
render(<LoginForm />);
fireEvent.click(screen.getByRole('button', { name: /submit/i }));
expect(await screen.findByText(/welcome/i)).toBeInTheDocument();`,

    16: `React 18 Concurrent Transitions:
Urgent:     setInputValue(e.target.value); // Immediate input response (60fps)
Transition: startTransition(() => setFilteredResults(calc(e.target.value)));
            // Interruptible background render; yields to user typing`
  },
  cloud: {
    1: `CI vs CD vs Continuous Deployment:
CI:                Git Push ──► Automated Build + Unit Tests Pass
Continuous Deliv:  Builds deployable drop artifact ──► Manual staging approval
Continuous Deploy: 100% automated deployment directly to Production`,

    2: `Azure Pipelines Hierarchy:
Pipeline ──► Stage (Build) ──► Job (Agent pool) ──► Steps (Tasks / Scripts)
         └──► Stage (Deploy) ──► Job (Environment) ──► Steps (Download drop & run)`,

    3: `YAML Pipelines vs Classic UI:
YAML:    Version controlled with code, PR reviews, branchable, diffable
Classic: Web GUI point-and-click, cannot branch with features, hard to audit`,

    4: `Immutability of Build Artifacts:
Build ONCE in CI (.dlls compiled) ──► Drop Artifact (SHA-256 hash)
  ├─► Deploy to Dev (Inject Dev appsettings)
  ├─► Deploy to Staging (Inject Staging appsettings)
  └─► Deploy to Prod (Inject Prod appsettings) ── ZERO recompilations!`,

    5: `Branch Policies & Quality Gates:
feature/* ──► Pull Request to main
              ├─► Required 2 Reviewer Approvals
              ├─► Successful CI Build & 100% Tests Pass
              ├─► SonarQube Quality Gate (0 new vulnerabilities)
              └─► Linear Git History (Squash & Merge)`,

    6: `Secrets Management & Azure Key Vault:
Application (App Service / Container)
  │ (Managed Identity - Zero hardcoded credentials)
  ▼
Azure Key Vault ──► Securely fetches DB Connection Strings & API Keys`,

    7: `Multi-Stage Environment Release Gates:
Build ──► Dev (Auto) ──► QA (Auto) ──► Staging ──► Production
                                           │            │
                                       Manual Approval  Automated Health Gate`,

    8: `Systematic CI/CD Pipeline Triage:
1. Did the build fail? ──► Compile error or missing NuGet package
2. Did tests fail?     ──► Regression in unit or integration test
3. Did deploy fail?    ──► Expired service principal or network/firewall rule`,

    9: `Zero-Downtime Deployment Slots:
[ Production Slot (Active Traffic 100%) ]
[ Staging Slot (Deploy new version & run warmup / health checks) ]
  │
  ▼ Swap Action (Instant Virtual IP traffic cutover)
[ Production Slot (Now running new version with 0 downtime!) ]`,

    10: `Docker Image vs Container:
Image:     Static, immutable filesystem snapshot (Blueprint / Class)
Container: Running, isolated process instance of that image (Object)`,

    11: `Dockerfile Layer Caching:
COPY *.csproj .
RUN dotnet restore  <── Cached! Re-runs ONLY if NuGet packages change!
COPY . .
RUN dotnet build    <── Re-runs when application code changes`,

    12: `Multi-Stage Docker Builds:
Stage 1: SDK Image (~800MB) ──► Restore, Build, Publish
Stage 2: ASP.NET Alpine Runtime (~110MB) ──► COPY --from=Stage 1 publish/
RESULT:  Hardened production container without compilers or source code`,

    13: `EXPOSE vs Port Mapping:
EXPOSE 8080:           Documentation metadata only (for human & orchestrator)
docker run -p 80:8080: Binds Host port 80 to Container internal port 8080`,

    14: `Docker Volumes vs Bind Mounts:
Volume:     Managed by Docker engine in /var/lib/docker/volumes (Portable)
Bind Mount: Direct mount of host filesystem folder (-v ./src:/app)`,

    15: `Container Health Checks:
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/healthz
Unhealthy container ──► Orchestrator automatically restarts or evicts pod`,

    16: `Azure Container Apps vs App Service vs AKS:
Container Apps: Serverless microservices, scale-to-zero (KEDA), low ops
App Service:    PaaS web apps, managed OS, built-in deployment slots
AKS:            Full Kubernetes control plane, complex enterprise topologies`,

    17: `Kubernetes Architecture:
Control Plane (API Server, etcd, Scheduler)
  │
  ▼
Worker Nodes ──► Kubelet ──► Pods (Containers sharing network & volumes)
                 Service (ClusterIP/LoadBalancer) ──► Ingress Controller`,

    18: `Infrastructure as Code (IaC):
Bicep:     First-class Azure native syntax, day-0 resource support, 0 state file
Terraform: Multi-cloud provider, manages state in remote storage (.tfstate)`
  },
};

module.exports = { VISUAL_BLUEPRINTS };
