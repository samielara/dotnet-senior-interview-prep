// ============================================================================
// RAPID-FIRE FLASHCARDS DATA
// Spaced-Repetition Cards Across the 7 Modular Interview Domains
// ============================================================================

window.INTERVIEW_FLASHCARDS = [
  {
    "id": "fc-1",
    "pillar": "csharp",
    "topic": "Task vs ValueTask",
    "front": "When should you return ValueTask<T> instead of Task<T> in high-performance C# code?",
    "back": "Return ValueTask<T> when the operation is likely to complete synchronously (e.g., in-memory cache hit, fast path) to avoid heap allocation of a Task object on the managed heap.\n\n⚠️ Caution: Never await a ValueTask<T> multiple times or concurrently! If needed, convert via .AsTask().",
    "seniorTip": "If a method completes asynchronously > 20% of the time, Task<T> is often preferred because ValueTask allocates more if asynchronous (due to state machine boxing)."
  },
  {
    "id": "fc-2",
    "pillar": "csharp",
    "topic": "GC Generations & Thresholds",
    "front": "What are the 3 GC Generations, and what is the exact byte threshold for the Large Object Heap (LOH)?",
    "back": "• Gen 0: Short-lived ephemeral objects (local variables).\n• Gen 1: Buffer/survival zone between short-lived and long-lived.\n• Gen 2: Long-lived objects (singletons, static data, cache).\n• LOH: Objects >= 85,000 bytes (85KB).\n\nLOH is not compacted by default during normal GC runs, risking address space fragmentation.",
    "seniorTip": "In .NET 5+, Microsoft introduced the POH (Pinned Object Heap) to separate pinned buffers from LOH and normal heaps."
  },
  {
    "id": "fc-3",
    "pillar": "csharp",
    "topic": "Span<T> Limitations",
    "front": "Why cannot Span<T> be boxed, used as a generic argument in Task<T>, or stored as a field in a class?",
    "back": "Span<T> is declared as a 'ref struct', which the CLR guarantees lives ONLY on the execution stack. Because classes and Tasks live on the managed heap, storing a Span<T> inside them would violate stack memory safety.\n\nUse Memory<T> or ReadOnlyMemory<T> when working across asynchronous await boundaries.",
    "seniorTip": "Span<T> contains a ref pointer and a length. Allowing it on the heap could lead to dangling pointers if the stack frame unwinds."
  },
  {
    "id": "fc-4",
    "pillar": "csharp",
    "topic": "IAsyncStateMachine",
    "front": "What does the C# Roslyn compiler lower an 'async' method into under the hood?",
    "back": "The compiler generates a hidden state machine struct implementing 'IAsyncStateMachine' containing:\n1. An integer state field (tracking execution progress across awaits).\n2. A MoveNext() method containing a switch-case jump table.\n3. An AsyncTaskMethodBuilder to construct the returned Task.\n4. Fields for every local variable and argument captured.",
    "seniorTip": "If an async method completes synchronously on first check, MoveNext() completes without allocating a Task completion source."
  },
  {
    "id": "fc-5",
    "pillar": "csharp",
    "topic": "Channel<T> vs BlockingCollection<T>",
    "front": "Why is System.Threading.Channels superior to BlockingCollection<T> for high-throughput producer-consumer queues?",
    "back": "• BlockingCollection uses kernel wait handles (Monitor/AutoResetEvent) that block OS threads when full or empty.\n• Channel<T> is fully asynchronous (WriteAsync / ReadAllAsync), non-blocking, and utilizes lock-free ring buffers with backpressure support (BoundedChannelFullMode.Wait).",
    "seniorTip": "Always configure SingleReader = true or SingleWriter = true if applicable to enable lock-free optimizations."
  },
  {
    "id": "fc-6",
    "pillar": "csharp",
    "topic": "Records vs Classes",
    "front": "What does C# generate behind the scenes when you define a 'public record Person(string Name, int Age);'?",
    "back": "1. Compiler-generated value-based equality: Equals(Person), GetHashCode(), and == / != operators comparing all properties.\n2. Deconstruct method for pattern matching.\n3. Clone copy-constructor for non-destructive mutation via the 'with' expression.\n4. Formatted PrintMembers and ToString() output.",
    "seniorTip": "Records are reference types ('record class') by default. You can also declare 'readonly record struct' for zero-allocation value types."
  },
  {
    "id": "fc-7",
    "pillar": "csharp",
    "topic": "SemaphoreSlim vs lock",
    "front": "Why can't you use the 'lock' statement around an 'await' keyword in C#?",
    "back": "The 'lock' keyword is syntactic sugar for Monitor.Enter() / Monitor.Exit(), which requires the locking thread and unlocking thread to be identical (Thread Affinity).\n\nBecause an awaited method may resume on a completely different ThreadPool thread, Monitor.Exit would throw SynchronizationLockException. Use SemaphoreSlim(1,1) with WaitAsync() instead.",
    "seniorTip": "Always place SemaphoreSlim.Release() inside a 'finally' block to prevent permanent deadlocks."
  },
  {
    "id": "fc-8",
    "pillar": "csharp",
    "topic": "ArrayPool<T>",
    "front": "How does ArrayPool<T>.Shared prevent GC pressure in high-frequency buffer allocations?",
    "back": "Instead of allocating new 'byte[]' arrays that end up on Gen 0 or LOH (if > 85KB), ArrayPool rents pre-allocated arrays from a thread-safe pool and reuses them across operations.\n\nUsage:\nvar buffer = ArrayPool<byte>.Shared.Rent(4096);\ntry { ... } finally { ArrayPool<byte>.Shared.Return(buffer); }",
    "seniorTip": "Rent() may return an array larger than requested! Always use the requested length or return value, not buffer.Length."
  },
  {
    "id": "fc-9",
    "pillar": "aspnet",
    "topic": "Captive Dependency",
    "front": "What is a 'Captive Dependency' in ASP.NET Core Dependency Injection, and why is it dangerous?",
    "back": "A Captive Dependency occurs when a service with a longer lifetime consumes a service with a shorter lifetime (e.g., a Singleton service injecting a Scoped service like DbContext).\n\nThe scoped dependency is held captive for the lifetime of the application, breaking thread-safety, leaking memory, and causing concurrency exceptions.",
    "seniorTip": "Enable 'options.ValidateScopes = true' in Program.cs (default in Development) to catch captive dependencies during container resolution."
  },
  {
    "id": "fc-10",
    "pillar": "aspnet",
    "topic": "IHttpClientFactory Socket Exhaustion",
    "front": "Why does instantiating 'new HttpClient()' inside a controller cause socket exhaustion?",
    "back": "Even when disposed, the underlying TCP socket remains in the 'TIME_WAIT' state for up to 4 minutes (RFC 793). Under load, all available ephemeral outbound ports are exhausted.\n\nIHttpClientFactory manages a pool of underlying 'HttpMessageHandler' instances, reusing sockets while rotating them every 2 minutes to respect DNS updates.",
    "seniorTip": "Prefer Typed Clients (services.AddHttpClient<IMyClient, MyClient>()) for strongly-typed injection and clean encapsulation."
  },
  {
    "id": "fc-11",
    "pillar": "aspnet",
    "topic": "Middleware Order & Short-Circuiting",
    "front": "How does middleware short-circuiting work in ASP.NET Core, and why does order matter?",
    "back": "Middleware executes in the order registered in Program.cs. Each middleware receives 'HttpContext' and 'RequestDelegate next'.\n\nIf a middleware does NOT call 'await next(context)' (e.g., authentication failure or rate limiting hit), the pipeline short-circuits and immediately returns back up the pipeline.",
    "seniorTip": "ExceptionHandler middleware must always be placed at the very top of the pipeline so it can catch unhandled exceptions thrown by subsequent components."
  },
  {
    "id": "fc-12",
    "pillar": "aspnet",
    "topic": "JWT Refresh Token Rotation",
    "front": "What is Refresh Token Rotation with Reuse Detection, and how does it prevent token theft?",
    "back": "1. Access token is short-lived (e.g., 15 minutes).\n2. Refresh token is single-use: when exchanged, a NEW refresh token is issued and the old one invalidated.\n3. Reuse Detection: If an already-used refresh token is presented, the auth server detects a breach, revokes the ENTIRE token family (all refresh tokens for that user session), and forces re-login.",
    "seniorTip": "Store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies to eliminate client-side XSS theft."
  },
  {
    "id": "fc-13",
    "pillar": "aspnet",
    "topic": "MediatR Pipeline Behaviors",
    "front": "What is an IPipelineBehavior<TRequest, TResponse> in MediatR, and what cross-cutting concerns does it solve?",
    "back": "It is an in-memory middleware pipeline that wraps around CQRS request handlers.\n\nCommon behaviors:\n• ValidationBehavior (runs FluentValidation before the handler)\n• LoggingBehavior (logs execution time and payload)\n• PerformanceMonitoringBehavior (alerts on handlers taking > 500ms)\n• TransactionBehavior (wraps Command in EF Core IDbContextTransaction)",
    "seniorTip": "Pipeline behaviors keep application command handlers 100% focused on business domain logic, satisfying Single Responsibility."
  },
  {
    "id": "fc-14",
    "pillar": "aspnet",
    "topic": "Output Caching vs Response Caching",
    "front": "How does .NET 8's Output Caching differ from legacy Response Caching?",
    "back": "• Response Caching: Relies on HTTP cache-control headers and client cooperation; limited server control.\n• Output Caching: Full server-side caching engine. Supports cache tag eviction ('EvictByTagAsync(\"products\")'), Redis distributed backplane, resource locking to prevent cache stampedes, and policy-based invalidation.",
    "seniorTip": "Use Output Caching for server-side cached API responses and tag them by entity type for instant invalidation upon mutations."
  },
  {
    "id": "fc-15",
    "pillar": "aspnet",
    "topic": "Minimal APIs vs Controllers",
    "front": "What makes ASP.NET Core Minimal APIs faster than classic MVC Controllers?",
    "back": "Minimal APIs bypass the entire MVC action invoker pipeline, model binding filters, and reflection-heavy controller discovery.\n\nThey compile directly to Endpoint route handlers using source generators, resulting in ~30% higher RPS (Requests Per Second) and faster startup time.",
    "seniorTip": "Use 'IEndpointFilter' in Minimal APIs to implement reusable validation, logging, and auth checks across route groups."
  },
  {
    "id": "fc-16",
    "pillar": "aspnet",
    "topic": "Rate Limiting in .NET 8",
    "front": "What are the 4 built-in Rate Limiting algorithms in ASP.NET Core 8?",
    "back": "1. Fixed Window: Fixed count per time window (bursts at boundary).\n2. Sliding Window: Segmented window smoothing out boundary spikes.\n3. Token Bucket: Constant refill of tokens; allows controlled bursts up to bucket capacity.\n4. Concurrency Limiter: Caps maximum active concurrent requests.",
    "seniorTip": "Use 'PartitionedRateLimiter.Create<HttpContext, string>' to apply separate rate limits per authenticated user ID or IP address."
  },
  {
    "id": "fc-17",
    "pillar": "sql",
    "topic": "Clustered vs Non-Clustered Index",
    "front": "What is the physical storage difference between a Clustered and a Non-Clustered index in SQL Server?",
    "back": "• Clustered Index: The leaf nodes ARE the actual data pages of the table (the table is physically sorted by the clustered key). Only 1 per table.\n• Non-Clustered Index: Separate B-Tree structure where leaf nodes contain index keys and a 'row locator' pointer (the clustered index key or heap RID) to find the actual row.",
    "seniorTip": "Always choose a narrow, monotonic, non-updating column (like an IDENTITY or Sequential GUID) for your clustered index to avoid page splits."
  },
  {
    "id": "fc-18",
    "pillar": "sql",
    "topic": "Covering Index & INCLUDE",
    "front": "What is a Covering Index, and how does the INCLUDE clause prevent Key Lookups?",
    "back": "A covering index contains all columns needed by a query, allowing SQL Server to satisfy the query entirely from the index leaf nodes without touching the clustered index.\n\nThe 'INCLUDE' clause stores non-key columns at the leaf level only (not in the B-Tree intermediate levels), reducing index size and overhead while eliminating Key Lookups.",
    "seniorTip": "Key Lookups are random I/O operations. In high-traffic queries, eliminating a Key Lookup can increase performance by 10x-50x."
  },
  {
    "id": "fc-19",
    "pillar": "sql",
    "topic": "SARGable Queries",
    "front": "What does SARGable mean in SQL, and why is 'WHERE YEAR(CreatedAt) = 2024' bad?",
    "back": "SARGable = 'Search ARGument ABLE'. It means the query optimizer can use an index seek rather than a full index scan.\n\nApplying a function to an indexed column (YEAR(CreatedAt)) prevents the B-Tree from seeking because the function must evaluate for every row. Refactor to:\n'WHERE CreatedAt >= \\'2024-01-01\\' AND CreatedAt < \\'2025-01-01\\''.",
    "seniorTip": "Implicit datatype conversions (e.g. comparing VARCHAR column against NVARCHAR parameter) also destroy SARGability!"
  },
  {
    "id": "fc-20",
    "pillar": "sql",
    "topic": "RCSI (Read Committed Snapshot)",
    "front": "What is RCSI (Read Committed Snapshot Isolation), and why is it essential for high-throughput SQL Server?",
    "back": "Under default Read Committed, readers take shared locks (S-locks) that block writers (X-locks), and writers block readers.\n\nRCSI uses row versioning in 'tempdb'. Readers read the last committed snapshot without acquiring S-locks, completely eliminating reader-writer blocking while preventing dirty reads!",
    "seniorTip": "Turn on RCSI using 'ALTER DATABASE MyDb SET READ_COMMITTED_SNAPSHOT ON'. This is the default in Azure SQL Database."
  },
  {
    "id": "fc-21",
    "pillar": "efcore",
    "topic": "AsNoTracking() Overhead",
    "front": "What internal EF Core structures are bypassed when you use .AsNoTracking()?",
    "back": "1. The Identity Map: EF Core does not store entity references in its internal dictionary.\n2. Snapshot Copies: EF Core does not take an initial copy of the entity's property values for change tracking.\n3. Fixup: Navigation property relationship fixup is omitted.\n\nResult: 40-60% less memory allocation and much faster execution.",
    "seniorTip": "If you only need identity resolution for duplicate entities in graph results, use .AsNoTrackingWithIdentityResolution()."
  },
  {
    "id": "fc-22",
    "pillar": "efcore",
    "topic": "Cartesian Explosion & AsSplitQuery",
    "front": "What is Cartesian Explosion in EF Core, and when should you use .AsSplitQuery()?",
    "back": "When using multiple .Include() on 1-to-many collections (e.g. Orders -> Items and Orders -> Notes), EF generates a single SQL JOIN that multiplies rows (Cartesian product), transmitting thousands of duplicate parent columns.\n\n.AsSplitQuery() splits the query into separate focused SQL queries for each collection, drastically reducing transferred network bytes.",
    "seniorTip": "Be careful: Split queries are not executed in a single atomic database transaction unless explicitly wrapped in 'BeginTransaction()'."
  },
  {
    "id": "fc-23",
    "pillar": "efcore",
    "topic": "Optimistic Concurrency & RowVersion",
    "front": "How is Optimistic Concurrency implemented in EF Core with SQL Server RowVersion?",
    "back": "Add a 'byte[] RowVersion' property configured with '[Timestamp]' or 'IsRowVersion()'. SQL Server automatically increments this binary number on every UPDATE.\n\nEF Core adds 'WHERE RowVersion = @original' to the UPDATE statement. If another user updated the row first, affected rows is 0 and EF throws 'DbUpdateConcurrencyException'.",
    "seniorTip": "Handle the exception by reloading the database values, presenting the conflict to the user, or executing a custom merge strategy."
  },
  {
    "id": "fc-24",
    "pillar": "efcore",
    "topic": "Dapper vs EF Core Hybrid",
    "front": "Why do top senior architects use a hybrid Dapper + EF Core architecture in enterprise .NET apps?",
    "back": "• EF Core: Used for the Command (Write) side. Excellent for complex business entity graphs, domain invariants, change tracking, and transactional units of work.\n• Dapper: Used for the Query (Read) side. Zero tracking overhead, direct raw SQL execution, and instant micro-second object mapping for read-heavy dashboards.",
    "seniorTip": "This is a practical implementation of CQRS (Command Query Responsibility Segregation) at the data access layer."
  },
  {
    "id": "fc-25",
    "pillar": "ui",
    "topic": "React Fiber Architecture",
    "front": "What is a React Fiber node, and how does the Fiber reconciler enable non-blocking UI rendering?",
    "back": "A Fiber is a JavaScript object representing a component and its state/DOM node. Fiber reimagines the call stack into an interruptible singly-linked list tree (child, sibling, return pointers).\n\nThe reconciler performs work in a cooperative multitasking work loop (yielding control to the browser via MessageChannel/requestIdleCallback) so high-priority user input is never blocked.",
    "seniorTip": "Fiber uses double buffering: a 'current' tree displayed on screen and a 'workInProgress' tree constructed offscreen before swapping."
  },
  {
    "id": "fc-26",
    "pillar": "ui",
    "topic": "useTransition Hook",
    "front": "What is the primary use case of React's useTransition() hook?",
    "back": "It marks a state update as a non-urgent 'transition'.\n\n```ts\nconst [isPending, startTransition] = useTransition();\nstartTransition(() => {\n  setFilterQuery(input);\n});\n```\nReact will prioritize urgent updates (like typing in an input field) and render the filtered list in the background without freezing the input!",
    "seniorTip": "useTransition does NOT throttle or debounce; it uses concurrent scheduling to interrupt rendering if a higher-priority update occurs."
  },
  {
    "id": "fc-27",
    "pillar": "ui",
    "topic": "Stale Closure in useEffect",
    "front": "What causes a 'stale closure' inside a useEffect or callback hook in React?",
    "back": "When an effect or callback captures variables from the component's render scope, but those variables are omitted from the dependency array.\n\nThe closure retains the original variable references from when it was created instead of the latest values.\n\nFix: Include all dependencies, use functional state updates ('setCount(c => c + 1)'), or use a mutable 'useRef'.",
    "seniorTip": "Always respect the ESLint 'react-hooks/exhaustive-deps' rule rather than disabling it with comments."
  },
  {
    "id": "fc-28",
    "pillar": "ui",
    "topic": "Zustand vs React Context",
    "front": "Why does Zustand outperform React Context for high-frequency state updates?",
    "back": "• React Context: Any value change in Context triggers a re-render of ALL consuming components, even if they only read a slice of the state.\n• Zustand: Uses external store subscriptions with fine-grained selectors: 'useStore(s => s.user.name)'. Components ONLY re-render when their selected slice strictly changes (Object.is).",
    "seniorTip": "Zustand stores can also be accessed outside of React components (e.g. in Axios interceptors or utility functions) without hook rules."
  },
  {
    "id": "fc-29",
    "pillar": "ui",
    "topic": "List Virtualization (Windowing)",
    "front": "How does List Virtualization render a list of 100,000 items with 60 FPS performance?",
    "back": "Instead of creating 100,000 DOM nodes (which crashes browser layout/rendering engines), virtualization calculates the scroll container offset and ONLY mounts the 15-20 DOM nodes currently visible in the user's viewport.\n\nTop and bottom padding (or translateY transforms) simulate the total scrollable height.",
    "seniorTip": "Popular libraries: @tanstack/react-virtual or react-window. Keeps DOM memory footprint constant regardless of list size."
  },
  {
    "id": "fc-30",
    "pillar": "ui",
    "topic": "Discriminated Unions & Exhaustiveness",
    "front": "How do you enforce compile-time exhaustive checking on TypeScript Discriminated Unions?",
    "back": "Use a shared literal discriminator property (e.g. 'type: \"success\" | \"error\"') and handle all cases in a switch block with a default case asserting 'never':\n\n```ts\ndefault: const _exhaustive: never = action; throw new Error('Unhandled case');\n```\nIf a developer adds a new union variant without handling it, TypeScript flags a compile-time error.",
    "seniorTip": "Discriminated unions eliminate optional property soup ('{ error?: string; data?: T }') and represent domain states accurately."
  },
  {
    "id": "fc-31",
    "pillar": "ui",
    "topic": "TypeScript Utility Types",
    "front": "What is the difference between Pick<T, K>, Omit<T, K>, and ReturnType<T>?",
    "back": "• Pick<T, K>: Constructs a type by picking specific keys K from T.\n• Omit<T, K>: Constructs a type by picking all keys from T then removing K.\n• ReturnType<T>: Extracts the return type of a function type T using conditional types ('T extends (...args: any) => infer R ? R : any').",
    "seniorTip": "Combine them: 'type SafeUserDto = Omit<User, \"passwordHash\" | \"securityStamp\">;' for bulletproof DTO definitions."
  },
  {
    "id": "fc-32",
    "pillar": "ui",
    "topic": "React 19 Server Actions",
    "front": "What are React 19 Server Actions and how do they interact with useActionState?",
    "back": "Server Actions are asynchronous functions declared with 'use server' that execute securely on the server directly from client form submissions or event handlers.\n\n'useActionState' manages pending states, optimistic updates, and server responses without manual fetch() boilerplate.",
    "seniorTip": "In ASP.NET Core + React decoupled apps, Server Actions are less common, but understanding them demonstrates modern React mastery."
  },
  {
    "id": "fc-33",
    "pillar": "cloud",
    "topic": "Deployment Slots & Zero-Downtime Swap",
    "front": "How do Azure App Service Deployment Slots achieve zero-downtime deployments without dropping user requests?",
    "back": "1. Deploy new code to the Staging slot.\n2. Warmup: App Service sends HTTP requests to the warmup endpoint specified in 'applicationInitialization' (in web.config).\n3. Swap: Once warmup succeeds, Azure switches the virtual IP routing rules. The production slot now serves the new build instantly.\n4. If issues occur, immediate instant rollback via swap.",
    "seniorTip": "Mark environmental connection strings as 'slotSetting: true' so they stay sticky to the staging or production slot during the swap."
  },
  {
    "id": "fc-34",
    "pillar": "cloud",
    "topic": "Azure Managed Identity",
    "front": "What is an Azure Managed Identity, and why is it superior to connection strings with passwords?",
    "back": "An automatically managed identity in Microsoft Entra ID (Azure AD) assigned to an Azure resource.\n\nBenefits:\n• Zero credentials or passwords in code or config files.\n• Azure automatically handles credential rotation.\n• In C#, use 'DefaultAzureCredential()' from Azure.Identity to authenticate to Azure SQL, Key Vault, and Service Bus seamlessly.",
    "seniorTip": "System-Assigned is tied to the resource lifecycle; User-Assigned can be shared across multiple instances or scalesets."
  },
  {
    "id": "fc-35",
    "pillar": "cloud",
    "topic": "Transactional Outbox Pattern",
    "front": "Why is the Transactional Outbox Pattern essential when publishing Azure Service Bus messages from an API?",
    "back": "The Dual-Write Problem: If you update a database and then publish a message over the network to Service Bus, one can fail while the other succeeds, causing data inconsistency.\n\nOutbox Pattern: Save the business entity AND the message payload in the SAME local database ACID transaction. A reliable background worker publishes to Service Bus.",
    "seniorTip": "MassTransit has built-in Transactional Outbox support for EF Core with just one line: 'cfg.AddEntityFrameworkOutbox<AppDbContext>()'."
  },
  {
    "id": "fc-36",
    "pillar": "cloud",
    "topic": "Ubuntu Chiseled Docker Containers",
    "front": "Why are Microsoft's .NET Chiseled Ubuntu container images recommended for production deployments?",
    "back": "• Size: Ultra-minimal (<100MB vs 300MB+ for standard images).\n• Security: Distroless architecture: NO package manager (no apt/dpkg), NO shell (no bash/sh), and runs as a non-root user by default.\n• Attack Surface: Eliminates over 90% of OS-level CVE vulnerability scanner alerts.",
    "seniorTip": "Use base image: 'mcr.microsoft.com/dotnet/aspnet:8.0-chiseled' in your production Dockerfile stage."
  },
  {
    "id": "fc-37",
    "pillar": "cloud",
    "topic": "Multi-Stage YAML Pipeline Gates",
    "front": "What is the difference between Pipeline Environments with Approvals vs simple Script tasks in Azure DevOps?",
    "back": "Pipeline Environments integrate with Azure DevOps Governance:\n• Manual Approval Gates (e.g. Lead Architect or QA approval before Prod deployment).\n• Automated Checks: Azure Monitor alerts, REST API validations, change management approvals.\n• Traceability: Full deployment history and commit-to-production tracking.",
    "seniorTip": "Always use Deployment Jobs ('deployment: DeployProd') rather than standard Jobs to access Environments, rollout strategies (canary, rolling), and rollback hooks."
  },
  {
    "id": "fc-38",
    "pillar": "cloud",
    "topic": "Azure Service Bus Dead-Letter Queue",
    "front": "When does Azure Service Bus automatically move a message to the Dead-Letter Queue (DLQ)?",
    "back": "1. MaxDeliveryCount exceeded (consumer threw unhandled exceptions and failed N retries).\n2. TimeToLive (TTL) expired and EnableDeadLetteringOnMessageExpiration is true.\n3. Subscription filter evaluation exception or message size issues.\n4. Explicitly called by consumer code: 'receiver.DeadLetterMessageAsync()'.",
    "seniorTip": "Always configure alerts on DLQ message count > 0; messages in DLQ represent lost or poisoned business transactions."
  },
  {
    "id": "fc-39",
    "pillar": "cloud",
    "topic": "Azure Front Door vs Traffic Manager",
    "front": "Why choose Azure Front Door over Azure Traffic Manager for global multi-region web routing?",
    "back": "• Traffic Manager: DNS-based load balancer. Subject to DNS TTL caching; failover can take 1-5 minutes to propagate to clients.\n• Front Door: Anycast Layer 7 HTTP/3 reverse proxy with SSL termination at edge PoPs, WAF security, path-based routing, and split-second instant health-probe failover.",
    "seniorTip": "Front Door also caches static assets at the edge, functioning as an integrated CDN."
  },
  {
    "id": "fc-40",
    "pillar": "cloud",
    "topic": "OpenTelemetry Distributed Tracing",
    "front": "How does W3C Trace Context enable end-to-end distributed tracing across microservices in .NET?",
    "back": "The W3C TraceContext specification defines the 'traceparent' HTTP header ('00-{trace-id}-{parent-id}-{trace-flags}').\n\nWhen .NET sends an HTTP request via HttpClient, it automatically injects this header. Downstream services read it, correlating all logs, traces, and metrics into a single unified trace tree in Application Insights / Jaeger.",
    "seniorTip": "In .NET 6+, ActivitySource and Activity directly implement OpenTelemetry tracing without third-party vendor lock-in."
  },
  {
    "id": "fc-linq-1",
    "pillar": "linq",
    "topic": "IEnumerable vs IQueryable",
    "front": "What is the critical performance difference between IEnumerable<T> and IQueryable<T> in LINQ?",
    "back": "• IEnumerable<T> uses Func<T, bool> delegates and evaluates IN-MEMORY on the client machine.\n• IQueryable<T> uses Expression<Func<T, bool>> (expression trees) and evaluates OUT-OF-PROCESS by translating LINQ into native SQL on the database server.\n\nCasting to IEnumerable before applying Where/Take forces EF Core to pull the entire table into client memory!",
    "seniorTip": "Always keep queries as IQueryable<T> until all WHERE, TAKE, and SELECT projections are applied."
  },
  {
    "id": "fc-linq-2",
    "pillar": "linq",
    "topic": "Multiple Enumeration",
    "front": "What causes the 'Possible multiple enumeration of IEnumerable' bug, and how do you prevent it?",
    "back": "LINQ queries are deferred. If an unmaterialized sequence is evaluated more than once (e.g. 'if (items.Any()) ... foreach (var x in items)'), the underlying query/generator/database call re-runs on every evaluation!\n\nFix: Materialize with .ToList() or .ToArray() before multiple iterations, or use TryGetNonEnumeratedCount() in .NET 6+.",
    "seniorTip": "If you only need a single forward pass over millions of items, do NOT call .ToList(); stream with 'foreach' to preserve O(1) memory."
  },
  {
    "id": "fc-linq-3",
    "pillar": "linq",
    "topic": "SelectMany vs Select",
    "front": "What is the difference between .Select() and .SelectMany() in LINQ?",
    "back": "• .Select() produces a 1-to-1 projection (transforms each element, returning IEnumerable<TOut>).\n• .SelectMany() flattens 1-to-many intermediate sequences into a single flat collection (monadic flatMap).\n\nIn EF Core, SelectMany translates into SQL CROSS APPLY or INNER JOIN.",
    "seniorTip": "Use SelectMany to query nested child collections (e.g., all order items across all orders) without writing nested foreach loops."
  },
  {
    "id": "fc-linq-4",
    "pillar": "linq",
    "topic": "GroupBy vs ToLookup",
    "front": "When should you use .ToLookup() instead of .GroupBy() or .ToDictionary()?",
    "back": "• GroupBy(): Deferred and streamed. Multiple enumerations re-evaluate.\n• ToLookup(): Immediately materialized in memory. Allows duplicate keys, and querying a non-existent key safely returns an empty sequence without throwing.\n• ToDictionary(): Immediately materialized, but requires strictly UNIQUE keys (duplicate keys throw ArgumentException).",
    "seniorTip": "Use ToLookup() when creating in-memory 1-to-many indexes for sub-millisecond parent-child lookups."
  }
];
