// ============================================================================
// 50+ HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW QUESTIONS
// Structured with 60-Second Pitch, Deep Dive, Code, Red Flags & Pro-Tips
// ============================================================================

window.INTERVIEW_QUESTIONS = [
  // ==========================================================================
  // PILLAR 1: C# INTERNALS & CONCURRENCY
  // ==========================================================================
  {
    id: "q-csharp-1",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Task", "ValueTask", "Memory Allocation", "Performance"],
    title: "Task vs. ValueTask: Internal Mechanics, Allocations, and Pitfalls",
    pitch: "Task is a reference type allocated on the managed heap every time an asynchronous operation is initiated. ValueTask is a discriminated union value type (struct) designed to avoid heap allocation entirely when an operation completes synchronously (such as a cache hit or buffered stream read). However, ValueTask has strict consumption rules: it cannot be awaited multiple times, awaited concurrently, or used with Task.WhenAll without converting via .AsTask().",
    deepDive: `Under the hood, returning a Task<T> from a method creates an instance of System.Threading.Tasks.Task on the heap, incurring GC Gen 0 pressure. When an API method is called millions of times per second and completes synchronously 90% of the time (e.g., fetching a session from in-memory cache), these Task allocations cause significant GC churn.

ValueTask<T> solves this by wrapping either a TResult value directly (for synchronous completion with ZERO allocation) or an IValueTaskSource / Task<T> (for asynchronous completion). 

However, ValueTask<T> has important trade-offs:
1. State Machine Overhead: If the method completes asynchronously, using ValueTask is actually slightly more expensive than Task because the underlying state machine struct must be boxed or use IValueTaskSource pooled nodes.
2. Safety Hazard: Because IValueTaskSource implementations reuse backing objects across invocations, awaiting a ValueTask twice or awaiting it concurrently can lead to race conditions and ObjectDisposedException.`,
    codeSnippet: `// High-performance cache accessor returning ValueTask<UserDto>
public class UserCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly AppDbContext _dbContext;

    public UserCacheService(IMemoryCache cache, AppDbContext db)
    {
        _memoryCache = cache;
        _dbContext = db;
    }

    public ValueTask<UserDto> GetUserAsync(int userId, CancellationToken ct)
    {
        // 1. FAST PATH (Synchronous): Zero heap allocation
        if (_memoryCache.TryGetValue(userId, out UserDto? cached) && cached is not null)
        {
            return new ValueTask<UserDto>(cached);
        }

        // 2. SLOW PATH (Asynchronous): Delegates to async helper
        return new ValueTask<UserDto>(FetchAndCacheUserAsync(userId, ct));
    }

    private async Task<UserDto> FetchAndCacheUserAsync(int userId, CancellationToken ct)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserDto(u.Id, u.Email, u.FullName))
            .FirstAsync(ct);

        _memoryCache.Set(userId, user, TimeSpan.FromMinutes(10));
        return user;
    }
}`,
    redFlags: [
      "Stating that 'ValueTask should always replace Task everywhere' (it shouldn't; only on high-frequency sync-heavy paths).",
      "Awaiting a ValueTask multiple times in code without using .AsTask().",
      "Using ValueTask in public interface contracts without measuring cache hit rates."
    ],
    proTips: [
      "Benchmark with BenchmarkDotNet to verify that the synchronous path is executed > 80% of the time before migrating to ValueTask.",
      "If you need to pass a ValueTask into Task.WhenAll or Task.WhenAny, always call .AsTask() first: await Task.WhenAll(v1.AsTask(), v2.AsTask())."
    ]
  },
  {
    id: "q-csharp-2",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Async/Await", "IAsyncStateMachine", "CLR", "Compiler"],
    title: "Async/Await Under the Hood: The Roslyn State Machine Lowering",
    pitch: "The C# compiler lowers an async method into an internal state machine struct implementing IAsyncStateMachine. It replaces your method body with an integer state tracker, fields to capture local variables and arguments, a MoveNext() method with a switch-jump table, and an AsyncTaskMethodBuilder. When an uncompleted awaiter is encountered, the state machine registers itself as a completion callback via INotifyCompletion, saves the execution context, and unwinds the call stack without blocking the OS thread.",
    deepDive: `When you declare 'async Task DoWorkAsync()', the compiler generates:
1. Struct State Machine: Generates '<DoWorkAsync>d__0 : IAsyncStateMachine' struct to prevent heap allocation for the state machine itself if it finishes synchronously.
2. Builder: Uses AsyncTaskMethodBuilder<TResult> to manage the lifecycle and construct the returned Task.
3. MoveNext(): All synchronous segments between awaits are separated by state numbers (-1 = running, 0..N = suspended at awaiter N, -2 = finished).
4. Context Capture: If SynchronizationContext.Current or ExecutionContext is present, the builder captures it to ensure AsyncLocal<T> and security principals flow correctly upon resumption.
5. Invocations: When the awaiter calls 'OnCompleted(Action)', if the awaiter isn't done, control returns to the caller immediately. When the I/O completion port (IOCP) notifies Windows that bytes arrived, a ThreadPool worker invokes MoveNext(), jumping straight to state N via the switch table.`,
    codeSnippet: `// Conceptually lowered code generated by Roslyn for async Task ExampleAsync()
[StructLayout(LayoutKind.Auto)]
private struct <ExampleAsync>d__1 : IAsyncStateMachine
{
    public int <>1__state;
    public AsyncTaskMethodBuilder <>t__builder;
    private TaskAwaiter <>u__1;

    public void MoveNext()
    {
        try
        {
            if (<>1__state == 0)
            {
                // Resume after await
                <>u__1.GetResult(); // Throws original exception if faulted
                return;
            }

            TaskAwaiter awaiter = SomeIoOperationAsync().GetAwaiter();
            if (!awaiter.IsCompleted)
            {
                <>1__state = 0;
                <>u__1 = awaiter;
                // Hook up continuation callback to ThreadPool
                <>t__builder.AwaitUnsafeOnCompleted(ref awaiter, ref this);
                return;
            }
            awaiter.GetResult();
        }
        catch (Exception ex)
        {
            <>1__state = -2;
            <>t__builder.SetException(ex);
            return;
        }
        <>1__state = -2;
        <>t__builder.SetResult();
    }

    public void SetStateMachine(IAsyncStateMachine stateMachine) => <>t__builder.SetStateMachine(stateMachine);
}`,
    redFlags: [
      "Claiming that 'async spawns a new background thread for each await' (I/O async operations use hardware interrupts & OS completion ports without dedicated threads).",
      "Thinking that code prior to the first await runs asynchronously (everything up to the first awaited Task that returns IsCompleted=false runs synchronously on the caller thread)."
    ],
    proTips: [
      "In library code, always use .ConfigureAwait(false) to skip capturing the SynchronizationContext, saving execution context flow overhead and avoiding UI/ASP.NET deadlocks.",
      "Inspect the lowered state machine using tools like sharplab.io or ildasm to analyze closure captures."
    ]
  },
  {
    id: "q-csharp-3",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Garbage Collection", "LOH", "POH", "Memory Management"],
    title: "CLR Garbage Collection: Generations, LOH 85KB Threshold, and POH",
    pitch: "The CLR GC is a generational, tracing, mark-and-sweep compacting collector based on the weak generational hypothesis: new objects die young. It divides heap memory into Gen 0 (ephemeral), Gen 1 (survival buffer), Gen 2 (long-lived), the Large Object Heap (LOH) for allocations >= 85,000 bytes, and the Pinned Object Heap (POH, added in .NET 5). While Gen 0/1/2 undergo compaction to eliminate fragmentation, the LOH is generally swept without compaction due to the prohibitive cost of copying large memory blocks.",
    deepDive: `Generations and Collection Triggers:
1. Gen 0 / Gen 1 (Ephemeral Segment): Compacted frequently in milliseconds (often < 1ms). Surviving objects promote to the next generation.
2. Gen 2 (Full GC): Collects Gen 0, 1, and 2. Can cause 'Stop-The-World' pauses unless running Concurrent/Background GC.
3. Large Object Heap (LOH): Objects >= 85,000 bytes (e.g. large byte arrays, large strings) bypass Gen 0/1 directly to LOH. Because LOH is not compacted by default, alternating allocations of large objects cause fragmentation, leading to OutOfMemoryException even with gigabytes of free RAM.
4. Pinned Object Heap (POH): .NET 5+ introduced POH (GC.AllocateArray<T>(..., pinned: true)). Pinned buffers used for socket/file I/O no longer fragment Gen 0 or LOH because they are segregated into their own non-moving heap segment.`,
    codeSnippet: `// Zero-allocation buffering using ArrayPool to avoid LOH fragmentation
public async Task ProcessLargeStreamAsync(Stream networkStream, CancellationToken ct)
{
    // RENT a 128KB buffer (Normally > 85KB would trigger LOH allocation!)
    byte[] buffer = ArrayPool<byte>.Shared.Rent(128 * 1024);
    try
    {
        int bytesRead;
        while ((bytesRead = await networkStream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            // Process bytes without heap allocation
            ProcessChunk(buffer.AsSpan(0, bytesRead));
        }
    }
    finally
    {
        // RETURN buffer to pool so it can be reused without GC involvement
        ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
    }
}`,
    redFlags: [
      "Recommending 'calling GC.Collect() manually' in production code.",
      "Not knowing the 85,000 byte threshold for the LOH.",
      "Believing that all garbage collections compact all heaps equally."
    ],
    proTips: [
      "Use GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce before a planned maintenance window if LOH compaction is strictly needed.",
      "Monitor '% Time in GC' in dotnet-counters or Application Insights. If it exceeds 5-10%, investigate LOH allocations and Gen 2 promotions using PerfView or dotnet-dump."
    ]
  },
  {
    id: "q-csharp-4",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Span<T>", "Memory<T>", "ref struct", "Zero Allocation"],
    title: "Span<T> vs Memory<T>: Stack-Only ref structs vs Heap-Safe Memory",
    pitch: "Span<T> is a ref struct representing a contiguous region of arbitrary memory (managed array, stack-allocated buffer, or unmanaged native memory). Because it is a ref struct, the CLR guarantees it resides solely on the execution stack, meaning it cannot be boxed, stored on classes, or used across async await points. Memory<T> is a regular struct that wraps an underlying memory owner, allowing contiguous memory slices to safely live on the heap and be passed into asynchronous methods.",
    deepDive: `Why was Span<T> introduced in C# 7.2?
Historically, string parsing (e.g. Substring(), Split()) allocated millions of transient string objects on the managed heap. Span<T> and ReadOnlySpan<T> provide safe, boundary-checked direct memory pointer arithmetic. A slice (span.Slice(start, length)) creates an interior pointer with zero heap allocations.

Ref Struct Limitations:
Because Span<T> contains a ByReference<T> (a managed interior pointer) and a length, placing it on the heap could result in dangling stack pointers if the enclosing stack frame unrolls.
Thus, C# enforces:
- Cannot be boxed or cast to object/ValueType/interfaces.
- Cannot be a field of a normal class or struct.
- Cannot be a type parameter in generics (e.g. List<Span<T>> is invalid).
- Cannot be used across 'await' or 'yield return' boundaries (because state machines hoist locals to heap-allocated fields).

Solution for Async: System.Memory<T> and ReadOnlyMemory<T>. They encapsulate an array or IMemoryOwner<T> with an offset and length, safe for asynchronous state machines.`,
    codeSnippet: `// High-performance zero-allocation string / span parser
public static class CsvParser
{
    // Consumes ReadOnlySpan<char> directly from memory without sub-allocating strings
    public static bool TryParseRecord(ReadOnlySpan<char> line, out int id, out decimal amount)
    {
        id = 0;
        amount = 0m;

        int firstComma = line.IndexOf(',');
        if (firstComma == -1) return false;

        ReadOnlySpan<char> idSpan = line.Slice(0, firstComma);
        ReadOnlySpan<char> remaining = line.Slice(firstComma + 1);

        if (!int.TryParse(idSpan, out id)) return false;
        if (!decimal.TryParse(remaining, out amount)) return false;

        return true;
    }
}`,
    redFlags: [
      "Trying to store a Span<T> as a field in a controller, service, or singleton.",
      "Not knowing why Span<T> cannot be used in an async method before an await.",
      "Creating new strings with .Substring() inside high-frequency loops instead of .AsSpan()."
    ],
    proTips: [
      "Use stackalloc byte[256] with Span<byte> for small scratchpad buffers (< 1KB) to achieve 100% stack-allocated zero-GC execution.",
      "Use MemoryMarshal.Cast<TFrom, TTo>() to re-interpret spans without copying memory bytes (e.g. byte span to int span)."
    ]
  },
  {
    id: "q-csharp-5",
    pillar: "csharp",
    seniority: "Mid",
    tags: ["Records", "Pattern Matching", "Immutability", "C# 9/10/11"],
    title: "Records, Value Equality, and Advanced Pattern Matching in Modern C#",
    pitch: "Records are reference types (or value types via 'record struct') that synthesize value-based equality, GetHashCode, ToString, and non-destructive mutation via the 'with' keyword by default. Coupled with modern pattern matching (type, relational, list, and property patterns), records provide expressive Domain-Driven Design Value Objects and immutable DTOs without writing boilerplate equality overrides.",
    deepDive: `Under the hood of 'public record Person(string Name, int Age);':
1. Properties: Compiles to 'public string Name { get; init; }' and 'public int Age { get; init; }'.
2. Equality: Implements IEquatable<Person>, overrides Equals(object?), and overrides == / != to compare all property values rather than reference addresses.
3. Clone Constructor: Synthesizes a protected copy constructor 'protected Person(Person original)' used by the 'with' expression to clone instances while mutating select fields.
4. Deconstruct: Implements 'Deconstruct(out string name, out int age)' enabling tuple-like destructuring.

Pattern Matching Evolution:
Modern C# supports exhaustive pattern matching across switch expressions:
- Property Patterns: { Status: OrderStatus.Shipped, Total: > 100 }
- Relational Patterns: x is >= 10 and <= 50
- Type Patterns: order is ExpressOrder { Priority: true }
- List Patterns: numbers is [1, 2, .. var rest, 99]`,
    codeSnippet: `public record Order(int Id, decimal Total, string Country, bool IsVip);

public static class DiscountEngine
{
    public static decimal CalculateDiscount(Order order) => order switch
    {
        // Property pattern + relational pattern
        { IsVip: true, Total: > 500m } => 0.25m,
        { IsVip: true, Total: > 100m } => 0.15m,
        // Relational and logical combinators
        { Country: "US" or "CA", Total: >= 200m } => 0.10m,
        { Total: < 50m } => 0.00m,
        _ => 0.05m
    };

    public static Order ApplySeasonalPromotion(Order original)
    {
        // Non-destructive mutation: returns cloned instance with altered Total
        return original with { Total = original.Total * 0.9m };
    }
}`,
    redFlags: [
      "Assuming records are value types (records are 'record class' reference types by default unless explicitly declared as 'record struct').",
      "Using records for mutable EF Core entities where reference equality and Change Tracker identity maps are expected."
    ],
    proTips: [
      "Use 'readonly record struct' for high-throughput Domain Value Objects (e.g. Money, Coordinates) to eliminate both heap allocation and unintended mutability.",
      "Always use switch expressions over switch statements for pattern matching to ensure compiler warnings on non-exhaustive branches."
    ]
  },
  {
    id: "q-csharp-6",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["SemaphoreSlim", "Concurrency", "Locks", "Async"],
    title: "SemaphoreSlim vs ReaderWriterLockSlim: Throttling and Async Mutual Exclusion",
    pitch: "The C# 'lock' statement and ReaderWriterLockSlim rely on thread affinity and block the underlying operating system thread, making them incompatible with async/await. SemaphoreSlim is a lightweight synchronization primitive that supports true asynchronous locking via WaitAsync(). It can be initialized to count 1 for mutual exclusion (replacing lock) or count N for concurrency throttling (such as limiting outgoing API calls to 10 concurrent requests without thread starvation).",
    deepDive: `Why 'lock' cannot wrap an 'await':
The C# lock statement is syntactic sugar for Monitor.Enter(obj) / Monitor.Exit(obj). Monitor enforces thread affinity: the exact same managed thread that acquired the lock must release it. However, in an async method, the code following an 'await' resumption may execute on a completely different ThreadPool thread, causing Monitor.Exit to throw SynchronizationLockException.

SemaphoreSlim Mechanics:
- Synchronous & Asynchronous: Exposes both .Wait() (blocking) and .WaitAsync() (non-blocking, returns a Task).
- In WaitAsync(), if the semaphore count is 0, the calling thread is NOT blocked. Instead, a TaskCompletionSource node is enqueued, and the calling thread is freed back to the ThreadPool.
- When another caller executes .Release(), the next queued waiter's Task is completed, scheduling its continuation on the ThreadPool.`,
    codeSnippet: `// Rate-throttled batch processor using SemaphoreSlim
public class RateThrottledProcessor
{
    private readonly HttpClient _httpClient;
    // Limits maximum concurrent downstream outbound requests to 5
    private readonly SemaphoreSlim _throttle = new SemaphoreSlim(5, 5);

    public RateThrottledProcessor(HttpClient httpClient) => _httpClient = httpClient;

    public async Task ProcessUrlsAsync(IEnumerable<string> urls, CancellationToken ct)
    {
        var tasks = urls.Select(async url =>
        {
            // Asynchronously wait for an open slot without holding a thread
            await _throttle.WaitAsync(ct);
            try
            {
                var response = await _httpClient.GetStringAsync(url, ct);
                Console.WriteLine($"Processed {url}: {response.Length} chars");
            }
            finally
            {
                // Guarantee slot is released even on exception
                _throttle.Release();
            }
        });

        await Task.WhenAll(tasks);
    }
}`,
    redFlags: [
      "Calling .Wait() or .Result on SemaphoreSlim in an async method instead of await .WaitAsync().",
      "Forgetting to release the SemaphoreSlim in a finally block (leads to permanent system deadlock).",
      "Using Thread.Sleep() inside an async pipeline."
    ],
    proTips: [
      "To prevent boilerplate try/finally blocks, create an 'IDisposable' wrapper struct pattern: using (await _semaphore.UseWaitAsync(ct)) { ... }.",
      "If you need reader-writer semantics with async, SemaphoreSlim does not natively support multiple readers; use Stephen Toub's AsyncReaderWriterLock."
    ]
  },
  {
    id: "q-csharp-7",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Channel<T>", "Producer-Consumer", "Backpressure", "High Throughput"],
    title: "System.Threading.Channels: Lock-Free Concurrency and Backpressure",
    pitch: "System.Threading.Channels is a high-performance, asynchronous, thread-safe communication library specifically built for producer-consumer workflows. Unlike BlockingCollection<T> which blocks OS threads, Channel<T> is completely non-blocking with async ReadAllAsync() and WriteAsync(). Most crucially, Bounded Channels provide backpressure: when the buffer reaches capacity, producers are asynchronously paused until consumers catch up, preventing OutOfMemoryException during traffic spikes.",
    deepDive: `Internal Architecture of Channel<T>:
1. Bounded vs Unbounded:
   - UnboundedChannel<T>: Infinite memory buffer. Fast, but dangerous under prolonged producer spikes (can crash server with OOM).
   - BoundedChannel<T>: Has a strict capacity limit. Supports BoundedChannelFullMode (Wait, DropOldest, DropNewest, DropWrite).
2. Lock-Free Implementation:
   Under the hood, Channel<T> avoids heavyweight kernel synchronization handles. It uses lock-free circular ring buffers and Interlocked CAS (Compare-And-Swap) operations.
3. Optimizations:
   - SingleReader = true: Enables specialized non-atomic reader pointers, eliminating atomic contention.
   - SingleWriter = true: Optimizes write pointer advancements for single-publisher streams.
4. Completion: Calling 'channel.Writer.Complete()' gracefully signals to the consumer that no more items will be published, causing 'await foreach (var item in channel.Reader.ReadAllAsync())' to exit cleanly without cancellation tokens.`,
    codeSnippet: `public class EventIngestionPipeline
{
    private readonly Channel<TelemetryEvent> _channel;

    public EventIngestionPipeline()
    {
        // Bounded channel to enforce backpressure at 10,000 items
        var options = new BoundedChannelOptions(10_000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleWriter = false,
            SingleReader = true
        };
        _channel = Channel.CreateBounded<TelemetryEvent>(options);
    }

    // High-frequency producer method
    public async ValueTask PublishAsync(TelemetryEvent evt, CancellationToken ct)
    {
        // Asynchronously pauses caller if buffer is full
        await _channel.Writer.WriteAsync(evt, ct);
    }

    // Background consumer loop
    public async Task StartConsumingAsync(CancellationToken ct)
    {
        // Streams items cleanly as they arrive without busy polling
        await foreach (var evt in _channel.Reader.ReadAllAsync(ct))
        {
            await ProcessTelemetryAsync(evt, ct);
        }
    }

    private async Task ProcessTelemetryAsync(TelemetryEvent evt, CancellationToken ct)
    {
        // Batch flush or external network call
        await Task.Yield();
    }
}`,
    redFlags: [
      "Using unbounded channels in production without evaluating memory exhaustion risks.",
      "Using Thread.Sleep or Task.Delay in a polling loop to inspect a ConcurrentQueue instead of Channel<T>."
    ],
    proTips: [
      "In ASP.NET Core background services, always wire the stoppingToken into channel.Reader.ReadAllAsync(stoppingToken).",
      "Channels integrate seamlessly with ASP.NET Core WebSockets and gRPC Server Streaming by piping ChannelReader directly into the response stream."
    ]
  },
  {
    id: "q-csharp-8",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["ThreadPool", "Sync-over-Async", "Deadlock", "Starvation"],
    title: "ThreadPool Starvation and the Sync-over-Async Anti-Pattern",
    pitch: "Sync-over-Async is the dangerous anti-pattern of synchronously blocking on an asynchronous Task using .Result, .Wait(), or .GetAwaiter().GetResult(). In environments with a SynchronizationContext (WPF, Blazor, legacy ASP.NET), this causes permanent deadlocks. In ASP.NET Core, it causes ThreadPool Starvation: worker threads block waiting for asynchronous I/O completion, forcing the ThreadPool to slowly inject replacement threads at only 1–2 per second, causing cascading 504 Gateway Timeouts.",
    deepDive: `Mechanisms of ThreadPool Starvation:
1. In ASP.NET Core, an incoming request is assigned a ThreadPool worker thread (Thread A).
2. Thread A calls 'var data = GetDataAsync().Result;'.
3. Thread A is now in a blocked kernel wait state, unable to perform any other work.
4. GetDataAsync initiates an asynchronous I/O operation (e.g. database query).
5. When the database query finishes, the I/O completion port schedules the continuation task to the ThreadPool.
6. If 1,000 concurrent requests all block on .Result, all 1,000 ThreadPool threads are blocked. There are zero available threads to execute the continuations that would unblock them!
7. The CLR ThreadPool has a built-in hill-climbing heuristic that injects new threads at a slow rate (approx 1 thread every 500ms). The entire server becomes completely unresponsive while CPU utilization sits near 0%.`,
    codeSnippet: `// ❌ THE ANTI-PATTERN: Sync-Over-Async
[HttpGet("bad/{id}")]
public IActionResult GetBad(int id)
{
    // BLOCKS worker thread. Starves ThreadPool under load!
    var user = _userService.GetUserAsync(id).Result;
    return Ok(user);
}

//  THE SENIOR SOLUTION: Pure Async/Await all the way down
[HttpGet("good/{id}")]
public async Task<IActionResult> GetGood(int id, CancellationToken ct)
{
    // Worker thread is returned to ThreadPool while I/O completes
    var user = await _userService.GetUserAsync(id, ct);
    return Ok(user);
}`,
    redFlags: [
      "Claiming '.GetAwaiter().GetResult() is completely safe because it avoids AggregateException' (it avoids AggregateException unwrapping, but STILL causes ThreadPool starvation).",
      "Using Task.Run(() => LongRunningSync()).Result to bypass async."
    ],
    proTips: [
      "Use Microsoft's 'dotnet-dump' and 'dotnet-counters' CLI tools in production. Watch 'ThreadPool Thread Count' spiking alongside high HTTP request queues.",
      "Install the Roslyn analyzer 'Microsoft.VisualStudio.Threading.Analyzers' (VSTHRD) to flag sync-over-async at build time with error VSTHRD002."
    ]
  },
  {
    id: "q-csharp-9",
    pillar: "csharp",
    seniority: "Mid",
    tags: ["Struct", "Class", "Memory Layout", "Boxing"],
    title: "Struct vs Class: Memory Layout, Boxing Overheads, and in/ref Modifiers",
    pitch: "Classes are reference types allocated on the managed heap with an 8-byte object header and 8-byte method table pointer (16 bytes minimum overhead on 64-bit). Structs are value types stored inline wherever declared (stack or inside an enclosing type) with zero object overhead. However, passing structs by value copies all bytes. For large structs (> 16-24 bytes), copying becomes expensive, and casting structs to interfaces causes boxing heap allocations.",
    deepDive: `Memory Layout Details (64-bit CLR):
- Class overhead: Object Header (Sync Block Index, 8 bytes) + Method Table Pointer (TypeHandle, 8 bytes) + Fields + Padding. Even an empty class instance consumes 24 bytes on the heap.
- Struct: Contains only its fields, aligned to memory boundaries. No object header, no sync block.
- Boxing: Casting a struct to 'object' or an interface copies the struct's bytes into a newly allocated heap object, generating GC Gen 0 churn.

Modern C# Value Type Optimizations:
1. 'readonly struct': Informs Roslyn that the struct is immutable, preventing defensive copies when accessing fields.
2. 'in' parameter modifier: Passes a struct by readonly reference (ref) without copying its fields, while guaranteeing the method cannot mutate it.
3. 'ref struct': Restricts allocation strictly to the stack (e.g. Span<T>).`,
    codeSnippet: `// High-performance immutable 3D Vector value type
public readonly struct Vector3D : IEquatable<Vector3D>
{
    public readonly double X;
    public readonly double Y;
    public readonly double Z;

    public Vector3D(double x, double y, double z) => (X, Y, Z) = (x, y, z);

    // Passes by reference ('in') to avoid copying 24 bytes on every call
    public static double DotProduct(in Vector3D a, in Vector3D b)
    {
        return (a.X * b.X) + (a.Y * b.Y) + (a.Z * b.Z);
    }

    // Direct value equality without interface boxing
    public bool Equals(Vector3D other) => X == other.X && Y == other.Y && Z == other.Z;
    public override bool Equals(object? obj) => obj is Vector3D other && Equals(other);
    public override int GetHashCode() => HashCode.Combine(X, Y, Z);
}`,
    redFlags: [
      "Declaring mutable structs (public fields with setters; can cause silent mutation bugs when copied).",
      "Using structs for large data structures (> 32 bytes) without 'in' / 'ref' modifiers.",
      "Casting structs to interfaces in tight loops, causing hidden boxing."
    ],
    proTips: [
      "Follow Microsoft's Framework Design Guideline: Use a struct only if instance size is <= 16 bytes, it is immutable, logically represents a single value, and won't be boxed frequently."
    ]
  },
  {
    id: "q-csharp-10",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["String", "String Interning", "Memory", "Span"],
    title: "String Immutability, String Interning, and string.Create() Zero-Allocation",
    pitch: "Strings in C# are immutable reference types with a fixed size determined at construction. Because they are immutable, concatenations in loops create intermediate heap garbage. The CLR maintains an internal 'Intern Pool' of unique string literals to save memory. In modern .NET, string.Create() provides an ultra-low allocation API allowing you to write directly into the uninitialized string memory buffer via a Span<char> before the string is finalized.",
    deepDive: `String Memory Layout:
A System.String contains:
1. Object Header (8 bytes)
2. Method Table Pointer (8 bytes)
3. Length integer (4 bytes)
4. Char array data (2 bytes per UTF-16 char) + Null terminator (2 bytes).

String Interning:
- At assembly load time, the CLR interns literal strings into a hash table.
- string.Intern(str) looks up or adds a string to the pool. However, manual interning has a permanent memory leak risk because interned strings are never collected by the GC!

Zero-Allocation Generation with string.Create():
Normally, formatting a string like 'ORDER-1234-US' requires string.Format, allocating intermediate strings. string.Create(length, state, (span, state) => ...) allocates the exact final string once on the heap and lets you write chars directly into its memory span.`,
    codeSnippet: `public static class OrderFormatter
{
    // Zero-allocation custom string builder
    public static string FormatOrderNumber(int orderId, string regionCode)
    {
        // Target format: "ORD-{orderId:D6}-{regionCode}" -> e.g. "ORD-001234-US" (14 chars)
        int length = 4 + 6 + 1 + regionCode.Length;

        return string.Create(length, (orderId, regionCode), (span, state) =>
        {
            "ORD-".AsSpan().CopyTo(span);
            // Format integer directly into span characters without allocating a string!
            state.orderId.TryFormat(span.Slice(4, 6), out _, "D6");
            span[10] = '-';
            state.regionCode.AsSpan().CopyTo(span.Slice(11));
        });
    }
}`,
    redFlags: [
      "Using string += in a loop instead of StringBuilder or string.Create.",
      "Calling string.Intern() on millions of user-supplied dynamic strings (causes permanent uncollectible memory leak)."
    ],
    proTips: [
      "Use string.Equals(a, b, StringComparison.Ordinal) or OrdinalIgnoreCase instead of == for culture-agnostic high-performance comparisons."
    ]
  },

  // ==========================================================================
  // PILLAR 2: ASP.NET CORE & WEB APIS
  // ==========================================================================
  {
    id: "q-aspnet-1",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Middleware", "Pipeline", "Short-Circuiting", "Architecture"],
    title: "ASP.NET Core Middleware Pipeline: Execution Order, Branching, and Short-Circuiting",
    pitch: "The ASP.NET Core middleware pipeline is an in-memory Russian-doll chain of RequestDelegate components. Each middleware receives the HttpContext and a next delegate. It can execute logic before invoking next(), await next() to pass control downstream, execute logic after next() returns, or short-circuit by returning without calling next(). Pipeline order is deterministic: Exception handling must be at the very top, followed by Security/HSTS, Routing, CORS, Authentication, Authorization, Rate Limiting, and Endpoints.",
    deepDive: `Pipeline Execution Mechanics:
1. RequestDelegate: Defined as 'delegate Task RequestDelegate(HttpContext context);'.
2. Composition: During application startup, 'IApplicationBuilder.Build()' compiles the chain into a single composite RequestDelegate via nested closures.
3. Branching:
   - app.Map("/api", branch => ...): Creates a isolated branch based on URL prefix match.
   - app.MapWhen(ctx => ctx.Request.Headers.ContainsKey("X-Custom"), branch => ...): Predicate-based branching.
   - app.UseWhen(...): Branches and re-joins the main pipeline.
4. Short-Circuiting:
   If Authentication fails or RateLimitingMiddleware rejects a request with HTTP 429, it omits calling next(context). The request immediately reverses back through the 'after' blocks of preceding middlewares.`,
    codeSnippet: `// Custom Performance and RFC 7807 Error Handling Middleware
public class PerformanceMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;

    public PerformanceMonitoringMiddleware(RequestDelegate next, ILogger<PerformanceMonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            // Pass execution downstream
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;
            if (elapsedMs > 500)
            {
                _logger.LogWarning("Slow request detected: {Method} {Path} took {Elapsed}ms",
                    context.Request.Method, context.Request.Path, elapsedMs);
            }
        }
    }
}`,
    redFlags: [
      "Placing ExceptionHandlerMiddleware after Authentication/Routing (exceptions thrown in auth will not be caught!).",
      "Mutating response headers AFTER calling await next(context) when the response body has already started streaming (throws InvalidOperationException: Headers are read-only)."
    ],
    proTips: [
      "Always check 'context.Response.HasStarted' before attempting to write custom error headers or redirect if next() throws."
    ]
  },
  {
    id: "q-aspnet-2",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Dependency Injection", "Captive Dependency", "Lifetimes", "ValidateScopes"],
    title: "DI Service Lifetimes and Captive Dependency Prevention",
    pitch: "ASP.NET Core DI provides three lifetimes: Transient (new instance every resolution), Scoped (one instance per HTTP request/scope), and Singleton (one instance for application lifetime). A Captive Dependency is an architectural bug where a longer-lived service consumes a shorter-lived service (e.g. Singleton injecting Scoped DbContext). This causes the Scoped service to be held hostage as a Singleton, leading to multi-threaded data corruption and memory leaks. In background services, IServiceScopeFactory must be used to create explicit scopes.",
    deepDive: `Why Captive Dependencies Are Catastrophic:
Consider a Singleton BackgroundService injecting a Scoped 'AppDbContext'.
1. Thread-Safety: DbContext is NOT thread-safe. Concurrent executions on background tasks or web threads accessing the same instance throw 'InvalidOperationException: A second operation was started on this context instance before a previous operation completed'.
2. Memory Leak: EF Core's Change Tracker retains snapshots of all queried entities. A captive DbContext never gets disposed, indefinitely hoarding tracked entities in memory until OutOfMemoryException.

Detection and Mitigation:
- Program.cs: Enable 'builder.Host.UseDefaultServiceProvider(options => { options.ValidateScopes = true; options.ValidateOnBuild = true; });'. In .NET, this is on by default in Development but OFF in Production for performance.
- Background Jobs: Inject 'IServiceScopeFactory', call 'using var scope = _scopeFactory.CreateScope();', and resolve Scoped dependencies inside the scope.`,
    codeSnippet: `// Proper pattern for consuming Scoped services in Singleton BackgroundService
public class OrderProcessingWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderProcessingWorker> _logger;

    public OrderProcessingWorker(IServiceScopeFactory scopeFactory, ILogger<OrderProcessingWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Explicitly create a clean scope per processing batch
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var pendingOrders = await dbContext.Orders
                    .Where(o => o.Status == OrderStatus.Pending)
                    .Take(50)
                    .ToListAsync(stoppingToken);

                // Process orders cleanly...
                await dbContext.SaveChangesAsync(stoppingToken);
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }
}`,
    redFlags: [
      "Injecting DbContext directly into a Singleton service constructor.",
      "Resolving scoped services from the root IServiceProvider in program startup or background workers."
    ],
    proTips: [
      "Keep 'ValidateScopes = true' and 'ValidateOnBuild = true' enabled in CI pipeline unit tests so captive dependencies are caught before deployment."
    ]
  },
  {
    id: "q-aspnet-3",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["IHttpClientFactory", "Socket Exhaustion", "DNS", "Resilience"],
    title: "IHttpClientFactory: Socket Exhaustion, Stale DNS, and SocketsHttpHandler",
    pitch: "Instantiating 'new HttpClient()' for every request causes TIME_WAIT socket exhaustion because disposed sockets remain in the TCP TIME_WAIT state for minutes. Conversely, making HttpClient a static singleton causes Stale DNS bugs: the client holds the TCP socket open indefinitely, ignoring DNS updates when downstream cloud services failover. IHttpClientFactory solves both: it pools and rotates the underlying HttpMessageHandler every 2 minutes while handing out transient HttpClient wrappers.",
    deepDive: `Deep Dive Mechanics:
1. TCP Socket Exhaustion:
   - When HttpClient is disposed, the underlying TCP connection undergoes a 4-way handshake and enters TIME_WAIT (RFC 793, typically 120-240 seconds).
   - Under heavy load, all ~65,000 ephemeral outbound ports are consumed, throwing 'System.Net.Sockets.SocketException: Only one usage of each socket address is normally permitted'.
2. Stale DNS:
   - A single static HttpClient keeps its TCP socket open forever. If an external API rotates its IP address (e.g. AWS/Azure failover), the static client continues sending traffic to the defunct IP.
3. IHttpClientFactory Architecture:
   - Separates the HttpClient facade from the underlying HttpMessageHandler.
   - HttpMessageHandler instances are pooled for a configurable lifetime (default: 2 minutes).
   - Once expired, an active handler is marked for deactivation; it completes in-flight requests and is disposed, forcing a fresh DNS resolution on the next connection.
4. .NET Core 2.1+ SocketsHttpHandler:
   - Alternatively, you can configure SocketsHttpHandler.PooledConnectionLifetime = TimeSpan.FromMinutes(2) on a singleton HttpClient.`,
    codeSnippet: `// Program.cs: Registering Typed HttpClient with Polly v8 Resilience Pipeline
builder.Services.AddHttpClient<IPaymentApiClient, PaymentApiClient>((sp, client) =>
{
    client.BaseAddress = new Uri("https://api.paymentprovider.com/v1/");
    client.Timeout = TimeSpan.FromSeconds(5);
})
.SetHandlerLifetime(TimeSpan.FromMinutes(5)) // Rotates handlers to refresh DNS
.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    PooledConnectionLifetime = TimeSpan.FromMinutes(2),
    EnableMultipleHttp2Connections = true
});`,
    redFlags: [
      "Using 'using var client = new HttpClient()' inside controller actions.",
      "Not knowing about the DNS caching issue with static HttpClient."
    ],
    proTips: [
      "Always favor Typed Clients (services.AddHttpClient<IClient, Client>()) over Named Clients to avoid stringly-typed client keys and improve unit testability."
    ]
  },
  {
    id: "q-aspnet-4",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["JWT", "Authentication", "Refresh Tokens", "Security"],
    title: "Production JWT Authentication and Refresh Token Rotation with Reuse Detection",
    pitch: "Stateless JWT access tokens are signed, self-contained credentials that cannot be revoked without maintaining a distributed revocation blacklist. To maintain security, access tokens must be short-lived (e.g., 10-15 minutes). Refresh Token Rotation with Reuse Detection is required: every token exchange revokes the old refresh token and issues a new one. If an already-used refresh token is presented, the system detects a breach and instantly revokes the entire refresh token family.",
    deepDive: `Enterprise JWT Architecture:
1. Token Separation:
   - Access Token: Short-lived (15 mins), passed in 'Authorization: Bearer <token>' header. Signed with RS256 (asymmetric private key on Identity Server, public key on APIs).
   - Refresh Token: Long-lived (7-30 days), stored in an HttpOnly, Secure, SameSite=Strict cookie to prevent XSS theft.
2. Token Family & Reuse Detection:
   - Each login generates a 'TokenFamilyId'.
   - When a client calls /refresh, the server marks the used refresh token as revoked and issues a new pair with the same FamilyId.
   - If an attacker intercepts a refresh token and uses it AFTER the legitimate client already rotated it, the server sees: 'Attempted use of REVOKED token'.
   - Action: Server revokes ALL tokens sharing that FamilyId, invalidating the attacker and forcing the real user to re-authenticate.`,
    codeSnippet: `public async Task<TokenResponseDto> RefreshTokenAsync(string tokenString, CancellationToken ct)
{
    var existingToken = await _db.RefreshTokens
        .FirstOrDefaultAsync(t => t.Token == tokenString, ct);

    if (existingToken == null) throw new SecurityTokenException("Invalid token");

    // CRITICAL: Reuse Detection!
    if (existingToken.IsRevoked)
    {
        // Compromise detected: Revoke entire token family!
        await RevokeTokenFamilyAsync(existingToken.FamilyId, ct);
        throw new SecurityTokenException("Token reuse detected. All sessions terminated.");
    }

    // Revoke current token
    existingToken.IsRevoked = true;
    existingToken.ReplacedByToken = GenerateSecureRandomToken();

    // Create new refresh token in same family
    var newRefreshToken = new RefreshToken
    {
        Token = existingToken.ReplacedByToken,
        FamilyId = existingToken.FamilyId,
        UserId = existingToken.UserId,
        ExpiresAt = DateTime.UtcNow.AddDays(7)
    };

    _db.RefreshTokens.Add(newRefreshToken);
    await _db.SaveChangesAsync(ct);

    var newJwt = GenerateJwtAccessToken(existingToken.UserId);
    return new TokenResponseDto(newJwt, newRefreshToken.Token);
}`,
    redFlags: [
      "Issuing 30-day JWT access tokens without any refresh mechanism.",
      "Storing refresh tokens in localStorage where they are vulnerable to XSS script injection.",
      "Using symmetric HS256 across multiple microservices (forces sharing the secret key)."
    ],
    proTips: [
      "Use RS256 or ES256 (Asymmetric keys): Only the Auth service holds the private key; resource APIs only cache the public key via JWKS (JSON Web Key Sets)."
    ]
  },
  {
    id: "q-aspnet-5",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Clean Architecture", "CQRS", "MediatR", "DDD"],
    title: "Clean Architecture and CQRS with MediatR: Separation of Concerns and Pipeline Behaviors",
    pitch: "Clean Architecture enforces strict inward dependency flow: Domain Entities depend on nothing; Application layer contains use cases (CQRS Commands and Queries); Infrastructure implements persistence, third-party APIs, and messaging; and Presentation (APIs) is a thin entry point. MediatR decouples controllers from business logic, while MediatR Pipeline Behaviors act as in-memory AOP middleware to handle cross-cutting concerns like validation, logging, and database transactions.",
    deepDive: `Layer Responsibilities:
1. Domain: Entities, Value Objects, Domain Events, Domain Exceptions. Pure C#, zero external dependencies.
2. Application: Commands (CreateOrderCommand), Queries (GetOrderByIdQuery), Handlers, DTOs, and Ports (Interfaces like IOrderRepository, IEmailService).
3. Infrastructure: Adapters implementing ports: EF Core DbContext, Dapper, SendGrid, MassTransit.
4. Presentation: Minimal APIs / Controllers. Only validates HTTP status codes and serializes DTOs.

MediatR IPipelineBehavior<TRequest, TResponse>:
Executes around every command/query handler. Common pipeline order:
1. LoggingBehavior (logs payload and execution time)
2. ValidationBehavior (executes FluentValidation rules; throws ValidationException before handler is reached)
3. TransactionBehavior (wraps Command execution in an EF Core IDbContextTransaction).`,
    codeSnippet: `// MediatR Validation Pipeline Behavior
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request, 
        RequestHandlerDelegate<TResponse> next, 
        CancellationToken ct)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, ct)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
        {
            throw new ValidationException(failures);
        }

        return await next();
    }
}`,
    redFlags: [
      "Letting Infrastructure or EF Core dependencies leak into the Domain layer.",
      "Returning EF Core IQueryable from Application service handlers out to Controllers.",
      "Bloating controllers with database queries, business rules, and validation logic."
    ],
    proTips: [
      "Commands (which modify state) should return Result<TId> or Result<Unit>; Queries (which read state) should return read-only DTOs, never domain entities."
    ]
  },
  {
    id: "q-aspnet-6",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Rate Limiting", ".NET 8", "API Security", "DDoS"],
    title: "ASP.NET Core Built-in Rate Limiting: Algorithms, Partitioning, and HTTP 429",
    pitch: ".NET 7 and 8 introduced a native, highly-optimized rate limiting middleware (System.Threading.RateLimiting) built into the framework. It offers four core algorithms: Fixed Window, Sliding Window, Token Bucket, and Concurrency Limiter. Rate limits can be applied globally, per-endpoint via attributes or extension methods, and partitioned per client IP or authenticated User ID, returning HTTP 429 Too Many Requests with a Retry-After header.",
    deepDive: `The 4 Algorithms Compared:
1. Fixed Window: Divides time into fixed intervals (e.g. 100 requests per minute). Vulnerable to traffic spikes at boundary edges (e.g. 100 requests at 0:59 and 100 requests at 1:01).
2. Sliding Window: Divides the window into segments, smoothing out boundary bursts.
3. Token Bucket: Tokens are added at a continuous rate up to a capacity. Allows controlled bursts when tokens are available, then throttles to refill rate.
4. Concurrency Limiter: Simply caps the maximum number of active concurrent in-flight requests (e.g. max 20 simultaneous requests).

Partitioning Strategy:
Never apply a single global fixed rate limit for all users, or an attacker will trigger a Denial-of-Service for legitimate users! Use PartitionedRateLimiter to partition keys by HttpContext.User.Identity.Name (if authenticated) or remote IP address.`,
    codeSnippet: `// Program.cs: TokenBucket Partitioned Rate Limiting in ASP.NET Core 8
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "30";
        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too Many Requests",
            Detail = "Rate limit exceeded. Please retry after 30 seconds."
        }, cancellationToken: token);
    };

    options.AddPolicy("AuthenticatedUserPolicy", httpContext =>
    {
        var partitionKey = httpContext.User.Identity?.IsAuthenticated == true
            ? httpContext.User.Identity.Name!
            : httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetTokenBucketLimiter(partitionKey, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = 50,
            TokensPerPeriod = 10,
            ReplenishmentPeriod = TimeSpan.FromSeconds(10),
            QueueLimit = 0
        });
    });
});`,
    redFlags: [
      "Using an unpartitioned global rate limiter (lets one malicious user block the entire platform).",
      "Setting QueueLimit too high, causing memory buildup and delayed timeouts instead of failing fast."
    ],
    proTips: [
      "In multi-instance cloud deployments (e.g. AKS or App Service cluster), local in-memory rate limiting applies per-instance; use Redis-backed rate limiting or Azure API Management (APIM) for global cluster-wide enforcement."
    ]
  },
  {
    id: "q-aspnet-7",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Output Caching", "Redis", "Cache Stampede", "Tag Eviction"],
    title: "Output Caching in .NET 8: Redis Backplane, Tag-Based Eviction, and Cache Stampede Mitigation",
    pitch: "ASP.NET Core Output Caching (.NET 7/8+) is a full server-side HTTP caching engine that replaces legacy Response Caching. It supports Redis distributed storage, resource locking to eliminate Cache Stampedes (Thundering Herd problem), and most importantly: Tag-based cache eviction. When an entity is updated via a POST/PUT command, calling IOutputCacheStore.EvictByTagAsync('products', ct) instantly purges all cached queries tagged with that entity without clearing the whole cache.",
    deepDive: `Key Capabilities of Output Caching:
1. Response Caching vs Output Caching:
   - Response Caching is HTTP-header based, relies on client cache-control, and cannot be programmatically invalidated from the server.
   - Output Caching lives entirely on the server/Redis, can cache regardless of client headers, and supports programmatic eviction.
2. Cache Stampede (Thundering Herd) Mitigation:
   - When an expensive cached item expires, hundreds of concurrent incoming requests would normally all hit the database simultaneously.
   - Output Caching implements Resource Locking: the first request locks the key and generates the response; all other concurrent requests await that single generation and receive the cached result.
3. Tag Eviction:
   - You can assign multiple tags to cached responses: 'policy.Tag(\"category-electronics\").Tag(\"brand-sony\")'.
   - When an admin updates a Sony camera, evicting the tag 'brand-sony' purges all related search and detail pages in Redis in one asynchronous call.`,
    codeSnippet: `// Program.cs: Output Caching with Redis and Tag Eviction
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Cache());
    options.AddPolicy("ProductsCache", builder => 
        builder.Expire(TimeSpan.FromHours(1))
               .SetVaryByQuery("page", "pageSize", "categoryId")
               .Tag("products"));
});

// Minimal API Endpoint with Tagged Cache
app.MapGet("/api/products", async (IProductService svc, [AsParameters] ProductQuery query) =>
    TypedResults.Ok(await svc.GetProductsAsync(query)))
   .CacheOutput("ProductsCache");

// Mutation Endpoint that triggers instant tag eviction
app.MapPost("/api/products", async (CreateProductDto dto, IProductService svc, IOutputCacheStore cache, CancellationToken ct) =>
{
    var created = await svc.CreateAsync(dto, ct);
    // Purges ALL cached product listings immediately!
    await cache.EvictByTagAsync("products", ct);
    return TypedResults.Created($"/api/products/{created.Id}", created);
});`,
    redFlags: [
      "Relying on legacy ResponseCachingMiddleware for server-side API invalidation.",
      "Clearing the entire Redis cache (FLUSHDB) when updating a single record instead of using tag-based eviction."
    ],
    proTips: [
      "Use 'SetVaryByHeader(\"Accept-Encoding\")' to ensure compressed gzip/brotli payloads are cached and served directly without re-compression."
    ]
  },
  {
    id: "q-aspnet-8",
    pillar: "aspnet",
    seniority: "Mid",
    tags: ["Minimal APIs", "Routing", "Performance", "Source Generators"],
    title: "Minimal APIs vs Controller-based APIs: Performance, Architecture, and Endpoint Filters",
    pitch: "Minimal APIs in ASP.NET Core bypass the heavy MVC action invoker, controller activator reflection, and model binding filters, compiling directly into native route handlers using Roslyn source generators. They offer ~30% higher throughput, lower memory footprint, and faster cold-start times, making them ideal for microservices and serverless. Endpoint Filters (IEndpointFilter) provide clean, composable cross-cutting interception without MVC filter overhead.",
    deepDive: `Architectural Differences:
- Controller Architecture: Uses Microsoft.AspNetCore.Mvc.Core. Every request traverses action discovery, controller factory reflection, action constraints, model binding dictionaries, and action filter pipelines.
- Minimal APIs Architecture: Directly integrates with ASP.NET Core Endpoint Routing. Request parameters are mapped using compile-time generated delegates via 'RequestDelegateFactory'.
- Structuring Minimal APIs at Scale: Use Route Groups (app.MapGroup(\"/api/v1/orders\")) combined with extension methods or Carter modules to avoid dumping thousands of lines of endpoints into Program.cs.`,
    codeSnippet: `// Endpoint Filter for Route Group Validation
public static class ValidationEndpointFilter
{
    public static RouteGroupBuilder MapOrderEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/", CreateOrderAsync)
             .AddEndpointFilter(async (invocationContext, next) =>
             {
                 var dto = invocationContext.GetArgument<CreateOrderDto>(0);
                 if (dto.Amount <= 0)
                 {
                     return Results.Problem("Order amount must be positive.", statusCode: 400);
                 }
                 return await next(invocationContext);
             });

        return group;
    }

    private static async Task<IResult> CreateOrderAsync(CreateOrderDto dto, IOrderService svc)
    {
        var id = await svc.CreateOrderAsync(dto);
        return TypedResults.Created($"/api/orders/{id}", new { Id = id });
    }
}`,
    redFlags: [
      "Stuffing 2,000 lines of endpoints directly in Program.cs without using Route Groups or extension methods.",
      "Assuming Minimal APIs cannot do dependency injection or validation (they support both via IEndpointFilter and FluentValidation)."
    ],
    proTips: [
      "Use 'TypedResults' instead of 'Results' in Minimal APIs: TypedResults provides compile-time OpenAPI type annotations for Swagger without needing [ProducesResponseType] attributes."
    ]
  },
  {
    id: "q-aspnet-9",
    pillar: "aspnet",
    seniority: "Mid",
    tags: ["ProblemDetails", "RFC 7807", "Exception Handling", "API Standards"],
    title: "RFC 7807 ProblemDetails and Global Exception Handling in ASP.NET Core 8",
    pitch: "RFC 7807 is the IETF standard specifying a machine-readable JSON format for HTTP API error responses. ASP.NET Core 8 provides native IExceptionHandler and AddProblemDetails() to standardize error payloads globally. Instead of returning raw stack traces or ad-hoc error shapes, every 4xx and 5xx error returns structured attributes: type, title, status, detail, instance, and traceId for distributed tracing correlation.",
    deepDive: `Core Mechanics in ASP.NET Core 8:
1. AddProblemDetails(): Injects standard ProblemDetails factories into all built-in status code responses (e.g. 404, 400, 401).
2. IExceptionHandler: Replaces older custom middleware. Handlers implement 'ValueTask<bool> TryHandleAsync(HttpContext, Exception, CancellationToken)'. Multiple handlers can be chained in order of specificity (e.g. ValidationExceptionHandler -> DatabaseExceptionHandler -> GlobalExceptionHandler).
3. Security: Never expose raw Exception.Message or StackTrace in production ProblemDetails. Map domain exceptions to safe, localized error codes while logging the full exception internally with the TraceId.`,
    codeSnippet: `// ASP.NET Core 8 Custom IExceptionHandler
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, 
        Exception exception, 
        CancellationToken ct)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", traceId);

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred",
            Detail = "Please contact support with the trace identifier.",
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = traceId }
        };

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(problem, ct);
        return true; // Mark as handled
    }
}`,
    redFlags: [
      "Returning HTTP 200 OK with '{ success: false, error: \"...\" }' payload (violates REST standards).",
      "Leaking raw SQL syntax or database connection strings in API error responses."
    ],
    proTips: [
      "Include custom extensions in ProblemDetails like 'errorCode' and 'invalidParams' to allow frontend UI clients to map field validation errors automatically."
    ]
  },
  {
    id: "q-aspnet-10",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["Polly", "Resilience", "Circuit Breaker", "Retry"],
    title: "Enterprise Resilience with Polly v8 and Microsoft.Extensions.Resilience",
    pitch: "In distributed microservices, transient network glitches, socket resets, and downstream service slowdowns are inevitable. Polly v8 completely reimagined .NET resilience with zero allocations, high performance, and integration via Microsoft.Extensions.Resilience. Core resilience strategies include: Retry with Exponential Backoff and Jitter (to prevent synchronized retry storms), Timeout, and Circuit Breaker (to fail fast when a downstream dependency is in an outage).",
    deepDive: `Key Resilience Strategies:
1. Retry with Jitter: Retrying immediately slams a recovering downstream server. Adding random 'jitter' to exponential backoff (e.g. 2s +/- 300ms) desynchronizes competing clients.
2. Circuit Breaker:
   - Closed: Normal operations.
   - Open: When failure rate exceeds threshold (e.g. > 50% failures over 30s), circuit trips OPEN. All calls fail instantly without network roundtrips.
   - Half-Open: After a break duration (e.g. 60s), a canary request tests downstream health. If successful, circuit closes; if it fails, it trips open again.
3. Hedging: For read-only idempotent queries, Polly can launch a concurrent secondary request if the primary has not responded within p95 latency, taking whichever finishes first.`,
    codeSnippet: `// Program.cs: Polly v8 Standard Resilience Pipeline
builder.Services.AddHttpClient<IExternalWeatherClient, WeatherClient>()
    .AddStandardResilienceHandler(options =>
    {
        // 1. Retry strategy with exponential backoff & jitter
        options.Retry.MaxRetryAttempts = 3;
        options.Retry.BackoffType = DelayBackoffType.Exponential;
        options.Retry.UseJitter = true;
        
        // 2. Circuit Breaker
        options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
        options.CircuitBreaker.FailureRatio = 0.5; // Trip if 50% of requests fail
        options.CircuitBreaker.MinimumThroughput = 20;
        options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(30);

        // 3. Attempt Timeout
        options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);
    });`,
    redFlags: [
      "Configuring retries on non-idempotent HTTP POST endpoints (can duplicate credit card charges!).",
      "Using immediate retries without backoff or jitter (exacerbates service outages)."
    ],
    proTips: [
      "Always combine Polly with distributed tracing: Polly v8 emits OpenTelemetry telemetry events on retries and circuit state transitions automatically."
    ]
  },

  // ==========================================================================
  // PILLAR 3: SQL SERVER & EF CORE
  // ==========================================================================
  {
    id: "q-sql-1",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Index", "B-Tree", "Clustered", "Non-Clustered"],
    title: "Clustered vs Non-Clustered Indexes: Physical Storage and Bookmark Lookups",
    pitch: "In SQL Server, a Clustered Index dictates the physical sorting order of rows on disk; its B-Tree leaf nodes ARE the actual data pages of the table. A table can have only one clustered index. A Non-Clustered Index is a separate B-Tree structure where leaf nodes contain only the indexed keys and a row locator pointer (the clustered index key or heap RID). When a non-clustered index satisfies the WHERE clause but lacks columns needed by the SELECT clause, SQL Server performs an expensive Bookmark Lookup (Key Lookup) to fetch the missing columns.",
    deepDive: `Physical B-Tree Mechanics:
1. Clustered Index:
   - Root Node -> Intermediate Nodes -> Leaf Nodes (Contains all data columns for all rows).
   - If a table has no clustered index, it is stored as an unordered Heap.
2. Non-Clustered Index:
   - Leaf nodes contain: Index Key Columns + Clustering Key (as the row locator).
3. The Key Lookup Cost:
   - When executing: SELECT CustomerId, OrderTotal FROM Orders WHERE OrderDate = '2024-05-01'
   - If index is on (OrderDate), SQL Server seeks the B-Tree to find matching rows.
   - For every matching row, it must execute a nested loop Key Lookup against the clustered index to read CustomerId and OrderTotal.
   - If matching rows exceed ~1-5% of total table rows (the 'tipping point'), the query optimizer abandons the index completely and performs a full Clustered Index Scan!`,
    codeSnippet: `-- Create Clustered Index on narrow, monotonically increasing identity
CREATE CLUSTERED INDEX CIX_Orders_OrderId ON Orders (OrderId);

-- Non-Clustered Index with Key Lookup vulnerability:
CREATE NONCLUSTERED INDEX IX_Orders_OrderDate ON Orders (OrderDate);

-- Query suffering from Key Lookup:
SELECT OrderId, CustomerId, OrderTotal 
FROM Orders 
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2024-02-01';`,
    redFlags: [
      "Choosing a wide, random GUID (uniqueidentifier) as a Clustered Index key (causes massive page splits, 50% page density, and huge non-clustered index sizes).",
      "Thinking non-clustered indexes contain all columns of the table."
    ],
    proTips: [
      "If you must use GUIDs for primary keys, use Sequential GUIDs (NEWSEQUENTIALID() in SQL or RT.Comb in C#) to ensure monotonic insertion and prevent B-Tree page splits."
    ]
  },
  {
    id: "q-sql-2",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Covering Index", "INCLUDE", "Key Lookup", "Optimization"],
    title: "Covering Indexes and the INCLUDE Clause: Eliminating Key Lookups",
    pitch: "A Covering Index contains all columns referenced by a query (in SELECT, WHERE, JOIN, and ORDER BY), satisfying the query entirely from index leaf nodes without touching the base table. The 'INCLUDE' clause allows non-key columns to be stored exclusively at the leaf level rather than intermediate B-Tree levels. This drastically reduces index size, avoids intermediate node bloat, bypasses the 1,700-byte index key limit, and completely eliminates Key Lookups.",
    deepDive: `Why use INCLUDE instead of adding columns to the index key?
1. B-Tree Size & Memory:
   - Key columns are stored in intermediate branch nodes of the B-Tree. Wider keys mean fewer keys fit per 8KB page, increasing tree depth and cache pressure.
   - Included columns are ONLY stored at the leaf level. Intermediate nodes remain lean and fit in buffer pool memory.
2. Limits:
   - SQL Server restricts composite index keys to a maximum of 32 columns and 1,700 bytes.
   - INCLUDED columns do not count towards the 1,700-byte key limit and can include types like VARCHAR(MAX).
3. Query Execution Plan Impact:
   - Plan changes from 'Index Seek + Nested Loops Key Lookup' to a clean, single 'Index Seek'.
   - I/O cost drops by orders of magnitude on high-cardinality queries.`,
    codeSnippet: `-- HIGH-PERFORMANCE COVERING INDEX:
-- OrderDate is the searchable key; CustomerId & OrderTotal are leaf-only payload columns
CREATE NONCLUSTERED INDEX IX_Orders_OrderDate_Covering 
ON Orders (OrderDate) 
INCLUDE (CustomerId, OrderTotal);

-- Query execution now runs with ZERO Key Lookups!
SELECT CustomerId, OrderTotal 
FROM Orders 
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2024-02-01';`,
    redFlags: [
      "Adding 10 columns to the index key list instead of using the INCLUDE clause.",
      "Creating dozens of covering indexes on every combination of columns, resulting in crippling INSERT/UPDATE write latency."
    ],
    proTips: [
      "Use SQL Server Dynamic Management Views (DMVs) like sys.dm_db_index_usage_stats to monitor and drop unused non-clustered indexes that waste storage and write I/O."
    ]
  },
  {
    id: "q-sql-3",
    pillar: "sql",
    seniority: "Senior",
    tags: ["SARGable", "Index Seek", "Performance", "Query Optimizer"],
    title: "SARGable Queries: Why Functions on Columns Destroy Index Seeks",
    pitch: "A query predicate is SARGable (Search ARGument ABLE) when the query optimizer can leverage a B-Tree Index Seek rather than an Index Scan. Wrapping an indexed column in a function (such as YEAR(d), UPPER(str), CONVERT(), or ISNULL()) destroys SARGability because SQL Server must evaluate the function for every single row in the table, degrading an O(log N) seek to an O(N) full table scan. SARGability also requires matching data types to prevent implicit datatype conversions.",
    deepDive: `Non-SARGable Anti-Patterns and Refactorings:
1. Date Functions:
   - Non-SARGable: WHERE YEAR(OrderDate) = 2024
   - SARGable: WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'
2. String Manipulations:
   - Non-SARGable: WHERE LEFT(LastName, 3) = 'SMI'
   - SARGable: WHERE LastName LIKE 'SMI%'
3. Null Coalescing:
   - Non-SARGable: WHERE ISNULL(Discount, 0) > 0.1
   - SARGable: WHERE Discount > 0.1 (NULL values evaluate to UNKNOWN and are excluded naturally)
4. Implicit Datatype Conversion:
   - If an indexed column is VARCHAR(50) and C# passes a Unicode string (NVARCHAR in EF Core parameter), SQL Server applies CONVERT_IMPLICIT(NVARCHAR, Column), invalidating the index seek!`,
    codeSnippet: `-- ❌ NON-SARGABLE: Clustered Index Scan across 10M rows
SELECT OrderId, TotalAmount FROM Orders 
WHERE DATEADD(day, 30, CreatedAt) < GETDATE();

--  SARGABLE REFACTOR: Index Seek directly jumping to leaf boundary
SELECT OrderId, TotalAmount FROM Orders 
WHERE CreatedAt < DATEADD(day, -30, GETDATE());`,
    redFlags: [
      "Writing 'WHERE Column + 10 > 100' instead of 'WHERE Column > 90'.",
      "Using leading wildcards: 'WHERE Name LIKE '%Smith'' (cannot seek index; must scan entire index)."
    ],
    proTips: [
      "In EF Core, configure string properties with '.IsUnicode(false)' if the database column is VARCHAR to prevent performance-killing CONVERT_IMPLICIT operations."
    ]
  },
  {
    id: "q-sql-4",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Isolation Levels", "RCSI", "Deadlocks", "Concurrency"],
    title: "Transaction Isolation Levels and RCSI (Read Committed Snapshot Isolation)",
    pitch: "Standard SQL Server isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) use pessimistic locking: readers acquire Shared (S) locks that block writers acquiring Exclusive (X) locks, and writers block readers. Read Committed Snapshot Isolation (RCSI) changes this model: readers do not acquire S-locks; instead, they read row versions from tempdb, completely eliminating reader-writer blocking while preventing dirty reads.",
    deepDive: `Isolation Phenomena:
1. Dirty Read: Reading uncommitted, in-flight transactions (permitted only in Read Uncommitted).
2. Non-Repeatable Read: Re-reading the same row within a transaction returns altered data.
3. Phantom Read: A range query executed twice discovers new rows inserted by another committed transaction.

The Power of RCSI (Read Committed Snapshot Isolation):
- Enabled at database level: ALTER DATABASE MyDb SET READ_COMMITTED_SNAPSHOT ON.
- When an UPDATE occurs, SQL Server writes the previous committed row version into a version store in 'tempdb'.
- Incoming SELECT queries read the committed version from tempdb without taking shared locks.
- Result: SELECT queries never block UPDATE queries, and UPDATE queries never block SELECT queries.
- Unlike full SNAPSHOT isolation, RCSI does not require explicit transaction opt-in and does not throw update conflict error 3960.`,
    codeSnippet: `-- Check if RCSI is enabled:
SELECT name, is_read_committed_snapshot_on 
FROM sys.databases 
WHERE name = 'ProductionDb';

-- Enable RCSI (Eliminates reader/writer blocking):
ALTER DATABASE ProductionDb 
SET READ_COMMITTED_SNAPSHOT ON 
WITH ROLLBACK IMMEDIATE;`,
    redFlags: [
      "Placing 'WITH (NOLOCK)' on every SELECT query (causes dirty reads, skipped rows, and reading corrupted duplicate rows due to page splits).",
      "Not accounting for tempdb size and I/O capacity when enabling RCSI on high-write systems."
    ],
    proTips: [
      "RCSI is enabled BY DEFAULT in Azure SQL Database and AWS RDS for SQL Server. If migrating from on-prem to Azure, code relying on shared lock blocking will behave differently."
    ]
  },
  {
    id: "q-sql-5",
    pillar: "sql",
    seniority: "Senior",
    tags: ["EF Core", "Change Tracker", "AsNoTracking", "Memory"],
    title: "EF Core Change Tracker Overhead and the .AsNoTracking() Optimization",
    pitch: "When EF Core executes a tracking query, it instantiates the entity, registers its reference in an Identity Map dictionary, and takes a deep snapshot copy of all its properties. During SaveChangesAsync, it compares every entity against its snapshot (DetectChanges) to find modifications. For read-only queries, this snapshotting and identity mapping wastes 40–60% of CPU and RAM. Using .AsNoTracking() bypasses the change tracker entirely for dramatic performance gains.",
    deepDive: `Internal Costs of EF Core Tracking:
1. Snapshot Allocation: Every tracked entity requires a second internal object storing original property values.
2. Identity Map Lookup: Every materialized row checks whether an entity with that primary key is already tracked.
3. Relationship Fixup: EF Core traverses navigation properties to stitch together references between entities.
4. DetectChanges(): SaveChangesAsync must iterate every tracked entity to compute diffs.

When to Use Variations:
- AsNoTracking(): Fastest read-only execution. Does not track or resolve duplicate instances in the same query.
- AsNoTrackingWithIdentityResolution(): Bypasses change tracking but ensures that multiple rows referencing the same primary key share a single C# object reference in memory (crucial for complex 1:N graph results).`,
    codeSnippet: `public async Task<List<ProductDto>> GetActiveProductsAsync(AppDbContext db, CancellationToken ct)
{
    // Bypasses Identity Map, Snapshot copies, and Change Tracker
    return await db.Products
        .AsNoTracking()
        .Where(p => p.IsActive)
        .OrderBy(p => p.Name)
        .Select(p => new ProductDto(p.Id, p.Name, p.Price, p.Category.Name))
        .ToListAsync(ct);
}`,
    redFlags: [
      "Using tracking queries in high-volume read-only API GET endpoints.",
      "Calling .Update(entity) blindly on an entity retrieved without tracking, causing EF to issue UPDATE statements for all 50 columns instead of modified columns."
    ],
    proTips: [
      "You can configure ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking globally in DbContext options for read-heavy microservices, explicitly opting into tracking only when writing."
    ]
  },
  {
    id: "q-sql-6",
    pillar: "sql",
    seniority: "Senior",
    tags: ["EF Core", "N+1 Problem", "Projection", "Cartesian Explosion"],
    title: "Eliminating N+1 Queries and Cartesian Explosion via LINQ Projection",
    pitch: "The N+1 query problem occurs when an application executes 1 initial database query to fetch N parent records, then fires N subsequent queries in a loop to fetch child records for each parent. While eager loading with .Include() eliminates N+1, chaining multiple .Include() calls on collections causes a Cartesian Explosion, where SQL joins multiply rows into thousands of redundant duplicated records. Pure LINQ projection via .Select() solves both by generating a single optimized SQL query that retrieves only needed columns.",
    deepDive: `Comparing Data Fetching Strategies:
1. Lazy Loading (N+1 Anti-Pattern):
   - var blogs = db.Blogs.ToList(); // 1 query
   - foreach (var b in blogs) Console.WriteLine(b.Posts.Count); // N queries!
2. Eager Loading with Multiple Includes (Cartesian Explosion):
   - db.Blogs.Include(b => b.Posts).Include(b => b.Contributors).ToList();
   - SQL JOIN produces: (Posts Count * Contributors Count) rows! If a blog has 50 posts and 20 contributors, 1,000 rows are returned across TDS for a single blog!
3. Split Queries (.AsSplitQuery()):
   - Issues separate SQL queries per collection (1 for Blogs, 1 for Posts, 1 for Contributors), avoiding the Cartesian multiplication.
4. Projection (.Select()):
   - Compiles directly to targeted SQL SELECT list. Computes counts and sums in the database engine in a single roundtrip.`,
    codeSnippet: `//  SENIOR PROJECTION PATTERN: Single DB roundtrip, zero duplicate bytes
public async Task<List<BlogSummaryDto>> GetBlogSummariesAsync(AppDbContext db, CancellationToken ct)
{
    return await db.Blogs
        .AsNoTracking()
        .Where(b => b.IsPublished)
        .Select(b => new BlogSummaryDto(
            b.Id,
            b.Title,
            b.Author.FullName,
            b.Posts.Count(), // Translated to SQL subquery
            b.Posts.OrderByDescending(p => p.PublishedAt).Select(p => p.Title).Take(3).ToList()
        ))
        .ToListAsync(ct);
}`,
    redFlags: [
      "Leaving Lazy Loading enabled in Web APIs (leads to silent N+1 queries during JSON serialization).",
      "Fetching complete entity graphs containing 40 columns just to display 3 fields on a frontend grid."
    ],
    proTips: [
      "Use EF Core Query Tagging (.TagWith(\"GetBlogSummaries\")) to easily trace LINQ queries in SQL Server Profiler and Application Insights."
    ]
  },
  {
    id: "q-sql-7",
    pillar: "sql",
    seniority: "Senior",
    tags: ["EF Core", "AsSplitQuery", "SQL Joins", "Performance"],
    title: "EF Core Split Queries (.AsSplitQuery): Mitigating Relational Duplication",
    pitch: "When EF Core loads multiple 1-to-many navigation properties using .Include(), its default behavior is to generate a single SQL query with LEFT JOINs. This causes severe Cartesian product data duplication over the network. EF Core's .AsSplitQuery() forces the query engine to split the operation into multiple discrete SQL queries executed within a single context, dramatically reducing transferred bytes and memory allocations at the expense of extra database roundtrips.",
    deepDive: `How AsSplitQuery Works Under the Hood:
- Single Query Mode (Default):
  \`SELECT b.Id, b.Name, p.Id, p.Title, c.Id, c.Text FROM Blogs b LEFT JOIN Posts p ... LEFT JOIN Comments c ...\`
  If a blog has 10 posts and 100 comments, 1,000 rows are sent over the network, duplicating the blog's name and post titles 1,000 times.
- Split Query Mode:
  Query 1: \`SELECT b.Id, b.Name FROM Blogs b\`
  Query 2: \`SELECT p.Id, p.Title, p.BlogId FROM Posts p WHERE p.BlogId IN (SELECT Id FROM Blogs ...)\`
  Query 3: \`SELECT c.Id, c.Text, c.BlogId FROM Comments c WHERE c.BlogId IN (SELECT Id FROM Blogs ...)\`
  Total rows: 1 + 10 + 100 = 111 rows instead of 1,000!

Trade-offs and Risks:
- Network Roundtrips: Split queries require multiple roundtrips to the database.
- Data Consistency: Unless executed inside an explicit serializable/snapshot transaction, an update could occur between query 1 and query 2, leading to inconsistent partial data.`,
    codeSnippet: `// Enabling Split Query on a multi-collection eager load
public async Task<CustomerOrderGraphDto?> GetCustomerGraphAsync(AppDbContext db, int customerId, CancellationToken ct)
{
    return await db.Customers
        .AsNoTracking()
        .AsSplitQuery() // Splits into distinct queries to avoid Cartesian explosion
        .Include(c => c.Orders)
            .ThenInclude(o => o.OrderItems)
        .Include(c => c.SupportTickets)
        .Where(c => c.Id == customerId)
        .FirstOrDefaultAsync(ct);
}`,
    redFlags: [
      "Blindly applying AsSplitQuery everywhere without benchmarking (for 1:1 relationships, standard single JOIN is much faster).",
      "Ignoring the EF Core warning 'Compiling a query which loads related collections for more than one collection navigation'."
    ],
    proTips: [
      "You can configure split queries globally: options.UseSqlServer(connectionString, o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))."
    ]
  },
  {
    id: "q-sql-8",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Concurrency", "RowVersion", "Optimistic Locking", "EF Core"],
    title: "Optimistic Concurrency Control with RowVersion and DbUpdateConcurrencyException",
    pitch: "Pessimistic locking holds exclusive database locks for the duration of a transaction, causing contention and deadlocks in web applications. Optimistic Concurrency assumes conflicts are rare: it allows concurrent reads and updates, but verifies at commit time that no other user modified the row in the interim. In SQL Server and EF Core, this is achieved using a 'RowVersion' (byte[]) column. If a conflict occurs, EF Core throws DbUpdateConcurrencyException, allowing the app to resolve the collision.",
    deepDive: `Implementation Details:
1. RowVersion in SQL Server:
   - A table column declared as 'RowVersion' (synonym: TIMESTAMP) automatically increments an internal 8-byte monotonic binary number on every INSERT or UPDATE.
2. EF Core Mapping:
   - Configured via '[Timestamp]' or 'builder.Property(p => p.Version).IsRowVersion()'.
3. The SQL Execution:
   - When updating: UPDATE Products SET Price = @newPrice WHERE Id = @id AND Version = @originalVersion;
   - If another process updated the product first, the database Version has incremented.
   - Rows affected = 0.
   - EF Core detects affected rows == 0 and throws DbUpdateConcurrencyException.
4. Conflict Resolution Strategies:
   - Client Wins: Overwrite database with client values.
   - Database Wins: Discard client changes and reload latest database values.
   - Custom Merge: Present both values to the user to choose fields.`,
    codeSnippet: `public async Task UpdateAccountBalanceAsync(int accountId, decimal depositAmount, CancellationToken ct)
{
    var account = await _db.Accounts.FindAsync(new object[] { accountId }, ct);
    if (account == null) throw new NotFoundException();

    account.Balance += depositAmount;

    try
    {
        await _db.SaveChangesAsync(ct);
    }
    catch (DbUpdateConcurrencyException ex)
    {
        // Concurrency conflict occurred! Another user updated the record.
        var entry = ex.Entries.Single();
        var databaseValues = await entry.GetDatabaseValuesAsync(ct);

        if (databaseValues == null)
        {
            throw new InvalidOperationException("Account was deleted by another user.");
        }

        var dbAccount = (Account)databaseValues.ToObject();
        throw new ConcurrencyException($"Conflict! Current DB balance is {dbAccount.Balance}. Please retry.");
    }
}`,
    redFlags: [
      "Using pessimistic transactions across HTTP requests (e.g. keeping a DB transaction open while awaiting user form submission).",
      "Catching DbUpdateConcurrencyException and doing nothing, silently dropping user updates."
    ],
    proTips: [
      "In distributed microservices where SQL Server RowVersion is unavailable, use an integer 'Version' column incremented manually: 'UPDATE Entity SET Version = Version + 1, ... WHERE Id = @id AND Version = @expectedVersion'."
    ]
  },
  {
    id: "q-sql-9",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Dapper", "EF Core", "Hybrid CQRS", "Micro-ORM"],
    title: "Dapper and EF Core Hybrid CQRS Architecture: Blending ORM with Micro-ORM",
    pitch: "In high-throughput enterprise .NET systems, combining EF Core and Dapper provides the ideal balance of productivity and performance. EF Core is used on the Command (Write) side for complex Domain Aggregate Roots, validation, change tracking, and transactional units of work. Dapper is used on the Query (Read) side for raw SQL execution, multi-mapping, and zero-allocation object hydration directly into read-optimized DTOs.",
    deepDive: `Why Pure EF Core or Pure Dapper Falls Short:
- Pure EF Core on Writes: Excellent. Handles state transitions, navigations, and concurrency tokens.
- Pure EF Core on Reads: Even with AsNoTracking(), LINQ translation imposes overhead on complex aggregations, window functions, and legacy schema joins.
- Pure Dapper on Writes: Painful. Requires writing manual boilerplate SQL INSERT/UPDATE statements for 50 entity fields and handling change tracking manually.

The Hybrid Solution:
- Both share the same underlying SQL Connection and Transaction: 'var conn = dbContext.Database.GetDbConnection();'.
- Dapper executes custom SQL with CTEs, PIVOTs, or window functions (ROW_NUMBER() OVER (...)) that LINQ cannot efficiently translate.`,
    codeSnippet: `// Query Handler using Dapper for micro-second read performance
public class GetOrderAnalyticsQueryHandler : IRequestHandler<GetOrderAnalyticsQuery, OrderAnalyticsDto>
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public GetOrderAnalyticsQueryHandler(IDbConnectionFactory factory) => _dbConnectionFactory = factory;

    public async Task<OrderAnalyticsDto> Handle(GetOrderAnalyticsQuery request, CancellationToken ct)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                COUNT(1) AS TotalOrders,
                SUM(TotalAmount) AS GrossRevenue,
                AVG(TotalAmount) AS AverageOrderValue
            FROM Orders WITH (NOLOCK)
            WHERE CreatedAt >= @StartDate AND Status = 'Completed';";

        return await connection.QuerySingleAsync<OrderAnalyticsDto>(
            new CommandDefinition(sql, new { request.StartDate }, cancellationToken: ct));
    }
}`,
    redFlags: [
      "Using string concatenation in Dapper SQL queries instead of parameterized anonymous objects (creates SQL Injection vulnerabilities!).",
      "Using Dapper to update complex entity aggregate graphs manually."
    ],
    proTips: [
      "Use Dapper's 'QueryMultipleAsync' to execute multiple SQL SELECT statements in a single database roundtrip, hydrating parent and child collections simultaneously."
    ]
  },
  {
    id: "q-sql-10",
    pillar: "sql",
    seniority: "Senior",
    tags: ["Deadlocks", "SQL Profiling", "XML Deadlock Graph", "Locking Order"],
    title: "SQL Server Deadlocks: Graph Analysis, Lock Hierarchy, and Resolution",
    pitch: "A deadlock occurs when two or more transactions hold exclusive locks on separate resources and each attempts to acquire a lock on the resource held by the other, creating a circular wait dependency. SQL Server detects deadlocks via an internal lock manager thread that runs every 5 seconds, selecting the transaction with the lowest rollback cost as the 'deadlock victim' (error 1205). Resolving deadlocks requires strict object access ordering, reducing transaction duration, creating covering indexes, and enabling RCSI.",
    deepDive: `Analyzing the XML Deadlock Graph:
The XML Deadlock Graph provides:
1. Victim Process: The SPID that was terminated.
2. Resource List: The specific Page, Key, or Table locks in contention (e.g. KEY: 8:7205759404... [OBJECT]).
3. Owner List and Waiter List: Shows which process held which lock mode (X, S, U) and was requesting another.

Four Proven Strategies to Eliminate Deadlocks:
1. Enforce Consistent Access Order: Always update tables in the exact same sequence across all transactions (e.g., Orders first, then OrderItems; never reversed).
2. Enable RCSI: Eliminates Shared (S) locks for readers. If deadlocks involve readers and writers, RCSI fixes them instantly.
3. Keep Transactions Lean: Do NOT make external HTTP API calls or run slow calculations inside an open database transaction.
4. Appropriate Indexes: A missing index turns an atomic row update into a full table scan, holding exclusive locks across the entire table.`,
    codeSnippet: `-- Handling Deadlock Exceptions with Polly Retry in C#
var retryPolicy = Policy
    .Handle<SqlException>(ex => ex.Number == 1205) // SQL Error 1205 = Deadlock Victim
    .WaitAndRetryAsync(
        retryCount: 3,
        sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(50 * Math.Pow(2, attempt)) + 
                                          TimeSpan.FromMilliseconds(Random.Shared.Next(0, 50)),
        onRetry: (exception, delay, attempt, context) =>
        {
            logger.LogWarning("Deadlock encountered. Retrying attempt {Attempt}...", attempt);
        });

await retryPolicy.ExecuteAsync(async () => await dbContext.SaveChangesAsync(ct));`,
    redFlags: [
      "Treating deadlocks as random flukes rather than reproducible concurrency design flaws.",
      "Performing heavy aggregations or multi-second operations inside open write transactions."
    ],
    proTips: [
      "Use SQL Extended Events (system_health session) to automatically capture XML deadlock graphs in production without performance overhead."
    ]
  },

  // ==========================================================================
  // PILLAR 4: FRONTEND (REACT 19 & TYPESCRIPT)
  // ==========================================================================
  {
    id: "q-frontend-1",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["React Fiber", "Reconciliation", "Virtual DOM", "Work Loop"],
    title: "React Fiber Architecture: Double Buffering, Lanes, and the Interruptible Work Loop",
    pitch: "React Fiber is a complete rewrite of React's core reconciliation algorithm that replaced the synchronous recursive stack reconciler. A Fiber is a JavaScript object representing a component, its state, props, and DOM bindings. Fiber enables interruptible, cooperative multitasking by structuring the component tree as a singly-linked list (child, sibling, return pointers). It uses double buffering ('current' vs 'workInProgress' trees) and Lane-based priority scheduling to ensure high-priority user interactions (typing, clicking) are never blocked by heavy rendering.",
    deepDive: `The Two Phases of React Rendering:
1. Render Phase (Asynchronous & Interruptible):
   - React executes the work loop (performUnitOfWork).
   - Traverses the fiber tree, runs component functions, and computes diffs.
   - If a higher-priority task arrives (e.g. keyboard stroke), React pauses work, returns control to the browser's main thread via MessageChannel, and restarts or resumes later.
   - Creates the 'workInProgress' tree.
2. Commit Phase (Synchronous & Uninterruptible):
   - Takes the finished workInProgress fiber tree and mutates the actual browser DOM (placement, update, deletion).
   - Executes useLayoutEffect synchronously, then swaps the root pointer: current = workInProgress.
   - Finally schedules useEffect asynchronously.

Lanes Scheduling:
React 18/19 groups updates into 31 bitmask Lanes (e.g. SyncLane, InputContinuousLane, DefaultLane, IdleLane), allowing fine-grained priority preemption.`,
    codeSnippet: `// Conceptual representation of a Fiber node structure
interface Fiber {
  tag: WorkTag;             // FunctionComponent, ClassComponent, HostRoot, etc.
  key: null | string;
  elementType: any;
  stateNode: any;           // Reference to actual DOM element or class instance
  
  // Singly-linked list tree structure
  return: Fiber | null;     // Parent fiber
  child: Fiber | null;      // First child
  sibling: Fiber | null;    // Next sibling

  memoizedProps: any;       // Props used in last render
  pendingProps: any;        // New incoming props
  memoizedState: any;       // Linked list of hooks (useState, useEffect)
  lanes: Lanes;             // Priority bitmask
  alternate: Fiber | null;  // Double buffering counterpart (current <-> workInProgress)
}`,
    redFlags: [
      "Claiming that Virtual DOM diffing is fast because manipulating JS objects has zero overhead (reconciliation still consumes CPU; Fiber's true breakthrough was interruptibility).",
      "Performing side-effects (API calls, DOM mutation) during the render phase instead of in useEffect."
    ],
    proTips: [
      "React DevTools Profiler allows you to inspect 'Rendered at lane' to see why and when concurrent priority preemption occurred."
    ]
  },
  {
    id: "q-frontend-2",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["React 19", "useTransition", "Concurrent", "useDeferredValue"],
    title: "React 19 Concurrent Features: useTransition, useDeferredValue, and Non-Blocking UI",
    pitch: "Before concurrent React, state updates were synchronous and all updates had equal urgency. If rendering a large list took 200ms, the user's typing in a search box froze. React's useTransition() allows developers to mark state updates as non-urgent transitions. Urgent updates (input value) render immediately at SyncLane, while non-urgent updates (filtering 10,000 items) render in the background. If the user types again, React aborts the in-flight background render and starts fresh with the new keystroke.",
    deepDive: `useTransition vs Debouncing vs useDeferredValue:
- Debouncing: Delays execution using setTimeout. Introduces artificial latency even on ultra-fast machines.
- useTransition: Starts rendering IMMEDIATELY in the background. If the device is fast, results show instantly; if slow, typing is still never blocked. Exposes 'isPending' for loading spinners.
- useDeferredValue: Used when you do not control the state update directly (e.g. receiving a prop from a parent). It defers re-rendering the child component until higher-priority work completes.`,
    codeSnippet: `import React, { useState, useTransition } from 'react';

export function SearchableAnalyticsDashboard({ records }: { records: RecordItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState(records);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 1. URGENT UPDATE: Keep typing responsive at 60 FPS
    setSearchTerm(value);

    // 2. NON-URGENT TRANSITION: Background interruptible render
    startTransition(() => {
      const filtered = records.filter(r => 
        r.name.toLowerCase().includes(value.toLowerCase()) ||
        r.category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredResults(filtered);
    });
  };

  return (
    <div>
      <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search..." />
      {isPending && <span className="spinner">Filtering records...</span>}
      <RecordList items={filteredResults} opacity={isPending ? 0.6 : 1} />
    </div>
  );
}`,
    redFlags: [
      "Wrapping controlled text input state updates directly in startTransition (makes the input sluggish).",
      "Using useTransition for simple boolean toggle switches where no heavy computations exist."
    ],
    proTips: [
      "In React 19, startTransition also accepts async functions (Actions), automatically managing 'isPending' until the promise settles."
    ]
  },
  {
    id: "q-frontend-3",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["useEffect", "Stale Closures", "React Hooks", "Memory Leaks"],
    title: "useEffect Dependency Traps, Stale Closures, and the useRef Escape Hatch",
    pitch: "A Stale Closure occurs when a hook closure (such as inside useEffect, useCallback, or an event listener) captures variables from a previous render pass because they were omitted from the dependency array. When the effect executes later, it references stale variable values. Common traps include infinite re-render loops from object dependency referential instability. Solutions include functional state updaters, useReducer, and the latest-ref pattern.",
    deepDive: `Why Stale Closures Happen:
JavaScript functions create closures over variables in their enclosing lexical scope. Each render in React is a distinct invocation with its own props, state, and constants. If an effect runs on mount (deps: []) and sets up an interval that reads 'count', it permanently captures 'count = 0' from the initial render, causing 'setCount(count + 1)' to perpetually set count to 1.

Fixing Stale Closures:
1. Functional Updates: setCount(prev => prev + 1) reads state from React's internal queue without needing 'count' in dependencies.
2. Latest Ref Pattern: Store changing callbacks or props in a mutable useRef ('const latestCallback = useRef(cb); latestCallback.current = cb;'). The effect can safely run once while reading the latest ref value.`,
    codeSnippet: `// Custom hook implementing the safe latest-ref pattern for intervals
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Keep ref synchronized with latest callback without re-triggering effect
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    // Cleanup to prevent memory leaks!
    return () => clearInterval(id);
  }, [delay]); // Only resets interval if delay duration changes!
}`,
    redFlags: [
      "Disabling the ESLint 'react-hooks/exhaustive-deps' rule with comments instead of fixing root causes.",
      "Creating inline object or array literals inside component bodies and passing them as dependencies to useEffect (triggers infinite loops)."
    ],
    proTips: [
      "If you find yourself chaining multiple useEffect hooks to synchronize state across components, refactor to derive state during render or use a centralized state store."
    ]
  },
  {
    id: "q-frontend-4",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["State Management", "Zustand", "Redux Toolkit", "Context"],
    title: "State Management Architecture: Zustand vs Redux Toolkit vs React Context",
    pitch: "React Context is a dependency injection mechanism, not a high-frequency state management system: any update to a Context value forces every consuming component to re-render, even if it only accesses an unchanged property. Redux Toolkit provides predictable centralized state with time-travel debugging and strict immutability, but has higher boilerplate. Zustand is an unopinionated, lightweight store using external state subscriptions and fine-grained selectors, preventing unnecessary re-renders with zero Context Provider wrappers.",
    deepDive: `Deep Architectural Comparison:
1. React Context:
   - Does NOT support selector-based subscriptions natively.
   - If 'UserContext' holds '{ name, theme, cart }', updating 'cart' triggers re-renders in components that only read 'theme'.
   - Workarounds require splitting into 10 separate tiny contexts.
2. Redux Toolkit (RTK):
   - Best for large enterprise teams requiring strict architectural conventions, middleware (RTK Query), and time-travel debugging.
   - Uses Immer for mutable-syntax immutable updates.
3. Zustand:
   - Stores live outside React's component tree.
   - Components subscribe via selectors: 'const name = useStore(state => state.user.name)'.
   - Uses Object.is to ensure the component ONLY re-renders when the selected slice strictly changes.
   - Can be read and modified outside of React components (e.g. in Axios interceptors or SignalR event handlers).`,
    codeSnippet: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        total: 0,
        addItem: (item) => set((state) => {
          const updatedItems = [...state.items, item];
          return {
            items: updatedItems,
            total: updatedItems.reduce((acc, i) => acc + i.price * i.qty, 0)
          };
        }),
        clearCart: () => set({ items: [], total: 0 })
      }),
      { name: 'shopping-cart-storage' }
    )
  )
);

