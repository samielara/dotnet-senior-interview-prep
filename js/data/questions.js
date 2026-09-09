// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM
// Organized into 7 Focused Technical Modules + Top 10 Coding Questions Arena
// Sourced from top GitHub .NET repositories and Reddit r/dotnet interview patterns
// ============================================================================

window.INTERVIEW_QUESTIONS = [
  {
    "id": "q-csharp-1",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Task",
      "ValueTask",
      "Memory Allocation",
      "Performance"
    ],
    "title": "Task vs. ValueTask: Internal Mechanics, Allocations, and Pitfalls",
    "pitch": "Task is a reference type allocated on the managed heap every time an asynchronous operation is initiated. ValueTask is a discriminated union value type (struct) designed to avoid heap allocation entirely when an operation completes synchronously (such as a cache hit or buffered stream read). However, ValueTask has strict consumption rules: it cannot be awaited multiple times, awaited concurrently, or used with Task.WhenAll without converting via .AsTask().",
    "deepDive": "Under the hood, returning a Task<T> from a method creates an instance of System.Threading.Tasks.Task on the heap, incurring GC Gen 0 pressure. When an API method is called millions of times per second and completes synchronously 90% of the time (e.g., fetching a session from in-memory cache), these Task allocations cause significant GC churn.\n\nValueTask<T> solves this by wrapping either a TResult value directly (for synchronous completion with ZERO allocation) or an IValueTaskSource / Task<T> (for asynchronous completion). \n\nHowever, ValueTask<T> has important trade-offs:\n1. State Machine Overhead: If the method completes asynchronously, using ValueTask is actually slightly more expensive than Task because the underlying state machine struct must be boxed or use IValueTaskSource pooled nodes.\n2. Safety Hazard: Because IValueTaskSource implementations reuse backing objects across invocations, awaiting a ValueTask twice or awaiting it concurrently can lead to race conditions and ObjectDisposedException.",
    "codeSnippet": "// High-performance cache accessor returning ValueTask<UserDto>\npublic class UserCacheService\n{\n    private readonly IMemoryCache _memoryCache;\n    private readonly AppDbContext _dbContext;\n\n    public UserCacheService(IMemoryCache cache, AppDbContext db)\n    {\n        _memoryCache = cache;\n        _dbContext = db;\n    }\n\n    public ValueTask<UserDto> GetUserAsync(int userId, CancellationToken ct)\n    {\n        // 1. FAST PATH (Synchronous): Zero heap allocation\n        if (_memoryCache.TryGetValue(userId, out UserDto? cached) && cached is not null)\n        {\n            return new ValueTask<UserDto>(cached);\n        }\n\n        // 2. SLOW PATH (Asynchronous): Delegates to async helper\n        return new ValueTask<UserDto>(FetchAndCacheUserAsync(userId, ct));\n    }\n\n    private async Task<UserDto> FetchAndCacheUserAsync(int userId, CancellationToken ct)\n    {\n        var user = await _dbContext.Users\n            .AsNoTracking()\n            .Where(u => u.Id == userId)\n            .Select(u => new UserDto(u.Id, u.Email, u.FullName))\n            .FirstAsync(ct);\n\n        _memoryCache.Set(userId, user, TimeSpan.FromMinutes(10));\n        return user;\n    }\n}",
    "redFlags": [
      "Stating that 'ValueTask should always replace Task everywhere' (it shouldn't; only on high-frequency sync-heavy paths).",
      "Awaiting a ValueTask multiple times in code without using .AsTask().",
      "Using ValueTask in public interface contracts without measuring cache hit rates."
    ],
    "proTips": [
      "Benchmark with BenchmarkDotNet to verify that the synchronous path is executed > 80% of the time before migrating to ValueTask.",
      "If you need to pass a ValueTask into Task.WhenAll or Task.WhenAny, always call .AsTask() first: await Task.WhenAll(v1.AsTask(), v2.AsTask())."
    ]
  },
  {
    "id": "q-csharp-2",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Async/Await",
      "IAsyncStateMachine",
      "CLR",
      "Compiler"
    ],
    "title": "Async/Await Under the Hood: The Roslyn State Machine Lowering",
    "pitch": "The C# compiler lowers an async method into an internal state machine struct implementing IAsyncStateMachine. It replaces your method body with an integer state tracker, fields to capture local variables and arguments, a MoveNext() method with a switch-jump table, and an AsyncTaskMethodBuilder. When an uncompleted awaiter is encountered, the state machine registers itself as a completion callback via INotifyCompletion, saves the execution context, and unwinds the call stack without blocking the OS thread.",
    "deepDive": "When you declare 'async Task DoWorkAsync()', the compiler generates:\n1. Struct State Machine: Generates '<DoWorkAsync>d__0 : IAsyncStateMachine' struct to prevent heap allocation for the state machine itself if it finishes synchronously.\n2. Builder: Uses AsyncTaskMethodBuilder<TResult> to manage the lifecycle and construct the returned Task.\n3. MoveNext(): All synchronous segments between awaits are separated by state numbers (-1 = running, 0..N = suspended at awaiter N, -2 = finished).\n4. Context Capture: If SynchronizationContext.Current or ExecutionContext is present, the builder captures it to ensure AsyncLocal<T> and security principals flow correctly upon resumption.\n5. Invocations: When the awaiter calls 'OnCompleted(Action)', if the awaiter isn't done, control returns to the caller immediately. When the I/O completion port (IOCP) notifies Windows that bytes arrived, a ThreadPool worker invokes MoveNext(), jumping straight to state N via the switch table.",
    "codeSnippet": "// Conceptually lowered code generated by Roslyn for async Task ExampleAsync()\n[StructLayout(LayoutKind.Auto)]\nprivate struct <ExampleAsync>d__1 : IAsyncStateMachine\n{\n    public int <>1__state;\n    public AsyncTaskMethodBuilder <>t__builder;\n    private TaskAwaiter <>u__1;\n\n    public void MoveNext()\n    {\n        try\n        {\n            if (<>1__state == 0)\n            {\n                // Resume after await\n                <>u__1.GetResult(); // Throws original exception if faulted\n                return;\n            }\n\n            TaskAwaiter awaiter = SomeIoOperationAsync().GetAwaiter();\n            if (!awaiter.IsCompleted)\n            {\n                <>1__state = 0;\n                <>u__1 = awaiter;\n                // Hook up continuation callback to ThreadPool\n                <>t__builder.AwaitUnsafeOnCompleted(ref awaiter, ref this);\n                return;\n            }\n            awaiter.GetResult();\n        }\n        catch (Exception ex)\n        {\n            <>1__state = -2;\n            <>t__builder.SetException(ex);\n            return;\n        }\n        <>1__state = -2;\n        <>t__builder.SetResult();\n    }\n\n    public void SetStateMachine(IAsyncStateMachine stateMachine) => <>t__builder.SetStateMachine(stateMachine);\n}",
    "redFlags": [
      "Claiming that 'async spawns a new background thread for each await' (I/O async operations use hardware interrupts & OS completion ports without dedicated threads).",
      "Thinking that code prior to the first await runs asynchronously (everything up to the first awaited Task that returns IsCompleted=false runs synchronously on the caller thread)."
    ],
    "proTips": [
      "In library code, always use .ConfigureAwait(false) to skip capturing the SynchronizationContext, saving execution context flow overhead and avoiding UI/ASP.NET deadlocks.",
      "Inspect the lowered state machine using tools like sharplab.io or ildasm to analyze closure captures."
    ]
  },
  {
    "id": "q-csharp-3",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Garbage Collection",
      "LOH",
      "POH",
      "Memory Management"
    ],
    "title": "CLR Garbage Collection: Generations, LOH 85KB Threshold, and POH",
    "pitch": "The CLR GC is a generational, tracing, mark-and-sweep compacting collector based on the weak generational hypothesis: new objects die young. It divides heap memory into Gen 0 (ephemeral), Gen 1 (survival buffer), Gen 2 (long-lived), the Large Object Heap (LOH) for allocations >= 85,000 bytes, and the Pinned Object Heap (POH, added in .NET 5). While Gen 0/1/2 undergo compaction to eliminate fragmentation, the LOH is generally swept without compaction due to the prohibitive cost of copying large memory blocks.",
    "deepDive": "Generations and Collection Triggers:\n1. Gen 0 / Gen 1 (Ephemeral Segment): Compacted frequently in milliseconds (often < 1ms). Surviving objects promote to the next generation.\n2. Gen 2 (Full GC): Collects Gen 0, 1, and 2. Can cause 'Stop-The-World' pauses unless running Concurrent/Background GC.\n3. Large Object Heap (LOH): Objects >= 85,000 bytes (e.g. large byte arrays, large strings) bypass Gen 0/1 directly to LOH. Because LOH is not compacted by default, alternating allocations of large objects cause fragmentation, leading to OutOfMemoryException even with gigabytes of free RAM.\n4. Pinned Object Heap (POH): .NET 5+ introduced POH (GC.AllocateArray<T>(..., pinned: true)). Pinned buffers used for socket/file I/O no longer fragment Gen 0 or LOH because they are segregated into their own non-moving heap segment.",
    "codeSnippet": "// Zero-allocation buffering using ArrayPool to avoid LOH fragmentation\npublic async Task ProcessLargeStreamAsync(Stream networkStream, CancellationToken ct)\n{\n    // RENT a 128KB buffer (Normally > 85KB would trigger LOH allocation!)\n    byte[] buffer = ArrayPool<byte>.Shared.Rent(128 * 1024);\n    try\n    {\n        int bytesRead;\n        while ((bytesRead = await networkStream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)\n        {\n            // Process bytes without heap allocation\n            ProcessChunk(buffer.AsSpan(0, bytesRead));\n        }\n    }\n    finally\n    {\n        // RETURN buffer to pool so it can be reused without GC involvement\n        ArrayPool<byte>.Shared.Return(buffer, clearArray: false);\n    }\n}",
    "redFlags": [
      "Recommending 'calling GC.Collect() manually' in production code.",
      "Not knowing the 85,000 byte threshold for the LOH.",
      "Believing that all garbage collections compact all heaps equally."
    ],
    "proTips": [
      "Use GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce before a planned maintenance window if LOH compaction is strictly needed.",
      "Monitor '% Time in GC' in dotnet-counters or Application Insights. If it exceeds 5-10%, investigate LOH allocations and Gen 2 promotions using PerfView or dotnet-dump."
    ]
  },
  {
    "id": "q-csharp-4",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Span<T>",
      "Memory<T>",
      "ref struct",
      "Zero Allocation"
    ],
    "title": "Span<T> vs Memory<T>: Stack-Only ref structs vs Heap-Safe Memory",
    "pitch": "Span<T> is a ref struct representing a contiguous region of arbitrary memory (managed array, stack-allocated buffer, or unmanaged native memory). Because it is a ref struct, the CLR guarantees it resides solely on the execution stack, meaning it cannot be boxed, stored on classes, or used across async await points. Memory<T> is a regular struct that wraps an underlying memory owner, allowing contiguous memory slices to safely live on the heap and be passed into asynchronous methods.",
    "deepDive": "Why was Span<T> introduced in C# 7.2?\nHistorically, string parsing (e.g. Substring(), Split()) allocated millions of transient string objects on the managed heap. Span<T> and ReadOnlySpan<T> provide safe, boundary-checked direct memory pointer arithmetic. A slice (span.Slice(start, length)) creates an interior pointer with zero heap allocations.\n\nRef Struct Limitations:\nBecause Span<T> contains a ByReference<T> (a managed interior pointer) and a length, placing it on the heap could result in dangling stack pointers if the enclosing stack frame unrolls.\nThus, C# enforces:\n- Cannot be boxed or cast to object/ValueType/interfaces.\n- Cannot be a field of a normal class or struct.\n- Cannot be a type parameter in generics (e.g. List<Span<T>> is invalid).\n- Cannot be used across 'await' or 'yield return' boundaries (because state machines hoist locals to heap-allocated fields).\n\nSolution for Async: System.Memory<T> and ReadOnlyMemory<T>. They encapsulate an array or IMemoryOwner<T> with an offset and length, safe for asynchronous state machines.",
    "codeSnippet": "// High-performance zero-allocation string / span parser\npublic static class CsvParser\n{\n    // Consumes ReadOnlySpan<char> directly from memory without sub-allocating strings\n    public static bool TryParseRecord(ReadOnlySpan<char> line, out int id, out decimal amount)\n    {\n        id = 0;\n        amount = 0m;\n\n        int firstComma = line.IndexOf(',');\n        if (firstComma == -1) return false;\n\n        ReadOnlySpan<char> idSpan = line.Slice(0, firstComma);\n        ReadOnlySpan<char> remaining = line.Slice(firstComma + 1);\n\n        if (!int.TryParse(idSpan, out id)) return false;\n        if (!decimal.TryParse(remaining, out amount)) return false;\n\n        return true;\n    }\n}",
    "redFlags": [
      "Trying to store a Span<T> as a field in a controller, service, or singleton.",
      "Not knowing why Span<T> cannot be used in an async method before an await.",
      "Creating new strings with .Substring() inside high-frequency loops instead of .AsSpan()."
    ],
    "proTips": [
      "Use stackalloc byte[256] with Span<byte> for small scratchpad buffers (< 1KB) to achieve 100% stack-allocated zero-GC execution.",
      "Use MemoryMarshal.Cast<TFrom, TTo>() to re-interpret spans without copying memory bytes (e.g. byte span to int span)."
    ]
  },
  {
    "id": "q-csharp-5",
    "pillar": "csharp",
    "seniority": "Mid",
    "tags": [
      "Records",
      "Pattern Matching",
      "Immutability",
      "C# 9/10/11"
    ],
    "title": "Records, Value Equality, and Advanced Pattern Matching in Modern C#",
    "pitch": "Records are reference types (or value types via 'record struct') that synthesize value-based equality, GetHashCode, ToString, and non-destructive mutation via the 'with' keyword by default. Coupled with modern pattern matching (type, relational, list, and property patterns), records provide expressive Domain-Driven Design Value Objects and immutable DTOs without writing boilerplate equality overrides.",
    "deepDive": "Under the hood of 'public record Person(string Name, int Age);':\n1. Properties: Compiles to 'public string Name { get; init; }' and 'public int Age { get; init; }'.\n2. Equality: Implements IEquatable<Person>, overrides Equals(object?), and overrides == / != to compare all property values rather than reference addresses.\n3. Clone Constructor: Synthesizes a protected copy constructor 'protected Person(Person original)' used by the 'with' expression to clone instances while mutating select fields.\n4. Deconstruct: Implements 'Deconstruct(out string name, out int age)' enabling tuple-like destructuring.\n\nPattern Matching Evolution:\nModern C# supports exhaustive pattern matching across switch expressions:\n- Property Patterns: { Status: OrderStatus.Shipped, Total: > 100 }\n- Relational Patterns: x is >= 10 and <= 50\n- Type Patterns: order is ExpressOrder { Priority: true }\n- List Patterns: numbers is [1, 2, .. var rest, 99]",
    "codeSnippet": "public record Order(int Id, decimal Total, string Country, bool IsVip);\n\npublic static class DiscountEngine\n{\n    public static decimal CalculateDiscount(Order order) => order switch\n    {\n        // Property pattern + relational pattern\n        { IsVip: true, Total: > 500m } => 0.25m,\n        { IsVip: true, Total: > 100m } => 0.15m,\n        // Relational and logical combinators\n        { Country: \"US\" or \"CA\", Total: >= 200m } => 0.10m,\n        { Total: < 50m } => 0.00m,\n        _ => 0.05m\n    };\n\n    public static Order ApplySeasonalPromotion(Order original)\n    {\n        // Non-destructive mutation: returns cloned instance with altered Total\n        return original with { Total = original.Total * 0.9m };\n    }\n}",
    "redFlags": [
      "Assuming records are value types (records are 'record class' reference types by default unless explicitly declared as 'record struct').",
      "Using records for mutable EF Core entities where reference equality and Change Tracker identity maps are expected."
    ],
    "proTips": [
      "Use 'readonly record struct' for high-throughput Domain Value Objects (e.g. Money, Coordinates) to eliminate both heap allocation and unintended mutability.",
      "Always use switch expressions over switch statements for pattern matching to ensure compiler warnings on non-exhaustive branches."
    ]
  },
  {
    "id": "q-csharp-6",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "SemaphoreSlim",
      "Concurrency",
      "Locks",
      "Async"
    ],
    "title": "SemaphoreSlim vs ReaderWriterLockSlim: Throttling and Async Mutual Exclusion",
    "pitch": "The C# 'lock' statement and ReaderWriterLockSlim rely on thread affinity and block the underlying operating system thread, making them incompatible with async/await. SemaphoreSlim is a lightweight synchronization primitive that supports true asynchronous locking via WaitAsync(). It can be initialized to count 1 for mutual exclusion (replacing lock) or count N for concurrency throttling (such as limiting outgoing API calls to 10 concurrent requests without thread starvation).",
    "deepDive": "Why 'lock' cannot wrap an 'await':\nThe C# lock statement is syntactic sugar for Monitor.Enter(obj) / Monitor.Exit(obj). Monitor enforces thread affinity: the exact same managed thread that acquired the lock must release it. However, in an async method, the code following an 'await' resumption may execute on a completely different ThreadPool thread, causing Monitor.Exit to throw SynchronizationLockException.\n\nSemaphoreSlim Mechanics:\n- Synchronous & Asynchronous: Exposes both .Wait() (blocking) and .WaitAsync() (non-blocking, returns a Task).\n- In WaitAsync(), if the semaphore count is 0, the calling thread is NOT blocked. Instead, a TaskCompletionSource node is enqueued, and the calling thread is freed back to the ThreadPool.\n- When another caller executes .Release(), the next queued waiter's Task is completed, scheduling its continuation on the ThreadPool.",
    "codeSnippet": "// Rate-throttled batch processor using SemaphoreSlim\npublic class RateThrottledProcessor\n{\n    private readonly HttpClient _httpClient;\n    // Limits maximum concurrent downstream outbound requests to 5\n    private readonly SemaphoreSlim _throttle = new SemaphoreSlim(5, 5);\n\n    public RateThrottledProcessor(HttpClient httpClient) => _httpClient = httpClient;\n\n    public async Task ProcessUrlsAsync(IEnumerable<string> urls, CancellationToken ct)\n    {\n        var tasks = urls.Select(async url =>\n        {\n            // Asynchronously wait for an open slot without holding a thread\n            await _throttle.WaitAsync(ct);\n            try\n            {\n                var response = await _httpClient.GetStringAsync(url, ct);\n                Console.WriteLine($\"Processed {url}: {response.Length} chars\");\n            }\n            finally\n            {\n                // Guarantee slot is released even on exception\n                _throttle.Release();\n            }\n        });\n\n        await Task.WhenAll(tasks);\n    }\n}",
    "redFlags": [
      "Calling .Wait() or .Result on SemaphoreSlim in an async method instead of await .WaitAsync().",
      "Forgetting to release the SemaphoreSlim in a finally block (leads to permanent system deadlock).",
      "Using Thread.Sleep() inside an async pipeline."
    ],
    "proTips": [
      "To prevent boilerplate try/finally blocks, create an 'IDisposable' wrapper struct pattern: using (await _semaphore.UseWaitAsync(ct)) { ... }.",
      "If you need reader-writer semantics with async, SemaphoreSlim does not natively support multiple readers; use Stephen Toub's AsyncReaderWriterLock."
    ]
  },
  {
    "id": "q-csharp-7",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Channel<T>",
      "Producer-Consumer",
      "Backpressure",
      "High Throughput"
    ],
    "title": "System.Threading.Channels: Lock-Free Concurrency and Backpressure",
    "pitch": "System.Threading.Channels is a high-performance, asynchronous, thread-safe communication library specifically built for producer-consumer workflows. Unlike BlockingCollection<T> which blocks OS threads, Channel<T> is completely non-blocking with async ReadAllAsync() and WriteAsync(). Most crucially, Bounded Channels provide backpressure: when the buffer reaches capacity, producers are asynchronously paused until consumers catch up, preventing OutOfMemoryException during traffic spikes.",
    "deepDive": "Internal Architecture of Channel<T>:\n1. Bounded vs Unbounded:\n   - UnboundedChannel<T>: Infinite memory buffer. Fast, but dangerous under prolonged producer spikes (can crash server with OOM).\n   - BoundedChannel<T>: Has a strict capacity limit. Supports BoundedChannelFullMode (Wait, DropOldest, DropNewest, DropWrite).\n2. Lock-Free Implementation:\n   Under the hood, Channel<T> avoids heavyweight kernel synchronization handles. It uses lock-free circular ring buffers and Interlocked CAS (Compare-And-Swap) operations.\n3. Optimizations:\n   - SingleReader = true: Enables specialized non-atomic reader pointers, eliminating atomic contention.\n   - SingleWriter = true: Optimizes write pointer advancements for single-publisher streams.\n4. Completion: Calling 'channel.Writer.Complete()' gracefully signals to the consumer that no more items will be published, causing 'await foreach (var item in channel.Reader.ReadAllAsync())' to exit cleanly without cancellation tokens.",
    "codeSnippet": "public class EventIngestionPipeline\n{\n    private readonly Channel<TelemetryEvent> _channel;\n\n    public EventIngestionPipeline()\n    {\n        // Bounded channel to enforce backpressure at 10,000 items\n        var options = new BoundedChannelOptions(10_000)\n        {\n            FullMode = BoundedChannelFullMode.Wait,\n            SingleWriter = false,\n            SingleReader = true\n        };\n        _channel = Channel.CreateBounded<TelemetryEvent>(options);\n    }\n\n    // High-frequency producer method\n    public async ValueTask PublishAsync(TelemetryEvent evt, CancellationToken ct)\n    {\n        // Asynchronously pauses caller if buffer is full\n        await _channel.Writer.WriteAsync(evt, ct);\n    }\n\n    // Background consumer loop\n    public async Task StartConsumingAsync(CancellationToken ct)\n    {\n        // Streams items cleanly as they arrive without busy polling\n        await foreach (var evt in _channel.Reader.ReadAllAsync(ct))\n        {\n            await ProcessTelemetryAsync(evt, ct);\n        }\n    }\n\n    private async Task ProcessTelemetryAsync(TelemetryEvent evt, CancellationToken ct)\n    {\n        // Batch flush or external network call\n        await Task.Yield();\n    }\n}",
    "redFlags": [
      "Using unbounded channels in production without evaluating memory exhaustion risks.",
      "Using Thread.Sleep or Task.Delay in a polling loop to inspect a ConcurrentQueue instead of Channel<T>."
    ],
    "proTips": [
      "In ASP.NET Core background services, always wire the stoppingToken into channel.Reader.ReadAllAsync(stoppingToken).",
      "Channels integrate seamlessly with ASP.NET Core WebSockets and gRPC Server Streaming by piping ChannelReader directly into the response stream."
    ]
  },
  {
    "id": "q-csharp-8",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "ThreadPool",
      "Sync-over-Async",
      "Deadlock",
      "Starvation"
    ],
    "title": "ThreadPool Starvation and the Sync-over-Async Anti-Pattern",
    "pitch": "Sync-over-Async is the dangerous anti-pattern of synchronously blocking on an asynchronous Task using .Result, .Wait(), or .GetAwaiter().GetResult(). In environments with a SynchronizationContext (WPF, Blazor, legacy ASP.NET), this causes permanent deadlocks. In ASP.NET Core, it causes ThreadPool Starvation: worker threads block waiting for asynchronous I/O completion, forcing the ThreadPool to slowly inject replacement threads at only 1–2 per second, causing cascading 504 Gateway Timeouts.",
    "deepDive": "Mechanisms of ThreadPool Starvation:\n1. In ASP.NET Core, an incoming request is assigned a ThreadPool worker thread (Thread A).\n2. Thread A calls 'var data = GetDataAsync().Result;'.\n3. Thread A is now in a blocked kernel wait state, unable to perform any other work.\n4. GetDataAsync initiates an asynchronous I/O operation (e.g. database query).\n5. When the database query finishes, the I/O completion port schedules the continuation task to the ThreadPool.\n6. If 1,000 concurrent requests all block on .Result, all 1,000 ThreadPool threads are blocked. There are zero available threads to execute the continuations that would unblock them!\n7. The CLR ThreadPool has a built-in hill-climbing heuristic that injects new threads at a slow rate (approx 1 thread every 500ms). The entire server becomes completely unresponsive while CPU utilization sits near 0%.",
    "codeSnippet": "// ❌ THE ANTI-PATTERN: Sync-Over-Async\n[HttpGet(\"bad/{id}\")]\npublic IActionResult GetBad(int id)\n{\n    // BLOCKS worker thread. Starves ThreadPool under load!\n    var user = _userService.GetUserAsync(id).Result;\n    return Ok(user);\n}\n\n//  THE SENIOR SOLUTION: Pure Async/Await all the way down\n[HttpGet(\"good/{id}\")]\npublic async Task<IActionResult> GetGood(int id, CancellationToken ct)\n{\n    // Worker thread is returned to ThreadPool while I/O completes\n    var user = await _userService.GetUserAsync(id, ct);\n    return Ok(user);\n}",
    "redFlags": [
      "Claiming '.GetAwaiter().GetResult() is completely safe because it avoids AggregateException' (it avoids AggregateException unwrapping, but STILL causes ThreadPool starvation).",
      "Using Task.Run(() => LongRunningSync()).Result to bypass async."
    ],
    "proTips": [
      "Use Microsoft's 'dotnet-dump' and 'dotnet-counters' CLI tools in production. Watch 'ThreadPool Thread Count' spiking alongside high HTTP request queues.",
      "Install the Roslyn analyzer 'Microsoft.VisualStudio.Threading.Analyzers' (VSTHRD) to flag sync-over-async at build time with error VSTHRD002."
    ]
  },
  {
    "id": "q-csharp-9",
    "pillar": "csharp",
    "seniority": "Mid",
    "tags": [
      "Struct",
      "Class",
      "Memory Layout",
      "Boxing"
    ],
    "title": "Struct vs Class: Memory Layout, Boxing Overheads, and in/ref Modifiers",
    "pitch": "Classes are reference types allocated on the managed heap with an 8-byte object header and 8-byte method table pointer (16 bytes minimum overhead on 64-bit). Structs are value types stored inline wherever declared (stack or inside an enclosing type) with zero object overhead. However, passing structs by value copies all bytes. For large structs (> 16-24 bytes), copying becomes expensive, and casting structs to interfaces causes boxing heap allocations.",
    "deepDive": "Memory Layout Details (64-bit CLR):\n- Class overhead: Object Header (Sync Block Index, 8 bytes) + Method Table Pointer (TypeHandle, 8 bytes) + Fields + Padding. Even an empty class instance consumes 24 bytes on the heap.\n- Struct: Contains only its fields, aligned to memory boundaries. No object header, no sync block.\n- Boxing: Casting a struct to 'object' or an interface copies the struct's bytes into a newly allocated heap object, generating GC Gen 0 churn.\n\nModern C# Value Type Optimizations:\n1. 'readonly struct': Informs Roslyn that the struct is immutable, preventing defensive copies when accessing fields.\n2. 'in' parameter modifier: Passes a struct by readonly reference (ref) without copying its fields, while guaranteeing the method cannot mutate it.\n3. 'ref struct': Restricts allocation strictly to the stack (e.g. Span<T>).",
    "codeSnippet": "// High-performance immutable 3D Vector value type\npublic readonly struct Vector3D : IEquatable<Vector3D>\n{\n    public readonly double X;\n    public readonly double Y;\n    public readonly double Z;\n\n    public Vector3D(double x, double y, double z) => (X, Y, Z) = (x, y, z);\n\n    // Passes by reference ('in') to avoid copying 24 bytes on every call\n    public static double DotProduct(in Vector3D a, in Vector3D b)\n    {\n        return (a.X * b.X) + (a.Y * b.Y) + (a.Z * b.Z);\n    }\n\n    // Direct value equality without interface boxing\n    public bool Equals(Vector3D other) => X == other.X && Y == other.Y && Z == other.Z;\n    public override bool Equals(object? obj) => obj is Vector3D other && Equals(other);\n    public override int GetHashCode() => HashCode.Combine(X, Y, Z);\n}",
    "redFlags": [
      "Declaring mutable structs (public fields with setters; can cause silent mutation bugs when copied).",
      "Using structs for large data structures (> 32 bytes) without 'in' / 'ref' modifiers.",
      "Casting structs to interfaces in tight loops, causing hidden boxing."
    ],
    "proTips": [
      "Follow Microsoft's Framework Design Guideline: Use a struct only if instance size is <= 16 bytes, it is immutable, logically represents a single value, and won't be boxed frequently."
    ]
  },
  {
    "id": "q-csharp-10",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "String",
      "String Interning",
      "Memory",
      "Span"
    ],
    "title": "String Immutability, String Interning, and string.Create() Zero-Allocation",
    "pitch": "Strings in C# are immutable reference types with a fixed size determined at construction. Because they are immutable, concatenations in loops create intermediate heap garbage. The CLR maintains an internal 'Intern Pool' of unique string literals to save memory. In modern .NET, string.Create() provides an ultra-low allocation API allowing you to write directly into the uninitialized string memory buffer via a Span<char> before the string is finalized.",
    "deepDive": "String Memory Layout:\nA System.String contains:\n1. Object Header (8 bytes)\n2. Method Table Pointer (8 bytes)\n3. Length integer (4 bytes)\n4. Char array data (2 bytes per UTF-16 char) + Null terminator (2 bytes).\n\nString Interning:\n- At assembly load time, the CLR interns literal strings into a hash table.\n- string.Intern(str) looks up or adds a string to the pool. However, manual interning has a permanent memory leak risk because interned strings are never collected by the GC!\n\nZero-Allocation Generation with string.Create():\nNormally, formatting a string like 'ORDER-1234-US' requires string.Format, allocating intermediate strings. string.Create(length, state, (span, state) => ...) allocates the exact final string once on the heap and lets you write chars directly into its memory span.",
    "codeSnippet": "public static class OrderFormatter\n{\n    // Zero-allocation custom string builder\n    public static string FormatOrderNumber(int orderId, string regionCode)\n    {\n        // Target format: \"ORD-{orderId:D6}-{regionCode}\" -> e.g. \"ORD-001234-US\" (14 chars)\n        int length = 4 + 6 + 1 + regionCode.Length;\n\n        return string.Create(length, (orderId, regionCode), (span, state) =>\n        {\n            \"ORD-\".AsSpan().CopyTo(span);\n            // Format integer directly into span characters without allocating a string!\n            state.orderId.TryFormat(span.Slice(4, 6), out _, \"D6\");\n            span[10] = '-';\n            state.regionCode.AsSpan().CopyTo(span.Slice(11));\n        });\n    }\n}",
    "redFlags": [
      "Using string += in a loop instead of StringBuilder or string.Create.",
      "Calling string.Intern() on millions of user-supplied dynamic strings (causes permanent uncollectible memory leak)."
    ],
    "proTips": [
      "Use string.Equals(a, b, StringComparison.Ordinal) or OrdinalIgnoreCase instead of == for culture-agnostic high-performance comparisons."
    ]
  },
  {
    "id": "q-aspnet-1",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Middleware",
      "Pipeline",
      "Short-Circuiting",
      "Architecture"
    ],
    "title": "ASP.NET Core Middleware Pipeline: Execution Order, Branching, and Short-Circuiting",
    "pitch": "The ASP.NET Core middleware pipeline is an in-memory Russian-doll chain of RequestDelegate components. Each middleware receives the HttpContext and a next delegate. It can execute logic before invoking next(), await next() to pass control downstream, execute logic after next() returns, or short-circuit by returning without calling next(). Pipeline order is deterministic: Exception handling must be at the very top, followed by Security/HSTS, Routing, CORS, Authentication, Authorization, Rate Limiting, and Endpoints.",
    "deepDive": "Pipeline Execution Mechanics:\n1. RequestDelegate: Defined as 'delegate Task RequestDelegate(HttpContext context);'.\n2. Composition: During application startup, 'IApplicationBuilder.Build()' compiles the chain into a single composite RequestDelegate via nested closures.\n3. Branching:\n   - app.Map(\"/api\", branch => ...): Creates a isolated branch based on URL prefix match.\n   - app.MapWhen(ctx => ctx.Request.Headers.ContainsKey(\"X-Custom\"), branch => ...): Predicate-based branching.\n   - app.UseWhen(...): Branches and re-joins the main pipeline.\n4. Short-Circuiting:\n   If Authentication fails or RateLimitingMiddleware rejects a request with HTTP 429, it omits calling next(context). The request immediately reverses back through the 'after' blocks of preceding middlewares.",
    "codeSnippet": "// Custom Performance and RFC 7807 Error Handling Middleware\npublic class PerformanceMonitoringMiddleware\n{\n    private readonly RequestDelegate _next;\n    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;\n\n    public PerformanceMonitoringMiddleware(RequestDelegate next, ILogger<PerformanceMonitoringMiddleware> logger)\n    {\n        _next = next;\n        _logger = logger;\n    }\n\n    public async Task InvokeAsync(HttpContext context)\n    {\n        var stopwatch = Stopwatch.StartNew();\n        try\n        {\n            // Pass execution downstream\n            await _next(context);\n        }\n        finally\n        {\n            stopwatch.Stop();\n            var elapsedMs = stopwatch.ElapsedMilliseconds;\n            if (elapsedMs > 500)\n            {\n                _logger.LogWarning(\"Slow request detected: {Method} {Path} took {Elapsed}ms\",\n                    context.Request.Method, context.Request.Path, elapsedMs);\n            }\n        }\n    }\n}",
    "redFlags": [
      "Placing ExceptionHandlerMiddleware after Authentication/Routing (exceptions thrown in auth will not be caught!).",
      "Mutating response headers AFTER calling await next(context) when the response body has already started streaming (throws InvalidOperationException: Headers are read-only)."
    ],
    "proTips": [
      "Always check 'context.Response.HasStarted' before attempting to write custom error headers or redirect if next() throws."
    ]
  },
  {
    "id": "q-aspnet-2",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Dependency Injection",
      "Captive Dependency",
      "Lifetimes",
      "ValidateScopes"
    ],
    "title": "DI Service Lifetimes and Captive Dependency Prevention",
    "pitch": "ASP.NET Core DI provides three lifetimes: Transient (new instance every resolution), Scoped (one instance per HTTP request/scope), and Singleton (one instance for application lifetime). A Captive Dependency is an architectural bug where a longer-lived service consumes a shorter-lived service (e.g. Singleton injecting Scoped DbContext). This causes the Scoped service to be held hostage as a Singleton, leading to multi-threaded data corruption and memory leaks. In background services, IServiceScopeFactory must be used to create explicit scopes.",
    "deepDive": "Why Captive Dependencies Are Catastrophic:\nConsider a Singleton BackgroundService injecting a Scoped 'AppDbContext'.\n1. Thread-Safety: DbContext is NOT thread-safe. Concurrent executions on background tasks or web threads accessing the same instance throw 'InvalidOperationException: A second operation was started on this context instance before a previous operation completed'.\n2. Memory Leak: EF Core's Change Tracker retains snapshots of all queried entities. A captive DbContext never gets disposed, indefinitely hoarding tracked entities in memory until OutOfMemoryException.\n\nDetection and Mitigation:\n- Program.cs: Enable 'builder.Host.UseDefaultServiceProvider(options => { options.ValidateScopes = true; options.ValidateOnBuild = true; });'. In .NET, this is on by default in Development but OFF in Production for performance.\n- Background Jobs: Inject 'IServiceScopeFactory', call 'using var scope = _scopeFactory.CreateScope();', and resolve Scoped dependencies inside the scope.",
    "codeSnippet": "// Proper pattern for consuming Scoped services in Singleton BackgroundService\npublic class OrderProcessingWorker : BackgroundService\n{\n    private readonly IServiceScopeFactory _scopeFactory;\n    private readonly ILogger<OrderProcessingWorker> _logger;\n\n    public OrderProcessingWorker(IServiceScopeFactory scopeFactory, ILogger<OrderProcessingWorker> logger)\n    {\n        _scopeFactory = scopeFactory;\n        _logger = logger;\n    }\n\n    protected override async Task ExecuteAsync(CancellationToken stoppingToken)\n    {\n        while (!stoppingToken.IsCancellationRequested)\n        {\n            // Explicitly create a clean scope per processing batch\n            using (var scope = _scopeFactory.CreateScope())\n            {\n                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();\n                var pendingOrders = await dbContext.Orders\n                    .Where(o => o.Status == OrderStatus.Pending)\n                    .Take(50)\n                    .ToListAsync(stoppingToken);\n\n                // Process orders cleanly...\n                await dbContext.SaveChangesAsync(stoppingToken);\n            }\n\n            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);\n        }\n    }\n}",
    "redFlags": [
      "Injecting DbContext directly into a Singleton service constructor.",
      "Resolving scoped services from the root IServiceProvider in program startup or background workers."
    ],
    "proTips": [
      "Keep 'ValidateScopes = true' and 'ValidateOnBuild = true' enabled in CI pipeline unit tests so captive dependencies are caught before deployment."
    ]
  },
  {
    "id": "q-aspnet-3",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "IHttpClientFactory",
      "Socket Exhaustion",
      "DNS",
      "Resilience"
    ],
    "title": "IHttpClientFactory: Socket Exhaustion, Stale DNS, and SocketsHttpHandler",
    "pitch": "Instantiating 'new HttpClient()' for every request causes TIME_WAIT socket exhaustion because disposed sockets remain in the TCP TIME_WAIT state for minutes. Conversely, making HttpClient a static singleton causes Stale DNS bugs: the client holds the TCP socket open indefinitely, ignoring DNS updates when downstream cloud services failover. IHttpClientFactory solves both: it pools and rotates the underlying HttpMessageHandler every 2 minutes while handing out transient HttpClient wrappers.",
    "deepDive": "Deep Dive Mechanics:\n1. TCP Socket Exhaustion:\n   - When HttpClient is disposed, the underlying TCP connection undergoes a 4-way handshake and enters TIME_WAIT (RFC 793, typically 120-240 seconds).\n   - Under heavy load, all ~65,000 ephemeral outbound ports are consumed, throwing 'System.Net.Sockets.SocketException: Only one usage of each socket address is normally permitted'.\n2. Stale DNS:\n   - A single static HttpClient keeps its TCP socket open forever. If an external API rotates its IP address (e.g. AWS/Azure failover), the static client continues sending traffic to the defunct IP.\n3. IHttpClientFactory Architecture:\n   - Separates the HttpClient facade from the underlying HttpMessageHandler.\n   - HttpMessageHandler instances are pooled for a configurable lifetime (default: 2 minutes).\n   - Once expired, an active handler is marked for deactivation; it completes in-flight requests and is disposed, forcing a fresh DNS resolution on the next connection.\n4. .NET Core 2.1+ SocketsHttpHandler:\n   - Alternatively, you can configure SocketsHttpHandler.PooledConnectionLifetime = TimeSpan.FromMinutes(2) on a singleton HttpClient.",
    "codeSnippet": "// Program.cs: Registering Typed HttpClient with Polly v8 Resilience Pipeline\nbuilder.Services.AddHttpClient<IPaymentApiClient, PaymentApiClient>((sp, client) =>\n{\n    client.BaseAddress = new Uri(\"https://api.paymentprovider.com/v1/\");\n    client.Timeout = TimeSpan.FromSeconds(5);\n})\n.SetHandlerLifetime(TimeSpan.FromMinutes(5)) // Rotates handlers to refresh DNS\n.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler\n{\n    PooledConnectionLifetime = TimeSpan.FromMinutes(2),\n    EnableMultipleHttp2Connections = true\n});",
    "redFlags": [
      "Using 'using var client = new HttpClient()' inside controller actions.",
      "Not knowing about the DNS caching issue with static HttpClient."
    ],
    "proTips": [
      "Always favor Typed Clients (services.AddHttpClient<IClient, Client>()) over Named Clients to avoid stringly-typed client keys and improve unit testability."
    ]
  },
  {
    "id": "q-aspnet-4",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "JWT",
      "Authentication",
      "Refresh Tokens",
      "Security"
    ],
    "title": "Production JWT Authentication and Refresh Token Rotation with Reuse Detection",
    "pitch": "Stateless JWT access tokens are signed, self-contained credentials that cannot be revoked without maintaining a distributed revocation blacklist. To maintain security, access tokens must be short-lived (e.g., 10-15 minutes). Refresh Token Rotation with Reuse Detection is required: every token exchange revokes the old refresh token and issues a new one. If an already-used refresh token is presented, the system detects a breach and instantly revokes the entire refresh token family.",
    "deepDive": "Enterprise JWT Architecture:\n1. Token Separation:\n   - Access Token: Short-lived (15 mins), passed in 'Authorization: Bearer <token>' header. Signed with RS256 (asymmetric private key on Identity Server, public key on APIs).\n   - Refresh Token: Long-lived (7-30 days), stored in an HttpOnly, Secure, SameSite=Strict cookie to prevent XSS theft.\n2. Token Family & Reuse Detection:\n   - Each login generates a 'TokenFamilyId'.\n   - When a client calls /refresh, the server marks the used refresh token as revoked and issues a new pair with the same FamilyId.\n   - If an attacker intercepts a refresh token and uses it AFTER the legitimate client already rotated it, the server sees: 'Attempted use of REVOKED token'.\n   - Action: Server revokes ALL tokens sharing that FamilyId, invalidating the attacker and forcing the real user to re-authenticate.",
    "codeSnippet": "public async Task<TokenResponseDto> RefreshTokenAsync(string tokenString, CancellationToken ct)\n{\n    var existingToken = await _db.RefreshTokens\n        .FirstOrDefaultAsync(t => t.Token == tokenString, ct);\n\n    if (existingToken == null) throw new SecurityTokenException(\"Invalid token\");\n\n    // CRITICAL: Reuse Detection!\n    if (existingToken.IsRevoked)\n    {\n        // Compromise detected: Revoke entire token family!\n        await RevokeTokenFamilyAsync(existingToken.FamilyId, ct);\n        throw new SecurityTokenException(\"Token reuse detected. All sessions terminated.\");\n    }\n\n    // Revoke current token\n    existingToken.IsRevoked = true;\n    existingToken.ReplacedByToken = GenerateSecureRandomToken();\n\n    // Create new refresh token in same family\n    var newRefreshToken = new RefreshToken\n    {\n        Token = existingToken.ReplacedByToken,\n        FamilyId = existingToken.FamilyId,\n        UserId = existingToken.UserId,\n        ExpiresAt = DateTime.UtcNow.AddDays(7)\n    };\n\n    _db.RefreshTokens.Add(newRefreshToken);\n    await _db.SaveChangesAsync(ct);\n\n    var newJwt = GenerateJwtAccessToken(existingToken.UserId);\n    return new TokenResponseDto(newJwt, newRefreshToken.Token);\n}",
    "redFlags": [
      "Issuing 30-day JWT access tokens without any refresh mechanism.",
      "Storing refresh tokens in localStorage where they are vulnerable to XSS script injection.",
      "Using symmetric HS256 across multiple microservices (forces sharing the secret key)."
    ],
    "proTips": [
      "Use RS256 or ES256 (Asymmetric keys): Only the Auth service holds the private key; resource APIs only cache the public key via JWKS (JSON Web Key Sets)."
    ]
  },
  {
    "id": "q-aspnet-5",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Clean Architecture",
      "CQRS",
      "MediatR",
      "DDD"
    ],
    "title": "Clean Architecture and CQRS with MediatR: Separation of Concerns and Pipeline Behaviors",
    "pitch": "Clean Architecture enforces strict inward dependency flow: Domain Entities depend on nothing; Application layer contains use cases (CQRS Commands and Queries); Infrastructure implements persistence, third-party APIs, and messaging; and Presentation (APIs) is a thin entry point. MediatR decouples controllers from business logic, while MediatR Pipeline Behaviors act as in-memory AOP middleware to handle cross-cutting concerns like validation, logging, and database transactions.",
    "deepDive": "Layer Responsibilities:\n1. Domain: Entities, Value Objects, Domain Events, Domain Exceptions. Pure C#, zero external dependencies.\n2. Application: Commands (CreateOrderCommand), Queries (GetOrderByIdQuery), Handlers, DTOs, and Ports (Interfaces like IOrderRepository, IEmailService).\n3. Infrastructure: Adapters implementing ports: EF Core DbContext, Dapper, SendGrid, MassTransit.\n4. Presentation: Minimal APIs / Controllers. Only validates HTTP status codes and serializes DTOs.\n\nMediatR IPipelineBehavior<TRequest, TResponse>:\nExecutes around every command/query handler. Common pipeline order:\n1. LoggingBehavior (logs payload and execution time)\n2. ValidationBehavior (executes FluentValidation rules; throws ValidationException before handler is reached)\n3. TransactionBehavior (wraps Command execution in an EF Core IDbContextTransaction).",
    "codeSnippet": "// MediatR Validation Pipeline Behavior\npublic class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>\n    where TRequest : IRequest<TResponse>\n{\n    private readonly IEnumerable<IValidator<TRequest>> _validators;\n\n    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)\n    {\n        _validators = validators;\n    }\n\n    public async Task<TResponse> Handle(\n        TRequest request, \n        RequestHandlerDelegate<TResponse> next, \n        CancellationToken ct)\n    {\n        if (!_validators.Any()) return await next();\n\n        var context = new ValidationContext<TRequest>(request);\n        var validationResults = await Task.WhenAll(\n            _validators.Select(v => v.ValidateAsync(context, ct)));\n\n        var failures = validationResults\n            .SelectMany(r => r.Errors)\n            .Where(f => f != null)\n            .ToList();\n\n        if (failures.Count != 0)\n        {\n            throw new ValidationException(failures);\n        }\n\n        return await next();\n    }\n}",
    "redFlags": [
      "Letting Infrastructure or EF Core dependencies leak into the Domain layer.",
      "Returning EF Core IQueryable from Application service handlers out to Controllers.",
      "Bloating controllers with database queries, business rules, and validation logic."
    ],
    "proTips": [
      "Commands (which modify state) should return Result<TId> or Result<Unit>; Queries (which read state) should return read-only DTOs, never domain entities."
    ]
  },
  {
    "id": "q-aspnet-6",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Rate Limiting",
      ".NET 8",
      "API Security",
      "DDoS"
    ],
    "title": "ASP.NET Core Built-in Rate Limiting: Algorithms, Partitioning, and HTTP 429",
    "pitch": ".NET 7 and 8 introduced a native, highly-optimized rate limiting middleware (System.Threading.RateLimiting) built into the framework. It offers four core algorithms: Fixed Window, Sliding Window, Token Bucket, and Concurrency Limiter. Rate limits can be applied globally, per-endpoint via attributes or extension methods, and partitioned per client IP or authenticated User ID, returning HTTP 429 Too Many Requests with a Retry-After header.",
    "deepDive": "The 4 Algorithms Compared:\n1. Fixed Window: Divides time into fixed intervals (e.g. 100 requests per minute). Vulnerable to traffic spikes at boundary edges (e.g. 100 requests at 0:59 and 100 requests at 1:01).\n2. Sliding Window: Divides the window into segments, smoothing out boundary bursts.\n3. Token Bucket: Tokens are added at a continuous rate up to a capacity. Allows controlled bursts when tokens are available, then throttles to refill rate.\n4. Concurrency Limiter: Simply caps the maximum number of active concurrent in-flight requests (e.g. max 20 simultaneous requests).\n\nPartitioning Strategy:\nNever apply a single global fixed rate limit for all users, or an attacker will trigger a Denial-of-Service for legitimate users! Use PartitionedRateLimiter to partition keys by HttpContext.User.Identity.Name (if authenticated) or remote IP address.",
    "codeSnippet": "// Program.cs: TokenBucket Partitioned Rate Limiting in ASP.NET Core 8\nbuilder.Services.AddRateLimiter(options =>\n{\n    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;\n    options.OnRejected = async (context, token) =>\n    {\n        context.HttpContext.Response.Headers.RetryAfter = \"30\";\n        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails\n        {\n            Status = StatusCodes.Status429TooManyRequests,\n            Title = \"Too Many Requests\",\n            Detail = \"Rate limit exceeded. Please retry after 30 seconds.\"\n        }, cancellationToken: token);\n    };\n\n    options.AddPolicy(\"AuthenticatedUserPolicy\", httpContext =>\n    {\n        var partitionKey = httpContext.User.Identity?.IsAuthenticated == true\n            ? httpContext.User.Identity.Name!\n            : httpContext.Connection.RemoteIpAddress?.ToString() ?? \"anonymous\";\n\n        return RateLimitPartition.GetTokenBucketLimiter(partitionKey, _ => new TokenBucketRateLimiterOptions\n        {\n            TokenLimit = 50,\n            TokensPerPeriod = 10,\n            ReplenishmentPeriod = TimeSpan.FromSeconds(10),\n            QueueLimit = 0\n        });\n    });\n});",
    "redFlags": [
      "Using an unpartitioned global rate limiter (lets one malicious user block the entire platform).",
      "Setting QueueLimit too high, causing memory buildup and delayed timeouts instead of failing fast."
    ],
    "proTips": [
      "In multi-instance cloud deployments (e.g. AKS or App Service cluster), local in-memory rate limiting applies per-instance; use Redis-backed rate limiting or Azure API Management (APIM) for global cluster-wide enforcement."
    ]
  },
  {
    "id": "q-aspnet-7",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Output Caching",
      "Redis",
      "Cache Stampede",
      "Tag Eviction"
    ],
    "title": "Output Caching in .NET 8: Redis Backplane, Tag-Based Eviction, and Cache Stampede Mitigation",
    "pitch": "ASP.NET Core Output Caching (.NET 7/8+) is a full server-side HTTP caching engine that replaces legacy Response Caching. It supports Redis distributed storage, resource locking to eliminate Cache Stampedes (Thundering Herd problem), and most importantly: Tag-based cache eviction. When an entity is updated via a POST/PUT command, calling IOutputCacheStore.EvictByTagAsync('products', ct) instantly purges all cached queries tagged with that entity without clearing the whole cache.",
    "deepDive": "Key Capabilities of Output Caching:\n1. Response Caching vs Output Caching:\n   - Response Caching is HTTP-header based, relies on client cache-control, and cannot be programmatically invalidated from the server.\n   - Output Caching lives entirely on the server/Redis, can cache regardless of client headers, and supports programmatic eviction.\n2. Cache Stampede (Thundering Herd) Mitigation:\n   - When an expensive cached item expires, hundreds of concurrent incoming requests would normally all hit the database simultaneously.\n   - Output Caching implements Resource Locking: the first request locks the key and generates the response; all other concurrent requests await that single generation and receive the cached result.\n3. Tag Eviction:\n   - You can assign multiple tags to cached responses: 'policy.Tag(\"category-electronics\").Tag(\"brand-sony\")'.\n   - When an admin updates a Sony camera, evicting the tag 'brand-sony' purges all related search and detail pages in Redis in one asynchronous call.",
    "codeSnippet": "// Program.cs: Output Caching with Redis and Tag Eviction\nbuilder.Services.AddOutputCache(options =>\n{\n    options.AddBasePolicy(builder => builder.Cache());\n    options.AddPolicy(\"ProductsCache\", builder => \n        builder.Expire(TimeSpan.FromHours(1))\n               .SetVaryByQuery(\"page\", \"pageSize\", \"categoryId\")\n               .Tag(\"products\"));\n});\n\n// Minimal API Endpoint with Tagged Cache\napp.MapGet(\"/api/products\", async (IProductService svc, [AsParameters] ProductQuery query) =>\n    TypedResults.Ok(await svc.GetProductsAsync(query)))\n   .CacheOutput(\"ProductsCache\");\n\n// Mutation Endpoint that triggers instant tag eviction\napp.MapPost(\"/api/products\", async (CreateProductDto dto, IProductService svc, IOutputCacheStore cache, CancellationToken ct) =>\n{\n    var created = await svc.CreateAsync(dto, ct);\n    // Purges ALL cached product listings immediately!\n    await cache.EvictByTagAsync(\"products\", ct);\n    return TypedResults.Created($\"/api/products/{created.Id}\", created);\n});",
    "redFlags": [
      "Relying on legacy ResponseCachingMiddleware for server-side API invalidation.",
      "Clearing the entire Redis cache (FLUSHDB) when updating a single record instead of using tag-based eviction."
    ],
    "proTips": [
      "Use 'SetVaryByHeader(\"Accept-Encoding\")' to ensure compressed gzip/brotli payloads are cached and served directly without re-compression."
    ]
  },
  {
    "id": "q-aspnet-8",
    "pillar": "aspnet",
    "seniority": "Mid",
    "tags": [
      "Minimal APIs",
      "Routing",
      "Performance",
      "Source Generators"
    ],
    "title": "Minimal APIs vs Controller-based APIs: Performance, Architecture, and Endpoint Filters",
    "pitch": "Minimal APIs in ASP.NET Core bypass the heavy MVC action invoker, controller activator reflection, and model binding filters, compiling directly into native route handlers using Roslyn source generators. They offer ~30% higher throughput, lower memory footprint, and faster cold-start times, making them ideal for microservices and serverless. Endpoint Filters (IEndpointFilter) provide clean, composable cross-cutting interception without MVC filter overhead.",
    "deepDive": "Architectural Differences:\n- Controller Architecture: Uses Microsoft.AspNetCore.Mvc.Core. Every request traverses action discovery, controller factory reflection, action constraints, model binding dictionaries, and action filter pipelines.\n- Minimal APIs Architecture: Directly integrates with ASP.NET Core Endpoint Routing. Request parameters are mapped using compile-time generated delegates via 'RequestDelegateFactory'.\n- Structuring Minimal APIs at Scale: Use Route Groups (app.MapGroup(\"/api/v1/orders\")) combined with extension methods or Carter modules to avoid dumping thousands of lines of endpoints into Program.cs.",
    "codeSnippet": "// Endpoint Filter for Route Group Validation\npublic static class ValidationEndpointFilter\n{\n    public static RouteGroupBuilder MapOrderEndpoints(this RouteGroupBuilder group)\n    {\n        group.MapPost(\"/\", CreateOrderAsync)\n             .AddEndpointFilter(async (invocationContext, next) =>\n             {\n                 var dto = invocationContext.GetArgument<CreateOrderDto>(0);\n                 if (dto.Amount <= 0)\n                 {\n                     return Results.Problem(\"Order amount must be positive.\", statusCode: 400);\n                 }\n                 return await next(invocationContext);\n             });\n\n        return group;\n    }\n\n    private static async Task<IResult> CreateOrderAsync(CreateOrderDto dto, IOrderService svc)\n    {\n        var id = await svc.CreateOrderAsync(dto);\n        return TypedResults.Created($\"/api/orders/{id}\", new { Id = id });\n    }\n}",
    "redFlags": [
      "Stuffing 2,000 lines of endpoints directly in Program.cs without using Route Groups or extension methods.",
      "Assuming Minimal APIs cannot do dependency injection or validation (they support both via IEndpointFilter and FluentValidation)."
    ],
    "proTips": [
      "Use 'TypedResults' instead of 'Results' in Minimal APIs: TypedResults provides compile-time OpenAPI type annotations for Swagger without needing [ProducesResponseType] attributes."
    ]
  },
  {
    "id": "q-aspnet-9",
    "pillar": "aspnet",
    "seniority": "Mid",
    "tags": [
      "ProblemDetails",
      "RFC 7807",
      "Exception Handling",
      "API Standards"
    ],
    "title": "RFC 7807 ProblemDetails and Global Exception Handling in ASP.NET Core 8",
    "pitch": "RFC 7807 is the IETF standard specifying a machine-readable JSON format for HTTP API error responses. ASP.NET Core 8 provides native IExceptionHandler and AddProblemDetails() to standardize error payloads globally. Instead of returning raw stack traces or ad-hoc error shapes, every 4xx and 5xx error returns structured attributes: type, title, status, detail, instance, and traceId for distributed tracing correlation.",
    "deepDive": "Core Mechanics in ASP.NET Core 8:\n1. AddProblemDetails(): Injects standard ProblemDetails factories into all built-in status code responses (e.g. 404, 400, 401).\n2. IExceptionHandler: Replaces older custom middleware. Handlers implement 'ValueTask<bool> TryHandleAsync(HttpContext, Exception, CancellationToken)'. Multiple handlers can be chained in order of specificity (e.g. ValidationExceptionHandler -> DatabaseExceptionHandler -> GlobalExceptionHandler).\n3. Security: Never expose raw Exception.Message or StackTrace in production ProblemDetails. Map domain exceptions to safe, localized error codes while logging the full exception internally with the TraceId.",
    "codeSnippet": "// ASP.NET Core 8 Custom IExceptionHandler\npublic class GlobalExceptionHandler : IExceptionHandler\n{\n    private readonly ILogger<GlobalExceptionHandler> _logger;\n\n    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;\n\n    public async ValueTask<bool> TryHandleAsync(\n        HttpContext context, \n        Exception exception, \n        CancellationToken ct)\n    {\n        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;\n        _logger.LogError(exception, \"Unhandled exception occurred. TraceId: {TraceId}\", traceId);\n\n        var problem = new ProblemDetails\n        {\n            Status = StatusCodes.Status500InternalServerError,\n            Title = \"An unexpected error occurred\",\n            Detail = \"Please contact support with the trace identifier.\",\n            Instance = context.Request.Path,\n            Extensions = { [\"traceId\"] = traceId }\n        };\n\n        context.Response.StatusCode = StatusCodes.Status500InternalServerError;\n        await context.Response.WriteAsJsonAsync(problem, ct);\n        return true; // Mark as handled\n    }\n}",
    "redFlags": [
      "Returning HTTP 200 OK with '{ success: false, error: \"...\" }' payload (violates REST standards).",
      "Leaking raw SQL syntax or database connection strings in API error responses."
    ],
    "proTips": [
      "Include custom extensions in ProblemDetails like 'errorCode' and 'invalidParams' to allow frontend UI clients to map field validation errors automatically."
    ]
  },
  {
    "id": "q-aspnet-10",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "Polly",
      "Resilience",
      "Circuit Breaker",
      "Retry"
    ],
    "title": "Enterprise Resilience with Polly v8 and Microsoft.Extensions.Resilience",
    "pitch": "In distributed microservices, transient network glitches, socket resets, and downstream service slowdowns are inevitable. Polly v8 completely reimagined .NET resilience with zero allocations, high performance, and integration via Microsoft.Extensions.Resilience. Core resilience strategies include: Retry with Exponential Backoff and Jitter (to prevent synchronized retry storms), Timeout, and Circuit Breaker (to fail fast when a downstream dependency is in an outage).",
    "deepDive": "Key Resilience Strategies:\n1. Retry with Jitter: Retrying immediately slams a recovering downstream server. Adding random 'jitter' to exponential backoff (e.g. 2s +/- 300ms) desynchronizes competing clients.\n2. Circuit Breaker:\n   - Closed: Normal operations.\n   - Open: When failure rate exceeds threshold (e.g. > 50% failures over 30s), circuit trips OPEN. All calls fail instantly without network roundtrips.\n   - Half-Open: After a break duration (e.g. 60s), a canary request tests downstream health. If successful, circuit closes; if it fails, it trips open again.\n3. Hedging: For read-only idempotent queries, Polly can launch a concurrent secondary request if the primary has not responded within p95 latency, taking whichever finishes first.",
    "codeSnippet": "// Program.cs: Polly v8 Standard Resilience Pipeline\nbuilder.Services.AddHttpClient<IExternalWeatherClient, WeatherClient>()\n    .AddStandardResilienceHandler(options =>\n    {\n        // 1. Retry strategy with exponential backoff & jitter\n        options.Retry.MaxRetryAttempts = 3;\n        options.Retry.BackoffType = DelayBackoffType.Exponential;\n        options.Retry.UseJitter = true;\n        \n        // 2. Circuit Breaker\n        options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);\n        options.CircuitBreaker.FailureRatio = 0.5; // Trip if 50% of requests fail\n        options.CircuitBreaker.MinimumThroughput = 20;\n        options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(30);\n\n        // 3. Attempt Timeout\n        options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);\n    });",
    "redFlags": [
      "Configuring retries on non-idempotent HTTP POST endpoints (can duplicate credit card charges!).",
      "Using immediate retries without backoff or jitter (exacerbates service outages)."
    ],
    "proTips": [
      "Always combine Polly with distributed tracing: Polly v8 emits OpenTelemetry telemetry events on retries and circuit state transitions automatically."
    ]
  },
  {
    "id": "q-sql-1",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "Index",
      "B-Tree",
      "Clustered",
      "Non-Clustered"
    ],
    "title": "Clustered vs Non-Clustered Indexes: Physical Storage and Bookmark Lookups",
    "pitch": "In SQL Server, a Clustered Index dictates the physical sorting order of rows on disk; its B-Tree leaf nodes ARE the actual data pages of the table. A table can have only one clustered index. A Non-Clustered Index is a separate B-Tree structure where leaf nodes contain only the indexed keys and a row locator pointer (the clustered index key or heap RID). When a non-clustered index satisfies the WHERE clause but lacks columns needed by the SELECT clause, SQL Server performs an expensive Bookmark Lookup (Key Lookup) to fetch the missing columns.",
    "deepDive": "Physical B-Tree Mechanics:\n1. Clustered Index:\n   - Root Node -> Intermediate Nodes -> Leaf Nodes (Contains all data columns for all rows).\n   - If a table has no clustered index, it is stored as an unordered Heap.\n2. Non-Clustered Index:\n   - Leaf nodes contain: Index Key Columns + Clustering Key (as the row locator).\n3. The Key Lookup Cost:\n   - When executing: SELECT CustomerId, OrderTotal FROM Orders WHERE OrderDate = '2024-05-01'\n   - If index is on (OrderDate), SQL Server seeks the B-Tree to find matching rows.\n   - For every matching row, it must execute a nested loop Key Lookup against the clustered index to read CustomerId and OrderTotal.\n   - If matching rows exceed ~1-5% of total table rows (the 'tipping point'), the query optimizer abandons the index completely and performs a full Clustered Index Scan!",
    "codeSnippet": "-- Create Clustered Index on narrow, monotonically increasing identity\nCREATE CLUSTERED INDEX CIX_Orders_OrderId ON Orders (OrderId);\n\n-- Non-Clustered Index with Key Lookup vulnerability:\nCREATE NONCLUSTERED INDEX IX_Orders_OrderDate ON Orders (OrderDate);\n\n-- Query suffering from Key Lookup:\nSELECT OrderId, CustomerId, OrderTotal \nFROM Orders \nWHERE OrderDate >= '2024-01-01' AND OrderDate < '2024-02-01';",
    "redFlags": [
      "Choosing a wide, random GUID (uniqueidentifier) as a Clustered Index key (causes massive page splits, 50% page density, and huge non-clustered index sizes).",
      "Thinking non-clustered indexes contain all columns of the table."
    ],
    "proTips": [
      "If you must use GUIDs for primary keys, use Sequential GUIDs (NEWSEQUENTIALID() in SQL or RT.Comb in C#) to ensure monotonic insertion and prevent B-Tree page splits."
    ]
  },
  {
    "id": "q-sql-2",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "Covering Index",
      "INCLUDE",
      "Key Lookup",
      "Optimization"
    ],
    "title": "Covering Indexes and the INCLUDE Clause: Eliminating Key Lookups",
    "pitch": "A Covering Index contains all columns referenced by a query (in SELECT, WHERE, JOIN, and ORDER BY), satisfying the query entirely from index leaf nodes without touching the base table. The 'INCLUDE' clause allows non-key columns to be stored exclusively at the leaf level rather than intermediate B-Tree levels. This drastically reduces index size, avoids intermediate node bloat, bypasses the 1,700-byte index key limit, and completely eliminates Key Lookups.",
    "deepDive": "Why use INCLUDE instead of adding columns to the index key?\n1. B-Tree Size & Memory:\n   - Key columns are stored in intermediate branch nodes of the B-Tree. Wider keys mean fewer keys fit per 8KB page, increasing tree depth and cache pressure.\n   - Included columns are ONLY stored at the leaf level. Intermediate nodes remain lean and fit in buffer pool memory.\n2. Limits:\n   - SQL Server restricts composite index keys to a maximum of 32 columns and 1,700 bytes.\n   - INCLUDED columns do not count towards the 1,700-byte key limit and can include types like VARCHAR(MAX).\n3. Query Execution Plan Impact:\n   - Plan changes from 'Index Seek + Nested Loops Key Lookup' to a clean, single 'Index Seek'.\n   - I/O cost drops by orders of magnitude on high-cardinality queries.",
    "codeSnippet": "-- HIGH-PERFORMANCE COVERING INDEX:\n-- OrderDate is the searchable key; CustomerId & OrderTotal are leaf-only payload columns\nCREATE NONCLUSTERED INDEX IX_Orders_OrderDate_Covering \nON Orders (OrderDate) \nINCLUDE (CustomerId, OrderTotal);\n\n-- Query execution now runs with ZERO Key Lookups!\nSELECT CustomerId, OrderTotal \nFROM Orders \nWHERE OrderDate >= '2024-01-01' AND OrderDate < '2024-02-01';",
    "redFlags": [
      "Adding 10 columns to the index key list instead of using the INCLUDE clause.",
      "Creating dozens of covering indexes on every combination of columns, resulting in crippling INSERT/UPDATE write latency."
    ],
    "proTips": [
      "Use SQL Server Dynamic Management Views (DMVs) like sys.dm_db_index_usage_stats to monitor and drop unused non-clustered indexes that waste storage and write I/O."
    ]
  },
  {
    "id": "q-sql-3",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "SARGable",
      "Index Seek",
      "Performance",
      "Query Optimizer"
    ],
    "title": "SARGable Queries: Why Functions on Columns Destroy Index Seeks",
    "pitch": "A query predicate is SARGable (Search ARGument ABLE) when the query optimizer can leverage a B-Tree Index Seek rather than an Index Scan. Wrapping an indexed column in a function (such as YEAR(d), UPPER(str), CONVERT(), or ISNULL()) destroys SARGability because SQL Server must evaluate the function for every single row in the table, degrading an O(log N) seek to an O(N) full table scan. SARGability also requires matching data types to prevent implicit datatype conversions.",
    "deepDive": "Non-SARGable Anti-Patterns and Refactorings:\n1. Date Functions:\n   - Non-SARGable: WHERE YEAR(OrderDate) = 2024\n   - SARGable: WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'\n2. String Manipulations:\n   - Non-SARGable: WHERE LEFT(LastName, 3) = 'SMI'\n   - SARGable: WHERE LastName LIKE 'SMI%'\n3. Null Coalescing:\n   - Non-SARGable: WHERE ISNULL(Discount, 0) > 0.1\n   - SARGable: WHERE Discount > 0.1 (NULL values evaluate to UNKNOWN and are excluded naturally)\n4. Implicit Datatype Conversion:\n   - If an indexed column is VARCHAR(50) and C# passes a Unicode string (NVARCHAR in EF Core parameter), SQL Server applies CONVERT_IMPLICIT(NVARCHAR, Column), invalidating the index seek!",
    "codeSnippet": "-- ❌ NON-SARGABLE: Clustered Index Scan across 10M rows\nSELECT OrderId, TotalAmount FROM Orders \nWHERE DATEADD(day, 30, CreatedAt) < GETDATE();\n\n--  SARGABLE REFACTOR: Index Seek directly jumping to leaf boundary\nSELECT OrderId, TotalAmount FROM Orders \nWHERE CreatedAt < DATEADD(day, -30, GETDATE());",
    "redFlags": [
      "Writing 'WHERE Column + 10 > 100' instead of 'WHERE Column > 90'.",
      "Using leading wildcards: 'WHERE Name LIKE '%Smith'' (cannot seek index; must scan entire index)."
    ],
    "proTips": [
      "In EF Core, configure string properties with '.IsUnicode(false)' if the database column is VARCHAR to prevent performance-killing CONVERT_IMPLICIT operations."
    ]
  },
  {
    "id": "q-sql-4",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "Isolation Levels",
      "RCSI",
      "Deadlocks",
      "Concurrency"
    ],
    "title": "Transaction Isolation Levels and RCSI (Read Committed Snapshot Isolation)",
    "pitch": "Standard SQL Server isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) use pessimistic locking: readers acquire Shared (S) locks that block writers acquiring Exclusive (X) locks, and writers block readers. Read Committed Snapshot Isolation (RCSI) changes this model: readers do not acquire S-locks; instead, they read row versions from tempdb, completely eliminating reader-writer blocking while preventing dirty reads.",
    "deepDive": "Isolation Phenomena:\n1. Dirty Read: Reading uncommitted, in-flight transactions (permitted only in Read Uncommitted).\n2. Non-Repeatable Read: Re-reading the same row within a transaction returns altered data.\n3. Phantom Read: A range query executed twice discovers new rows inserted by another committed transaction.\n\nThe Power of RCSI (Read Committed Snapshot Isolation):\n- Enabled at database level: ALTER DATABASE MyDb SET READ_COMMITTED_SNAPSHOT ON.\n- When an UPDATE occurs, SQL Server writes the previous committed row version into a version store in 'tempdb'.\n- Incoming SELECT queries read the committed version from tempdb without taking shared locks.\n- Result: SELECT queries never block UPDATE queries, and UPDATE queries never block SELECT queries.\n- Unlike full SNAPSHOT isolation, RCSI does not require explicit transaction opt-in and does not throw update conflict error 3960.",
    "codeSnippet": "-- Check if RCSI is enabled:\nSELECT name, is_read_committed_snapshot_on \nFROM sys.databases \nWHERE name = 'ProductionDb';\n\n-- Enable RCSI (Eliminates reader/writer blocking):\nALTER DATABASE ProductionDb \nSET READ_COMMITTED_SNAPSHOT ON \nWITH ROLLBACK IMMEDIATE;",
    "redFlags": [
      "Placing 'WITH (NOLOCK)' on every SELECT query (causes dirty reads, skipped rows, and reading corrupted duplicate rows due to page splits).",
      "Not accounting for tempdb size and I/O capacity when enabling RCSI on high-write systems."
    ],
    "proTips": [
      "RCSI is enabled BY DEFAULT in Azure SQL Database and AWS RDS for SQL Server. If migrating from on-prem to Azure, code relying on shared lock blocking will behave differently."
    ]
  },
  {
    "id": "q-sql-5",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "EF Core",
      "Change Tracker",
      "AsNoTracking",
      "Memory"
    ],
    "title": "EF Core Change Tracker Overhead and the .AsNoTracking() Optimization",
    "pitch": "When EF Core executes a tracking query, it instantiates the entity, registers its reference in an Identity Map dictionary, and takes a deep snapshot copy of all its properties. During SaveChangesAsync, it compares every entity against its snapshot (DetectChanges) to find modifications. For read-only queries, this snapshotting and identity mapping wastes 40–60% of CPU and RAM. Using .AsNoTracking() bypasses the change tracker entirely for dramatic performance gains.",
    "deepDive": "Internal Costs of EF Core Tracking:\n1. Snapshot Allocation: Every tracked entity requires a second internal object storing original property values.\n2. Identity Map Lookup: Every materialized row checks whether an entity with that primary key is already tracked.\n3. Relationship Fixup: EF Core traverses navigation properties to stitch together references between entities.\n4. DetectChanges(): SaveChangesAsync must iterate every tracked entity to compute diffs.\n\nWhen to Use Variations:\n- AsNoTracking(): Fastest read-only execution. Does not track or resolve duplicate instances in the same query.\n- AsNoTrackingWithIdentityResolution(): Bypasses change tracking but ensures that multiple rows referencing the same primary key share a single C# object reference in memory (crucial for complex 1:N graph results).",
    "codeSnippet": "public async Task<List<ProductDto>> GetActiveProductsAsync(AppDbContext db, CancellationToken ct)\n{\n    // Bypasses Identity Map, Snapshot copies, and Change Tracker\n    return await db.Products\n        .AsNoTracking()\n        .Where(p => p.IsActive)\n        .OrderBy(p => p.Name)\n        .Select(p => new ProductDto(p.Id, p.Name, p.Price, p.Category.Name))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Using tracking queries in high-volume read-only API GET endpoints.",
      "Calling .Update(entity) blindly on an entity retrieved without tracking, causing EF to issue UPDATE statements for all 50 columns instead of modified columns."
    ],
    "proTips": [
      "You can configure ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking globally in DbContext options for read-heavy microservices, explicitly opting into tracking only when writing."
    ]
  },
  {
    "id": "q-sql-6",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "EF Core",
      "N+1 Problem",
      "Projection",
      "Cartesian Explosion"
    ],
    "title": "Eliminating N+1 Queries and Cartesian Explosion via LINQ Projection",
    "pitch": "The N+1 query problem occurs when an application executes 1 initial database query to fetch N parent records, then fires N subsequent queries in a loop to fetch child records for each parent. While eager loading with .Include() eliminates N+1, chaining multiple .Include() calls on collections causes a Cartesian Explosion, where SQL joins multiply rows into thousands of redundant duplicated records. Pure LINQ projection via .Select() solves both by generating a single optimized SQL query that retrieves only needed columns.",
    "deepDive": "Comparing Data Fetching Strategies:\n1. Lazy Loading (N+1 Anti-Pattern):\n   - var blogs = db.Blogs.ToList(); // 1 query\n   - foreach (var b in blogs) Console.WriteLine(b.Posts.Count); // N queries!\n2. Eager Loading with Multiple Includes (Cartesian Explosion):\n   - db.Blogs.Include(b => b.Posts).Include(b => b.Contributors).ToList();\n   - SQL JOIN produces: (Posts Count * Contributors Count) rows! If a blog has 50 posts and 20 contributors, 1,000 rows are returned across TDS for a single blog!\n3. Split Queries (.AsSplitQuery()):\n   - Issues separate SQL queries per collection (1 for Blogs, 1 for Posts, 1 for Contributors), avoiding the Cartesian multiplication.\n4. Projection (.Select()):\n   - Compiles directly to targeted SQL SELECT list. Computes counts and sums in the database engine in a single roundtrip.",
    "codeSnippet": "//  SENIOR PROJECTION PATTERN: Single DB roundtrip, zero duplicate bytes\npublic async Task<List<BlogSummaryDto>> GetBlogSummariesAsync(AppDbContext db, CancellationToken ct)\n{\n    return await db.Blogs\n        .AsNoTracking()\n        .Where(b => b.IsPublished)\n        .Select(b => new BlogSummaryDto(\n            b.Id,\n            b.Title,\n            b.Author.FullName,\n            b.Posts.Count(), // Translated to SQL subquery\n            b.Posts.OrderByDescending(p => p.PublishedAt).Select(p => p.Title).Take(3).ToList()\n        ))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Leaving Lazy Loading enabled in Web APIs (leads to silent N+1 queries during JSON serialization).",
      "Fetching complete entity graphs containing 40 columns just to display 3 fields on a frontend grid."
    ],
    "proTips": [
      "Use EF Core Query Tagging (.TagWith(\"GetBlogSummaries\")) to easily trace LINQ queries in SQL Server Profiler and Application Insights."
    ]
  },
  {
    "id": "q-sql-7",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "EF Core",
      "AsSplitQuery",
      "SQL Joins",
      "Performance"
    ],
    "title": "EF Core Split Queries (.AsSplitQuery): Mitigating Relational Duplication",
    "pitch": "When EF Core loads multiple 1-to-many navigation properties using .Include(), its default behavior is to generate a single SQL query with LEFT JOINs. This causes severe Cartesian product data duplication over the network. EF Core's .AsSplitQuery() forces the query engine to split the operation into multiple discrete SQL queries executed within a single context, dramatically reducing transferred bytes and memory allocations at the expense of extra database roundtrips.",
    "deepDive": "How AsSplitQuery Works Under the Hood:\n- Single Query Mode (Default):\n  `SELECT b.Id, b.Name, p.Id, p.Title, c.Id, c.Text FROM Blogs b LEFT JOIN Posts p ... LEFT JOIN Comments c ...`\n  If a blog has 10 posts and 100 comments, 1,000 rows are sent over the network, duplicating the blog's name and post titles 1,000 times.\n- Split Query Mode:\n  Query 1: `SELECT b.Id, b.Name FROM Blogs b`\n  Query 2: `SELECT p.Id, p.Title, p.BlogId FROM Posts p WHERE p.BlogId IN (SELECT Id FROM Blogs ...)`\n  Query 3: `SELECT c.Id, c.Text, c.BlogId FROM Comments c WHERE c.BlogId IN (SELECT Id FROM Blogs ...)`\n  Total rows: 1 + 10 + 100 = 111 rows instead of 1,000!\n\nTrade-offs and Risks:\n- Network Roundtrips: Split queries require multiple roundtrips to the database.\n- Data Consistency: Unless executed inside an explicit serializable/snapshot transaction, an update could occur between query 1 and query 2, leading to inconsistent partial data.",
    "codeSnippet": "// Enabling Split Query on a multi-collection eager load\npublic async Task<CustomerOrderGraphDto?> GetCustomerGraphAsync(AppDbContext db, int customerId, CancellationToken ct)\n{\n    return await db.Customers\n        .AsNoTracking()\n        .AsSplitQuery() // Splits into distinct queries to avoid Cartesian explosion\n        .Include(c => c.Orders)\n            .ThenInclude(o => o.OrderItems)\n        .Include(c => c.SupportTickets)\n        .Where(c => c.Id == customerId)\n        .FirstOrDefaultAsync(ct);\n}",
    "redFlags": [
      "Blindly applying AsSplitQuery everywhere without benchmarking (for 1:1 relationships, standard single JOIN is much faster).",
      "Ignoring the EF Core warning 'Compiling a query which loads related collections for more than one collection navigation'."
    ],
    "proTips": [
      "You can configure split queries globally: options.UseSqlServer(connectionString, o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))."
    ]
  },
  {
    "id": "q-sql-8",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "Concurrency",
      "RowVersion",
      "Optimistic Locking",
      "EF Core"
    ],
    "title": "Optimistic Concurrency Control with RowVersion and DbUpdateConcurrencyException",
    "pitch": "Pessimistic locking holds exclusive database locks for the duration of a transaction, causing contention and deadlocks in web applications. Optimistic Concurrency assumes conflicts are rare: it allows concurrent reads and updates, but verifies at commit time that no other user modified the row in the interim. In SQL Server and EF Core, this is achieved using a 'RowVersion' (byte[]) column. If a conflict occurs, EF Core throws DbUpdateConcurrencyException, allowing the app to resolve the collision.",
    "deepDive": "Implementation Details:\n1. RowVersion in SQL Server:\n   - A table column declared as 'RowVersion' (synonym: TIMESTAMP) automatically increments an internal 8-byte monotonic binary number on every INSERT or UPDATE.\n2. EF Core Mapping:\n   - Configured via '[Timestamp]' or 'builder.Property(p => p.Version).IsRowVersion()'.\n3. The SQL Execution:\n   - When updating: UPDATE Products SET Price = @newPrice WHERE Id = @id AND Version = @originalVersion;\n   - If another process updated the product first, the database Version has incremented.\n   - Rows affected = 0.\n   - EF Core detects affected rows == 0 and throws DbUpdateConcurrencyException.\n4. Conflict Resolution Strategies:\n   - Client Wins: Overwrite database with client values.\n   - Database Wins: Discard client changes and reload latest database values.\n   - Custom Merge: Present both values to the user to choose fields.",
    "codeSnippet": "public async Task UpdateAccountBalanceAsync(int accountId, decimal depositAmount, CancellationToken ct)\n{\n    var account = await _db.Accounts.FindAsync(new object[] { accountId }, ct);\n    if (account == null) throw new NotFoundException();\n\n    account.Balance += depositAmount;\n\n    try\n    {\n        await _db.SaveChangesAsync(ct);\n    }\n    catch (DbUpdateConcurrencyException ex)\n    {\n        // Concurrency conflict occurred! Another user updated the record.\n        var entry = ex.Entries.Single();\n        var databaseValues = await entry.GetDatabaseValuesAsync(ct);\n\n        if (databaseValues == null)\n        {\n            throw new InvalidOperationException(\"Account was deleted by another user.\");\n        }\n\n        var dbAccount = (Account)databaseValues.ToObject();\n        throw new ConcurrencyException($\"Conflict! Current DB balance is {dbAccount.Balance}. Please retry.\");\n    }\n}",
    "redFlags": [
      "Using pessimistic transactions across HTTP requests (e.g. keeping a DB transaction open while awaiting user form submission).",
      "Catching DbUpdateConcurrencyException and doing nothing, silently dropping user updates."
    ],
    "proTips": [
      "In distributed microservices where SQL Server RowVersion is unavailable, use an integer 'Version' column incremented manually: 'UPDATE Entity SET Version = Version + 1, ... WHERE Id = @id AND Version = @expectedVersion'."
    ]
  },
  {
    "id": "q-sql-9",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "Dapper",
      "EF Core",
      "Hybrid CQRS",
      "Micro-ORM"
    ],
    "title": "Dapper and EF Core Hybrid CQRS Architecture: Blending ORM with Micro-ORM",
    "pitch": "In high-throughput enterprise .NET systems, combining EF Core and Dapper provides the ideal balance of productivity and performance. EF Core is used on the Command (Write) side for complex Domain Aggregate Roots, validation, change tracking, and transactional units of work. Dapper is used on the Query (Read) side for raw SQL execution, multi-mapping, and zero-allocation object hydration directly into read-optimized DTOs.",
    "deepDive": "Why Pure EF Core or Pure Dapper Falls Short:\n- Pure EF Core on Writes: Excellent. Handles state transitions, navigations, and concurrency tokens.\n- Pure EF Core on Reads: Even with AsNoTracking(), LINQ translation imposes overhead on complex aggregations, window functions, and legacy schema joins.\n- Pure Dapper on Writes: Painful. Requires writing manual boilerplate SQL INSERT/UPDATE statements for 50 entity fields and handling change tracking manually.\n\nThe Hybrid Solution:\n- Both share the same underlying SQL Connection and Transaction: 'var conn = dbContext.Database.GetDbConnection();'.\n- Dapper executes custom SQL with CTEs, PIVOTs, or window functions (ROW_NUMBER() OVER (...)) that LINQ cannot efficiently translate.",
    "codeSnippet": "// Query Handler using Dapper for micro-second read performance\npublic class GetOrderAnalyticsQueryHandler : IRequestHandler<GetOrderAnalyticsQuery, OrderAnalyticsDto>\n{\n    private readonly IDbConnectionFactory _dbConnectionFactory;\n\n    public GetOrderAnalyticsQueryHandler(IDbConnectionFactory factory) => _dbConnectionFactory = factory;\n\n    public async Task<OrderAnalyticsDto> Handle(GetOrderAnalyticsQuery request, CancellationToken ct)\n    {\n        using var connection = _dbConnectionFactory.CreateConnection();\n        const string sql = @\"\n            SELECT \n                COUNT(1) AS TotalOrders,\n                SUM(TotalAmount) AS GrossRevenue,\n                AVG(TotalAmount) AS AverageOrderValue\n            FROM Orders WITH (NOLOCK)\n            WHERE CreatedAt >= @StartDate AND Status = 'Completed';\";\n\n        return await connection.QuerySingleAsync<OrderAnalyticsDto>(\n            new CommandDefinition(sql, new { request.StartDate }, cancellationToken: ct));\n    }\n}",
    "redFlags": [
      "Using string concatenation in Dapper SQL queries instead of parameterized anonymous objects (creates SQL Injection vulnerabilities!).",
      "Using Dapper to update complex entity aggregate graphs manually."
    ],
    "proTips": [
      "Use Dapper's 'QueryMultipleAsync' to execute multiple SQL SELECT statements in a single database roundtrip, hydrating parent and child collections simultaneously."
    ]
  },
  {
    "id": "q-sql-10",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "Deadlocks",
      "SQL Profiling",
      "XML Deadlock Graph",
      "Locking Order"
    ],
    "title": "SQL Server Deadlocks: Graph Analysis, Lock Hierarchy, and Resolution",
    "pitch": "A deadlock occurs when two or more transactions hold exclusive locks on separate resources and each attempts to acquire a lock on the resource held by the other, creating a circular wait dependency. SQL Server detects deadlocks via an internal lock manager thread that runs every 5 seconds, selecting the transaction with the lowest rollback cost as the 'deadlock victim' (error 1205). Resolving deadlocks requires strict object access ordering, reducing transaction duration, creating covering indexes, and enabling RCSI.",
    "deepDive": "Analyzing the XML Deadlock Graph:\nThe XML Deadlock Graph provides:\n1. Victim Process: The SPID that was terminated.\n2. Resource List: The specific Page, Key, or Table locks in contention (e.g. KEY: 8:7205759404... [OBJECT]).\n3. Owner List and Waiter List: Shows which process held which lock mode (X, S, U) and was requesting another.\n\nFour Proven Strategies to Eliminate Deadlocks:\n1. Enforce Consistent Access Order: Always update tables in the exact same sequence across all transactions (e.g., Orders first, then OrderItems; never reversed).\n2. Enable RCSI: Eliminates Shared (S) locks for readers. If deadlocks involve readers and writers, RCSI fixes them instantly.\n3. Keep Transactions Lean: Do NOT make external HTTP API calls or run slow calculations inside an open database transaction.\n4. Appropriate Indexes: A missing index turns an atomic row update into a full table scan, holding exclusive locks across the entire table.",
    "codeSnippet": "-- Handling Deadlock Exceptions with Polly Retry in C#\nvar retryPolicy = Policy\n    .Handle<SqlException>(ex => ex.Number == 1205) // SQL Error 1205 = Deadlock Victim\n    .WaitAndRetryAsync(\n        retryCount: 3,\n        sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(50 * Math.Pow(2, attempt)) + \n                                          TimeSpan.FromMilliseconds(Random.Shared.Next(0, 50)),\n        onRetry: (exception, delay, attempt, context) =>\n        {\n            logger.LogWarning(\"Deadlock encountered. Retrying attempt {Attempt}...\", attempt);\n        });\n\nawait retryPolicy.ExecuteAsync(async () => await dbContext.SaveChangesAsync(ct));",
    "redFlags": [
      "Treating deadlocks as random flukes rather than reproducible concurrency design flaws.",
      "Performing heavy aggregations or multi-second operations inside open write transactions."
    ],
    "proTips": [
      "Use SQL Extended Events (system_health session) to automatically capture XML deadlock graphs in production without performance overhead."
    ]
  },
  {
    "id": "q-frontend-1",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "React Fiber",
      "Reconciliation",
      "Virtual DOM",
      "Work Loop"
    ],
    "title": "React Fiber Architecture: Double Buffering, Lanes, and the Interruptible Work Loop",
    "pitch": "React Fiber is a complete rewrite of React's core reconciliation algorithm that replaced the synchronous recursive stack reconciler. A Fiber is a JavaScript object representing a component, its state, props, and DOM bindings. Fiber enables interruptible, cooperative multitasking by structuring the component tree as a singly-linked list (child, sibling, return pointers). It uses double buffering ('current' vs 'workInProgress' trees) and Lane-based priority scheduling to ensure high-priority user interactions (typing, clicking) are never blocked by heavy rendering.",
    "deepDive": "The Two Phases of React Rendering:\n1. Render Phase (Asynchronous & Interruptible):\n   - React executes the work loop (performUnitOfWork).\n   - Traverses the fiber tree, runs component functions, and computes diffs.\n   - If a higher-priority task arrives (e.g. keyboard stroke), React pauses work, returns control to the browser's main thread via MessageChannel, and restarts or resumes later.\n   - Creates the 'workInProgress' tree.\n2. Commit Phase (Synchronous & Uninterruptible):\n   - Takes the finished workInProgress fiber tree and mutates the actual browser DOM (placement, update, deletion).\n   - Executes useLayoutEffect synchronously, then swaps the root pointer: current = workInProgress.\n   - Finally schedules useEffect asynchronously.\n\nLanes Scheduling:\nReact 18/19 groups updates into 31 bitmask Lanes (e.g. SyncLane, InputContinuousLane, DefaultLane, IdleLane), allowing fine-grained priority preemption.",
    "codeSnippet": "// Conceptual representation of a Fiber node structure\ninterface Fiber {\n  tag: WorkTag;             // FunctionComponent, ClassComponent, HostRoot, etc.\n  key: null | string;\n  elementType: any;\n  stateNode: any;           // Reference to actual DOM element or class instance\n  \n  // Singly-linked list tree structure\n  return: Fiber | null;     // Parent fiber\n  child: Fiber | null;      // First child\n  sibling: Fiber | null;    // Next sibling\n\n  memoizedProps: any;       // Props used in last render\n  pendingProps: any;        // New incoming props\n  memoizedState: any;       // Linked list of hooks (useState, useEffect)\n  lanes: Lanes;             // Priority bitmask\n  alternate: Fiber | null;  // Double buffering counterpart (current <-> workInProgress)\n}",
    "redFlags": [
      "Claiming that Virtual DOM diffing is fast because manipulating JS objects has zero overhead (reconciliation still consumes CPU; Fiber's true breakthrough was interruptibility).",
      "Performing side-effects (API calls, DOM mutation) during the render phase instead of in useEffect."
    ],
    "proTips": [
      "React DevTools Profiler allows you to inspect 'Rendered at lane' to see why and when concurrent priority preemption occurred."
    ]
  },
  {
    "id": "q-frontend-2",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "React 19",
      "useTransition",
      "Concurrent",
      "useDeferredValue"
    ],
    "title": "React 19 Concurrent Features: useTransition, useDeferredValue, and Non-Blocking UI",
    "pitch": "Before concurrent React, state updates were synchronous and all updates had equal urgency. If rendering a large list took 200ms, the user's typing in a search box froze. React's useTransition() allows developers to mark state updates as non-urgent transitions. Urgent updates (input value) render immediately at SyncLane, while non-urgent updates (filtering 10,000 items) render in the background. If the user types again, React aborts the in-flight background render and starts fresh with the new keystroke.",
    "deepDive": "useTransition vs Debouncing vs useDeferredValue:\n- Debouncing: Delays execution using setTimeout. Introduces artificial latency even on ultra-fast machines.\n- useTransition: Starts rendering IMMEDIATELY in the background. If the device is fast, results show instantly; if slow, typing is still never blocked. Exposes 'isPending' for loading spinners.\n- useDeferredValue: Used when you do not control the state update directly (e.g. receiving a prop from a parent). It defers re-rendering the child component until higher-priority work completes.",
    "codeSnippet": "import React, { useState, useTransition } from 'react';\n\nexport function SearchableAnalyticsDashboard({ records }: { records: RecordItem[] }) {\n  const [searchTerm, setSearchTerm] = useState('');\n  const [filteredResults, setFilteredResults] = useState(records);\n  const [isPending, startTransition] = useTransition();\n\n  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const value = e.target.value;\n    \n    // 1. URGENT UPDATE: Keep typing responsive at 60 FPS\n    setSearchTerm(value);\n\n    // 2. NON-URGENT TRANSITION: Background interruptible render\n    startTransition(() => {\n      const filtered = records.filter(r => \n        r.name.toLowerCase().includes(value.toLowerCase()) ||\n        r.category.toLowerCase().includes(value.toLowerCase())\n      );\n      setFilteredResults(filtered);\n    });\n  };\n\n  return (\n    <div>\n      <input type=\"text\" value={searchTerm} onChange={handleSearchChange} placeholder=\"Search...\" />\n      {isPending && <span className=\"spinner\">Filtering records...</span>}\n      <RecordList items={filteredResults} opacity={isPending ? 0.6 : 1} />\n    </div>\n  );\n}",
    "redFlags": [
      "Wrapping controlled text input state updates directly in startTransition (makes the input sluggish).",
      "Using useTransition for simple boolean toggle switches where no heavy computations exist."
    ],
    "proTips": [
      "In React 19, startTransition also accepts async functions (Actions), automatically managing 'isPending' until the promise settles."
    ]
  },
  {
    "id": "q-frontend-3",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "useEffect",
      "Stale Closures",
      "React Hooks",
      "Memory Leaks"
    ],
    "title": "useEffect Dependency Traps, Stale Closures, and the useRef Escape Hatch",
    "pitch": "A Stale Closure occurs when a hook closure (such as inside useEffect, useCallback, or an event listener) captures variables from a previous render pass because they were omitted from the dependency array. When the effect executes later, it references stale variable values. Common traps include infinite re-render loops from object dependency referential instability. Solutions include functional state updaters, useReducer, and the latest-ref pattern.",
    "deepDive": "Why Stale Closures Happen:\nJavaScript functions create closures over variables in their enclosing lexical scope. Each render in React is a distinct invocation with its own props, state, and constants. If an effect runs on mount (deps: []) and sets up an interval that reads 'count', it permanently captures 'count = 0' from the initial render, causing 'setCount(count + 1)' to perpetually set count to 1.\n\nFixing Stale Closures:\n1. Functional Updates: setCount(prev => prev + 1) reads state from React's internal queue without needing 'count' in dependencies.\n2. Latest Ref Pattern: Store changing callbacks or props in a mutable useRef ('const latestCallback = useRef(cb); latestCallback.current = cb;'). The effect can safely run once while reading the latest ref value.",
    "codeSnippet": "// Custom hook implementing the safe latest-ref pattern for intervals\nimport { useEffect, useRef } from 'react';\n\nexport function useInterval(callback: () => void, delay: number | null) {\n  const savedCallback = useRef(callback);\n\n  // Keep ref synchronized with latest callback without re-triggering effect\n  useEffect(() => {\n    savedCallback.current = callback;\n  }, [callback]);\n\n  useEffect(() => {\n    if (delay === null) return;\n\n    const tick = () => savedCallback.current();\n    const id = setInterval(tick, delay);\n    // Cleanup to prevent memory leaks!\n    return () => clearInterval(id);\n  }, [delay]); // Only resets interval if delay duration changes!\n}",
    "redFlags": [
      "Disabling the ESLint 'react-hooks/exhaustive-deps' rule with comments instead of fixing root causes.",
      "Creating inline object or array literals inside component bodies and passing them as dependencies to useEffect (triggers infinite loops)."
    ],
    "proTips": [
      "If you find yourself chaining multiple useEffect hooks to synchronize state across components, refactor to derive state during render or use a centralized state store."
    ]
  },
  {
    "id": "q-frontend-4",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "State Management",
      "Zustand",
      "Redux Toolkit",
      "Context"
    ],
    "title": "State Management Architecture: Zustand vs Redux Toolkit vs React Context",
    "pitch": "React Context is a dependency injection mechanism, not a high-frequency state management system: any update to a Context value forces every consuming component to re-render, even if it only accesses an unchanged property. Redux Toolkit provides predictable centralized state with time-travel debugging and strict immutability, but has higher boilerplate. Zustand is an unopinionated, lightweight store using external state subscriptions and fine-grained selectors, preventing unnecessary re-renders with zero Context Provider wrappers.",
    "deepDive": "Deep Architectural Comparison:\n1. React Context:\n   - Does NOT support selector-based subscriptions natively.\n   - If 'UserContext' holds '{ name, theme, cart }', updating 'cart' triggers re-renders in components that only read 'theme'.\n   - Workarounds require splitting into 10 separate tiny contexts.\n2. Redux Toolkit (RTK):\n   - Best for large enterprise teams requiring strict architectural conventions, middleware (RTK Query), and time-travel debugging.\n   - Uses Immer for mutable-syntax immutable updates.\n3. Zustand:\n   - Stores live outside React's component tree.\n   - Components subscribe via selectors: 'const name = useStore(state => state.user.name)'.\n   - Uses Object.is to ensure the component ONLY re-renders when the selected slice strictly changes.\n   - Can be read and modified outside of React components (e.g. in Axios interceptors or SignalR event handlers).",
    "codeSnippet": "import { create } from 'zustand';\nimport { devtools, persist } from 'zustand/middleware';\n\ninterface CartState {\n  items: CartItem[];\n  total: number;\n  addItem: (item: CartItem) => void;\n  clearCart: () => void;\n}\n\nexport const useCartStore = create<CartState>()(\n  devtools(\n    persist(\n      (set, get) => ({\n        items: [],\n        total: 0,\n        addItem: (item) => set((state) => {\n          const updatedItems = [...state.items, item];\n          return {\n            items: updatedItems,\n            total: updatedItems.reduce((acc, i) => acc + i.price * i.qty, 0)\n          };\n        }),\n        clearCart: () => set({ items: [], total: 0 })\n      }),\n      { name: 'shopping-cart-storage' }\n    )\n  )\n);\n\n// Component only re-renders when 'total' changes; ignores 'items' changes!\nexport function CartSummary() {\n  const total = useCartStore((s) => s.total);\n  return <div className=\"cart-total\">Total: ${total.toFixed(2)}</div>;\n}",
    "redFlags": [
      "Using React Context for global real-time WebSocket or stock ticker state updates (causes massive UI lag).",
      "Calling 'const store = useCartStore()' without a selector (causes the component to re-render on ANY store change)."
    ],
    "proTips": [
      "Use Zustand's 'useShallow' hook when selecting multiple properties into an object to prevent re-renders from new object reference allocations."
    ]
  },
  {
    "id": "q-frontend-5",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "Virtualization",
      "Windowing",
      "DOM Performance",
      "Large Lists"
    ],
    "title": "List Virtualization (Windowing 100k Rows): Mechanics and DOM Recycling",
    "pitch": "Mounting 100,000 DOM elements causes the browser to allocate hundreds of megabytes of memory, choking layout computation, garbage collection, and scroll performance. List Virtualization (windowing) solves this by maintaining a fixed pool of only 15–20 DOM elements currently within the user's viewport (plus an overscan buffer). As the user scrolls, elements are recycled and dynamically repositioned using CSS transform: translateY, keeping DOM memory constant regardless of dataset size.",
    "deepDive": "Internal Virtualization Algorithm:\n1. Container & Total Height:\n   - Outer container has 'overflow-y: auto' and a fixed viewport height (e.g. 600px).\n   - Inner container height is set to: 'Total Items * Item Height' (e.g. 100,000 * 50px = 5,000,000px) to establish a realistic scrollbar.\n2. Viewport Math:\n   - Listen to container 'scroll' event (or use ResizeObserver / requestAnimationFrame).\n   - Calculate:\n     startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);\n     endIndex = Math.min(totalItems - 1, Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan);\n3. Slice & Translate:\n   - Extract records slice: items.slice(startIndex, endIndex + 1).\n   - Render each item with style: 'position: absolute; top: 0; transform: translateY(index * itemHeight)px'.",
    "codeSnippet": "// Zero-dependency Virtual List component implementation\nimport React, { useState, useRef } from 'react';\n\nexport function VirtualizedList<T>({ items, itemHeight, viewportHeight, renderItem }: {\n  items: T[];\n  itemHeight: number;\n  viewportHeight: number;\n  renderItem: (item: T, index: number) => React.ReactNode;\n}) {\n  const [scrollTop, setScrollTop] = useState(0);\n  const totalHeight = items.length * itemHeight;\n  const overscan = 3;\n\n  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);\n  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan);\n\n  const visibleItems = items.slice(startIndex, endIndex + 1);\n\n  return (\n    <div\n      style={{ height: viewportHeight, overflowY: 'auto', position: 'relative' }}\n      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}\n    >\n      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>\n        {visibleItems.map((item, idx) => {\n          const actualIndex = startIndex + idx;\n          return (\n            <div\n              key={actualIndex}\n              style={{\n                position: 'absolute',\n                top: 0,\n                left: 0,\n                width: '100%',\n                height: itemHeight,\n                transform: `translateY(${actualIndex * itemHeight}px)`\n              }}\n            >\n              {renderItem(item, actualIndex)}\n            </div>\n          );\n        })}\n      </div>\n    </div>\n  );\n}",
    "redFlags": [
      "Using pagination as the only answer to large datasets without knowing how virtualization works.",
      "Attempting to render 10,000 SVG charts or complex DOM trees simultaneously without windowing."
    ],
    "proTips": [
      "For dynamic row heights where itemHeight varies, use @tanstack/react-virtual or react-virtualized which measure DOM elements dynamically using ResizeObserver."
    ]
  },
  {
    "id": "q-frontend-6",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "TypeScript",
      "Discriminated Unions",
      "Exhaustive Check",
      "Type Safety"
    ],
    "title": "TypeScript Discriminated Unions and Compile-Time Exhaustive Pattern Matching",
    "pitch": "Discriminated Unions (tagged unions) model mutually exclusive states by combining an explicit literal 'discriminant' property (e.g. 'status') with distinct payloads. This eliminates 'optional property soup' where types contain numerous confusing optional fields. By leveraging the 'never' type in switch default cases, TypeScript provides compile-time exhaustiveness checking: if an engineer adds a new union variant, the compiler fails with a type error until the variant is handled.",
    "deepDive": "Why Optional Interfaces Fail in Production:\nConsider:\ninterface AsyncState<T> { isLoading?: boolean; error?: Error; data?: T; }\nThis allows invalid domain states, such as { isLoading: true, data: user, error: new Error() }.\n\nDiscriminated Union Structure:\ntype AsyncState<T> =\n  | { status: 'idle' }\n  | { status: 'loading' }\n  | { status: 'success'; data: T }\n  | { status: 'error'; error: Error };\n\nWhen 'state.status === \"success\"', TypeScript automatically narrows the type, granting access to 'data' while guaranteeing 'error' does not exist.\n\nExhaustiveness with 'never':\nAssigning an unhandled union case to type 'never' causes the TypeScript compiler to throw error: 'Type X is not assignable to type never'.",
    "codeSnippet": "// Bulletproof Redux/Zustand Action handling with Exhaustive Verification\ntype OrderAction =\n  | { type: 'SUBMIT'; payload: { orderId: string } }\n  | { type: 'APPROVE'; payload: { orderId: string; approverId: string } }\n  | { type: 'REJECT'; payload: { orderId: string; reason: string } };\n\nexport function orderReducer(state: OrderState, action: OrderAction): OrderState {\n  switch (action.type) {\n    case 'SUBMIT':\n      return { ...state, status: 'submitted', id: action.payload.orderId };\n    case 'APPROVE':\n      return { ...state, status: 'approved', approvedBy: action.payload.approverId };\n    case 'REJECT':\n      return { ...state, status: 'rejected', rejectionReason: action.payload.reason };\n    default: {\n      // COMPILE-TIME GUARD: If a new action is added to OrderAction, TypeScript errors here!\n      const _exhaustiveCheck: never = action;\n      throw new Error(`Unhandled action: ${JSON.stringify(_exhaustiveCheck)}`);\n    }\n  }\n}",
    "redFlags": [
      "Using 'any' or type assertions ('as unknown as Type') to bypass union mismatch errors.",
      "Modeling multi-state workflows with multiple independent boolean flags (isSubmitting, isFailed, isComplete)."
    ],
    "proTips": [
      "Use TypeScript satisfies operator (data satisfies ApiResponse) to enforce type compliance without widening literal types."
    ]
  },
  {
    "id": "q-frontend-7",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "TypeScript",
      "Utility Types",
      "Mapped Types",
      "Generics"
    ],
    "title": "Advanced TypeScript: ReturnType, Parameters, Mapped Types, and Conditional 'infer'",
    "pitch": "Senior TypeScript mastery requires understanding utility types and type metaprogramming. Core built-in utilities like Pick, Omit, Partial, and Record transform interface shapes. Advanced utilities like ReturnType<T> and Parameters<T> use conditional types and the 'infer' keyword to extract return types and parameter tuples directly from functions, ensuring type definitions stay strictly in sync with runtime code without duplicate interface declarations.",
    "deepDive": "How ReturnType<T> is Implemented in TypeScript's Standard Library:\ntype ReturnType<T extends (...args: any) => any> = \n  T extends (...args: any) => infer R ? R : any;\n\nThe 'infer' keyword introduces a runtime type variable inside a conditional type expression.\n\nCustom Mapped Types:\nMapped types iterate over keys using 'in keyof':\n- DeepReadonly<T>: Recursively applies 'readonly' to all nested objects.\n- OptionalKeys<T>: Extracts only keys that are optional in an interface.\n- Template Literal Types: Combines string literals (e.g. `on${Capitalize<EventName>}`).",
    "codeSnippet": "// Extracting typed API response contract without duplicate types\nexport async function fetchUserDashboard(userId: string) {\n  const response = await fetch(`/api/users/${userId}/dashboard`);\n  const data = await response.json();\n  return {\n    userId,\n    profile: data.profile as { name: string; avatarUrl: string },\n    permissions: data.permissions as string[],\n    unreadCount: data.unreadCount as number\n  };\n}\n\n// Automatically derived contract type - ALWAYS matches function implementation!\nexport type UserDashboardData = ReturnType<typeof fetchUserDashboard> extends Promise<infer T> ? T : never;\n\n// Generic Deep Immutable Utility Type\nexport type DeepReadonly<T> = {\n  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];\n};",
    "redFlags": [
      "Manually declaring duplicate interfaces for function return payloads that easily drift out of sync.",
      "Overusing complex generic mapped types where simple interfaces would suffice."
    ],
    "proTips": [
      "Use 'Awaited<ReturnType<typeof asyncFn>>' in TypeScript 4.5+ to unwrap Promise types cleanly without manual 'infer' boilerplate."
    ]
  },
  {
    "id": "q-cloud-1",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "CI/CD",
      "YAML",
      "Pipelines",
      "Azure DevOps"
    ],
    "title": "Enterprise Multi-Stage YAML Pipelines: Build, Test, Security, and Gated Deployments",
    "pitch": "Modern enterprise CI/CD uses version-controlled multi-stage YAML pipelines rather than legacy GUI release pipelines. Stages represent distinct phases: Build (restore, build, unit test, publish artifacts), Security Scan (SonarQube, Trivy container scan), Staging Deployment, and Production Deployment. Environments enforce automated governance: manual manager approvals, Azure Monitor health alert gates, and automated rollbacks without manual developer intervention.",
    "deepDive": "Multi-Stage Architecture:\n1. Trigger & PR Validation:\n   - Branch triggers on main/release.\n   - Separate PR validation triggers that build and test feature branches before merge.\n2. Immutability Principle:\n   - Build ONCE, Deploy Everywhere. The same binary/container image produced in Stage 1 is deployed to Dev, Staging, and Production. Environmental differences are injected via App Service app settings or Kubernetes ConfigMaps.\n3. Deployment Jobs:\n   - Use 'deployment: DeployProd' rather than standard 'job: Deploy'.\n   - Links directly to Azure DevOps Environments, providing deployment history, audit logs, and approval checks.\n   - Supports deployment strategies: 'runOnce', 'rolling', or 'canary'.",
    "codeSnippet": "trigger:\n  branches:\n    include: [ main ]\n\nstages:\n- stage: BuildAndTest\n  displayName: 'Build, Test & Containerize'\n  jobs:\n  - job: BuildJob\n    pool: { vmImage: 'ubuntu-latest' }\n    steps:\n    - task: DotNetCoreCLI@2\n      inputs:\n        command: 'test'\n        projects: '**/*Tests/*.csproj'\n        arguments: '--configuration Release /p:CollectCoverage=true'\n    - task: Docker@2\n      inputs:\n        command: 'buildAndPush'\n        containerRegistry: 'acr-production'\n        repository: 'api/orders'\n        tags: '$(Build.BuildId)'\n\n- stage: DeployProduction\n  displayName: 'Deploy to Production (Gated)'\n  dependsOn: BuildAndTest\n  jobs:\n  - deployment: DeployToAppService\n    environment: 'Production-Environment' # Enforces Approval Gates & Alert Checks\n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - task: AzureWebAppContainer@1\n            inputs:\n              appName: 'app-orders-prod'\n              imageName: 'acrproduction.azurecr.io/api/orders:$(Build.BuildId)'",
    "redFlags": [
      "Rebuilding the application from source code in every environment (violates artifact immutability).",
      "Storing passwords or API keys directly in YAML files instead of Azure Key Vault / Azure DevOps Variable Groups."
    ],
    "proTips": [
      "Use YAML Templates (extends: template.yml) to enforce organization-wide security, SonarQube quality gates, and compliance standards across all repositories."
    ]
  },
  {
    "id": "q-cloud-2",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "App Service",
      "Deployment Slots",
      "Zero Downtime",
      "Warmup"
    ],
    "title": "Azure App Service Deployment Slots and Zero-Downtime Warmup Probes",
    "pitch": "Azure App Service Deployment Slots enable true zero-downtime blue/green deployments. Instead of deploying directly to production and incurring JIT compilation lag or cold-start timeouts, the new build is deployed to an isolated 'Staging' slot. Azure warms up the app using the 'applicationInitialization' probe specified in web.config. Once the staging slot returns HTTP 200, Azure swaps the virtual IP routing rules: traffic instantly switches to the new build with zero dropped TCP connections.",
    "deepDive": "The Mechanics of a Slot Swap:\n1. Warmup Phase:\n   - App Service sends HTTP requests to the root '/' or designated health probe path.\n   - EF Core compiles model caches, JIT compiles C# assemblies, and singletons initialize.\n2. IP Swap:\n   - Azure's Front-End routing servers update their internal reverse proxy routing rules.\n   - The staging slot's worker processes become the production endpoints.\n3. Sticky Settings ('slotSetting: true'):\n   - Settings can be marked as slot-specific (e.g. database connection strings, logging levels).\n   - Sticky settings stay with the slot and DO NOT swap.\n4. Instant Rollback:\n   - If a critical bug is discovered after swapping, clicking 'Swap' again reverses the routing in < 10 seconds.",
    "codeSnippet": "<!-- web.config: Ensure JIT warmup finishes before slot swap switches traffic -->\n<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<configuration>\n  <system.webServer>\n    <applicationInitialization doAppInitAfterRestart=\"true\">\n      <!-- App Service holds the swap until this probe returns HTTP 200 -->\n      <add initializationPage=\"/health/ready\" hostName=\"localhost\" />\n    </applicationInitialization>\n  </system.webServer>\n</configuration>",
    "redFlags": [
      "Swapping slots without configuring warmup probes (production users experience 10-second cold start latency spikes).",
      "Forgetting to make staging connection strings 'sticky', causing staging slots to write to production databases."
    ],
    "proTips": [
      "Configure Auto-Swap on the staging slot: any successful deployment to staging automatically initiates a swap to production once warmup passes."
    ]
  },
  {
    "id": "q-cloud-3",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "Managed Identity",
      "Security",
      "Azure SQL",
      "Key Vault"
    ],
    "title": "Azure Managed Identities: Passwordless Architecture with DefaultAzureCredential",
    "pitch": "Azure Managed Identity provides an automatically managed identity in Microsoft Entra ID (Azure AD) for Azure resources (App Service, AKS, Functions). It eliminates the dangerous anti-pattern of storing connection strings, database passwords, and client secrets in configuration files. In C#, the Azure.Identity library's 'DefaultAzureCredential' automatically fetches OAuth tokens to authenticate to Azure SQL Database, Azure Key Vault, and Azure Service Bus seamlessly across local dev and production.",
    "deepDive": "System-Assigned vs User-Assigned:\n- System-Assigned: Created and tied directly to the lifecycle of a specific Azure resource (deleting the App Service automatically deletes the identity in Entra ID).\n- User-Assigned: Created as an independent Azure resource; can be assigned to multiple VMs or scale-set instances.\n\nPasswordless Azure SQL Connection:\n- In Azure SQL, create an Entra ID user: CREATE USER [app-orders-prod] FROM EXTERNAL PROVIDER;\n- Grant permissions: ALTER ROLE db_datareader ADD MEMBER [app-orders-prod];\n- Connection string in appsettings.json becomes:\n  'Server=tcp:sql-prod.database.windows.net,1433;Database=OrdersDb;Authentication=Active Directory Default;'\n- Zero passwords! Microsoft.Data.SqlClient automatically contacts Azure's IMDS (Instance Metadata Service) endpoint to acquire an access token.",
    "codeSnippet": "// C# Program.cs: Passwordless Secret and Blob Storage Client setup\nusing Azure.Identity;\nusing Azure.Security.KeyVault.Secrets;\n\nvar builder = WebApplication.CreateBuilder(args);\n\n// DefaultAzureCredential automatically falls back:\n// 1. Environment Variables (CI/CD)\n// 2. Workload Identity / Managed Identity (Azure App Service / AKS)\n// 3. Azure CLI / Visual Studio (Local developer machine)\nvar credential = new DefaultAzureCredential();\n\nbuilder.Services.AddSingleton(new SecretClient(\n    new Uri(\"https://kv-production-core.vault.azure.net/\"), \n    credential));\n\n// Azure SQL with Passwordless Managed Identity in EF Core\nbuilder.Services.AddDbContext<AppDbContext>(options =>\n{\n    options.UseSqlServer(builder.Configuration.GetConnectionString(\"SqlManagedIdentity\"));\n});",
    "redFlags": [
      "Checking database passwords or connection strings into Git repositories.",
      "Hardcoding ClientId and ClientSecret inside appsettings.json."
    ],
    "proTips": [
      "For local developer machines, sign in via 'az login' in the terminal; DefaultAzureCredential will detect your developer credentials automatically without code changes."
    ]
  },
  {
    "id": "q-cloud-4",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "Docker",
      "Containers",
      "Ubuntu Chiseled",
      "Security"
    ],
    "title": "Minimal Ubuntu Chiseled Docker Containers: Distroless Security and Size Optimization",
    "pitch": "Microsoft and Canonical partnered to produce 'Ubuntu Chiseled' container images for .NET 8+. Chiseled images are distroless: they contain only the bare minimum runtime dependencies needed to execute .NET binaries. They contain NO package manager (no apt/dpkg), NO shell (no bash/sh), and run as a non-root user ('app') by default. This shrinks container images from 350MB+ down to < 100MB, accelerates startup and auto-scaling, and eliminates over 90% of OS-level CVE vulnerability scanner alerts.",
    "deepDive": "Why Traditional Containers are Risky in Enterprise Production:\n- Standard Linux images contain thousands of utilities (curl, wget, tar, bash, python).\n- If an attacker achieves Remote Code Execution (RCE), they use the container's shell and package manager to install malware, compile exploit kits, and pivot laterally across the Kubernetes cluster.\n\nChiseled / Distroless Architecture:\n- Non-Root: Runs as user ID 1654 ('app') rather than root (UID 0), preventing container breakout attacks.\n- Read-Only & Immutability: Without apt or bash, an attacker cannot install packages or execute shell commands.\n- Multi-Stage Dockerfile: Build on heavy SDK image; copy only the compiled binaries to the chiseled runtime image.",
    "codeSnippet": "# Multi-stage production Dockerfile using .NET 8 Ubuntu Chiseled\n# STAGE 1: Build & Publish\nFROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\nWORKDIR /src\nCOPY [\"OrdersApi/OrdersApi.csproj\", \"OrdersApi/\"]\nRUN dotnet restore \"OrdersApi/OrdersApi.csproj\"\nCOPY . .\nWORKDIR \"/src/OrdersApi\"\nRUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false\n\n# STAGE 2: Ultra-Minimal Chiseled Runtime (< 100MB, Non-root user)\nFROM mcr.microsoft.com/dotnet/aspnet:8.0-chiseled AS final\nWORKDIR /app\nCOPY --from=build /app/publish .\n\n# Port 8080 is the default non-root port in .NET 8\nEXPOSE 8080\nENV ASPNETCORE_HTTP_PORTS=8080\n\nENTRYPOINT [\"dotnet\", \"OrdersApi.dll\"]",
    "redFlags": [
      "Running production containers as the root user (UID 0).",
      "Shipping the entire .NET SDK image to production instead of using multi-stage builds."
    ],
    "proTips": [
      "In .NET 8+, ASP.NET Core binds to port 8080 by default (rather than port 80) because non-root users cannot bind to privileged ports below 1024."
    ]
  },
  {
    "id": "q-cloud-5",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "Service Bus",
      "Outbox Pattern",
      "Distributed Systems",
      "EDA"
    ],
    "title": "Azure Service Bus and the Transactional Outbox Pattern: Solving Dual-Write Bugs",
    "pitch": "The Dual-Write Problem occurs in distributed architectures when a service must mutate its database and publish an event to a message broker (Azure Service Bus). If the database write succeeds but the network fails during event publish, downstream services never receive the event; if publish succeeds but database transaction rolls back, downstream services process ghost data. The Transactional Outbox Pattern solves this by storing the message in an Outbox table within the same local database ACID transaction.",
    "deepDive": "Detailed Mechanics:\n1. The ACID Boundary:\n   - Within an explicit DbContext transaction:\n     db.Orders.Add(order);\n     db.OutboxMessages.Add(new OutboxMessage { EventType = \"OrderCreated\", Payload = json });\n     await db.SaveChangesAsync();\n   - If either fails, the entire transaction rolls back. Guaranteed atomicity without 2-Phase Commit (2PC).\n2. The Outbox Publisher:\n   - A separate background worker (or Debezium CDC) reads unprocessed outbox records:\n     SELECT * FROM OutboxMessages WHERE ProcessedAt IS NULL ORDER BY CreatedAt.\n   - Publishes to Azure Service Bus Topic.\n   - Updates OutboxMessage.ProcessedAt = DateTime.UtcNow.\n3. At-Least-Once Delivery & Idempotency:\n   - Message brokers guarantee at-least-once delivery. If the publisher crashes after publishing but before updating ProcessedAt, a duplicate message will be published.\n   - Downstream consumers MUST be idempotent (track processed MessageId in their own database to reject duplicates).",
    "codeSnippet": "// MassTransit provides built-in Transactional Outbox for EF Core with one line!\nbuilder.Services.AddMassTransit(x =>\n{\n    x.AddEntityFrameworkOutbox<AppDbContext>(o =>\n    {\n        o.UseSqlServer();\n        o.UseBusOutbox(); // Integrates outbox directly into IPublishEndpoint\n        o.DuplicateDetectionWindow = TimeSpan.FromMinutes(30);\n    });\n\n    x.UsingAzureServiceBus((context, cfg) =>\n    {\n        cfg.Host(builder.Configuration.GetConnectionString(\"ServiceBus\"));\n        cfg.ConfigureEndpoints(context);\n    });\n});\n\n// In your application service:\npublic async Task CreateOrderAsync(CreateOrderDto dto, CancellationToken ct)\n{\n    var order = new Order(dto.CustomerId, dto.Amount);\n    _db.Orders.Add(order);\n\n    // This publish is automatically intercepted and saved to the Outbox table in the DB!\n    await _publishEndpoint.Publish(new OrderCreatedEvent(order.Id, order.Amount), ct);\n\n    // Commits BOTH the Order and the Outbox message in a single atomic transaction!\n    await _db.SaveChangesAsync(ct);\n}",
    "redFlags": [
      "Publishing to Azure Service Bus before calling db.SaveChangesAsync() (ghost event published if DB throws exception).",
      "Assuming message brokers provide exactly-once delivery without implementing idempotent consumers."
    ],
    "proTips": [
      "Enable 'RequiresDuplicateDetection = true' and 'DuplicateDetectionHistoryTimeWindow = 10 minutes' on Azure Service Bus Queues to let Azure deduplicate retried messages via MessageId."
    ]
  },
  {
    "id": "q-csharp-11",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Unsafe",
      "Pointers",
      "MemoryMarshal",
      "SIMD"
    ],
    "title": "Unsafe Code, Native Pointers, and MemoryMarshal Zero-Copy Casts",
    "pitch": "While C# is fundamentally a type-safe managed language, the 'unsafe' keyword and System.Runtime.InteropServices.MemoryMarshal allow developers to bypass CLR safety checks for ultra-high-throughput native interop, cryptographic operations, and SIMD hardware intrinsics. MemoryMarshal.Cast<TFrom, TTo>() allows zero-copy type reinterpretation of Span buffers without copying a single byte in memory.",
    "deepDive": "Unsafe vs Safe Memory Operations:\n1. Pointers (fixed statement):\n   - The CLR GC moves objects during compaction.\n   - Using 'fixed (byte* p = buffer)' pins the managed array in memory, disabling GC movement for that block so raw pointers can be safely traversed.\n2. MemoryMarshal.Cast:\n   - Reinterprets a Span<byte> as a Span<int> or Span<Vector256<float>> without copying.\n   - Calculates the new length as: '(oldLength * sizeof(TFrom)) / sizeof(TTo)'.\n3. Hardware Intrinsics (SIMD):\n   - System.Runtime.Intrinsics.X86 (AVX2, AVX512) and Arm.Arm64.\n   - Performs Single Instruction Multiple Data operations, processing 8 or 16 numbers in a single CPU clock cycle.",
    "codeSnippet": "using System.Runtime.InteropServices;\nusing System.Runtime.Intrinsics;\nusing System.Runtime.Intrinsics.X86;\n\npublic static class FastBufferUtilities\n{\n    // Zero-allocation byte-to-uint cast using MemoryMarshal\n    public static uint ComputeFastSum(ReadOnlySpan<byte> data)\n    {\n        // Reinterpret byte span as uint span (4 bytes per uint)\n        ReadOnlySpan<uint> uintSpan = MemoryMarshal.Cast<byte, uint>(data);\n        uint sum = 0;\n        for (int i = 0; i < uintSpan.Length; i++)\n        {\n            sum += uintSpan[i];\n        }\n        return sum;\n    }\n}",
    "redFlags": [
      "Using unsafe pointer arithmetic where Span<T> or ArrayPool<T> provides equivalent speed safely.",
      "Pinning managed objects with 'fixed' for long periods, causing severe GC heap fragmentation."
    ],
    "proTips": [
      "Always prefer MemoryMarshal and Unsafe.As<T>() over raw pointers: they are verified by Roslyn and preserve JIT optimization heuristics."
    ]
  },
  {
    "id": "q-aspnet-11",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "SignalR",
      "WebSockets",
      "Real-Time",
      "MessagePack"
    ],
    "title": "ASP.NET Core SignalR Scale-Out, MessagePack, and Azure SignalR Service",
    "pitch": "ASP.NET Core SignalR simplifies real-time bidirectional communication by abstracting WebSockets, Server-Sent Events, and Long Polling. In high-traffic clusters, sticky sessions and memory constraints make hosting WebSockets on application pods unscalable. Azure SignalR Service offloads client connections entirely: backend web servers maintain only a lightweight multiplexed control channel. Replacing standard JSON with MessagePack serialization reduces network payloads by up to 70% and drastically cuts GC allocations.",
    "deepDive": "Real-Time Architecture Nuances:\n1. Transport Fallbacks:\n   - WebSocket: Full-duplex persistent TCP connection (preferred).\n   - Server-Sent Events (SSE): Half-duplex (server-to-client push only; client sends via standard HTTP).\n   - Long Polling: Legacy fallback for restrictive enterprise proxies.\n2. Backplane Alternatives:\n   - Redis Backplane: Every broadcast to a group is fanned out to EVERY connected node in the cluster ($O(N \times M)$ overhead).\n   - Azure SignalR Service: Managed edge service terminating 100k+ WebSockets. Only routes messages to nodes with active subscribers.\n3. MessagePack Binary Protocol:\n   - By default, SignalR serializes messages to JSON text.\n   - Adding 'Microsoft.AspNetCore.SignalR.Protocols.MessagePack' transmits compact binary data, reducing CPU serialization overhead and mobile client bandwidth.",
    "codeSnippet": "// Program.cs: SignalR with Azure SignalR Service and MessagePack\nbuilder.Services.AddSignalR()\n    .AddAzureSignalR(options =>\n    {\n        options.ConnectionString = builder.Configuration.GetConnectionString(\"AzureSignalR\");\n        options.ServerStickyMode = ServerStickyMode.Disabled;\n    })\n    .AddMessagePackProtocol(); // Binary high-efficiency protocol",
    "redFlags": [
      "Assuming SignalR requires sticky sessions when using Azure SignalR Service (Azure SignalR eliminates sticky session requirements).",
      "Broadcasting 5MB payloads over SignalR instead of sending a lightweight notification with an HTTP download link."
    ],
    "proTips": [
      "Implement Hub lifetime events ('OnConnectedAsync' and 'OnDisconnectedAsync') to manage user presence in Redis with automatic TTL timeouts."
    ]
  },
  {
    "id": "q-sql-11",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "EF Core",
      "Compiled Queries",
      "Batching",
      "Raw SQL"
    ],
    "title": "EF Core Compiled Queries, Statement Batching, and Parameterized Raw SQL",
    "pitch": "Every LINQ query executed in EF Core must compile the expression tree into a relational SQL statement and cache the query plan. For micro-second critical endpoints, EF.CompileAsyncQuery() pre-compiles the query into an invocable delegate, bypassing expression tree compilation on every request. Furthermore, modern EF Core automatically batches multiple INSERT/UPDATE/DELETE statements into a single network roundtrip, and provides ExecuteSqlInterpolated() for safe, parameterized raw SQL execution.",
    "deepDive": "Mechanics of Compiled Queries:\n- Standard LINQ Execution:\n  1. Parse C# Expression Tree.\n  2. Compute Query Cache Key (based on shape and parameters).\n  3. Look up relational command in memory cache.\n  4. Generate and parameterize SQL string.\n- Compiled Query (EF.CompileAsyncQuery):\n  1. Evaluates steps 1-4 ONCE at startup.\n  2. Stores a compiled Func<DbContext, TParam, IAsyncEnumerable<TResult>> delegate.\n  3. Subsequent executions invoke the delegate directly, cutting query overhead by 50-70%.\n\nAutomatic Statement Batching:\nWhen calling SaveChangesAsync on 50 modified entities, EF Core bundles all 50 statements into a single TDS batch packet rather than issuing 50 sequential network roundtrips.",
    "codeSnippet": "// High-performance static pre-compiled query delegate\npublic static class QueryCache\n{\n    public static readonly Func<AppDbContext, int, Task<UserSummaryDto?>> GetUserSummaryCompiled =\n        EF.CompileAsyncQuery((AppDbContext db, int id) =>\n            db.Users\n              .AsNoTracking()\n              .Where(u => u.Id == id)\n              .Select(u => new UserSummaryDto(u.Id, u.Email, u.Role))\n              .FirstOrDefault());\n}\n\n// In your high-frequency controller / endpoint:\npublic async Task<IResult> GetUser(int id, AppDbContext db)\n{\n    var user = await QueryCache.GetUserSummaryCompiled(db, id);\n    return user is not null ? TypedResults.Ok(user) : TypedResults.NotFound();\n}",
    "redFlags": [
      "Using string concatenation with db.Database.ExecuteSqlRaw() (creates critical SQL injection vulnerabilities!).",
      "Over-optimizing with compiled queries on low-volume admin endpoints where standard LINQ is more readable."
    ],
    "proTips": [
      "In EF Core 7+, use ExecuteUpdateAsync() and ExecuteDeleteAsync() to execute bulk mutations directly on the database without loading entities into memory first."
    ]
  },
  {
    "id": "q-frontend-8",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "React 19",
      "Server Actions",
      "useActionState",
      "Forms"
    ],
    "title": "React 19 Server Actions and Form State Management with useActionState",
    "pitch": "React 19 introduced first-class Server Actions and hooks like useActionState and useFormStatus to standardize form handling and asynchronous mutations. Server Actions execute asynchronously on the server and can be invoked directly from HTML form action attributes. The useActionState hook encapsulates pending state, validation errors, and optimistic UI updates without manual useState, useEffect, or fetch boilerplate.",
    "deepDive": "Evolution of Mutations in React:\n- Pre-React 19: Required manual onSubmit event handlers, e.preventDefault(), useState for isSubmitting, error, and response, and manual try/catch fetch logic.\n- React 19 Actions:\n  Functions that transition state asynchronously. When passed to an action prop or useActionState, React automatically manages the transition lifecycle, exposes isPending, and coordinates with Suspense and Error Boundaries.",
    "codeSnippet": "import React, { useActionState } from 'react';\n\n// Action function handling API mutation\nasync function updateProfileScore(prevState: { error?: string; success?: boolean }, formData: FormData) {\n  const score = formData.get('score');\n  try {\n    const res = await fetch('/api/profile/score', {\n      method: 'POST',\n      body: JSON.stringify({ score }),\n      headers: { 'Content-Type': 'application/json' }\n    });\n    if (!res.ok) return { error: 'Failed to update score' };\n    return { success: true };\n  } catch (err: any) {\n    return { error: err.message };\n  }\n}\n\nexport function ProfileScoreEditor() {\n  const [state, formAction, isPending] = useActionState(updateProfileScore, {});\n\n  return (\n    <form action={formAction}>\n      <input type=\"number\" name=\"score\" defaultValue={100} disabled={isPending} />\n      <button type=\"submit\" disabled={isPending}>\n        {isPending ? 'Saving...' : 'Update Score'}\n      </button>\n      {state.error && <p className=\"error\">{state.error}</p>}\n      {state.success && <p className=\"success\">Saved successfully!</p>}\n    </form>\n  );\n}",
    "redFlags": [
      "Manually creating 4 different useState variables for every single form in React 19.",
      "Not handling progressive enhancement or disabled states during pending action submissions."
    ],
    "proTips": [
      "Combine useActionState with useOptimistic to instantly update the UI before the server mutation roundtrip finishes."
    ]
  },
  {
    "id": "q-frontend-9",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "Memoization",
      "React Compiler",
      "Performance",
      "useCallback"
    ],
    "title": "React Memoization: React.memo, useMemo, and the React Compiler (React Forget)",
    "pitch": "Historically, React developers manually memoized components with React.memo and expressions with useMemo/useCallback to avoid unnecessary re-renders caused by referential inequality of functions and objects. However, over-memoization adds memory overhead and dependency array maintenance bugs. The new React Compiler (React Forget) is an ahead-of-time auto-memoizing compiler that automatically injects fine-grained memoization at compile time, eliminating the need for manual useMemo and useCallback in modern React codebases.",
    "deepDive": "Referential Equality and Re-Rendering:\n1. In JavaScript, '{} !== {}' and '(() => {}) !== (() => {})'.\n2. When a parent re-renders, every inline callback and object literal receives a brand-new memory address.\n3. If passed to a child wrapped in React.memo, the shallow prop comparison fails, forcing the child to re-render anyway.\n4. The Cost of Memoization:\n   - useMemo has an internal cost: allocating dependency arrays, comparing dependencies on every render, and holding cached values.\n   - For simple calculations (e.g. string formatting), useMemo is often slower than re-computing!\n5. The React Compiler Revolution:\n   - Converts React components into an optimized Intermediate Representation (IR).\n   - Identifies values and JSX subtrees that do not change and inserts memoization blocks automatically.",
    "codeSnippet": "// Classic manual memoization pattern\nimport React, { useMemo, useCallback } from 'react';\n\nexport const ExpensiveGrid = React.memo(function ExpensiveGrid({ data, onRowClick }: {\n  data: RowItem[];\n  onRowClick: (id: string) => void;\n}) {\n  // Expensive sorting operation properly memoized\n  const sortedData = useMemo(() => {\n    return [...data].sort((a, b) => b.value - a.value);\n  }, [data]);\n\n  return (\n    <div>\n      {sortedData.map(row => (\n        <div key={row.id} onClick={() => onRowClick(row.id)}>\n          {row.name}: {row.value}\n        </div>\n      ))}\n    </div>\n  );\n});",
    "redFlags": [
      "Wrapping trivial calculations like 'const total = useMemo(() => a + b, [a, b])' in useMemo.",
      "Omitting callback dependencies or passing unstable inline functions into React.memo components."
    ],
    "proTips": [
      "Always measure before memoizing: use the React DevTools Profiler 'Highlight updates when components render' to find actual bottlenecks."
    ]
  },
  {
    "id": "q-frontend-10",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "Micro-Frontends",
      "Module Federation",
      "Architecture",
      "TypeScript"
    ],
    "title": "Micro-Frontends and Webpack Module Federation in Decoupled ASP.NET Core Systems",
    "pitch": "Micro-frontends decompose large monolithic single-page applications into independently developed, tested, and deployed frontend sub-applications. Webpack Module Federation allows micro-apps to dynamically share runtime dependencies (such as React, Zustand, and Design System components) at runtime without bundling them into every micro-app artifact. An ASP.NET Core host or edge gateway routes user sessions and supplies unified authentication context.",
    "deepDive": "Module Federation Mechanics:\n1. Host vs Remote:\n   - Shell / Host: Renders the outer navigation shell, header, and handles global auth.\n   - Remotes: Independent micro-apps (e.g. Checkout, Catalog, Account Dashboard) hosted at separate URLs/CDNs.\n2. Shared Dependencies:\n   - 'shared: { react: { singleton: true, requiredVersion: \"^19.0.0\" } }' ensures that only a single instance of React exists in memory, preventing hook context collisions.\n3. Decoupled CI/CD:\n   - Teams can deploy the Checkout micro-app 10 times a day without rebuilding or redeploying the Catalog or Shell.",
    "codeSnippet": "// webpack.config.js for Remote Micro-Frontend\nconst { ModuleFederationPlugin } = require('webpack').container;\n\nmodule.exports = {\n  plugins: [\n    new ModuleFederationPlugin({\n      name: 'ordersApp',\n      filename: 'remoteEntry.js',\n      exposes: {\n        './OrderHistoryWidget': './src/components/OrderHistoryWidget'\n      },\n      shared: {\n        react: { singleton: true, requiredVersion: '^19.0.0' },\n        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },\n        zustand: { singleton: true }\n      }\n    })\n  ]\n};",
    "redFlags": [
      "Loading multiple different versions of React in the same browser window (causes React hook crash errors).",
      "Using iframes for micro-frontends (breaks responsive layout, accessibility, and smooth modal overlays)."
    ],
    "proTips": [
      "Use Custom Events or a lightweight event bus for cross-micro-frontend communication to maintain loose coupling."
    ]
  },
  {
    "id": "q-cloud-6",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "IaC",
      "Bicep",
      "Terraform",
      "Cloud Architecture"
    ],
    "title": "Infrastructure as Code: Azure Bicep vs Terraform and State Management",
    "pitch": "Infrastructure as Code (IaC) ensures repeatable, auditable cloud environments. Terraform is cloud-agnostic, using HCL (HashiCorp Configuration Language) and an explicit state file (terraform.tfstate) stored in Azure Blob Storage with blob leasing locks. Azure Bicep is Microsoft's native domain-specific language compiling directly into ARM templates: it has zero state files, instantaneous support for new Azure day-zero features, and native validation within Azure Resource Manager.",
    "deepDive": "Detailed Comparison:\n1. State Management:\n   - Terraform: Requires state file management. If state drifts or gets locked/corrupted, deployments block. However, state enables cross-provider plans (e.g. Azure + Cloudflare + Datadog).\n   - Bicep: Completely stateless. Queries the live Azure Resource Manager (ARM) API directly to determine current state, eliminating state corruption risks.\n2. Tooling and Day-0 Support:\n   - Bicep: Offers first-class VS Code IntelliSense with immediate support for any new Azure API preview.\n   - Terraform: Relies on AzureRM provider updates, which can lag behind Azure previews.\n3. Idempotency:\n   - Both tools are idempotent: running the script multiple times against the same environment results in the exact same infrastructure without duplicate resources.",
    "codeSnippet": "// main.bicep: Modular Azure App Service and Key Vault deployment\nparam location string = resourceGroup().location\nparam appName string = 'app-orders-prod'\n\nresource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {\n  name: 'plan-${appName}'\n  location: location\n  sku: { name: 'P1v3', tier: 'PremiumV3' }\n  kind: 'linux'\n  properties: { reserved: true }\n}\n\nresource webApp 'Microsoft.Web/sites@2023-12-01' = {\n  name: appName\n  location: location\n  properties: {\n    serverFarmId: appServicePlan.id\n    siteConfig: {\n      linuxFxVersion: 'DOTNETCORE|8.0'\n      http20Enabled: true\n      minTlsVersion: '1.2'\n    }\n  }\n  identity: { type: 'SystemAssigned' } // Enables Passwordless Managed Identity\n}",
    "redFlags": [
      "Creating cloud resources manually in the Azure Portal (ClickOps) for production environments.",
      "Leaving Terraform state files in public or unencrypted storage without blob lease locking."
    ],
    "proTips": [
      "Use 'az deployment group what-if' in Bicep or 'terraform plan' in CI pull requests to inspect infrastructure diffs before applying changes."
    ]
  },
  {
    "id": "q-cloud-7",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "KEDA",
      "Kubernetes",
      "Autoscaling",
      "Event-Driven"
    ],
    "title": "Event-Driven Autoscaling with KEDA for .NET Background Consumers",
    "pitch": "Standard Kubernetes Horizontal Pod Autoscaling (HPA) scales pods based on CPU or Memory metrics. However, for background event processors consuming Azure Service Bus queues or Kafka topics, CPU can remain low while queue backlog explodes. KEDA (Kubernetes Event-driven Autoscaling) monitors external event sources directly, scaling .NET consumer pods from 0 to N based on queue depth and message lag, and scaling down to 0 when idle to save cloud costs.",
    "deepDive": "How KEDA Operates:\n1. ScaledObject: A Kubernetes custom resource definition (CRD) that links an application deployment to a trigger (e.g. azure-servicebus).\n2. Metric Server: KEDA queries the Azure Service Bus API to check 'activeMessageCount'.\n3. Scaling to Zero:\n   - Standard Kubernetes HPA cannot scale a deployment from 0 to 1 or 1 to 0.\n   - KEDA activates the deployment (0 -> 1) when messages appear, then delegates to HPA for scaling (1 -> N) based on target message backlog per pod.\n4. Scale-Down Grace Period:\n   - Ensures in-flight .NET message processing completes gracefully before Kubernetes terminates the pod (using SIGTERM and CancellationToken).",
    "codeSnippet": "apiVersion: keda.sh/v1alpha1\nkind: ScaledObject\nmetadata:\n  name: order-consumer-scaler\nspec:\n  scaleTargetRef:\n    name: order-processor-deployment\n  minReplicaCount: 0  # Scales to ZERO when queue is empty!\n  maxReplicaCount: 20\n  triggers:\n  - type: azure-servicebus\n    metadata:\n      queueName: pending-orders\n      messageCount: '50' # Add 1 pod for every 50 messages in backlog\n    authenticationRef:\n      name: keda-servicebus-auth",
    "redFlags": [
      "Scaling background worker pods using CPU metrics (pods idle while 500k messages queue up!).",
      "Ignoring SIGTERM in C# consumers, causing messages to be aborted mid-processing when scaling down."
    ],
    "proTips": [
      "Set 'IHostOptions.ShutdownTimeout' in C# Program.cs to allow background services sufficient time (e.g. 30 seconds) to flush active database transactions during pod scale-down."
    ]
  },
  {
    "id": "q-cloud-8",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "OpenTelemetry",
      "Distributed Tracing",
      "App Insights",
      "Observability"
    ],
    "title": "Distributed Tracing with OpenTelemetry and Azure Application Insights in .NET",
    "pitch": "In microservice architectures, a single user request can touch 10 independent services and databases. OpenTelemetry (OTel) is the vendor-neutral cloud standard for traces, metrics, and logs. In .NET 8, System.Diagnostics.Activity and ActivitySource natively implement OpenTelemetry specifications. By propagating the W3C 'traceparent' header across HTTP and Service Bus boundaries, distributed transactions can be visualized end-to-end in Application Insights with full call graphs, timings, and database dependencies.",
    "deepDive": "The W3C TraceContext Standard:\n- Header: 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'\n- Fields: Version (00) - TraceId (unique per user request) - ParentSpanId - TraceFlags (sampling bit).\n\nActivitySource in .NET:\n- System.Diagnostics.ActivitySource is the C# instrumentation API.\n- Activities represent spans in a trace.\n- When HttpClient sends a request, .NET automatically injects the active traceparent header.\n- Downstream ASP.NET Core APIs read the header and create child Activities, preserving causal links.",
    "codeSnippet": "// Program.cs: OpenTelemetry integration with Azure Application Insights\nusing Azure.Monitor.OpenTelemetry.AspNetCore;\n\nvar builder = WebApplication.CreateBuilder(args);\n\n// Register OpenTelemetry with Azure Monitor in one line (.NET 8+)\nbuilder.Services.AddOpenTelemetry()\n    .UseAzureMonitor(options =>\n    {\n        options.ConnectionString = builder.Configuration.GetConnectionString(\"ApplicationInsights\");\n    })\n    .WithTracing(tracing =>\n    {\n        tracing.AddSource(\"Company.Orders.Pipeline\")\n               .AddAspNetCoreInstrumentation()\n               .AddHttpClientInstrumentation()\n               .AddEntityFrameworkCoreInstrumentation();\n    });\n\n// Custom ActivitySource in domain business logic\npublic static class Telemetry\n{\n    public static readonly ActivitySource Source = new(\"Company.Orders.Pipeline\");\n}\n\npublic async Task ProcessOrder(string orderId)\n{\n    using var activity = Telemetry.Source.StartActivity(\"CustomOrderProcessing\");\n    activity?.SetTag(\"order.id\", orderId);\n    // Business logic...\n}",
    "redFlags": [
      "Using custom proprietary correlation ID headers (e.g. X-Correlation-ID) instead of the standard W3C traceparent header.",
      "Logging sensitive PII (passwords, credit card numbers) in distributed trace tags."
    ],
    "proTips": [
      "Configure adaptive sampling in Application Insights to capture 100% of errors while sampling down high-frequency health probes to save log ingestion costs."
    ]
  },
  {
    "id": "q-cloud-9",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "APIM",
      "API Gateway",
      "mTLS",
      "Security"
    ],
    "title": "Azure API Management (APIM): Policies, Rate Limiting, and Mutual TLS (mTLS)",
    "pitch": "Azure API Management (APIM) acts as an enterprise edge API Gateway sitting between client applications and backend microservices. It centralizes cross-cutting API policies using XML-based execution expressions: JWT validation, header transformations, response caching, IP filtering, and quota rate limits. For zero-trust backend security, APIM authenticates to backend App Services using Mutual TLS (mTLS) with client certificates or private virtual network (VNet) integration.",
    "deepDive": "APIM Processing Lifecycle:\n1. Inbound: Evaluates policies before forwarding to backend (JWT verification, rate limit check).\n2. Backend: Routes to HTTP backend or Service Fabric/AKS service.\n3. Outbound: Modifies response before sending to caller (stripping internal headers like Server, X-Powered-By, masking sensitive data).\n4. On-Error: Custom exception formatting returning standardized RFC 7807 ProblemDetails.\n\nZero-Trust with Mutual TLS (mTLS):\n- Backend web APIs are configured with 'ClientCertEnabled = true'.\n- Only APIM presents a trusted public certificate thumbprint during the TLS handshake.\n- Direct public access to backend microservices is blocked; all traffic is forced through APIM.",
    "codeSnippet": "<!-- APIM Policy: Enforce JWT validation and rate limiting by ClientId -->\n<policies>\n  <inbound>\n    <base />\n    <!-- Validate Microsoft Entra ID Bearer Token -->\n    <validate-jwt header-name=\"Authorization\" failed-validation-httpcode=\"401\" failed-validation-error-message=\"Unauthorized\">\n      <openid-config url=\"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration\" />\n      <required-claims>\n        <claim name=\"aud\" match=\"all\">\n          <value>api://orders-production</value>\n        </claim>\n      </required-claims>\n    </validate-jwt>\n\n    <!-- Rate limit by Client ID claim: 100 calls per 60 seconds -->\n    <rate-limit-by-key calls=\"100\" renewal-period=\"60\" \n      counter-key=\"@(context.Request.Headers.GetValueOrDefault(\"Authorization\",\"\").AsJwt()?.Subject)\" />\n  </inbound>\n</policies>",
    "redFlags": [
      "Leaving backend microservices exposed directly to the public internet without IP restrictions or mTLS.",
      "Duplicating JWT validation and CORS logic in 20 separate backend APIs instead of centralizing in APIM."
    ],
    "proTips": [
      "Use APIM Named Values linked to Azure Key Vault secrets so certificate thumbprints and API keys rotate automatically without modifying policies."
    ]
  },
  {
    "id": "q-cloud-10",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "Disaster Recovery",
      "Front Door",
      "Multi-Region",
      "High Availability"
    ],
    "title": "Cloud Disaster Recovery: Azure Front Door vs Traffic Manager and Active-Active Architecture",
    "pitch": "Achieving a 99.99% enterprise SLA requires multi-region redundancy across paired Azure regions (e.g. East US and West Europe). Azure Traffic Manager is a DNS-level load balancer subject to DNS client caching TTLs (causing 1–5 minute failover delays). Azure Front Door is an Anycast Layer 7 reverse proxy operating at Microsoft's global edge network: it provides split-second instant failover, SSL termination at the edge, and WAF protection. Paired with Azure SQL Auto-Failover Groups, it delivers seamless disaster recovery.",
    "deepDive": "Active-Active vs Active-Passive:\n- Active-Passive (Hot Standby): Primary region serves all traffic; secondary region sits idle until failover. Simpler data model, but secondary compute costs run continuously.\n- Active-Active (Multi-Region): Both regions serve read and write traffic simultaneously. Requires globally distributed databases like Azure Cosmos DB (Multi-Region Writes) or partitioning users geographically to prevent write conflicts.\n\nDatabase Disaster Recovery:\n- Azure SQL Auto-Failover Group: Asynchronously replicates transactions to secondary region.\n- Failover Policy: Includes a grace period (e.g. 1 hour) for automatic failover to prevent false-positive failovers during brief network blips.\n- Connection Strings: Clients connect to a single virtual listener ('mydb.database.windows.net') that Azure automatically redirects to the active primary.",
    "codeSnippet": "// Health probe endpoint in ASP.NET Core for Azure Front Door\napp.MapGet(\"/health/ready\", async (AppDbContext db) =>\n{\n    // Deep readiness check: verifies database connectivity\n    var canConnect = await db.Database.CanConnectAsync();\n    return canConnect \n        ? Results.Ok(new { Status = \"Healthy\", Region = Environment.GetEnvironmentVariable(\"REGION\") })\n        : Results.Problem(\"Database unavailable\", statusCode: 503);\n});",
    "redFlags": [
      "Having a shallow health check probe that returns 200 OK without verifying backend database connectivity.",
      "Failing over the web app to a secondary region while the database is still located in the primary region (causes crippling cross-region 80ms latency on every DB query)."
    ],
    "proTips": [
      "Regularly conduct Chaos Engineering game-day exercises (e.g. using Azure Chaos Studio) to simulate a complete region outage and verify automated failover within your RTO and RPO targets."
    ]
  },
  {
    "id": "q-linq-1",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "IEnumerable",
      "IQueryable",
      "Expression Trees",
      "Deferred Execution"
    ],
    "title": "IEnumerable<T> vs. IQueryable<T>: In-Memory Client Filtering vs SQL Expression Trees",
    "pitch": "IEnumerable<T> operates in-memory on in-process collections using compiled delegates (Func<T, bool>). Every filtering operation evaluates in the CLR on the client machine. IQueryable<T> inherits from IEnumerable but evaluates out-of-process against an external data source (like SQL Server) using Expression Trees (Expression<Func<T, bool>>). The query provider parses the expression tree and translates it into native SQL, executing filtering directly on the database engine.",
    "deepDive": "Under the Hood Differences:\n1. Method Signatures:\n   - Enumerable.Where takes Func<TSource, bool> (compiled C# IL delegate).\n   - Queryable.Where takes Expression<Func<TSource, bool>> (data structure representing code).\n2. The Fatal Performance Anti-Pattern:\n   - If an EF Core query is cast to IEnumerable<T> before applying Where or Take:\n     IEnumerable<Order> orders = dbContext.Orders; // Still IQueryable\n     var filtered = orders.Where(o => o.Status == \"Completed\").Take(10);\n   - Because Where() is invoked on IEnumerable, EF Core issues: SELECT * FROM Orders;\n   - All 5,000,000 order rows are transferred across the network to client RAM, where the CLR filters in-memory!\n   - Invoking Where() on IQueryable compiles to: SELECT TOP (10) * FROM Orders WHERE Status = 'Completed';\n3. When to use each:\n   - Use IQueryable while building the database query pipeline (paging, filtering, sorting, projection).\n   - Use IEnumerable once data has been materialized (.ToList(), .AsEnumerable()) for C# domain computations that SQL cannot express.",
    "codeSnippet": "// ❌ JUNIOR MISTAKE: Pulls all 5 million rows into memory!\npublic List<OrderDto> BadGetOrders(AppDbContext db)\n{\n    IEnumerable<Order> query = db.Orders; // Casts to IEnumerable!\n    return query\n        .Where(o => o.Total > 500)       // Executes in C# memory, NOT in SQL!\n        .Take(20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToList();\n}\n\n// ✅ SENIOR PATTERN: Generates optimal SQL with WHERE and TOP\npublic async Task<List<OrderDto>> GoodGetOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    IQueryable<Order> query = db.Orders.AsNoTracking();\n    return await query\n        .Where(o => o.Total > 500)       // Translated to SQL: WHERE Total > 500\n        .Take(20)                        // Translated to SQL: TOP (20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Calling '.ToList()' or '.AsEnumerable()' early in an EF query pipeline before applying filters or pagination.",
      "Stating that IQueryable and IEnumerable execute the same way."
    ],
    "proTips": [
      "Keep method return types as IQueryable<T> inside Repository/Query specifications only if you want callers to append further SQL clauses; otherwise, return Task<List<TDto>> to prevent leaky query logic."
    ]
  },
  {
    "id": "q-linq-2",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "Deferred Execution",
      "Multiple Enumeration",
      "Re-evaluation",
      "Yield"
    ],
    "title": "LINQ Deferred Execution vs. Immediate Execution: The Multiple Enumeration Bug",
    "pitch": "LINQ queries use deferred execution by default: defining a query does not execute it or allocate collection memory; execution occurs only when the sequence is iterated (via foreach, .ToList(), .Count(), etc.). However, this introduces the critical 'Multiple Enumeration' performance bug: iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database roundtrip or calculation) to re-execute every single time.",
    "deepDive": "Core Mechanics of Deferred Execution:\n1. Iterators & Yield:\n   - Operators like Where, Select, and Skip return custom iterator structs/classes implementing IEnumerator<T>.\n   - Code executes on each call to MoveNext().\n2. The Multiple Enumeration Hazard:\n   public void Process(IEnumerable<User> users)\n   {\n       if (users.Any()) // Enumeration 1: Runs SQL query or generator\n       {\n           int count = users.Count(); // Enumeration 2: Re-runs entire query!\n           foreach (var u in users) { ... } // Enumeration 3: Re-runs again!\n       }\n   }\n3. Immediate Execution Operators:\n   - Operators that produce a non-sequence value: Count(), Any(), First(), Single(), Sum(), Average().\n   - Operators that buffer into a collection: ToList(), ToArray(), ToDictionary(), ToLookup().",
    "codeSnippet": "// ❌ MULTIPLE ENUMERATION: Re-executes HTTP/DB or LINQ stream twice\npublic void SendAlerts(IEnumerable<SensorReading> readings)\n{\n    // Multiple enumeration warning!\n    if (readings.Any(r => r.Temperature > 100))\n    {\n        var critical = readings.Where(r => r.Temperature > 100);\n        _logger.LogWarning(\"Found {Count} critical readings\", critical.Count()); // Re-enumerates!\n    }\n}\n\n// ✅ MATERIALIZED EVALUATION: Single pass iteration\npublic void SendAlertsOptimal(IEnumerable<SensorReading> readings)\n{\n    // Materialize into memory once if multiple iterations are required\n    var critical = readings.Where(r => r.Temperature > 100).ToList();\n    if (critical.Count > 0)\n    {\n        _logger.LogWarning(\"Found {Count} critical readings\", critical.Count);\n    }\n}",
    "redFlags": [
      "Ignoring JetBrains ReSharper / Roslyn 'Possible multiple enumeration of IEnumerable' compiler warnings.",
      "Calling .ToList() prematurely on huge streams that only require a single streaming forward-pass."
    ],
    "proTips": [
      "In .NET 6+, use 'reading.TryGetNonEnumeratedCount(out int count)' to check element count without forcing an enumeration if the sequence implements ICollection."
    ]
  },
  {
    "id": "q-linq-4",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "SelectMany",
      "Cross Join",
      "Hierarchy Flattening",
      "Projection"
    ],
    "title": "SelectMany vs. Select: Flattening Hierarchies, 1:N Relationships, and Cross Joins",
    "pitch": "Select() projects each element of a sequence into a new form, producing a 1-to-1 output sequence (IEnumerable<TOut>). SelectMany() projects each element to an intermediate sequence and flattens the resulting sequences into a single one-dimensional collection (1-to-many relationship). In relational databases and EF Core, SelectMany translates to an SQL CROSS APPLY or INNER JOIN, avoiding nested collection objects.",
    "deepDive": "Understanding the Mechanics:\n1. Select:\n   - Input: List of Authors (each author has List<Book>).\n   - authors.Select(a => a.Books) returns IEnumerable<List<Book>> (a collection of collections).\n2. SelectMany:\n   - authors.SelectMany(a => a.Books) returns IEnumerable<Book> (a single flat list of all books from all authors).\n3. Cross Product / Cartesian Generation:\n   - SelectMany can take a second result selector to combine parent and child attributes:\n     authors.SelectMany(a => a.Books, (author, book) => new { author.Name, book.Title });\n4. EF Core Translation:\n   - Translates into SQL: 'FROM Authors a CROSS APPLY Books b' or 'INNER JOIN Books b ON a.Id = b.AuthorId'.",
    "codeSnippet": "public class Department\n{\n    public string Name { get; set; } = \"\";\n    public List<Employee> Employees { get; set; } = new();\n}\n\npublic class ReportingService\n{\n    public List<EmployeeDto> GetAllActiveEmployees(List<Department> departments)\n    {\n        // Flattens departments into a single stream of active employees\n        return departments\n            .SelectMany(dept => dept.Employees)\n            .Where(emp => emp.IsActive)\n            .Select(emp => new EmployeeDto(emp.Id, emp.FullName, emp.Salary))\n            .ToList();\n    }\n}",
    "redFlags": [
      "Using nested foreach loops to append child items to a new List instead of a declarative SelectMany.",
      "Confusing SelectMany with Concat or Union."
    ],
    "proTips": [
      "SelectMany is the monadic 'bind' (flatMap) operation in functional programming, enabling railway-oriented programming when chaining Result<T> types."
    ]
  },
  {
    "id": "q-linq-5",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "GroupBy",
      "ToLookup",
      "ToDictionary",
      "Memory"
    ],
    "title": "LINQ GroupBy vs. ToLookup vs. ToDictionary: Performance and Memory Trade-Offs",
    "pitch": "GroupBy produces a deferred, lazy-evaluated sequence of IGrouping<TKey, TElement> where each group is streamed. ToLookup() immediately executes and creates an immutable 1-to-many lookup structure (ILookup<TKey, TElement>) where duplicate keys are supported and querying a missing key returns an empty sequence rather than throwing an exception. ToDictionary() creates a mutable 1-to-1 map where duplicate keys throw ArgumentException.",
    "deepDive": "Comparison Table:\n1. GroupBy(k):\n   - Execution: Deferred (iterated on demand).\n   - Keys: Multiple values per key.\n   - Missing key: N/A (linear search through groups).\n2. ToLookup(k):\n   - Execution: Immediate (materialized in RAM).\n   - Keys: Multiple values per key.\n   - Missing key: Returns Enumerable.Empty<T>() (safe, never throws KeyNotFoundException).\n3. ToDictionary(k, v):\n   - Execution: Immediate (materialized in RAM).\n   - Keys: Strictly UNIQUE keys only!\n   - Missing key: Throws KeyNotFoundException unless using TryGetValue. Duplicate key on creation throws ArgumentException.",
    "codeSnippet": "var orders = GetOrders();\n\n// 1. ToDictionary: Fails if duplicate CustomerId exists!\n// var dict = orders.ToDictionary(o => o.CustomerId); // 💥 ArgumentException!\n\n// 2. ToLookup: Ideal for 1-to-many in-memory indexing\nILookup<int, Order> ordersByCustomer = orders.ToLookup(o => o.CustomerId);\n\n// Safe lookup: Never throws KeyNotFoundException\nIEnumerable<Order> customerOrders = ordersByCustomer[999]; // Returns empty sequence if not found!\nConsole.WriteLine($\"Customer 999 order count: {customerOrders.Count()}\");",
    "redFlags": [
      "Using ToDictionary on columns with potential duplicates without grouping first.",
      "Iterating GroupBy multiple times without materializing with ToLookup or ToList."
    ],
    "proTips": [
      "When building in-memory multi-value caches, prefer ILookup<K, V> over Dictionary<K, List<V>> for cleaner, thread-safe, immutable reads."
    ]
  },
  {
    "id": "q-linq-6",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "Expression Trees",
      "Roslyn",
      "Dynamic LINQ",
      "IQueryProvider"
    ],
    "title": "Expression Trees Under the Hood: Func<T, bool> vs. Expression<Func<T, bool>>",
    "pitch": "In C#, a lambda passed to Func<T, bool> compiles into executable IL code (a delegate). When the identical lambda syntax is assigned to Expression<Func<T, bool>>, the Roslyn compiler lowers it into a tree data structure composed of Expression nodes (ParameterExpression, BinaryExpression, MemberExpression). This expression tree represents the code structure as data, allowing database providers like EF Core to inspect nodes at runtime and translate them into SQL.",
    "deepDive": "Why Expression Trees are Essential for Senior .NET Developers:\n1. Inspection as Data:\n   - An Expression tree can be visited using the Visitor Pattern (ExpressionVisitor).\n   - EF Core walks the tree to translate 'user.Age > 18' into SQL 'WHERE [u].[Age] > 18'.\n2. Dynamic Query Generation:\n   - For advanced search screens with 15 optional filter inputs, instead of writing 15 nested if statements or string SQL concatenation, senior engineers dynamically combine Expression trees using Expression.AndAlso and Expression.Lambda.\n3. Compiling Expressions:\n   - You can compile an Expression tree back into an executable delegate at runtime via 'expr.Compile()', though compilation incurs high CPU overhead and should be cached.",
    "codeSnippet": "// Programmatic Dynamic Filter Construction using Expression Trees\npublic static Expression<Func<T, bool>> CombineWithAnd<T>(\n    Expression<Func<T, bool>> first, \n    Expression<Func<T, bool>> second)\n{\n    var parameter = Expression.Parameter(typeof(T), \"x\");\n\n    // Replace parameters in both expressions with unified parameter\n    var leftVisitor = new ParameterReplacer(first.Parameters[0], parameter);\n    var left = leftVisitor.Visit(first.Body);\n\n    var rightVisitor = new ParameterReplacer(second.Parameters[0], parameter);\n    var right = rightVisitor.Visit(second.Body);\n\n    // Combine with logical AND: x => left && right\n    var body = Expression.AndAlso(left!, right!);\n    return Expression.Lambda<Func<T, bool>>(body, parameter);\n}\n\npublic class ParameterReplacer : ExpressionVisitor\n{\n    private readonly ParameterExpression _from, _to;\n    public ParameterReplacer(ParameterExpression from, ParameterExpression to) => (_from, _to) = (from, to);\n    protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);\n}",
    "redFlags": [
      "Compiling Expression trees in a tight loop with .Compile() (causes severe JIT CPU spikes).",
      "Attempting to invoke arbitrary C# methods inside EF Core Expressions that have no SQL equivalent."
    ],
    "proTips": [
      "Use System.Linq.Expressions with compiled lambdas for high-speed dynamic object mapping that matches manual assignment speed while avoiding Reflection overhead."
    ]
  },
  {
    "id": "q-efcore-5",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "Migrations",
      "CI/CD",
      "Bundle",
      "Zero-Downtime"
    ],
    "title": "EF Core Migrations in CI/CD: Migration Bundles vs Database.Migrate() at Startup",
    "pitch": "Calling 'context.Database.Migrate()' during application startup is dangerous in production: in horizontally scaled environments with multiple containers starting concurrently, race conditions corrupt the __EFMigrationsHistory table or cause deadlocks. The enterprise standard is using self-contained Migration Bundles (dotnet ef migrations bundle) executed as a dedicated gated step in CI/CD pipelines before application deployment, paired with expand/contract schema design for zero downtime.",
    "deepDive": "Why Migrate() at Startup Fails at Scale:\n1. Concurrency Race: Multiple App Service or Kubernetes pods booting simultaneously execute ALTER TABLE at the same time.\n2. Permission Violation: Web app database users should have DML permissions (SELECT, INSERT, UPDATE, DELETE) only, NEVER DDL permissions (CREATE TABLE, ALTER TABLE, DROP TABLE).\n3. Health Check Failure: Migrations running on 100M-row tables cause startup timeouts and crash-loops.\n\nThe CI/CD Migration Bundle Pattern:\n1. Generate Bundle during CI build:\n   dotnet ef migrations bundle --output ./bundle.exe --self-contained -r linux-x64\n2. Execute in Release Pipeline:\n   Run bundle.exe against the staging/production database using elevated DBA credentials.\n3. Expand / Contract Pattern for Zero Downtime:\n   - Phase 1 (Expand): Add new nullable columns or tables. Deploy new code.\n   - Phase 2 (Backfill): Populate data asynchronously.\n   - Phase 3 (Contract): After old code is fully decommissioned, remove deprecated columns in a future migration.",
    "codeSnippet": "# Azure DevOps Release Pipeline Migration Step\n- task: AzureCLI@2\n  displayName: 'Execute EF Core Migration Bundle'\n  inputs:\n    azureSubscription: 'Production-Azure-Connection'\n    scriptType: 'bash'\n    scriptLocation: 'inlineScript'\n    inlineScript: |\n      chmod +x $(Pipeline.Workspace)/drop/bundle\n      # Execute idempotent migration binary with elevated connection string\n      $(Pipeline.Workspace)/drop/bundle --connection \"$(PROD_DB_CONNECTION_STRING)\"",
    "redFlags": [
      "Running 'context.Database.EnsureCreated()' in production (bypasses migration history completely).",
      "Renaming a column in a single migration on a live system without expand/contract (causes instant 500 errors for running containers)."
    ],
    "proTips": [
      "Generate idempotent SQL scripts via 'dotnet ef migrations script --idempotent' to allow DBA inspection and auditing before deployment."
    ]
  },
  {
    "id": "q-linq-1",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "IEnumerable",
      "IQueryable",
      "Expression Trees",
      "Deferred Execution"
    ],
    "title": "IEnumerable<T> vs. IQueryable<T>: In-Memory Client Filtering vs SQL Expression Trees",
    "pitch": "IEnumerable<T> operates in-memory on in-process collections using compiled delegates (Func<T, bool>). Every filtering operation evaluates in the CLR on the client machine. IQueryable<T> inherits from IEnumerable but evaluates out-of-process against an external data source (like SQL Server) using Expression Trees (Expression<Func<T, bool>>). The query provider parses the expression tree and translates it into native SQL, executing filtering directly on the database engine.",
    "deepDive": "Under the Hood Differences:\n1. Method Signatures:\n   - Enumerable.Where takes Func<TSource, bool> (compiled C# IL delegate).\n   - Queryable.Where takes Expression<Func<TSource, bool>> (data structure representing code).\n2. The Fatal Performance Anti-Pattern:\n   - If an EF Core query is cast to IEnumerable<T> before applying Where or Take:\n     IEnumerable<Order> orders = dbContext.Orders; // Still IQueryable\n     var filtered = orders.Where(o => o.Status == \"Completed\").Take(10);\n   - Because Where() is invoked on IEnumerable, EF Core issues: SELECT * FROM Orders;\n   - All 5,000,000 order rows are transferred across the network to client RAM, where the CLR filters in-memory!\n   - Invoking Where() on IQueryable compiles to: SELECT TOP (10) * FROM Orders WHERE Status = 'Completed';\n3. When to use each:\n   - Use IQueryable while building the database query pipeline (paging, filtering, sorting, projection).\n   - Use IEnumerable once data has been materialized (.ToList(), .AsEnumerable()) for C# domain computations that SQL cannot express.",
    "codeSnippet": "// ❌ JUNIOR MISTAKE: Pulls all 5 million rows into memory!\npublic List<OrderDto> BadGetOrders(AppDbContext db)\n{\n    IEnumerable<Order> query = db.Orders; // Casts to IEnumerable!\n    return query\n        .Where(o => o.Total > 500)       // Executes in C# memory, NOT in SQL!\n        .Take(20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToList();\n}\n\n// ✅ SENIOR PATTERN: Generates optimal SQL with WHERE and TOP\npublic async Task<List<OrderDto>> GoodGetOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    IQueryable<Order> query = db.Orders.AsNoTracking();\n    return await query\n        .Where(o => o.Total > 500)       // Translated to SQL: WHERE Total > 500\n        .Take(20)                        // Translated to SQL: TOP (20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Calling '.ToList()' or '.AsEnumerable()' early in an EF query pipeline before applying filters or pagination.",
      "Stating that IQueryable and IEnumerable execute the same way."
    ],
    "proTips": [
      "Keep method return types as IQueryable<T> inside Repository/Query specifications only if you want callers to append further SQL clauses; otherwise, return Task<List<TDto>> to prevent leaky query logic."
    ]
  },
  {
    "id": "q-linq-2",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "Deferred Execution",
      "Multiple Enumeration",
      "Re-evaluation",
      "Yield"
    ],
    "title": "LINQ Deferred Execution vs. Immediate Execution: The Multiple Enumeration Bug",
    "pitch": "LINQ queries use deferred execution by default: defining a query does not execute it or allocate collection memory; execution occurs only when the sequence is iterated (via foreach, .ToList(), .Count(), etc.). However, this introduces the critical 'Multiple Enumeration' performance bug: iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database roundtrip or calculation) to re-execute every single time.",
    "deepDive": "Core Mechanics of Deferred Execution:\n1. Iterators & Yield:\n   - Operators like Where, Select, and Skip return custom iterator structs/classes implementing IEnumerator<T>.\n   - Code executes on each call to MoveNext().\n2. The Multiple Enumeration Hazard:\n   public void Process(IEnumerable<User> users)\n   {\n       if (users.Any()) // Enumeration 1: Runs SQL query or generator\n       {\n           int count = users.Count(); // Enumeration 2: Re-runs entire query!\n           foreach (var u in users) { ... } // Enumeration 3: Re-runs again!\n       }\n   }\n3. Immediate Execution Operators:\n   - Operators that produce a non-sequence value: Count(), Any(), First(), Single(), Sum(), Average().\n   - Operators that buffer into a collection: ToList(), ToArray(), ToDictionary(), ToLookup().",
    "codeSnippet": "// ❌ MULTIPLE ENUMERATION: Re-executes HTTP/DB or LINQ stream twice\npublic void SendAlerts(IEnumerable<SensorReading> readings)\n{\n    // Multiple enumeration warning!\n    if (readings.Any(r => r.Temperature > 100))\n    {\n        var critical = readings.Where(r => r.Temperature > 100);\n        _logger.LogWarning(\"Found {Count} critical readings\", critical.Count()); // Re-enumerates!\n    }\n}\n\n// ✅ MATERIALIZED EVALUATION: Single pass iteration\npublic void SendAlertsOptimal(IEnumerable<SensorReading> readings)\n{\n    // Materialize into memory once if multiple iterations are required\n    var critical = readings.Where(r => r.Temperature > 100).ToList();\n    if (critical.Count > 0)\n    {\n        _logger.LogWarning(\"Found {Count} critical readings\", critical.Count);\n    }\n}",
    "redFlags": [
      "Ignoring JetBrains ReSharper / Roslyn 'Possible multiple enumeration of IEnumerable' compiler warnings.",
      "Calling .ToList() prematurely on huge streams that only require a single streaming forward-pass."
    ],
    "proTips": [
      "In .NET 6+, use 'reading.TryGetNonEnumeratedCount(out int count)' to check element count without forcing an enumeration if the sequence implements ICollection."
    ]
  },
  {
    "id": "q-linq-4",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "SelectMany",
      "Cross Join",
      "Hierarchy Flattening",
      "Projection"
    ],
    "title": "SelectMany vs. Select: Flattening Hierarchies, 1:N Relationships, and Cross Joins",
    "pitch": "Select() projects each element of a sequence into a new form, producing a 1-to-1 output sequence (IEnumerable<TOut>). SelectMany() projects each element to an intermediate sequence and flattens the resulting sequences into a single one-dimensional collection (1-to-many relationship). In relational databases and EF Core, SelectMany translates to an SQL CROSS APPLY or INNER JOIN, avoiding nested collection objects.",
    "deepDive": "Understanding the Mechanics:\n1. Select:\n   - Input: List of Authors (each author has List<Book>).\n   - authors.Select(a => a.Books) returns IEnumerable<List<Book>> (a collection of collections).\n2. SelectMany:\n   - authors.SelectMany(a => a.Books) returns IEnumerable<Book> (a single flat list of all books from all authors).\n3. Cross Product / Cartesian Generation:\n   - SelectMany can take a second result selector to combine parent and child attributes:\n     authors.SelectMany(a => a.Books, (author, book) => new { author.Name, book.Title });\n4. EF Core Translation:\n   - Translates into SQL: 'FROM Authors a CROSS APPLY Books b' or 'INNER JOIN Books b ON a.Id = b.AuthorId'.",
    "codeSnippet": "public class Department\n{\n    public string Name { get; set; } = \"\";\n    public List<Employee> Employees { get; set; } = new();\n}\n\npublic class ReportingService\n{\n    public List<EmployeeDto> GetAllActiveEmployees(List<Department> departments)\n    {\n        // Flattens departments into a single stream of active employees\n        return departments\n            .SelectMany(dept => dept.Employees)\n            .Where(emp => emp.IsActive)\n            .Select(emp => new EmployeeDto(emp.Id, emp.FullName, emp.Salary))\n            .ToList();\n    }\n}",
    "redFlags": [
      "Using nested foreach loops to append child items to a new List instead of a declarative SelectMany.",
      "Confusing SelectMany with Concat or Union."
    ],
    "proTips": [
      "SelectMany is the monadic 'bind' (flatMap) operation in functional programming, enabling railway-oriented programming when chaining Result<T> types."
    ]
  },
  {
    "id": "q-linq-5",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "GroupBy",
      "ToLookup",
      "ToDictionary",
      "Memory"
    ],
    "title": "LINQ GroupBy vs. ToLookup vs. ToDictionary: Performance and Memory Trade-Offs",
    "pitch": "GroupBy produces a deferred, lazy-evaluated sequence of IGrouping<TKey, TElement> where each group is streamed. ToLookup() immediately executes and creates an immutable 1-to-many lookup structure (ILookup<TKey, TElement>) where duplicate keys are supported and querying a missing key returns an empty sequence rather than throwing an exception. ToDictionary() creates a mutable 1-to-1 map where duplicate keys throw ArgumentException.",
    "deepDive": "Comparison Table:\n1. GroupBy(k):\n   - Execution: Deferred (iterated on demand).\n   - Keys: Multiple values per key.\n   - Missing key: N/A (linear search through groups).\n2. ToLookup(k):\n   - Execution: Immediate (materialized in RAM).\n   - Keys: Multiple values per key.\n   - Missing key: Returns Enumerable.Empty<T>() (safe, never throws KeyNotFoundException).\n3. ToDictionary(k, v):\n   - Execution: Immediate (materialized in RAM).\n   - Keys: Strictly UNIQUE keys only!\n   - Missing key: Throws KeyNotFoundException unless using TryGetValue. Duplicate key on creation throws ArgumentException.",
    "codeSnippet": "var orders = GetOrders();\n\n// 1. ToDictionary: Fails if duplicate CustomerId exists!\n// var dict = orders.ToDictionary(o => o.CustomerId); // 💥 ArgumentException!\n\n// 2. ToLookup: Ideal for 1-to-many in-memory indexing\nILookup<int, Order> ordersByCustomer = orders.ToLookup(o => o.CustomerId);\n\n// Safe lookup: Never throws KeyNotFoundException\nIEnumerable<Order> customerOrders = ordersByCustomer[999]; // Returns empty sequence if not found!\nConsole.WriteLine($\"Customer 999 order count: {customerOrders.Count()}\");",
    "redFlags": [
      "Using ToDictionary on columns with potential duplicates without grouping first.",
      "Iterating GroupBy multiple times without materializing with ToLookup or ToList."
    ],
    "proTips": [
      "When building in-memory multi-value caches, prefer ILookup<K, V> over Dictionary<K, List<V>> for cleaner, thread-safe, immutable reads."
    ]
  },
  {
    "id": "q-linq-6",
    "pillar": "linq",
    "seniority": "Senior",
    "tags": [
      "Expression Trees",
      "Roslyn",
      "Dynamic LINQ",
      "IQueryProvider"
    ],
    "title": "Expression Trees Under the Hood: Func<T, bool> vs. Expression<Func<T, bool>>",
    "pitch": "In C#, a lambda passed to Func<T, bool> compiles into executable IL code (a delegate). When the identical lambda syntax is assigned to Expression<Func<T, bool>>, the Roslyn compiler lowers it into a tree data structure composed of Expression nodes (ParameterExpression, BinaryExpression, MemberExpression). This expression tree represents the code structure as data, allowing database providers like EF Core to inspect nodes at runtime and translate them into SQL.",
    "deepDive": "Why Expression Trees are Essential for Senior .NET Developers:\n1. Inspection as Data:\n   - An Expression tree can be visited using the Visitor Pattern (ExpressionVisitor).\n   - EF Core walks the tree to translate 'user.Age > 18' into SQL 'WHERE [u].[Age] > 18'.\n2. Dynamic Query Generation:\n   - For advanced search screens with 15 optional filter inputs, instead of writing 15 nested if statements or string SQL concatenation, senior engineers dynamically combine Expression trees using Expression.AndAlso and Expression.Lambda.\n3. Compiling Expressions:\n   - You can compile an Expression tree back into an executable delegate at runtime via 'expr.Compile()', though compilation incurs high CPU overhead and should be cached.",
    "codeSnippet": "// Programmatic Dynamic Filter Construction using Expression Trees\npublic static Expression<Func<T, bool>> CombineWithAnd<T>(\n    Expression<Func<T, bool>> first, \n    Expression<Func<T, bool>> second)\n{\n    var parameter = Expression.Parameter(typeof(T), \"x\");\n\n    // Replace parameters in both expressions with unified parameter\n    var leftVisitor = new ParameterReplacer(first.Parameters[0], parameter);\n    var left = leftVisitor.Visit(first.Body);\n\n    var rightVisitor = new ParameterReplacer(second.Parameters[0], parameter);\n    var right = rightVisitor.Visit(second.Body);\n\n    // Combine with logical AND: x => left && right\n    var body = Expression.AndAlso(left!, right!);\n    return Expression.Lambda<Func<T, bool>>(body, parameter);\n}\n\npublic class ParameterReplacer : ExpressionVisitor\n{\n    private readonly ParameterExpression _from, _to;\n    public ParameterReplacer(ParameterExpression from, ParameterExpression to) => (_from, _to) = (from, to);\n    protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);\n}",
    "redFlags": [
      "Compiling Expression trees in a tight loop with .Compile() (causes severe JIT CPU spikes).",
      "Attempting to invoke arbitrary C# methods inside EF Core Expressions that have no SQL equivalent."
    ],
    "proTips": [
      "Use System.Linq.Expressions with compiled lambdas for high-speed dynamic object mapping that matches manual assignment speed while avoiding Reflection overhead."
    ]
  },
  {
    "id": "q-efcore-5",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "Migrations",
      "CI/CD",
      "Bundle",
      "Zero-Downtime"
    ],
    "title": "EF Core Migrations in CI/CD: Migration Bundles vs Database.Migrate() at Startup",
    "pitch": "Calling 'context.Database.Migrate()' during application startup is dangerous in production: in horizontally scaled environments with multiple containers starting concurrently, race conditions corrupt the __EFMigrationsHistory table or cause deadlocks. The enterprise standard is using self-contained Migration Bundles (dotnet ef migrations bundle) executed as a dedicated gated step in CI/CD pipelines before application deployment, paired with expand/contract schema design for zero downtime.",
    "deepDive": "Why Migrate() at Startup Fails at Scale:\n1. Concurrency Race: Multiple App Service or Kubernetes pods booting simultaneously execute ALTER TABLE at the same time.\n2. Permission Violation: Web app database users should have DML permissions (SELECT, INSERT, UPDATE, DELETE) only, NEVER DDL permissions (CREATE TABLE, ALTER TABLE, DROP TABLE).\n3. Health Check Failure: Migrations running on 100M-row tables cause startup timeouts and crash-loops.\n\nThe CI/CD Migration Bundle Pattern:\n1. Generate Bundle during CI build:\n   dotnet ef migrations bundle --output ./bundle.exe --self-contained -r linux-x64\n2. Execute in Release Pipeline:\n   Run bundle.exe against the staging/production database using elevated DBA credentials.\n3. Expand / Contract Pattern for Zero Downtime:\n   - Phase 1 (Expand): Add new nullable columns or tables. Deploy new code.\n   - Phase 2 (Backfill): Populate data asynchronously.\n   - Phase 3 (Contract): After old code is fully decommissioned, remove deprecated columns in a future migration.",
    "codeSnippet": "# Azure DevOps Release Pipeline Migration Step\n- task: AzureCLI@2\n  displayName: 'Execute EF Core Migration Bundle'\n  inputs:\n    azureSubscription: 'Production-Azure-Connection'\n    scriptType: 'bash'\n    scriptLocation: 'inlineScript'\n    inlineScript: |\n      chmod +x $(Pipeline.Workspace)/drop/bundle\n      # Execute idempotent migration binary with elevated connection string\n      $(Pipeline.Workspace)/drop/bundle --connection \"$(PROD_DB_CONNECTION_STRING)\"",
    "redFlags": [
      "Running 'context.Database.EnsureCreated()' in production (bypasses migration history completely).",
      "Renaming a column in a single migration on a live system without expand/contract (causes instant 500 errors for running containers)."
    ],
    "proTips": [
      "Generate idempotent SQL scripts via 'dotnet ef migrations script --idempotent' to allow DBA inspection and auditing before deployment."
    ]
  },
  {
    "id": "q-sql-6",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "Normalization",
      "Denormalization",
      "OLTP vs OLAP",
      "Database Design"
    ],
    "title": "Relational Normalization (1NF through 3NF/BCNF) vs. Pragmatic Denormalization",
    "pitch": "Normalization organizes relational schemas to minimize data redundancy and eliminate insert, update, and delete anomalies by ensuring every non-key attribute depends on 'the key, the whole key, and nothing but the key' (3NF/BCNF). In high-throughput OLTP systems, 3NF ensures atomic, consistent writes. However, in read-heavy architectures with massive JOIN overhead, senior engineers pragmatically apply Denormalization (materialized views, read-model projections, and pre-aggregated summary tables) to trade write complexity for sub-millisecond query performance.",
    "deepDive": "The Normal Forms Breakdown:\n1. 1NF (First Normal Form): Atomic values only (no repeating groups, comma-separated lists, or arrays in a column).\n2. 2NF (Second Normal Form): 1NF + No partial key dependencies (every non-key column must depend on the FULL composite primary key).\n3. 3NF (Third Normal Form): 2NF + No transitive dependencies (non-key columns must not depend on other non-key columns).\n4. BCNF (Boyce-Codd Normal Form): A stricter version of 3NF where every determinant must be a candidate key.\n\nPragmatic Denormalization Patterns in Modern .NET:\n1. Summary Tables & Pre-Aggregation: Maintaining 'DailySalesSummary' updated asynchronously via background jobs or triggers.\n2. Read-Model Projections (CQRS): Keeping normalized relational tables for write aggregates, while projecting denormalized JSON or DTO tables for read screens.\n3. Indexed / Materialized Views: SQL Server automatically maintains the view output on disk when underlying tables change, allowing lightning-fast index seeks on complex aggregations.",
    "codeSnippet": "-- SQL Server Indexed View (Materialized Denormalization)\nCREATE VIEW dbo.vw_CustomerOrderTotals\nWITH SCHEMABINDING -- Required for indexing\nAS\nSELECT \n    c.CustomerId,\n    c.CustomerName,\n    COUNT_BIG(*) AS OrderCount,\n    SUM(ISNULL(o.TotalAmount, 0)) AS LifetimeSpend\nFROM dbo.Customers c\nINNER JOIN dbo.Orders o ON c.CustomerId = o.CustomerId\nGROUP BY c.CustomerId, c.CustomerName;\nGO\n\n-- Create unique clustered index to materialize view on disk\nCREATE UNIQUE CLUSTERED INDEX CIX_vw_CustomerOrderTotals \nON dbo.vw_CustomerOrderTotals (CustomerId);",
    "redFlags": [
      "Prematurely denormalizing tables during initial schema design before identifying read bottlenecks.",
      "Denormalizing transactional write models without establishing mechanisms to prevent data divergence."
    ],
    "proTips": [
      "Use SQL Server Indexed Views with SCHEMABINDING for read-heavy aggregates: the query optimizer can automatically substitute the view index even when the query targets the underlying base tables!"
    ]
  }
];