// Component only re-renders when 'total' changes; ignores 'items' changes!
export function CartSummary() {
  const total = useCartStore((s) => s.total);
  return <div className="cart-total">Total: ${total.toFixed(2)}</div>;
}`,
    redFlags: [
      "Using React Context for global real-time WebSocket or stock ticker state updates (causes massive UI lag).",
      "Calling 'const store = useCartStore()' without a selector (causes the component to re-render on ANY store change)."
    ],
    proTips: [
      "Use Zustand's 'useShallow' hook when selecting multiple properties into an object to prevent re-renders from new object reference allocations."
    ]
  },
  {
    id: "q-frontend-5",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["Virtualization", "Windowing", "DOM Performance", "Large Lists"],
    title: "List Virtualization (Windowing 100k Rows): Mechanics and DOM Recycling",
    pitch: "Mounting 100,000 DOM elements causes the browser to allocate hundreds of megabytes of memory, choking layout computation, garbage collection, and scroll performance. List Virtualization (windowing) solves this by maintaining a fixed pool of only 15–20 DOM elements currently within the user's viewport (plus an overscan buffer). As the user scrolls, elements are recycled and dynamically repositioned using CSS transform: translateY, keeping DOM memory constant regardless of dataset size.",
    deepDive: `Internal Virtualization Algorithm:
1. Container & Total Height:
   - Outer container has 'overflow-y: auto' and a fixed viewport height (e.g. 600px).
   - Inner container height is set to: 'Total Items * Item Height' (e.g. 100,000 * 50px = 5,000,000px) to establish a realistic scrollbar.
2. Viewport Math:
   - Listen to container 'scroll' event (or use ResizeObserver / requestAnimationFrame).
   - Calculate:
     startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
     endIndex = Math.min(totalItems - 1, Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan);
3. Slice & Translate:
   - Extract records slice: items.slice(startIndex, endIndex + 1).
   - Render each item with style: 'position: absolute; top: 0; transform: translateY(index * itemHeight)px'.`,
    codeSnippet: `// Zero-dependency Virtual List component implementation
import React, { useState, useRef } from 'react';

export function VirtualizedList<T>({ items, itemHeight, viewportHeight, renderItem }: {
  items: T[];
  itemHeight: number;
  viewportHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * itemHeight;
  const overscan = 3;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      style={{ height: viewportHeight, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {visibleItems.map((item, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: itemHeight,
                transform: \`translateY(\${actualIndex * itemHeight}px)\`
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}`,
    redFlags: [
      "Using pagination as the only answer to large datasets without knowing how virtualization works.",
      "Attempting to render 10,000 SVG charts or complex DOM trees simultaneously without windowing."
    ],
    proTips: [
      "For dynamic row heights where itemHeight varies, use @tanstack/react-virtual or react-virtualized which measure DOM elements dynamically using ResizeObserver."
    ]
  },
  {
    id: "q-frontend-6",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["TypeScript", "Discriminated Unions", "Exhaustive Check", "Type Safety"],
    title: "TypeScript Discriminated Unions and Compile-Time Exhaustive Pattern Matching",
    pitch: "Discriminated Unions (tagged unions) model mutually exclusive states by combining an explicit literal 'discriminant' property (e.g. 'status') with distinct payloads. This eliminates 'optional property soup' where types contain numerous confusing optional fields. By leveraging the 'never' type in switch default cases, TypeScript provides compile-time exhaustiveness checking: if an engineer adds a new union variant, the compiler fails with a type error until the variant is handled.",
    deepDive: `Why Optional Interfaces Fail in Production:
Consider:
interface AsyncState<T> { isLoading?: boolean; error?: Error; data?: T; }
This allows invalid domain states, such as { isLoading: true, data: user, error: new Error() }.

Discriminated Union Structure:
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

When 'state.status === \"success\"', TypeScript automatically narrows the type, granting access to 'data' while guaranteeing 'error' does not exist.

Exhaustiveness with 'never':
Assigning an unhandled union case to type 'never' causes the TypeScript compiler to throw error: 'Type X is not assignable to type never'.`,
    codeSnippet: `// Bulletproof Redux/Zustand Action handling with Exhaustive Verification
type OrderAction =
  | { type: 'SUBMIT'; payload: { orderId: string } }
  | { type: 'APPROVE'; payload: { orderId: string; approverId: string } }
  | { type: 'REJECT'; payload: { orderId: string; reason: string } };

export function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, status: 'submitted', id: action.payload.orderId };
    case 'APPROVE':
      return { ...state, status: 'approved', approvedBy: action.payload.approverId };
    case 'REJECT':
      return { ...state, status: 'rejected', rejectionReason: action.payload.reason };
    default: {
      // COMPILE-TIME GUARD: If a new action is added to OrderAction, TypeScript errors here!
      const _exhaustiveCheck: never = action;
      throw new Error(\`Unhandled action: \${JSON.stringify(_exhaustiveCheck)}\`);
    }
  }
}`,
    redFlags: [
      "Using 'any' or type assertions ('as unknown as Type') to bypass union mismatch errors.",
      "Modeling multi-state workflows with multiple independent boolean flags (isSubmitting, isFailed, isComplete)."
    ],
    proTips: [
      "Use TypeScript satisfies operator (data satisfies ApiResponse) to enforce type compliance without widening literal types."
    ]
  },
  {
    id: "q-frontend-7",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["TypeScript", "Utility Types", "Mapped Types", "Generics"],
    title: "Advanced TypeScript: ReturnType, Parameters, Mapped Types, and Conditional 'infer'",
    pitch: "Senior TypeScript mastery requires understanding utility types and type metaprogramming. Core built-in utilities like Pick, Omit, Partial, and Record transform interface shapes. Advanced utilities like ReturnType<T> and Parameters<T> use conditional types and the 'infer' keyword to extract return types and parameter tuples directly from functions, ensuring type definitions stay strictly in sync with runtime code without duplicate interface declarations.",
    deepDive: `How ReturnType<T> is Implemented in TypeScript's Standard Library:
type ReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => infer R ? R : any;

The 'infer' keyword introduces a runtime type variable inside a conditional type expression.

Custom Mapped Types:
Mapped types iterate over keys using 'in keyof':
- DeepReadonly<T>: Recursively applies 'readonly' to all nested objects.
- OptionalKeys<T>: Extracts only keys that are optional in an interface.
- Template Literal Types: Combines string literals (e.g. \`on\${Capitalize<EventName>}\`).`,
    codeSnippet: `// Extracting typed API response contract without duplicate types
export async function fetchUserDashboard(userId: string) {
  const response = await fetch(\`/api/users/\${userId}/dashboard\`);
  const data = await response.json();
  return {
    userId,
    profile: data.profile as { name: string; avatarUrl: string },
    permissions: data.permissions as string[],
    unreadCount: data.unreadCount as number
  };
}

// Automatically derived contract type - ALWAYS matches function implementation!
export type UserDashboardData = ReturnType<typeof fetchUserDashboard> extends Promise<infer T> ? T : never;

// Generic Deep Immutable Utility Type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};`,
    redFlags: [
      "Manually declaring duplicate interfaces for function return payloads that easily drift out of sync.",
      "Overusing complex generic mapped types where simple interfaces would suffice."
    ],
    proTips: [
      "Use 'Awaited<ReturnType<typeof asyncFn>>' in TypeScript 4.5+ to unwrap Promise types cleanly without manual 'infer' boilerplate."
    ]
  },

  // ==========================================================================
  // PILLAR 5: AZURE DEVOPS & CLOUD CI/CD
  // ==========================================================================
  {
    id: "q-cloud-1",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["CI/CD", "YAML", "Pipelines", "Azure DevOps"],
    title: "Enterprise Multi-Stage YAML Pipelines: Build, Test, Security, and Gated Deployments",
    pitch: "Modern enterprise CI/CD uses version-controlled multi-stage YAML pipelines rather than legacy GUI release pipelines. Stages represent distinct phases: Build (restore, build, unit test, publish artifacts), Security Scan (SonarQube, Trivy container scan), Staging Deployment, and Production Deployment. Environments enforce automated governance: manual manager approvals, Azure Monitor health alert gates, and automated rollbacks without manual developer intervention.",
    deepDive: `Multi-Stage Architecture:
1. Trigger & PR Validation:
   - Branch triggers on main/release.
   - Separate PR validation triggers that build and test feature branches before merge.
2. Immutability Principle:
   - Build ONCE, Deploy Everywhere. The same binary/container image produced in Stage 1 is deployed to Dev, Staging, and Production. Environmental differences are injected via App Service app settings or Kubernetes ConfigMaps.
3. Deployment Jobs:
   - Use 'deployment: DeployProd' rather than standard 'job: Deploy'.
   - Links directly to Azure DevOps Environments, providing deployment history, audit logs, and approval checks.
   - Supports deployment strategies: 'runOnce', 'rolling', or 'canary'.`,
    codeSnippet: `trigger:
  branches:
    include: [ main ]

stages:
- stage: BuildAndTest
  displayName: 'Build, Test & Containerize'
  jobs:
  - job: BuildJob
    pool: { vmImage: 'ubuntu-latest' }
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'test'
        projects: '**/*Tests/*.csproj'
        arguments: '--configuration Release /p:CollectCoverage=true'
    - task: Docker@2
      inputs:
        command: 'buildAndPush'
        containerRegistry: 'acr-production'
        repository: 'api/orders'
        tags: '$(Build.BuildId)'

- stage: DeployProduction
  displayName: 'Deploy to Production (Gated)'
  dependsOn: BuildAndTest
  jobs:
  - deployment: DeployToAppService
    environment: 'Production-Environment' # Enforces Approval Gates & Alert Checks
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            inputs:
              appName: 'app-orders-prod'
              imageName: 'acrproduction.azurecr.io/api/orders:$(Build.BuildId)'`,
    redFlags: [
      "Rebuilding the application from source code in every environment (violates artifact immutability).",
      "Storing passwords or API keys directly in YAML files instead of Azure Key Vault / Azure DevOps Variable Groups."
    ],
    proTips: [
      "Use YAML Templates (extends: template.yml) to enforce organization-wide security, SonarQube quality gates, and compliance standards across all repositories."
    ]
  },
  {
    id: "q-cloud-2",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["App Service", "Deployment Slots", "Zero Downtime", "Warmup"],
    title: "Azure App Service Deployment Slots and Zero-Downtime Warmup Probes",
    pitch: "Azure App Service Deployment Slots enable true zero-downtime blue/green deployments. Instead of deploying directly to production and incurring JIT compilation lag or cold-start timeouts, the new build is deployed to an isolated 'Staging' slot. Azure warms up the app using the 'applicationInitialization' probe specified in web.config. Once the staging slot returns HTTP 200, Azure swaps the virtual IP routing rules: traffic instantly switches to the new build with zero dropped TCP connections.",
    deepDive: `The Mechanics of a Slot Swap:
1. Warmup Phase:
   - App Service sends HTTP requests to the root '/' or designated health probe path.
   - EF Core compiles model caches, JIT compiles C# assemblies, and singletons initialize.
2. IP Swap:
   - Azure's Front-End routing servers update their internal reverse proxy routing rules.
   - The staging slot's worker processes become the production endpoints.
3. Sticky Settings ('slotSetting: true'):
   - Settings can be marked as slot-specific (e.g. database connection strings, logging levels).
   - Sticky settings stay with the slot and DO NOT swap.
4. Instant Rollback:
   - If a critical bug is discovered after swapping, clicking 'Swap' again reverses the routing in < 10 seconds.`,
    codeSnippet: `<!-- web.config: Ensure JIT warmup finishes before slot swap switches traffic -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <applicationInitialization doAppInitAfterRestart="true">
      <!-- App Service holds the swap until this probe returns HTTP 200 -->
      <add initializationPage="/health/ready" hostName="localhost" />
    </applicationInitialization>
  </system.webServer>
</configuration>`,
    redFlags: [
      "Swapping slots without configuring warmup probes (production users experience 10-second cold start latency spikes).",
      "Forgetting to make staging connection strings 'sticky', causing staging slots to write to production databases."
    ],
    proTips: [
      "Configure Auto-Swap on the staging slot: any successful deployment to staging automatically initiates a swap to production once warmup passes."
    ]
  },
  {
    id: "q-cloud-3",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["Managed Identity", "Security", "Azure SQL", "Key Vault"],
    title: "Azure Managed Identities: Passwordless Architecture with DefaultAzureCredential",
    pitch: "Azure Managed Identity provides an automatically managed identity in Microsoft Entra ID (Azure AD) for Azure resources (App Service, AKS, Functions). It eliminates the dangerous anti-pattern of storing connection strings, database passwords, and client secrets in configuration files. In C#, the Azure.Identity library's 'DefaultAzureCredential' automatically fetches OAuth tokens to authenticate to Azure SQL Database, Azure Key Vault, and Azure Service Bus seamlessly across local dev and production.",
    deepDive: `System-Assigned vs User-Assigned:
- System-Assigned: Created and tied directly to the lifecycle of a specific Azure resource (deleting the App Service automatically deletes the identity in Entra ID).
- User-Assigned: Created as an independent Azure resource; can be assigned to multiple VMs or scale-set instances.

Passwordless Azure SQL Connection:
- In Azure SQL, create an Entra ID user: CREATE USER [app-orders-prod] FROM EXTERNAL PROVIDER;
- Grant permissions: ALTER ROLE db_datareader ADD MEMBER [app-orders-prod];
- Connection string in appsettings.json becomes:
  'Server=tcp:sql-prod.database.windows.net,1433;Database=OrdersDb;Authentication=Active Directory Default;'
- Zero passwords! Microsoft.Data.SqlClient automatically contacts Azure's IMDS (Instance Metadata Service) endpoint to acquire an access token.`,
    codeSnippet: `// C# Program.cs: Passwordless Secret and Blob Storage Client setup
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

var builder = WebApplication.CreateBuilder(args);

// DefaultAzureCredential automatically falls back:
// 1. Environment Variables (CI/CD)
// 2. Workload Identity / Managed Identity (Azure App Service / AKS)
// 3. Azure CLI / Visual Studio (Local developer machine)
var credential = new DefaultAzureCredential();

builder.Services.AddSingleton(new SecretClient(
    new Uri("https://kv-production-core.vault.azure.net/"), 
    credential));

// Azure SQL with Passwordless Managed Identity in EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlManagedIdentity"));
});`,
    redFlags: [
      "Checking database passwords or connection strings into Git repositories.",
      "Hardcoding ClientId and ClientSecret inside appsettings.json."
    ],
    proTips: [
      "For local developer machines, sign in via 'az login' in the terminal; DefaultAzureCredential will detect your developer credentials automatically without code changes."
    ]
  },
  {
    id: "q-cloud-4",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["Docker", "Containers", "Ubuntu Chiseled", "Security"],
    title: "Minimal Ubuntu Chiseled Docker Containers: Distroless Security and Size Optimization",
    pitch: "Microsoft and Canonical partnered to produce 'Ubuntu Chiseled' container images for .NET 8+. Chiseled images are distroless: they contain only the bare minimum runtime dependencies needed to execute .NET binaries. They contain NO package manager (no apt/dpkg), NO shell (no bash/sh), and run as a non-root user ('app') by default. This shrinks container images from 350MB+ down to < 100MB, accelerates startup and auto-scaling, and eliminates over 90% of OS-level CVE vulnerability scanner alerts.",
    deepDive: `Why Traditional Containers are Risky in Enterprise Production:
- Standard Linux images contain thousands of utilities (curl, wget, tar, bash, python).
- If an attacker achieves Remote Code Execution (RCE), they use the container's shell and package manager to install malware, compile exploit kits, and pivot laterally across the Kubernetes cluster.

Chiseled / Distroless Architecture:
- Non-Root: Runs as user ID 1654 ('app') rather than root (UID 0), preventing container breakout attacks.
- Read-Only & Immutability: Without apt or bash, an attacker cannot install packages or execute shell commands.
- Multi-Stage Dockerfile: Build on heavy SDK image; copy only the compiled binaries to the chiseled runtime image.`,
    codeSnippet: `# Multi-stage production Dockerfile using .NET 8 Ubuntu Chiseled
# STAGE 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["OrdersApi/OrdersApi.csproj", "OrdersApi/"]
RUN dotnet restore "OrdersApi/OrdersApi.csproj"
COPY . .
WORKDIR "/src/OrdersApi"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# STAGE 2: Ultra-Minimal Chiseled Runtime (< 100MB, Non-root user)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-chiseled AS final
WORKDIR /app
COPY --from=build /app/publish .

# Port 8080 is the default non-root port in .NET 8
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "OrdersApi.dll"]`,
    redFlags: [
      "Running production containers as the root user (UID 0).",
      "Shipping the entire .NET SDK image to production instead of using multi-stage builds."
    ],
    proTips: [
      "In .NET 8+, ASP.NET Core binds to port 8080 by default (rather than port 80) because non-root users cannot bind to privileged ports below 1024."
    ]
  },
  {
    id: "q-cloud-5",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["Service Bus", "Outbox Pattern", "Distributed Systems", "EDA"],
    title: "Azure Service Bus and the Transactional Outbox Pattern: Solving Dual-Write Bugs",
    pitch: "The Dual-Write Problem occurs in distributed architectures when a service must mutate its database and publish an event to a message broker (Azure Service Bus). If the database write succeeds but the network fails during event publish, downstream services never receive the event; if publish succeeds but database transaction rolls back, downstream services process ghost data. The Transactional Outbox Pattern solves this by storing the message in an Outbox table within the same local database ACID transaction.",
    deepDive: `Detailed Mechanics:
1. The ACID Boundary:
   - Within an explicit DbContext transaction:
     db.Orders.Add(order);
     db.OutboxMessages.Add(new OutboxMessage { EventType = \"OrderCreated\", Payload = json });
     await db.SaveChangesAsync();
   - If either fails, the entire transaction rolls back. Guaranteed atomicity without 2-Phase Commit (2PC).
2. The Outbox Publisher:
   - A separate background worker (or Debezium CDC) reads unprocessed outbox records:
     SELECT * FROM OutboxMessages WHERE ProcessedAt IS NULL ORDER BY CreatedAt.
   - Publishes to Azure Service Bus Topic.
   - Updates OutboxMessage.ProcessedAt = DateTime.UtcNow.
3. At-Least-Once Delivery & Idempotency:
   - Message brokers guarantee at-least-once delivery. If the publisher crashes after publishing but before updating ProcessedAt, a duplicate message will be published.
   - Downstream consumers MUST be idempotent (track processed MessageId in their own database to reject duplicates).`,
    codeSnippet: `// MassTransit provides built-in Transactional Outbox for EF Core with one line!
builder.Services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<AppDbContext>(o =>
    {
        o.UseSqlServer();
        o.UseBusOutbox(); // Integrates outbox directly into IPublishEndpoint
        o.DuplicateDetectionWindow = TimeSpan.FromMinutes(30);
    });

    x.UsingAzureServiceBus((context, cfg) =>
    {
        cfg.Host(builder.Configuration.GetConnectionString("ServiceBus"));
        cfg.ConfigureEndpoints(context);
    });
});

// In your application service:
public async Task CreateOrderAsync(CreateOrderDto dto, CancellationToken ct)
{
    var order = new Order(dto.CustomerId, dto.Amount);
    _db.Orders.Add(order);

    // This publish is automatically intercepted and saved to the Outbox table in the DB!
    await _publishEndpoint.Publish(new OrderCreatedEvent(order.Id, order.Amount), ct);

    // Commits BOTH the Order and the Outbox message in a single atomic transaction!
    await _db.SaveChangesAsync(ct);
}`,
    redFlags: [
      "Publishing to Azure Service Bus before calling db.SaveChangesAsync() (ghost event published if DB throws exception).",
      "Assuming message brokers provide exactly-once delivery without implementing idempotent consumers."
    ],
    proTips: [
      "Enable 'RequiresDuplicateDetection = true' and 'DuplicateDetectionHistoryTimeWindow = 10 minutes' on Azure Service Bus Queues to let Azure deduplicate retried messages via MessageId."
    ]
  },
  {
    id: "q-csharp-11",
    pillar: "csharp",
    seniority: "Senior",
    tags: ["Unsafe", "Pointers", "MemoryMarshal", "SIMD"],
    title: "Unsafe Code, Native Pointers, and MemoryMarshal Zero-Copy Casts",
    pitch: "While C# is fundamentally a type-safe managed language, the 'unsafe' keyword and System.Runtime.InteropServices.MemoryMarshal allow developers to bypass CLR safety checks for ultra-high-throughput native interop, cryptographic operations, and SIMD hardware intrinsics. MemoryMarshal.Cast<TFrom, TTo>() allows zero-copy type reinterpretation of Span buffers without copying a single byte in memory.",
    deepDive: `Unsafe vs Safe Memory Operations:
1. Pointers (fixed statement):
   - The CLR GC moves objects during compaction.
   - Using 'fixed (byte* p = buffer)' pins the managed array in memory, disabling GC movement for that block so raw pointers can be safely traversed.
2. MemoryMarshal.Cast:
   - Reinterprets a Span<byte> as a Span<int> or Span<Vector256<float>> without copying.
   - Calculates the new length as: '(oldLength * sizeof(TFrom)) / sizeof(TTo)'.
3. Hardware Intrinsics (SIMD):
   - System.Runtime.Intrinsics.X86 (AVX2, AVX512) and Arm.Arm64.
   - Performs Single Instruction Multiple Data operations, processing 8 or 16 numbers in a single CPU clock cycle.`,
    codeSnippet: `using System.Runtime.InteropServices;
using System.Runtime.Intrinsics;
using System.Runtime.Intrinsics.X86;

public static class FastBufferUtilities
{
    // Zero-allocation byte-to-uint cast using MemoryMarshal
    public static uint ComputeFastSum(ReadOnlySpan<byte> data)
    {
        // Reinterpret byte span as uint span (4 bytes per uint)
        ReadOnlySpan<uint> uintSpan = MemoryMarshal.Cast<byte, uint>(data);
        uint sum = 0;
        for (int i = 0; i < uintSpan.Length; i++)
        {
            sum += uintSpan[i];
        }
        return sum;
    }
}`,
    redFlags: [
      "Using unsafe pointer arithmetic where Span<T> or ArrayPool<T> provides equivalent speed safely.",
      "Pinning managed objects with 'fixed' for long periods, causing severe GC heap fragmentation."
    ],
    proTips: [
      "Always prefer MemoryMarshal and Unsafe.As<T>() over raw pointers: they are verified by Roslyn and preserve JIT optimization heuristics."
    ]
  },
  {
    id: "q-aspnet-11",
    pillar: "aspnet",
    seniority: "Senior",
    tags: ["SignalR", "WebSockets", "Real-Time", "MessagePack"],
    title: "ASP.NET Core SignalR Scale-Out, MessagePack, and Azure SignalR Service",
    pitch: "ASP.NET Core SignalR simplifies real-time bidirectional communication by abstracting WebSockets, Server-Sent Events, and Long Polling. In high-traffic clusters, sticky sessions and memory constraints make hosting WebSockets on application pods unscalable. Azure SignalR Service offloads client connections entirely: backend web servers maintain only a lightweight multiplexed control channel. Replacing standard JSON with MessagePack serialization reduces network payloads by up to 70% and drastically cuts GC allocations.",
    deepDive: `Real-Time Architecture Nuances:
1. Transport Fallbacks:
   - WebSocket: Full-duplex persistent TCP connection (preferred).
   - Server-Sent Events (SSE): Half-duplex (server-to-client push only; client sends via standard HTTP).
   - Long Polling: Legacy fallback for restrictive enterprise proxies.
2. Backplane Alternatives:
   - Redis Backplane: Every broadcast to a group is fanned out to EVERY connected node in the cluster ($O(N \times M)$ overhead).
   - Azure SignalR Service: Managed edge service terminating 100k+ WebSockets. Only routes messages to nodes with active subscribers.
3. MessagePack Binary Protocol:
   - By default, SignalR serializes messages to JSON text.
   - Adding 'Microsoft.AspNetCore.SignalR.Protocols.MessagePack' transmits compact binary data, reducing CPU serialization overhead and mobile client bandwidth.`,
    codeSnippet: `// Program.cs: SignalR with Azure SignalR Service and MessagePack
builder.Services.AddSignalR()
    .AddAzureSignalR(options =>
    {
        options.ConnectionString = builder.Configuration.GetConnectionString("AzureSignalR");
        options.ServerStickyMode = ServerStickyMode.Disabled;
    })
    .AddMessagePackProtocol(); // Binary high-efficiency protocol`,
    redFlags: [
      "Assuming SignalR requires sticky sessions when using Azure SignalR Service (Azure SignalR eliminates sticky session requirements).",
      "Broadcasting 5MB payloads over SignalR instead of sending a lightweight notification with an HTTP download link."
    ],
    proTips: [
      "Implement Hub lifetime events ('OnConnectedAsync' and 'OnDisconnectedAsync') to manage user presence in Redis with automatic TTL timeouts."
    ]
  },
  {
    id: "q-sql-11",
    pillar: "sql",
    seniority: "Senior",
    tags: ["EF Core", "Compiled Queries", "Batching", "Raw SQL"],
    title: "EF Core Compiled Queries, Statement Batching, and Parameterized Raw SQL",
    pitch: "Every LINQ query executed in EF Core must compile the expression tree into a relational SQL statement and cache the query plan. For micro-second critical endpoints, EF.CompileAsyncQuery() pre-compiles the query into an invocable delegate, bypassing expression tree compilation on every request. Furthermore, modern EF Core automatically batches multiple INSERT/UPDATE/DELETE statements into a single network roundtrip, and provides ExecuteSqlInterpolated() for safe, parameterized raw SQL execution.",
    deepDive: `Mechanics of Compiled Queries:
- Standard LINQ Execution:
  1. Parse C# Expression Tree.
  2. Compute Query Cache Key (based on shape and parameters).
  3. Look up relational command in memory cache.
  4. Generate and parameterize SQL string.
- Compiled Query (EF.CompileAsyncQuery):
  1. Evaluates steps 1-4 ONCE at startup.
  2. Stores a compiled Func<DbContext, TParam, IAsyncEnumerable<TResult>> delegate.
  3. Subsequent executions invoke the delegate directly, cutting query overhead by 50-70%.

Automatic Statement Batching:
When calling SaveChangesAsync on 50 modified entities, EF Core bundles all 50 statements into a single TDS batch packet rather than issuing 50 sequential network roundtrips.`,
    codeSnippet: `// High-performance static pre-compiled query delegate
public static class QueryCache
{
    public static readonly Func<AppDbContext, int, Task<UserSummaryDto?>> GetUserSummaryCompiled =
        EF.CompileAsyncQuery((AppDbContext db, int id) =>
            db.Users
              .AsNoTracking()
              .Where(u => u.Id == id)
              .Select(u => new UserSummaryDto(u.Id, u.Email, u.Role))
              .FirstOrDefault());
}

// In your high-frequency controller / endpoint:
public async Task<IResult> GetUser(int id, AppDbContext db)
{
    var user = await QueryCache.GetUserSummaryCompiled(db, id);
    return user is not null ? TypedResults.Ok(user) : TypedResults.NotFound();
}`,
    redFlags: [
      "Using string concatenation with db.Database.ExecuteSqlRaw() (creates critical SQL injection vulnerabilities!).",
      "Over-optimizing with compiled queries on low-volume admin endpoints where standard LINQ is more readable."
    ],
    proTips: [
      "In EF Core 7+, use ExecuteUpdateAsync() and ExecuteDeleteAsync() to execute bulk mutations directly on the database without loading entities into memory first."
    ]
  },
  {
    id: "q-frontend-8",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["React 19", "Server Actions", "useActionState", "Forms"],
    title: "React 19 Server Actions and Form State Management with useActionState",
    pitch: "React 19 introduced first-class Server Actions and hooks like useActionState and useFormStatus to standardize form handling and asynchronous mutations. Server Actions execute asynchronously on the server and can be invoked directly from HTML form action attributes. The useActionState hook encapsulates pending state, validation errors, and optimistic UI updates without manual useState, useEffect, or fetch boilerplate.",
    deepDive: `Evolution of Mutations in React:
- Pre-React 19: Required manual onSubmit event handlers, e.preventDefault(), useState for isSubmitting, error, and response, and manual try/catch fetch logic.
- React 19 Actions:
  Functions that transition state asynchronously. When passed to an action prop or useActionState, React automatically manages the transition lifecycle, exposes isPending, and coordinates with Suspense and Error Boundaries.`,
    codeSnippet: `import React, { useActionState } from 'react';

// Action function handling API mutation
async function updateProfileScore(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const score = formData.get('score');
  try {
    const res = await fetch('/api/profile/score', {
      method: 'POST',
      body: JSON.stringify({ score }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return { error: 'Failed to update score' };
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export function ProfileScoreEditor() {
  const [state, formAction, isPending] = useActionState(updateProfileScore, {});

  return (
    <form action={formAction}>
      <input type="number" name="score" defaultValue={100} disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Update Score'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Saved successfully!</p>}
    </form>
  );
}`,
    redFlags: [
      "Manually creating 4 different useState variables for every single form in React 19.",
      "Not handling progressive enhancement or disabled states during pending action submissions."
    ],
    proTips: [
      "Combine useActionState with useOptimistic to instantly update the UI before the server mutation roundtrip finishes."
    ]
  },
  {
    id: "q-frontend-9",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["Memoization", "React Compiler", "Performance", "useCallback"],
    title: "React Memoization: React.memo, useMemo, and the React Compiler (React Forget)",
    pitch: "Historically, React developers manually memoized components with React.memo and expressions with useMemo/useCallback to avoid unnecessary re-renders caused by referential inequality of functions and objects. However, over-memoization adds memory overhead and dependency array maintenance bugs. The new React Compiler (React Forget) is an ahead-of-time auto-memoizing compiler that automatically injects fine-grained memoization at compile time, eliminating the need for manual useMemo and useCallback in modern React codebases.",
    deepDive: `Referential Equality and Re-Rendering:
1. In JavaScript, '{} !== {}' and '(() => {}) !== (() => {})'.
2. When a parent re-renders, every inline callback and object literal receives a brand-new memory address.
3. If passed to a child wrapped in React.memo, the shallow prop comparison fails, forcing the child to re-render anyway.
4. The Cost of Memoization:
   - useMemo has an internal cost: allocating dependency arrays, comparing dependencies on every render, and holding cached values.
   - For simple calculations (e.g. string formatting), useMemo is often slower than re-computing!
5. The React Compiler Revolution:
   - Converts React components into an optimized Intermediate Representation (IR).
   - Identifies values and JSX subtrees that do not change and inserts memoization blocks automatically.`,
    codeSnippet: `// Classic manual memoization pattern
import React, { useMemo, useCallback } from 'react';

export const ExpensiveGrid = React.memo(function ExpensiveGrid({ data, onRowClick }: {
  data: RowItem[];
  onRowClick: (id: string) => void;
}) {
  // Expensive sorting operation properly memoized
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div>
      {sortedData.map(row => (
        <div key={row.id} onClick={() => onRowClick(row.id)}>
          {row.name}: {row.value}
        </div>
      ))}
    </div>
  );
});`,
    redFlags: [
      "Wrapping trivial calculations like 'const total = useMemo(() => a + b, [a, b])' in useMemo.",
      "Omitting callback dependencies or passing unstable inline functions into React.memo components."
    ],
    proTips: [
      "Always measure before memoizing: use the React DevTools Profiler 'Highlight updates when components render' to find actual bottlenecks."
    ]
  },
  {
    id: "q-frontend-10",
    pillar: "frontend",
    seniority: "Senior",
    tags: ["Micro-Frontends", "Module Federation", "Architecture", "TypeScript"],
    title: "Micro-Frontends and Webpack Module Federation in Decoupled ASP.NET Core Systems",
    pitch: "Micro-frontends decompose large monolithic single-page applications into independently developed, tested, and deployed frontend sub-applications. Webpack Module Federation allows micro-apps to dynamically share runtime dependencies (such as React, Zustand, and Design System components) at runtime without bundling them into every micro-app artifact. An ASP.NET Core host or edge gateway routes user sessions and supplies unified authentication context.",
    deepDive: `Module Federation Mechanics:
1. Host vs Remote:
   - Shell / Host: Renders the outer navigation shell, header, and handles global auth.
   - Remotes: Independent micro-apps (e.g. Checkout, Catalog, Account Dashboard) hosted at separate URLs/CDNs.
2. Shared Dependencies:
   - 'shared: { react: { singleton: true, requiredVersion: \"^19.0.0\" } }' ensures that only a single instance of React exists in memory, preventing hook context collisions.
3. Decoupled CI/CD:
   - Teams can deploy the Checkout micro-app 10 times a day without rebuilding or redeploying the Catalog or Shell.`,
    codeSnippet: `// webpack.config.js for Remote Micro-Frontend
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'ordersApp',
      filename: 'remoteEntry.js',
      exposes: {
        './OrderHistoryWidget': './src/components/OrderHistoryWidget'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        zustand: { singleton: true }
      }
    })
  ]
};`,
    redFlags: [
      "Loading multiple different versions of React in the same browser window (causes React hook crash errors).",
      "Using iframes for micro-frontends (breaks responsive layout, accessibility, and smooth modal overlays)."
    ],
    proTips: [
      "Use Custom Events or a lightweight event bus for cross-micro-frontend communication to maintain loose coupling."
    ]
  },
  {
    id: "q-cloud-6",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["IaC", "Bicep", "Terraform", "Cloud Architecture"],
    title: "Infrastructure as Code: Azure Bicep vs Terraform and State Management",
    pitch: "Infrastructure as Code (IaC) ensures repeatable, auditable cloud environments. Terraform is cloud-agnostic, using HCL (HashiCorp Configuration Language) and an explicit state file (terraform.tfstate) stored in Azure Blob Storage with blob leasing locks. Azure Bicep is Microsoft's native domain-specific language compiling directly into ARM templates: it has zero state files, instantaneous support for new Azure day-zero features, and native validation within Azure Resource Manager.",
    deepDive: `Detailed Comparison:
1. State Management:
   - Terraform: Requires state file management. If state drifts or gets locked/corrupted, deployments block. However, state enables cross-provider plans (e.g. Azure + Cloudflare + Datadog).
   - Bicep: Completely stateless. Queries the live Azure Resource Manager (ARM) API directly to determine current state, eliminating state corruption risks.
2. Tooling and Day-0 Support:
   - Bicep: Offers first-class VS Code IntelliSense with immediate support for any new Azure API preview.
   - Terraform: Relies on AzureRM provider updates, which can lag behind Azure previews.
3. Idempotency:
   - Both tools are idempotent: running the script multiple times against the same environment results in the exact same infrastructure without duplicate resources.`,
    codeSnippet: `// main.bicep: Modular Azure App Service and Key Vault deployment
param location string = resourceGroup().location
param appName string = 'app-orders-prod'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-\${appName}'
  location: location
  sku: { name: 'P1v3', tier: 'PremiumV3' }
  kind: 'linux'
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      http20Enabled: true
      minTlsVersion: '1.2'
    }
  }
  identity: { type: 'SystemAssigned' } // Enables Passwordless Managed Identity
}`,
    redFlags: [
      "Creating cloud resources manually in the Azure Portal (ClickOps) for production environments.",
      "Leaving Terraform state files in public or unencrypted storage without blob lease locking."
    ],
    proTips: [
      "Use 'az deployment group what-if' in Bicep or 'terraform plan' in CI pull requests to inspect infrastructure diffs before applying changes."
    ]
  },
  {
    id: "q-cloud-7",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["KEDA", "Kubernetes", "Autoscaling", "Event-Driven"],
    title: "Event-Driven Autoscaling with KEDA for .NET Background Consumers",
    pitch: "Standard Kubernetes Horizontal Pod Autoscaling (HPA) scales pods based on CPU or Memory metrics. However, for background event processors consuming Azure Service Bus queues or Kafka topics, CPU can remain low while queue backlog explodes. KEDA (Kubernetes Event-driven Autoscaling) monitors external event sources directly, scaling .NET consumer pods from 0 to N based on queue depth and message lag, and scaling down to 0 when idle to save cloud costs.",
    deepDive: `How KEDA Operates:
1. ScaledObject: A Kubernetes custom resource definition (CRD) that links an application deployment to a trigger (e.g. azure-servicebus).
2. Metric Server: KEDA queries the Azure Service Bus API to check 'activeMessageCount'.
3. Scaling to Zero:
   - Standard Kubernetes HPA cannot scale a deployment from 0 to 1 or 1 to 0.
   - KEDA activates the deployment (0 -> 1) when messages appear, then delegates to HPA for scaling (1 -> N) based on target message backlog per pod.
4. Scale-Down Grace Period:
   - Ensures in-flight .NET message processing completes gracefully before Kubernetes terminates the pod (using SIGTERM and CancellationToken).`,
    codeSnippet: `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-consumer-scaler
spec:
  scaleTargetRef:
    name: order-processor-deployment
  minReplicaCount: 0  # Scales to ZERO when queue is empty!
  maxReplicaCount: 20
  triggers:
  - type: azure-servicebus
    metadata:
      queueName: pending-orders
      messageCount: '50' # Add 1 pod for every 50 messages in backlog
    authenticationRef:
      name: keda-servicebus-auth`,
    redFlags: [
      "Scaling background worker pods using CPU metrics (pods idle while 500k messages queue up!).",
      "Ignoring SIGTERM in C# consumers, causing messages to be aborted mid-processing when scaling down."
    ],
    proTips: [
      "Set 'IHostOptions.ShutdownTimeout' in C# Program.cs to allow background services sufficient time (e.g. 30 seconds) to flush active database transactions during pod scale-down."
    ]
  },
  {
    id: "q-cloud-8",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["OpenTelemetry", "Distributed Tracing", "App Insights", "Observability"],
    title: "Distributed Tracing with OpenTelemetry and Azure Application Insights in .NET",
    pitch: "In microservice architectures, a single user request can touch 10 independent services and databases. OpenTelemetry (OTel) is the vendor-neutral cloud standard for traces, metrics, and logs. In .NET 8, System.Diagnostics.Activity and ActivitySource natively implement OpenTelemetry specifications. By propagating the W3C 'traceparent' header across HTTP and Service Bus boundaries, distributed transactions can be visualized end-to-end in Application Insights with full call graphs, timings, and database dependencies.",
    deepDive: `The W3C TraceContext Standard:
- Header: 'traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
- Fields: Version (00) - TraceId (unique per user request) - ParentSpanId - TraceFlags (sampling bit).

ActivitySource in .NET:
- System.Diagnostics.ActivitySource is the C# instrumentation API.
- Activities represent spans in a trace.
- When HttpClient sends a request, .NET automatically injects the active traceparent header.
- Downstream ASP.NET Core APIs read the header and create child Activities, preserving causal links.`,
    codeSnippet: `// Program.cs: OpenTelemetry integration with Azure Application Insights
using Azure.Monitor.OpenTelemetry.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Register OpenTelemetry with Azure Monitor in one line (.NET 8+)
builder.Services.AddOpenTelemetry()
    .UseAzureMonitor(options =>
    {
        options.ConnectionString = builder.Configuration.GetConnectionString("ApplicationInsights");
    })
    .WithTracing(tracing =>
    {
        tracing.AddSource("Company.Orders.Pipeline")
               .AddAspNetCoreInstrumentation()
               .AddHttpClientInstrumentation()
               .AddEntityFrameworkCoreInstrumentation();
    });

// Custom ActivitySource in domain business logic
public static class Telemetry
{
    public static readonly ActivitySource Source = new("Company.Orders.Pipeline");
}

public async Task ProcessOrder(string orderId)
{
    using var activity = Telemetry.Source.StartActivity("CustomOrderProcessing");
    activity?.SetTag("order.id", orderId);
    // Business logic...
}`,
    redFlags: [
      "Using custom proprietary correlation ID headers (e.g. X-Correlation-ID) instead of the standard W3C traceparent header.",
      "Logging sensitive PII (passwords, credit card numbers) in distributed trace tags."
    ],
    proTips: [
      "Configure adaptive sampling in Application Insights to capture 100% of errors while sampling down high-frequency health probes to save log ingestion costs."
    ]
  },
  {
    id: "q-cloud-9",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["APIM", "API Gateway", "mTLS", "Security"],
    title: "Azure API Management (APIM): Policies, Rate Limiting, and Mutual TLS (mTLS)",
    pitch: "Azure API Management (APIM) acts as an enterprise edge API Gateway sitting between client applications and backend microservices. It centralizes cross-cutting API policies using XML-based execution expressions: JWT validation, header transformations, response caching, IP filtering, and quota rate limits. For zero-trust backend security, APIM authenticates to backend App Services using Mutual TLS (mTLS) with client certificates or private virtual network (VNet) integration.",
    deepDive: `APIM Processing Lifecycle:
1. Inbound: Evaluates policies before forwarding to backend (JWT verification, rate limit check).
2. Backend: Routes to HTTP backend or Service Fabric/AKS service.
3. Outbound: Modifies response before sending to caller (stripping internal headers like Server, X-Powered-By, masking sensitive data).
4. On-Error: Custom exception formatting returning standardized RFC 7807 ProblemDetails.

Zero-Trust with Mutual TLS (mTLS):
- Backend web APIs are configured with 'ClientCertEnabled = true'.
- Only APIM presents a trusted public certificate thumbprint during the TLS handshake.
- Direct public access to backend microservices is blocked; all traffic is forced through APIM.`,
    codeSnippet: `<!-- APIM Policy: Enforce JWT validation and rate limiting by ClientId -->
<policies>
  <inbound>
    <base />
    <!-- Validate Microsoft Entra ID Bearer Token -->
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized">
      <openid-config url="https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration" />
      <required-claims>
        <claim name="aud" match="all">
          <value>api://orders-production</value>
        </claim>
      </required-claims>
    </validate-jwt>

    <!-- Rate limit by Client ID claim: 100 calls per 60 seconds -->
    <rate-limit-by-key calls="100" renewal-period="60" 
      counter-key="@(context.Request.Headers.GetValueOrDefault("Authorization","").AsJwt()?.Subject)" />
  </inbound>
</policies>`,
    redFlags: [
      "Leaving backend microservices exposed directly to the public internet without IP restrictions or mTLS.",
      "Duplicating JWT validation and CORS logic in 20 separate backend APIs instead of centralizing in APIM."
    ],
    proTips: [
      "Use APIM Named Values linked to Azure Key Vault secrets so certificate thumbprints and API keys rotate automatically without modifying policies."
    ]
  },
  {
    id: "q-cloud-10",
    pillar: "cloud",
    seniority: "Senior",
    tags: ["Disaster Recovery", "Front Door", "Multi-Region", "High Availability"],
    title: "Cloud Disaster Recovery: Azure Front Door vs Traffic Manager and Active-Active Architecture",
    pitch: "Achieving a 99.99% enterprise SLA requires multi-region redundancy across paired Azure regions (e.g. East US and West Europe). Azure Traffic Manager is a DNS-level load balancer subject to DNS client caching TTLs (causing 1–5 minute failover delays). Azure Front Door is an Anycast Layer 7 reverse proxy operating at Microsoft's global edge network: it provides split-second instant failover, SSL termination at the edge, and WAF protection. Paired with Azure SQL Auto-Failover Groups, it delivers seamless disaster recovery.",
    deepDive: `Active-Active vs Active-Passive:
- Active-Passive (Hot Standby): Primary region serves all traffic; secondary region sits idle until failover. Simpler data model, but secondary compute costs run continuously.
- Active-Active (Multi-Region): Both regions serve read and write traffic simultaneously. Requires globally distributed databases like Azure Cosmos DB (Multi-Region Writes) or partitioning users geographically to prevent write conflicts.

Database Disaster Recovery:
- Azure SQL Auto-Failover Group: Asynchronously replicates transactions to secondary region.
- Failover Policy: Includes a grace period (e.g. 1 hour) for automatic failover to prevent false-positive failovers during brief network blips.
- Connection Strings: Clients connect to a single virtual listener ('mydb.database.windows.net') that Azure automatically redirects to the active primary.`,
    codeSnippet: `// Health probe endpoint in ASP.NET Core for Azure Front Door
app.MapGet("/health/ready", async (AppDbContext db) =>
{
    // Deep readiness check: verifies database connectivity
    var canConnect = await db.Database.CanConnectAsync();
    return canConnect 
        ? Results.Ok(new { Status = "Healthy", Region = Environment.GetEnvironmentVariable("REGION") })
        : Results.Problem("Database unavailable", statusCode: 503);
});`,
    redFlags: [
      "Having a shallow health check probe that returns 200 OK without verifying backend database connectivity.",
      "Failing over the web app to a secondary region while the database is still located in the primary region (causes crippling cross-region 80ms latency on every DB query)."
    ],
    proTips: [
      "Regularly conduct Chaos Engineering game-day exercises (e.g. using Azure Chaos Studio) to simulate a complete region outage and verify automated failover within your RTO and RPO targets."
    ]
  }
];

