// ============================================================================
// RAPID-FIRE FLASHCARDS DATA (POPULAR CURRICULUM)
// Spaced-Repetition Cards with Teenager Analogies across all 6 Core Modules
// ============================================================================

window.INTERVIEW_FLASHCARDS = [
  {
    "id": "fc-csharp-1",
    "pillar": "csharp",
    "topic": "OOP",
    "front": "What are the 4 fundamental pillars of Object-Oriented Programming (OOP)?",
    "back": "The 4 pillars are Encapsulation (bundling data with methods and restricting direct access via access modifiers), Abstraction (exposing only essential interfaces while hiding internal complexity), Inheritance (enabling a derived class to acquire properties and behavior from a base class), and Polymorphism (allowing different classes to be treated through a common interface via method overriding or overloading).\n\n💡 Teenager Analogy: Encapsulation is a car's engine under the hood; Abstraction is the steering wheel and pedals; Inheritance is a sports car sharing a chassis with a sedan; Polymorphism is pressing the gas pedal on either an electric or gas car and having each accelerate in its own way.",
    "seniorTip": "In enterprise .NET architecture, always mention favoring Composition over Inheritance: deep inheritance trees create tight coupling and testability headaches."
  },
  {
    "id": "fc-csharp-2",
    "pillar": "csharp",
    "topic": "OOP",
    "front": "Method Overloading vs. Method Overriding: What is the difference?",
    "back": "Method Overloading is compile-time (static) polymorphism where multiple methods in the same class share the same name but differ in parameter types or counts. Method Overriding is runtime (dynamic) polymorphism where a derived class provides a specific implementation of a virtual or abstract method defined in its base class using the override keyword.\n\n💡 Teenager Analogy: Overloading is a multi-tool that opens cans, bottles, or screws depending on what you hand it; Overriding is a child following the family recipe but substituting an ingredient to make their own version.",
    "seniorTip": "Mark overridden methods as 'sealed' if you want to prevent further subclasses down the inheritance chain from overriding them again."
  },
  {
    "id": "fc-csharp-3",
    "pillar": "csharp",
    "topic": "OOP",
    "front": "Interface or abstract class: when would you use each?",
    "back": "Use an interface to define a capability or contract that unrelated classes can implement without dictating their hierarchy. Use an abstract class when related types need shared implementation behavior or protected internal state, while still leaving specific operations abstract for subclasses.\n\n💡 Teenager Analogy: An interface is a driver's license requirement (anyone can qualify regardless of family); an abstract class is a basic car frame shared by related vehicle models.",
    "seniorTip": "Always design public API service boundaries with interfaces (e.g. ICustomerService); use abstract base classes internally within the domain model for shared entity invariants."
  },
  {
    "id": "fc-csharp-4",
    "pillar": "csharp",
    "topic": "SOLID",
    "front": "Explain the SOLID principles with concrete C# examples.",
    "back": "SOLID comprises 5 core object-oriented design principles: Single Responsibility (a class should have one reason to change), Open/Closed (open for extension, closed for modification), Liskov Substitution (subtypes must be substitutable for their base types), Interface Segregation (clients should not depend on interfaces they do not use), and Dependency Inversion (high-level modules should depend on abstractions, not concretions).\n\n💡 Teenager Analogy: SRP is a chef cooking instead of delivering food; OCP is adding a phone attachment without opening the phone; LSP is a stunt double doing everything the actor can do; ISP is a TV remote with only the buttons you need; DIP is plugging into a wall outlet rather than hardwiring your appliance to the electric grid.",
    "seniorTip": "In ASP.NET Core, the built-in DI container (IServiceCollection) is the direct manifestation of the Dependency Inversion Principle (DIP)."
  },
  {
    "id": "fc-csharp-5",
    "pillar": "csharp",
    "topic": "Class",
    "front": "Class vs. Struct in C#: Value Types vs. Reference Types, Stack vs. Heap, and Boxing",
    "back": "A class is a reference type allocated on the managed heap, copied by reference pointer, and collected by the Garbage Collector. A struct is a value type allocated inline where declared (typically on the execution stack or inside an enclosing object), copied by value, and cleaned up when its scope exits. Boxing occurs when a value type is cast to object or an interface, forcing a heap allocation and copy.\n\n💡 Teenager Analogy: A struct is like printing a physical coupon: handing it to someone gives them their own copy. A class is a Google Doc link: everyone points to the same document, and changes are visible to all.",
    "seniorTip": "Declare structs as 'readonly struct' in modern C#: the compiler guarantees immutability and eliminates hidden defensive copies when passed with the 'in' modifier."
  },
  {
    "id": "fc-csharp-6",
    "pillar": "csharp",
    "topic": "Access Modifiers",
    "front": "Access Modifiers in C#: public, private, protected, internal, and combinations",
    "back": "Access modifiers control member and type visibility. 'public' is accessible anywhere; 'private' is accessible only within the declaring type; 'protected' is accessible within the type and derived subclasses; 'internal' is accessible anywhere within the same assembly; 'protected internal' allows access from derived classes OR anywhere in the same assembly; 'private protected' allows access from derived classes ONLY within the same assembly.\n\n💡 Teenager Analogy: Public is a public billboard; Private is your private diary; Protected is family heirlooms; Internal is an office bulletin board; Protected Internal is anyone in the building plus family outside; Private Protected is family members who work in the same building.",
    "seniorTip": "In Clean Architecture, make internal services and repository implementations 'internal' and expose only interfaces: this prevents junior developers from bypassing service layers and instantiating repositories directly."
  },
  {
    "id": "fc-csharp-7",
    "pillar": "csharp",
    "topic": "static",
    "front": "The static keyword: Static Classes, Methods, Constructors (.cctor), and Singletons",
    "back": "The 'static' keyword declares members that belong to the type itself rather than an instance. A static class cannot be instantiated, cannot inherit or be inherited from, and cannot implement interfaces. Static constructors (.cctor) are parameterless, run exactly once before the type is first accessed or instantiated, and are thread-safe and lazily invoked by the CLR.\n\n💡 Teenager Analogy: A static class is the building's central heating furnace: there is only one for the entire building, and no tenant installs their own personal furnace.",
    "seniorTip": "Reserve static classes for pure, stateless utility functions (e.g. StringUtils, RegexHelpers, Math). For stateful services, always use DI Singletons (services.AddSingleton<T>)."
  },
  {
    "id": "fc-csharp-8",
    "pillar": "csharp",
    "topic": "Composition",
    "front": "Composition vs. Inheritance: Why favor composition?",
    "back": "Inheritance creates a tight, compile-time 'is-a' coupling where derived classes depend directly on base class implementation details (the fragile base class problem). Composition establishes a loose 'has-a' relationship where an object encapsulates references to interfaces, delegating tasks at runtime. Favoring composition provides superior flexibility, testability, and runtime interchangeability.\n\n💡 Teenager Analogy: Inheritance is being born with your parents' physical traits; Composition is hiring a photographer, a caterer, and a DJ for an event: you can swap the DJ without changing who you are.",
    "seniorTip": "Apply the 'Is-A' vs 'Has-A' rule: If an object merely uses behavior, it 'Has-A' dependency (composition). Only use inheritance if Liskov Substitution holds true 100% of the time."
  },
  {
    "id": "fc-csharp-9",
    "pillar": "csharp",
    "topic": "ref",
    "front": "ref vs. out vs. in: Parameter Passing Semantics and Memory Safety",
    "back": "'ref' passes an existing variable by reference (must be initialized before calling, allows both read and write). 'out' passes by reference to return multiple values (the callee is required to assign before returning). 'in' passes a value type by read-only reference, eliminating stack-copy overhead for large structs while preventing modification. In IL, all three emit managed pointers (&).\n\n💡 Teenager Analogy: ref is handing someone a notebook to add or edit notes; out is handing someone a blank form they must fill out before giving it back; in is letting someone read your notebook under glass without touching it.",
    "seniorTip": "Use 'in' only for structs larger than 16 bytes (IntPtr.Size * 2). For primitives and small structs, pass by value directly."
  },
  {
    "id": "fc-csharp-10",
    "pillar": "csharp",
    "topic": "Task",
    "front": "What is the difference between a Task and a Thread?",
    "back": "A Thread is an operating-system level execution resource with its own 1MB stack memory and context-switching overhead. A Task is a higher-level promise representing an asynchronous operation that may or may not occupy a thread continuously. For web I/O operations, tasks release threads back to the ThreadPool while waiting for database or network responses.\n\n💡 Teenager Analogy: A thread is a hired worker; a task is a job ticket. The worker can pick up a ticket, start it, put it on hold while waiting for materials, work on another ticket, and resume later.",
    "seniorTip": "For compute-bound CPU tasks, use Task.Run() to queue work to the ThreadPool. For I/O-bound tasks (database, HTTP, disk), use native async/await APIs without Task.Run()."
  },
  {
    "id": "fc-csharp-11",
    "pillar": "csharp",
    "topic": "async/await",
    "front": "How does async and await improve a web API?",
    "back": "For I/O-bound operations, await lets the HTTP request release its ThreadPool thread while waiting for the database or network response, freeing that thread to serve other concurrent web requests. This dramatically increases server throughput and scalability, though it does not make a single request run faster.\n\n💡 Teenager Analogy: While laundry runs, you can do homework instead of staring at the machine: that is better use of time, not a faster washer.",
    "seniorTip": "Always configure CancellationToken parameters on API controller actions and pass them to all EF Core and HttpClient methods to terminate wasted database queries when users navigate away."
  },
  {
    "id": "fc-csharp-12",
    "pillar": "csharp",
    "topic": "Task",
    "front": "Task vs. ValueTask: When should you return which, and what are the traps?",
    "back": "Task is a reference type that always allocates an object on the managed heap. ValueTask is a struct that avoids heap allocations when an operation completes synchronously (e.g., in-memory cache hit). However, ValueTask cannot be awaited multiple times or awaited concurrently. If needed multiple times, convert it to Task using .AsTask().\n\n💡 Teenager Analogy: Task is buying an expensive reusable container for every meal; ValueTask is a paper cup: zero-cost if you drink right away, but you cannot reuse it or pass it around to multiple people.",
    "seniorTip": "Rule of thumb: Return ValueTask<T> only if performance profiling shows high invocation frequency AND > 20% of calls complete synchronously."
  },
  {
    "id": "fc-csharp-13",
    "pillar": "csharp",
    "topic": "GC",
    "front": "CLR Garbage Collection: Generations (Gen 0/1/2), the 85KB LOH Threshold, and ArrayPool",
    "back": "The CLR GC is a generational, tracing garbage collector operating on three ephemeral generations (Gen 0 for short-lived items, Gen 1 as a buffer, and Gen 2 for long-lived singletons). Objects >= 85,000 bytes bypass ephemeral segments and go directly to the Large Object Heap (LOH), which is collected during Gen 2 and is not compacted by default, risking memory fragmentation. ArrayPool<T> prevents LOH allocation churn.\n\n💡 Teenager Analogy: Gen 0 is the trash can by your desk; Gen 1 is the hallway dumpster; Gen 2 is the city landfill; LOH is oversize bulky trash that requires special pickup and is rarely rearranged.",
    "seniorTip": "Always inspect buffer.Length when renting from ArrayPool: ArrayPool may return an array larger than requested! Never assume rentedBuffer.Length == requestedSize."
  },
  {
    "id": "fc-csharp-14",
    "pillar": "csharp",
    "topic": "IDisposable",
    "front": "The Standard IDisposable and IAsyncDisposable Pattern with Finalizers",
    "back": "The standard Dispose pattern provides deterministic cleanup of unmanaged OS resources (file handles, network sockets, unmanaged pointers) before non-deterministic GC collection. Implementing IDisposable with Dispose(bool disposing) and GC.SuppressFinalize(this) removes the object from the Finalization Queue, avoiding costly Gen 2 finalizer promotion. Modern .NET also requires IAsyncDisposable with DisposeAsync() for non-blocking asynchronous cleanup via 'await using'.\n\n💡 Teenager Analogy: Dispose is turning off your car engine and locking the doors when you arrive; the Finalizer is the tow truck hauling away an abandoned car days later.",
    "seniorTip": "Wrap native OS pointers with SafeHandle instead of raw IntPtr: SafeHandle derives from CriticalFinalizerObject and guarantees cleanup even during thread aborts or out-of-memory exceptions."
  },
  {
    "id": "fc-csharp-15",
    "pillar": "csharp",
    "topic": "Delegates",
    "front": "Delegates vs. Events: Encapsulation and Memory Leak Traps",
    "back": "A delegate is a type-safe object-oriented function pointer inheriting from System.MulticastDelegate with an internal linked invocation list. An 'event' is a compiler-enforced encapsulation wrapper over a delegate: it restricts external consumers to only adding (+=) or removing (-=) handlers, preventing external code from invoking the delegate directly or accidentally resetting subscribers with '= null'. The classic senior bug is the 'Lapsed Listener' memory leak: subscribing a short-lived object's method to a long-lived publisher prevents the subscriber from ever being collected by GC.\n\n💡 Teenager Analogy: A delegate is an open sign-up sheet anyone can erase or trigger; an event is a secure mailbox where you can submit or cancel your subscription, but only the owner can send the broadcast.",
    "seniorTip": "In modern C#, favor built-in Action<T> and Func<T, TResult> over custom delegate types unless you need 'ref' parameters or custom parameter names in API signatures."
  },
  {
    "id": "fc-csharp-16",
    "pillar": "csharp",
    "topic": "const",
    "front": "const vs. readonly vs. static readonly: Compile-Time Inlining and Assembly Versioning",
    "back": "'const' is evaluated at compile-time: the Roslyn compiler literally inlines the literal primitive or string value directly into the calling assembly's IL bytecode. If assembly A changes a 'const' and is redeployed without recompiling assembly B, assembly B silently retains the stale hardcoded value. In contrast, 'readonly' and 'static readonly' fields are evaluated at runtime (in instance constructors or the static class constructor .cctor), referencing the live memory address and supporting reference types and cross-assembly updates without breaking changes.\n\n💡 Teenager Analogy: const is printing the price on the box at the factory; static readonly is looking up the price at the register when the item is scanned.",
    "seniorTip": "Rule of thumb: Only use 'const' for true mathematical or unchanging constants (like Math.PI, DaysInWeek = 7). For configuration defaults and URLs across assemblies, always use 'static readonly'."
  },
  {
    "id": "fc-csharp-17",
    "pillar": "csharp",
    "topic": "string",
    "front": "String Immutability, String Interning, and StringBuilder Performance",
    "back": "Strings in C# are immutable reference types: any modification (concatenation, Replace, Substring) allocates a brand-new string on the managed heap. Repeated string concatenation in loops generates massive Gen 0 GC churn. StringBuilder uses an internal mutable char buffer that expands as needed, eliminating intermediate allocations. String Interning maintains a CLR-wide table of unique string literals to share identical references across the AppDomain.\n\n💡 Teenager Analogy: String immutability is writing in stone: to fix a typo, you must carve a brand-new stone tablet. StringBuilder is a whiteboard where you can write, erase, and append until you take the final photo.",
    "seniorTip": "In modern .NET, for combining small sequences, prefer 'string.Join(',', ids)' or 'string.Create()' which allocate the exact buffer size up-front with zero intermediate allocations."
  },
  {
    "id": "fc-csharp-18",
    "pillar": "csharp",
    "topic": "Exceptions",
    "front": "Exception Handling Best Practices: throw vs. throw ex, try-catch-finally, and Custom Exceptions",
    "back": "In C#, using 'throw;' rethrows the caught exception while fully preserving the original call stack and line numbers. Using 'throw ex;' overwrites the stack trace, making it appear that the error originated right at that catch block and obscuring the true root cause. Catch blocks should only be used when you can genuinely handle the failure, add domain context, or log diagnostics before rethrowing.\n\n💡 Teenager Analogy: throw; is forwarding the original police report with all timestamps intact; throw ex; is tearing up the report and filing a new one in your own name, erasing where the crime actually happened.",
    "seniorTip": "Use C# Exception Filters 'catch (Exception ex) when (condition)': if the condition is false, the stack is NOT unwound, which preserves the original crash dump state for tools like Azure Application Insights."
  },
  {
    "id": "fc-aspnet-1",
    "pillar": "aspnet",
    "topic": "Controllers",
    "front": "How do you keep an ASP.NET Core controller thin?",
    "back": "The controller should handle only HTTP-level concerns: route matching, model validation, authorization checks, and HTTP status code mapping. All business calculations, workflow coordination, domain rules, and data access should be delegated to a dedicated service or manager layer. This keeps workflow logic reusable, maintainable, and easily unit-testable without mocking HttpContext.\n\n💡 Teenager Analogy: A restaurant waiter takes the order and delivers the result; the kitchen contains the cooking rules and prepares the meal.",
    "seniorTip": "Use CQRS with MediatR (IRequest<TResponse>) or Minimal API endpoint filters to keep endpoint handlers strictly under 15 lines of code."
  },
  {
    "id": "fc-aspnet-2",
    "pillar": "aspnet",
    "topic": "Dependency Injection",
    "front": "What is dependency injection, and why use it?",
    "back": "Dependency Injection (DI) supplies a class with the dependencies it needs from the outside (typically via constructor injection) instead of letting the class construct them directly with 'new'. It reduces tight coupling, centralizes component configuration and lifetimes, and makes units trivial to test by substituting mock implementations.\n\n💡 Teenager Analogy: A school provides each classroom with approved supplies instead of every teacher building their own desks and printers from scratch.",
    "seniorTip": "Always program against interfaces (e.g. IEmailSender) rather than concrete classes: this makes swapping providers (e.g., SendGrid to AWS SES) a one-line change in Program.cs."
  },
  {
    "id": "fc-aspnet-3",
    "pillar": "aspnet",
    "topic": "DI Lifetimes",
    "front": "Explain transient, scoped, and singleton service lifetimes in ASP.NET Core.",
    "back": "Transient creates a brand-new instance every single time the service is requested. Scoped creates one single instance per client HTTP request (shared across all components within that request). Singleton creates one instance the first time it is requested and reuses that same instance for the entire lifetime of the application. A scoped service (like DbContext) must NEVER be injected into a singleton.\n\n💡 Teenager Analogy: Transient is a fresh worksheet per use; Scoped is one shared folder for a student's office visit; Singleton is the school clock on the wall shared all year by everyone.",
    "seniorTip": "Always leave 'builder.Host.UseDefaultServiceProvider(o => o.ValidateScopes = true)' enabled in development to fail fast on startup if a captive dependency is introduced."
  },
  {
    "id": "fc-aspnet-4",
    "pillar": "aspnet",
    "topic": "Middleware",
    "front": "What is the difference between middleware and filters in ASP.NET Core?",
    "back": "Middleware participates in the global HTTP pipeline and executes for every incoming request (including static files, WebSockets, and health checks) before routing reaches an endpoint. It has access only to raw HttpContext. MVC Filters run inside the MVC routing pipeline after an endpoint is selected: they have access to controller context, action arguments, model binding, and ModelState.\n\n💡 Teenager Analogy: Middleware is school security at the main building entrance; a filter is a hall pass check applied inside a specific classroom.",
    "seniorTip": "Use Resource Filters for performance-sensitive caching: they execute before model binding, allowing you to return cached responses without paying the CPU cost of deserializing large JSON request bodies."
  },
  {
    "id": "fc-aspnet-5",
    "pillar": "aspnet",
    "topic": "REST",
    "front": "How do you design a REST API response and choose appropriate HTTP status codes?",
    "back": "Use resource-oriented routes, validate input upfront, return a consistent JSON response shape, and choose HTTP status codes that accurately match the outcome: 200 for OK, 201 for Created (with Location header), 204 for No Content (successful update/delete), 400 for Bad Request (validation errors), 401 for Unauthorized, 403 for Forbidden, 404 for Not Found, and 409 for Conflict.\n\n💡 Teenager Analogy: A package tracking code should clearly say delivered, wrong address, missing package, or duplicate request instead of always saying 'something happened'.",
    "seniorTip": "In ASP.NET Core 7/8, call 'builder.Services.AddProblemDetails()' in Program.cs: it automatically standardizes all validation and runtime errors to the RFC 7807 ProblemDetails format."
  },
  {
    "id": "fc-aspnet-6",
    "pillar": "aspnet",
    "topic": "Idempotency",
    "front": "What is idempotency, and why does it matter in web APIs and background jobs?",
    "back": "An operation is idempotent if executing it multiple times produces the exact same server state as executing it once. In REST, GET, PUT, and DELETE are idempotent by definition, while POST is not. Idempotency is critical for network reliability: when mobile clients or payment systems experience timeout retries, idempotent endpoints prevent duplicate orders, double billing, or corrupt data.\n\n💡 Teenager Analogy: Pressing an elevator button five times requests one elevator, not five elevators. Setting a thermostat to 72 degrees ten times still results in 72 degrees.",
    "seniorTip": "Store idempotency keys with an expiration time (e.g. 24 hours) in Redis with atomic SETNX (Set if Not Exists) to prevent race conditions during rapid retries."
  },
  {
    "id": "fc-aspnet-7",
    "pillar": "aspnet",
    "topic": "Exception Handling",
    "front": "How do you handle exceptions in ASP.NET Core centrally?",
    "back": "Handle unexpected exceptions centrally using ASP.NET Core's UseExceptionHandler middleware or .NET 8's IExceptionHandler interface. Log sufficient diagnostics with correlation IDs, return safe standardized RFC 7807 ProblemDetails responses without exposing stack traces, and catch exceptions locally only when you can genuinely recover or enrich domain context.\n\n💡 Teenager Analogy: A school principal's office handles major campus emergencies consistently, while a teacher handles a missing pencil locally because the teacher can solve it immediately.",
    "seniorTip": "In .NET 8, combine 'builder.Services.AddProblemDetails()' with 'builder.Services.AddExceptionHandler<GlobalExceptionHandler>()' and 'app.UseExceptionHandler()' for full RFC 7807 compliance."
  },
  {
    "id": "fc-aspnet-8",
    "pillar": "aspnet",
    "topic": "Authentication",
    "front": "Authentication versus Authorization: What is the difference and how do they work in ASP.NET Core?",
    "back": "Authentication establishes WHO the caller is (verifying identity via credentials, tokens, or certificates). Authorization decides WHAT the authenticated caller is allowed to do (verifying permissions, roles, or claims). In ASP.NET Core, UseAuthentication() must precede UseAuthorization(), and authorization rules must always be enforced on the server regardless of what the UI hides.\n\n💡 Teenager Analogy: Authentication is checking your driver's license at airport security to verify your identity; Authorization is checking your boarding pass to see if you are allowed to enter the first-class lounge.",
    "seniorTip": "Use custom 'AuthorizationHandler<TRequirement>' for resource-based authorization (e.g., verifying that a user can only edit their OWN order: 'order.UserId == user.Id')."
  },
  {
    "id": "fc-aspnet-9",
    "pillar": "aspnet",
    "topic": "CancellationToken",
    "front": "Why pass a CancellationToken through backend code?",
    "back": "A CancellationToken allows database queries, HTTP client calls, and long-running operations to stop immediately when the client aborts the request, closes their browser tab, or when a timeout policy triggers. Passing it through async layers prevents server CPU, memory, and database connection pools from being wasted on computations whose results will never be read.\n\n💡 Teenager Analogy: If a customer leaves the restaurant, the waiter should notify the kitchen to stop cooking the meal before wasting ingredients nobody will eat.",
    "seniorTip": "Combine client tokens with server-side timeouts using 'CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutToken)' to enforce hard maximum execution limits."
  },
  {
    "id": "fc-aspnet-10",
    "pillar": "aspnet",
    "topic": "Hangfire",
    "front": "How do you make a Hangfire or background job safe to retry?",
    "back": "Make the job idempotent, persist state changes to durable storage, log a correlation identifier, and separate retryable transient network failures from permanent validation errors. Inputs should be minimal and serializable (e.g. passing an entity ID rather than an entire object), with the job reloading fresh data from the database upon execution.\n\n💡 Teenager Analogy: A delivery driver may retry the route if a gate was locked, but the system must prevent the package from being delivered and charged twice.",
    "seniorTip": "Use the Hangfire attribute '[AutomaticRetry(Attempts = 3, OnAttemptsExceeded = AttemptsExceededAction.Fail)]' and log the Hangfire JobId as a correlation identifier in structured logs."
  },
  {
    "id": "fc-aspnet-11",
    "pillar": "aspnet",
    "topic": "IHttpClientFactory",
    "front": "IHttpClientFactory: Solving TIME_WAIT socket exhaustion and stale DNS resolution",
    "back": "Instantiating 'new HttpClient()' for every request exhausts operating system TCP sockets in the TIME_WAIT state under high traffic. Conversely, reusing a single static HttpClient indefinitely never honors DNS changes when backend IPs rotate. IHttpClientFactory solves both: it pools underlying HttpMessageHandler instances to eliminate socket exhaustion, while rotating them every 2 minutes to refresh DNS records.\n\n💡 Teenager Analogy: new HttpClient() is buying a new phone for every phone call; static HttpClient is never checking if your doctor's office changed their phone number; IHttpClientFactory is a shared company phone pool with an updated directory.",
    "seniorTip": "In modern .NET Core / .NET 8, using a single SocketsHttpHandler with 'PooledConnectionLifetime = TimeSpan.FromMinutes(2)' achieves the exact same benefits as IHttpClientFactory without requiring the factory dependency."
  },
  {
    "id": "fc-aspnet-12",
    "pillar": "aspnet",
    "topic": "CORS",
    "front": "CORS Architecture: Same-Origin Policy, Preflight OPTIONS, and Middleware Ordering",
    "back": "CORS is a browser-enforced security policy preventing unauthorized cross-origin HTTP requests. For requests with custom headers, PUT/DELETE, or JSON, browsers send an HTTP OPTIONS preflight request. In ASP.NET Core, app.UseCors() must be placed strictly after app.UseRouting() and before app.UseAuthentication() and app.UseAuthorization(). A fatal trap is configuring AllowAnyOrigin() with AllowCredentials(), which browsers reject outright.\n\n💡 Teenager Analogy: CORS is the bouncer at the door checking an approved guest list; the preflight OPTIONS request is calling ahead to verify the dress code before arriving.",
    "seniorTip": "Set 'SetPreflightMaxAge(TimeSpan.FromHours(2))' in production CORS policies to prevent browsers from issuing a wasteful HTTP OPTIONS round-trip before every single API call."
  },
  {
    "id": "fc-aspnet-13",
    "pillar": "aspnet",
    "topic": "Minimal APIs",
    "front": "Minimal APIs vs. Controller-Based APIs: Performance, Architecture, and Endpoint Filters",
    "back": "Minimal APIs route HTTP requests directly to lambda handlers or static methods, completely bypassing MVC controller discovery, reflection overhead, and filter pipelines. This yields faster cold starts, lower memory usage, and higher throughput. Controller-based APIs provide structured conventions for large enterprise applications with dozens of endpoints. Minimal APIs in .NET 7/8 support Endpoint Filters, validation, and full OpenAPI documentation.\n\n💡 Teenager Analogy: A Controller is a multi-story department store with escalators and cashiers; a Minimal API is an express drive-thru window serving exactly what you ordered.",
    "seniorTip": "Organize Minimal APIs in enterprise apps using 'ICarterModule' or extension methods on 'IEndpointRouteBuilder' to group endpoints by business aggregate."
  },
  {
    "id": "fc-aspnet-14",
    "pillar": "aspnet",
    "topic": "JWT",
    "front": "Production JWT Authentication and Refresh Token Rotation with Reuse Detection",
    "back": "Stateless JWT access tokens should be short-lived (e.g. 15 minutes) to minimize exposure if intercepted. Refresh Token Rotation issues a brand-new single-use refresh token every time the access token is refreshed, immediately invalidating the previous refresh token. Reuse Detection detects if an already-used refresh token is presented: if detected, the auth server identifies a token theft breach, revokes the entire token family, and forces re-authentication.\n\n💡 Teenager Analogy: An access token is a 15-minute visitor badge; a refresh token is a numbered claim ticket. Every time you show your claim ticket, it gets shredded and you receive a new one. If someone shows an already-shredded ticket, the alarm sounds because a clone exists.",
    "seniorTip": "Always store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies: this makes them completely invisible to malicious client-side JavaScript."
  },
  {
    "id": "fc-efcore-1",
    "pillar": "efcore",
    "topic": "LINQ",
    "front": "What is the difference between IEnumerable and IQueryable in LINQ?",
    "back": "IEnumerable represents in-memory iteration using compiled delegates (Func<T, bool>) where filtering executes on the client machine in CLR memory. IQueryable represents an out-of-process query using Expression Trees (Expression<Func<T, bool>>) that a provider like Entity Framework translates into native SQL for database-side execution. Calling .ToList() too early moves expensive filtering and sorting into application memory.\n\n💡 Teenager Analogy: IQueryable gives the librarian a precise request so they fetch only the 3 books you need; IEnumerable brings every single book in the library to your desk and forces you to search through them yourself.",
    "seniorTip": "Keep query specifications as IQueryable<T> inside Repository layers only while building clauses; materialize to Task<List<TDto>> before returning to API controllers to prevent leaky abstraction bugs."
  },
  {
    "id": "fc-efcore-2",
    "pillar": "efcore",
    "topic": "EF Core",
    "front": "When do you use AsNoTracking in Entity Framework Core?",
    "back": "Use AsNoTracking for read-only queries when you do not intend to modify, update, or delete the returned entities in the current DbContext. Bypassing the Change Tracker eliminates snapshot creation, identity map registration, and memory retention, providing a 40–60% performance and memory gain on large datasets.\n\n💡 Teenager Analogy: When reading a library book's title, you do not need a clipboard tracking every single page you touched.",
    "seniorTip": "Configure 'UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)' globally on DbContext in read-heavy applications, and explicitly call '.AsTracking()' only on update paths."
  },
  {
    "id": "fc-efcore-3",
    "pillar": "efcore",
    "topic": "EF Core",
    "front": "How do you avoid the N+1 query problem in Entity Framework Core?",
    "back": "The N+1 problem occurs when an application executes 1 initial query to fetch parent rows, followed by N separate SQL queries inside a loop to fetch child rows for each parent. Avoid it by inspecting generated SQL and using direct DTO projection (.Select()), deliberate eager loading (.Include()), or purpose-built join queries instead of lazy loading navigations.\n\n💡 Teenager Analogy: Do not visit the grocery store once for each ingredient; make one complete shopping list and execute one planned trip.",
    "seniorTip": "Always prefer direct LINQ projection (.Select()) over .Include(): projection only pulls requested columns, bypassing the change tracker and generating optimal SQL subqueries."
  },
  {
    "id": "fc-efcore-4",
    "pillar": "efcore",
    "topic": "DbContext",
    "front": "What is the correct lifetime and usage of DbContext in ASP.NET Core?",
    "back": "DbContext represents a short-lived Unit of Work and Identity Map that should typically be registered with a Scoped lifetime (one instance per HTTP request). DbContext is NOT thread-safe: it must never be shared across concurrent asynchronous operations, stored in static fields, or injected directly into a Singleton service.\n\n💡 Teenager Analogy: A DbContext is one student's assignment folder for one class period, not a school-wide cabinet edited by 500 students at the same moment.",
    "seniorTip": "Use 'AddDbContextPool<AppDbContext>' in high-throughput APIs: it pools reusable DbContext instances, reducing the memory allocation cost of instantiating contexts on every HTTP request."
  },
  {
    "id": "fc-efcore-5",
    "pillar": "efcore",
    "topic": "Transactions",
    "front": "When do you use a database transaction, and how do you implement it in EF Core?",
    "back": "Use an explicit database transaction when multiple database operations across one or more SaveChanges() calls or raw SQL commands must succeed or fail together as a single atomic unit. Keep the transaction as short as practical, choose an appropriate isolation level, and avoid slow external HTTP or filesystem calls while database locks are held.\n\n💡 Teenager Analogy: Buying a plane ticket and assigning its seat must happen together: you should not pay for the ticket and then discover the seat was given away.",
    "seniorTip": "In modern C#, 'await using var tx = await db.Database.BeginTransactionAsync(ct);' guarantees an automatic rollback upon disposal if CommitAsync was not reached due to an exception."
  },
  {
    "id": "fc-efcore-6",
    "pillar": "efcore",
    "topic": "Concurrency",
    "front": "How do you handle concurrent updates in EF Core? (Optimistic vs. Pessimistic Concurrency)",
    "back": "Choose the concurrency control based on conflict frequency: Optimistic Concurrency works best when collisions are rare, using a SQL Server RowVersion / byte[] column to detect if another session changed the row before committing. If changed, EF Core throws DbUpdateConcurrencyException. Pessimistic Concurrency uses database locks (e.g. sp_getapplock or UPDLOCK) when collisions are frequent or for critical workflow operations where retries are unacceptable.\n\n💡 Teenager Analogy: Optimistic concurrency is checking whether the shared document changed before clicking save; a workflow lock is the physical key to a shared equipment room that only one person can hold at a time.",
    "seniorTip": "For financial workflows or state transitions where retries are dangerous, combine optimistic RowVersion checks with SQL Server application locks ('sp_getapplock') to serialize critical execution paths."
  },
  {
    "id": "fc-efcore-7",
    "pillar": "efcore",
    "topic": "EF Core",
    "front": "EF Core Split Queries (.AsSplitQuery): Mitigating Cartesian Product Explosions",
    "back": "When eagerly loading multiple 1:N child collections in a single LINQ query via .Include(), SQL Server creates a Cartesian product JOIN that duplicates parent columns for every child combination. .AsSplitQuery() splits the operation into multiple distinct SQL queries (one for the parent table, one for each child collection), drastically reducing transferred data volume and database memory grants.\n\n💡 Teenager Analogy: If a student has 10 classes and 5 clubs, sending one spreadsheet pairing every class with every club creates 50 redundant rows; sending one class list and one club list sends only 15 rows.",
    "seniorTip": "Configure 'UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)' globally in Program.cs for applications that frequently load multi-collection aggregates."
  },
  {
    "id": "fc-efcore-8",
    "pillar": "efcore",
    "topic": "First",
    "front": "First vs. FirstOrDefault vs. Single vs. SingleOrDefault: SQL Generation (TOP 1 vs TOP 2)",
    "back": "First and FirstOrDefault generate 'SELECT TOP (1)' in SQL Server, stopping index traversal immediately on the first match. Single and SingleOrDefault generate 'SELECT TOP (2)' because SQL Server must verify that a second matching row does NOT exist to guarantee uniqueness. If more than one row matches, Single throws InvalidOperationException.\n\n💡 Teenager Analogy: FirstOrDefault is finding the first student wearing a red shirt and stopping; SingleOrDefault checks the entire classroom to make sure NO OTHER student is wearing a red shirt.",
    "seniorTip": "In .NET 6+, use 'FirstOrDefault(predicate, defaultValue)' to specify an explicit non-null fallback object instead of checking for null after execution."
  },
  {
    "id": "fc-efcore-9",
    "pillar": "efcore",
    "topic": "Eager Loading",
    "front": "Eager Loading vs. Explicit Loading vs. Lazy Loading in EF Core",
    "back": "Eager loading (.Include()) loads related entities upfront in the initial query via SQL JOINs. Explicit loading (entry.Collection().LoadAsync()) loads navigations on-demand for an entity that is already tracked. Lazy loading automatically loads related data when a virtual navigation property is accessed, which introduces hidden N+1 query storms and circular JSON serialization crashes.\n\n💡 Teenager Analogy: Eager loading is packing all travel luggage into the car before leaving; Explicit loading is stopping at a store to buy an item only if needed; Lazy loading is driving back home every time you realize you forgot a toothbrush.",
    "seniorTip": "In high-performance REST APIs, prefer direct DTO projection (.Select()) over .Include(): EF Core will only query the exact columns requested and completely bypass entity tracking overhead."
  },
  {
    "id": "fc-efcore-10",
    "pillar": "efcore",
    "topic": "Code-First",
    "front": "Code-First vs. Database-First: Scaffolding, Migrations, and Team Schema Governance",
    "back": "Code-First defines database models using C# classes and Fluent API configurations, automating incremental schema evolution via 'dotnet ef migrations add'. Database-First begins with an existing relational database and generates C# entities using 'dotnet ef dbcontext scaffold'. For enterprise production deployments, never run Database.Migrate() at application startup; use idempotent SQL migration bundles in CI/CD pipelines.\n\n💡 Teenager Analogy: Code-First is architecting a house from modern architectural software blueprints; Database-First is scanning an existing building to produce architectural drawings.",
    "seniorTip": "Use 'dotnet ef migrations bundle' in Docker-based CI/CD pipelines: it creates a self-contained executable that applies migrations without requiring the full .NET SDK to be installed on the deployment agent."
  },
  {
    "id": "fc-efcore-11",
    "pillar": "efcore",
    "topic": "LINQ",
    "front": "LINQ Deferred Execution vs. Immediate Execution and the Multiple Enumeration Bug",
    "back": "LINQ query definitions (Where, Select, Skip, Take) use deferred execution: defining the query does not execute it or allocate collection memory. Execution occurs only when the sequence is enumerated (via foreach, .ToList(), .Count(), etc.). However, iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database round-trip or calculation) to re-execute every single time.\n\n💡 Teenager Analogy: A recipe is deferred execution: writing the recipe does not bake the cake; following the instructions bakes the cake. If you bake the cake every time someone asks if you have one, you waste hours.",
    "seniorTip": "In API contracts, if a method returns an already-materialized collection, specify 'IReadOnlyList<T>' or 'List<T>' as the return type instead of 'IEnumerable<T>' to communicate that the sequence is safe to enumerate repeatedly."
  },
  {
    "id": "fc-efcore-12",
    "pillar": "efcore",
    "topic": "Any()",
    "front": "LINQ Any() vs. Count() > 0: Short-Circuiting vs. Full Table Scans",
    "back": "To check for the presence of elements, .Any() is asymptotically superior because it short-circuits on the very first match: in-memory, it calls MoveNext() once and returns true immediately. In EF Core, it compiles to 'IF EXISTS (SELECT 1 FROM ...)', terminating index traversal at row 1. In contrast, .Count() > 0 forces an eager evaluation of the entire sequence: in SQL, it generates 'SELECT COUNT(*)', reading all matching pages.\n\n💡 Teenager Analogy: Any() is checking if a restaurant has an open table and taking the first one you see; Count() > 0 is counting every empty chair in the entire building before deciding to sit down.",
    "seniorTip": "For in-memory List<T>, use 'list.Exists(match)' instead of 'list.Any(match)': Exists is an optimized struct-based internal loop that does not allocate an enumerator instance on the heap."
  },
  {
    "id": "fc-sql-1",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is the difference between INNER JOIN and LEFT JOIN, and how do they handle NULLs?",
    "back": "An INNER JOIN returns only records that have matching keys in both tables. A LEFT JOIN returns all records from the left table, plus matched records from the right table; if no match exists, all columns from the right table are filled with NULLs. For filtering out existing records (anti-joins), a LEFT JOIN with a WHERE right.Key IS NULL is a classic pattern.\n\n💡 Teenager Analogy: A dance class: INNER JOIN pairs up dancers who both have partners; LEFT JOIN lists every dancer from your school, pairing them if a partner showed up or leaving the partner spot empty (NULL) if nobody came.",
    "seniorTip": "For anti-joins on large datasets, test 'NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerId = c.CustomerId)' against 'LEFT JOIN ... WHERE o.Id IS NULL'. In SQL Server, the optimizer often generates identical anti-semi-join plans, but NOT EXISTS is clearer and immune to NULL-in-WHERE conversion bugs."
  },
  {
    "id": "fc-sql-2",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is the difference between WHERE and HAVING in SQL?",
    "back": "WHERE filters raw individual rows before any grouping or aggregate functions are calculated. HAVING filters the summarized groups after the GROUP BY and aggregate functions have executed. You cannot use aggregate functions like SUM() or COUNT() in a WHERE clause, and filtering non-aggregate columns in HAVING instead of WHERE forces SQL Server to aggregate unnecessary rows first, destroying performance.\n\n💡 Teenager Analogy: Grading high schoolers: WHERE filters out students who were absent before calculating the class averages; HAVING filters out entire classrooms whose overall average score fell below 75%.",
    "seniorTip": "Remember the query processing mnemonic: 'Fresh Wind Gives Heavy Scented Daisies Open' -> FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY."
  },
  {
    "id": "fc-sql-3",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How do Window Functions differ from GROUP BY, and when do you use ROW_NUMBER vs DENSE_RANK vs RANK?",
    "back": "GROUP BY collapses multiple rows into a single summary row per group. Window functions (OVER clause) calculate aggregates or rankings across a partitioned window of rows while preserving each individual row's identity and detail columns. Among ranking functions: ROW_NUMBER assigns unique sequential integers (1,2,3,4) regardless of ties; RANK skips numbers on ties (1,2,2,4); and DENSE_RANK does not skip numbers on ties (1,2,2,3).\n\n💡 Teenager Analogy: GROUP BY replaces every row in a department with one manager report stating '5 employees, average salary $100k'. A Window Function leaves every employee seated at their desk, but tapes a sticker to their computer showing their rank and the department average salary next to their individual name.",
    "seniorTip": "Window functions cannot be placed directly in WHERE or HAVING clauses because WHERE is evaluated in Step 2, long before Step 5 (Window/SELECT). Always wrap in a CTE or subquery to filter on 'rn = 1'."
  },
  {
    "id": "fc-sql-4",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is the difference between a Clustered Index and a Nonclustered Index?",
    "back": "A Clustered Index physically determines the storage order of the actual table data rows on disk; therefore, a table can only have one clustered index (usually the Primary Key). The leaf level of a clustered index IS the table data. A Nonclustered Index is a separate B-tree structure that stores indexed key columns plus a row locator (pointer or clustering key) pointing back to the actual data row. A table can have many nonclustered indexes.\n\n💡 Teenager Analogy: A phone book is a Clustered Index (entries are physically sorted alphabetically by last name from page 1 to the end). The index at the back of a textbook is a Nonclustered Index (topics sorted alphabetically, each with a page number pointing to where the full text lives).",
    "seniorTip": "If you use GUIDs as primary keys, use 'NEWSEQUENTIALID()' instead of 'NEWID()', or keep the primary key as a nonclustered GUID and cluster on an internal sequential BIGINT IDENTITY column to prevent devastating B-Tree page splitting."
  },
  {
    "id": "fc-sql-5",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is a Covering Index and how do INCLUDE columns prevent Key Lookups?",
    "back": "A Covering Index contains all columns requested by a specific query in its B-tree structure, allowing SQL Server to fulfill the entire query directly from index pages without touching the underlying table data. By using the INCLUDE clause, non-key columns are stored only at the leaf level of the nonclustered index. This satisfies SELECT queries while keeping the intermediate index tree levels narrow and fast without the 900-byte index key width limitation.\n\n💡 Teenager Analogy: Carrying a cheat sheet with your friend's name, phone number, and address into a call. If you need their address, it is already on the cheat sheet (Covering Index). If the cheat sheet only had names and phone numbers, you'd have to drive to their house just to look up their address (Key Lookup).",
    "seniorTip": "Look at SQL Server execution plans for thick arrow lines going into a 'Key Lookup (Clustered)' with a high cost percentage. Add the missing output columns to the INCLUDE list of the seeking index to eliminate the lookup instantly."
  },
  {
    "id": "fc-sql-6",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What does SARGable mean, and why does wrapping columns in functions destroy index utilization?",
    "back": "SARGable stands for 'Search Argument Able'. A query predicate is SARGable when SQL Server can utilize an Index Seek along the B-Tree rather than having to scan the entire index or table. Wrapping an indexed column inside a scalar function like WHERE YEAR(OrderDate) = 2024 or WHERE LEFT(LastName, 3) = 'SMI' is non-SARGable; SQL Server cannot evaluate the index's sorted order and must execute the function against every single row in the table (Index Scan).\n\n💡 Teenager Analogy: Looking for 'Smith' in a telephone book: SARGable is flipping directly to the 'S-m-i' page (Index Seek). Non-SARGable is hiring someone to read every single name in the entire book and check 'Does the 3rd letter match 'i'?' (Full Scan).",
    "seniorTip": "In EF Core, writing 'where o.OrderDate.Year == 2024' translates to non-SARGable 'DATEPART(year, ...)' in older versions. Always use date ranges 'o.OrderDate >= startDate && o.OrderDate < endDate' to guarantee SARGable index seeks."
  },
  {
    "id": "fc-sql-7",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How do you read a SQL Server Execution Plan to diagnose query performance?",
    "back": "You read an Execution Plan from right-to-left and top-to-bottom, following the data stream arrows. Thick arrows indicate high row counts. Key operators to look for include: Table Scan (scanning unindexed heap), Clustered Index Scan (reading every row of the table), Index Seek (optimal B-tree key navigation), Key Lookup (fetching missing columns from clustered index), and Sort / Hash Match (high-memory operations). You also compare 'Actual Number of Rows' with 'Estimated Number of Rows' to spot stale statistics.\n\n💡 Teenager Analogy: Reading a factory assembly line blueprint from the loading dock (right) to the shipping warehouse (left). If you see a forklift carrying 10 million parts when the blueprint estimated 1 part, you immediately found where the bottleneck is.",
    "seniorTip": "Always look for 'Tempdb Spills' (Sort Warnings or Hash Warnings). When SQL Server drastically underestimates row counts, it allocates too little memory workspace; the sort spills to tempdb disk, multiplying query latency by 100x."
  },
  {
    "id": "fc-sql-8",
    "pillar": "sql",
    "topic": "SQL",
    "front": "When should you use Stored Procedures vs EF Core / ORM, and how do they compare?",
    "back": "EF Core is ideal for standard OLTP operations, rapid feature delivery, compile-time type safety, automated database migrations, and clean domain modeling. Stored Procedures are superior for complex batch transformations, high-security environments requiring zero direct table permissions, heavy reporting aggregations where raw SQL tuning is paramount, and reducing cross-network round-trips for multi-step transactional procedures.\n\n💡 Teenager Analogy: EF Core is an Uber ride: effortless, standardized, and handles the driving for your everyday commutes. A Stored Procedure is a specialized cargo freight train: requires track maintenance and specialized operators, but moves massive tonnage across the system far more efficiently.",
    "seniorTip": "Always specify 'SET NOCOUNT ON;' at the start of every Stored Procedure to suppress the 'X rows affected' wire messages sent to the client after every INSERT/UPDATE statement."
  },
  {
    "id": "fc-sql-9",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is Parameter Sniffing in SQL Server, how do you detect it, and how do you fix it?",
    "back": "Parameter Sniffing occurs when SQL Server compiles and caches an execution plan based on the specific parameter values passed on the very first execution of a stored procedure. If the first run passes an atypical or rare value (e.g. a tenant with 1 row vs a tenant with 5,000,000 rows), the optimizer chooses a plan tailored to that value (e.g. Index Seek + Key Lookup instead of Table Scan). Subsequent executions with typical parameters are forced to use the suboptimal cached plan, causing severe performance degradation.\n\n💡 Teenager Analogy: A tailor makes clothes for an entire basketball team based solely on measurements taken from the 5-foot-2 team mascot because he walked into the shop first. Now none of the 6-foot-8 players can fit into their uniforms.",
    "seniorTip": "Check SQL Server query plan XML for the tags '<ParameterList>' -> '<ColumnReference ParameterCompiledValue=\"...\" ParameterRuntimeValue=\"...\" />'. If Compiled is '1' and Runtime is '500,000', parameter sniffing is confirmed."
  },
  {
    "id": "fc-sql-10",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What are ACID properties and how do SQL Server Transaction Isolation Levels balance consistency vs concurrency?",
    "back": "ACID guarantees database reliability: Atomicity (all or nothing), Consistency (preserves schema/business invariants), Isolation (concurrent transactions do not interfere), and Durability (committed data survives server crashes). SQL Server provides isolation levels with increasing protection: READ UNCOMMITTED (allows dirty reads), READ COMMITTED (default, prevents dirty reads), REPEATABLE READ (prevents non-repeatable reads), SERIALIZABLE (prevents phantom reads via range locks), and SNAPSHOT (optimistic row-versioning in tempdb).\n\n💡 Teenager Analogy: Atomicity is buying a flight and hotel together—if the hotel fails, your flight is refunded. Durability is an airplane black box that survives a crash. Isolation is taking a private test where no other student can see or edit your test sheet while you are writing.",
    "seniorTip": "Enable RCSI (Read Committed Snapshot Isolation) on your SQL Server database. It eliminates read-write blocking by serving row versions from tempdb without modifying your C# application code or adding NOLOCK hints."
  },
  {
    "id": "fc-sql-11",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What causes Deadlocks in SQL Server, and how do you diagnose and prevent them?",
    "back": "A deadlock occurs when two or more transactions hold exclusive locks on resources the other transaction needs to proceed, creating a cyclic dependency where neither can continue. SQL Server automatically detects deadlocks within seconds, chooses the transaction with the lowest rollback cost as the 'Deadlock Victim', and kills it with Error 1205. Deadlocks are diagnosed using Extended Events or Deadlock Graphs and prevented by accessing tables in identical order, keeping transactions brief, and using appropriate indexing.\n\n💡 Teenager Analogy: Two cars enter a one-lane bridge from opposite sides: Car A won't reverse until Car B moves, and Car B won't reverse until Car A moves. The bridge controller (SQL Server) steps in and tows Car A away so Car B can pass.",
    "seniorTip": "In the XML Deadlock Graph, look for the 'victim-list' and 'resource-list'. Pay special attention to 'inputbuf'—it reveals the exact SQL statement or stored procedure executed by each colliding transaction."
  },
  {
    "id": "fc-sql-12",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How and when do you use sp_getapplock for application-level distributed locking?",
    "back": "sp_getapplock is a built-in SQL Server stored procedure that lets applications acquire custom named locks using SQL Server's enterprise lock manager. It allows you to synchronize distributed processes or prevent duplicate concurrent executions across multiple web server instances without creating custom lock tables or managing external lock stores like Redis. Locks can be bound to the lifetime of a transaction or an explicit database session.\n\n💡 Teenager Analogy: Borrowing the conference room key from the front desk concierge. Even if 10 different employees from different offices rush to use the room at the exact same second, only the person with the physical key gets in; the rest wait outside until it is returned.",
    "seniorTip": "For .NET microservices that already use SQL Server, 'sp_getapplock' gives you rock-solid distributed locking across all ECS/Kubernetes pods for free, eliminating the operational overhead of deploying and clustering Redis Redlock."
  },
  {
    "id": "fc-sql-13",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How do you implement high-performance pagination in SQL Server, and why is OFFSET / FETCH better than subqueries?",
    "back": "Modern SQL Server uses the ANSI-standard OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY clause, which requires an explicit ORDER BY clause. For deep pagination (e.g. page 10,000), OFFSET/FETCH can degrade because SQL Server must still traverse and discard all preceding 100,000 rows. In massive datasets, Keyset Pagination (Seek Pagination / 'WHERE Id > @LastSeenId') delivers constant O(1) time complexity by seeking directly off the clustered or covered index.\n\n💡 Teenager Analogy: Reading a 1,000-page book: OFFSET 500 requires flipping through and counting the first 500 pages one by one before reading. Keyset pagination is using a bookmark: you open directly to page 501 in one motion.",
    "seniorTip": "Always include a unique tie-breaker column (such as the Primary Key 'OrderId') at the end of your ORDER BY clause. Without it, SQL Server does not guarantee row stability across consecutive page queries if two rows share the exact same timestamp."
  },
  {
    "id": "fc-sql-14",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What are the trade-offs between CTEs, Temporary Tables (#temp), and Table Variables (@table)?",
    "back": "A CTE is an in-memory syntactic expression that exists only for the duration of a single query; it does not persist data and is re-evaluated every time it is referenced. A Temporary Table (#temp) is a physical table stored in tempdb with full statistics, indexability, and transaction logging—ideal for medium-to-large datasets. A Table Variable (@table) is also stored in tempdb but lacks column statistics (assumed 1 row in older SQL Server) and cannot participate in parallel query plans, making it suitable only for very small sets (< 100 rows).\n\n💡 Teenager Analogy: A CTE is a formula written on a whiteboard that you erase when you leave the room. A Table Variable is a sticky note in your pocket. A Temp Table is a full metal filing cabinet brought into your office with folders, dividers, and alphabetical tabs.",
    "seniorTip": "If you have a complex CTE that is joined multiple times in a query, materialize it into a '#temp' table first. The query optimizer can generate accurate statistics and use indexes, often reducing execution time from minutes to milliseconds."
  },
  {
    "id": "fc-sql-15",
    "pillar": "sql",
    "topic": "SQL",
    "front": "Why are Set-Based operations vastly superior to Cursors and iterative loops in SQL?",
    "back": "SQL Server is a relational engine designed mathematically for relational algebra and set theory. Set-based operations process entire datasets simultaneously in bulk, allowing the query optimizer to leverage parallelism, B-tree indexes, vector CPU instructions, and bulk logging. Cursors and WHILE loops operate iteratively (row-by-agonizing-row / RBAR), incurring massive transaction log overhead, repeated context switching, lock escalation, and disabling query parallelism.\n\n💡 Teenager Analogy: Moving a truckload of bricks: A Set-Based operation is a forklift lifting an entire pallet of 500 bricks into the truck in one 5-second movement. A Cursor is an individual walking back and forth 500 times, carrying one brick in each hand.",
    "seniorTip": "If you find yourself reaching for a cursor to format strings or aggregate child rows, use 'STRING_AGG(ColumnName, \", \")' (SQL Server 2017+) or Set-Based Window Functions instead."
  },
  {
    "id": "fc-sql-16",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How do you prevent SQL Injection, and why is dynamic SQL so dangerous?",
    "back": "SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL command string, allowing an attacker to alter the query's syntax and execute arbitrary commands. You prevent SQL Injection by using Parameterized Queries via SqlCommand, EF Core, or sp_executesql. Parameters treat user input strictly as literal values, never as executable SQL tokens, regardless of whether the string contains quotes, semicolons, or DROP statements.\n\n💡 Teenager Analogy: Sending money through a drive-through teller tube: A Parameterized Query places the money inside an airtight, sealed capsule that the teller opens safely. SQL Injection is throwing loose paper into the pneumatic pipe where someone slipped in an explosive firecracker disguised as cash.",
    "seniorTip": "In EF Core 7+, use 'context.Database.SqlQuery<T>()' or 'FromSqlInterpolated()'. If dynamic column sorting is required (which cannot be parameterized), validate the column name against an explicit whitelist of allowed property names before appending it."
  },
  {
    "id": "fc-sql-17",
    "pillar": "sql",
    "topic": "SQL",
    "front": "How do you systematically diagnose and fix a slow query in a production SQL Server?",
    "back": "I follow a systematic 5-step triage process: 1) Measure actual resource consumption (CPU vs I/O vs Duration) using 'SET STATISTICS IO, TIME ON' or DMVs; 2) Inspect the Actual Execution Plan to locate expensive operators, missing indexes, or cardinality misestimates; 3) Check wait statistics to see if the query is CPU-bound (SOS_SCHEDULER_YIELD) or I/O-bound (PAGEIOLATCH); 4) Inspect table statistics and index fragmentation; and 5) Apply targeted fixes—such as rewriting non-SARGable predicates, creating covering indexes with INCLUDE, updating statistics, or using query hints.\n\n💡 Teenager Analogy: A doctor examining a sick patient: First check vitals (blood pressure, temperature = wait stats and IO reads), take an X-ray (execution plan), inspect previous lab history (statistics), and then prescribe targeted medication instead of doing random surgery.",
    "seniorTip": "Always query 'sys.dm_os_waiting_tasks' when an active query is hanging in production. It tells you immediately if the query is actively executing or blocked waiting for a lock held by another session ID."
  },
  {
    "id": "fc-sql-18",
    "pillar": "sql",
    "topic": "SQL",
    "front": "What is Database Normalization (1NF, 2NF, 3NF), and when do you intentionally denormalize?",
    "back": "Normalization organizes relational tables to minimize data redundancy and prevent update, insert, and delete anomalies. First Normal Form (1NF) eliminates duplicate columns and ensures atomic values. Second Normal Form (2NF) requires 1NF and ensures all non-key columns depend on the entire primary key. Third Normal Form (3NF) requires 2NF and ensures non-key columns depend only on the primary key (no transitive dependencies). We intentionally denormalize in read-heavy reporting systems, OLAP data warehouses, or high-throughput caches to eliminate expensive multi-table joins.\n\n💡 Teenager Analogy: Packing clothes for a trip: Normalization is putting all shirts in one packing cube, pants in another, and shoes in a separate bag so nothing gets crumpled and duplicates are easy to spot. Denormalization is pre-packing complete outfits together in a carry-on so you can grab a full set in 2 seconds without searching 3 different bags.",
    "seniorTip": "In transactional systems (OLTP), normalize to 3NF to guarantee absolute data integrity. In read-heavy reporting systems (OLAP / CQRS Read Models), denormalize into flat summary tables or Materialized Views to achieve sub-10ms query times."
  },
  {
    "id": "fc-ui-1",
    "pillar": "ui",
    "topic": "React",
    "front": "What is the difference between Props and State in React, and how does unidirectional data flow work?",
    "back": "Props are read-only inputs passed down from a parent component to a child to configure its appearance and behavior; a child component must never mutate its own props. State is private, internal memory managed within the component itself that changes over time in response to user events or network requests. When state changes, React triggers a re-render of that component and its children along a predictable unidirectional (top-down) data flow.\n\n💡 Teenager Analogy: Props are your genetic traits passed down from your parents (eye color, blood type)—you can't change them. State is your current mood or what you're wearing right now—you can change it whenever you want throughout the day.",
    "seniorTip": "Avoid redundant state! If a value can be calculated directly from existing props or state on the fly (e.g. 'const fullName = `${firstName} ${lastName}`'), calculate it during render instead of syncing it in state with useEffect."
  },
  {
    "id": "fc-ui-2",
    "pillar": "ui",
    "topic": "React",
    "front": "What is the difference between Controlled and Uncontrolled Components in React?",
    "back": "A Controlled Component is one where form input data is handled directly by React state; the input's value is driven by the state variable and updated on every keystroke via an onChange handler. An Uncontrolled Component lets the browser DOM maintain the form data internally, and React reads the current value on-demand using a useRef hook. Controlled is preferred in modern React for real-time validation, dynamic disabling, and conditional fields.\n\n💡 Teenager Analogy: A Controlled component is a modern digital dashboard where the computer regulates the speed and updates the speedometer readout every millisecond. An Uncontrolled component is a traditional bicycle odometer: it ticks on its own, and you only glance at it when you decide to stop and check your distance.",
    "seniorTip": "To prevent the classic 'Warning: A component is changing an uncontrolled input to be controlled', always initialize input state with an empty string ('\"\"') rather than 'undefined' or 'null'."
  },
  {
    "id": "fc-ui-3",
    "pillar": "ui",
    "topic": "React",
    "front": "Why and when should you use functional state updates (setCount(prev => prev + 1)) in React?",
    "back": "In React, state setter calls are batched and asynchronous; the state variable within the current render scope does not change immediately after calling the setter. If a state calculation depends on the prior state value, passing an updater function ('prev => prev + 1') guarantees you receive the freshest, pending state value from the queue. This prevents race conditions, stale closures in asynchronous callbacks, and duplicate update drops.\n\n💡 Teenager Analogy: Sending instructions to an ATM: If you tell the ATM 'Set balance to $100' three times in the same second, your balance ends up at $100. If you give functional instructions: 'Add $1 to whatever the current balance is' three times, your balance accurately increases by $3.",
    "seniorTip": "Whenever the next state depends on the previous state, ALWAYS use the functional updater form 'setState(prev => ...)'. It is bulletproof against React 18 concurrent updates and asynchronous closures."
  },
  {
    "id": "fc-ui-4",
    "pillar": "ui",
    "topic": "React",
    "front": "How does the useEffect lifecycle work, and why are dependency arrays and cleanup functions critical?",
    "back": "useEffect executes side-effects after React has committed updates to the DOM. The dependency array tells React when to re-run the effect: no array runs after every render; an empty array ([]) runs once on mount; and specific dependencies run when any listed value changes referentially. A cleanup function returned by useEffect runs before the effect is re-executed and on component unmount to prevent memory leaks, cancel subscriptions, clear timers, or abort fetch requests.\n\n💡 Teenager Analogy: Hiring a cleaning crew for an Airbnb: The effect is the crew preparing the room when guests arrive. The cleanup function is the crew washing the sheets and locking the doors when the guest checks out so the room is clean for the next person.",
    "seniorTip": "Never disable 'react-hooks/exhaustive-deps' with an ESLint suppression comment. If a dependency triggers too many runs, memoize that dependency with 'useCallback' or 'useMemo', or extract it outside the component."
  },
  {
    "id": "fc-ui-5",
    "pillar": "ui",
    "topic": "React",
    "front": "How do useMemo, useCallback, and React.memo optimize performance, and when are they counterproductive?",
    "back": "React.memo wraps a component to skip re-rendering if its props have not changed by shallow comparison. useMemo caches the result of an expensive calculation between renders. useCallback caches a callback function instance between renders to preserve referential equality when passing functions to memoized child components. They are counterproductive when used prematurely on trivial operations because instantiating dependency arrays and shallow comparisons consumes more CPU and memory than the re-render itself.\n\n💡 Teenager Analogy: React.memo is a guard at an office door checking if anything changed before letting workers rebuild the room. useMemo is saving a complex financial calculation on a whiteboard so you don't recalculate it from scratch every minute. useCallback is keeping the exact same keycard rather than printing a new plastic card every time you walk through the door.",
    "seniorTip": "Use the React DevTools Profiler ('Record why each component rendered') before optimizing. In 90% of cases, optimizing your component tree structure (colocating state) solves performance issues without needing any memoization hooks."
  },
  {
    "id": "fc-ui-6",
    "pillar": "ui",
    "topic": "React",
    "front": "Why are Keys essential in React lists, and why is using array index as key a critical anti-pattern?",
    "back": "Keys give elements a stable identity across renders, allowing React's reconciliation algorithm to determine whether an item was added, removed, reordered, or modified in the Virtual DOM. Using an array index as a key is a dangerous anti-pattern when lists can be filtered, sorted, or mutated; inserting an item at the beginning shifts all subsequent indexes, causing React to associate old component state and uncontrolled DOM inputs with the wrong data rows.\n\n💡 Teenager Analogy: Assigned seating at a wedding: If seats are numbered by row order (index: 1, 2, 3), and someone cuts to the front of the line, everyone is forced to take the seat and name-card of whoever was ahead of them. If seats are labeled by the person's actual name (stable unique ID), people can sit in any order and their meal preference follows them accurately.",
    "seniorTip": "When a list genuinely has no unique ID (e.g. read-only static marketing bullets that will NEVER reorder, sort, or paginate), index as a key is acceptable. In all other scenarios, use unique entity IDs or generate UUIDs upon creation."
  },
  {
    "id": "fc-ui-7",
    "pillar": "ui",
    "topic": "React",
    "front": "How do you choose between Lifting State Up, React Context, and Global State (Redux/Zustand)?",
    "back": "Lift State Up when two closely related sibling components need to share state. Use React Context for low-frequency global data that many deeply nested components need—such as current user authentication, theme, or localization. Use a dedicated state manager like Zustand or Redux Toolkit for complex, high-frequency state with many cross-component mutations, heavy business logic, or where you need granular component re-rendering without the Context re-render performance tax.\n\n💡 Teenager Analogy: Lifting State is asking the teacher sitting between two students to hold their shared pencil. React Context is the school PA system broadcasting the fire alarm to every room. Global Store (Zustand/Redux) is the school central records database with dedicated clerks and audit logs for student grades.",
    "seniorTip": "If using React Context, split contexts by domain and update frequency: keep 'AuthContext' (rare updates) separate from 'CartContext' or 'ThemeContext'. Never put everything into one monolithic 'AppContext'."
  },
  {
    "id": "fc-ui-8",
    "pillar": "ui",
    "topic": "React",
    "front": "How do you build Custom Hooks to encapsulate and share reusable stateful logic?",
    "back": "A Custom Hook is a JavaScript/TypeScript function whose name starts with 'use' and that can call other built-in React hooks. Custom hooks encapsulate stateful logic, asynchronous operations, or browser API integrations so they can be reused cleanly across multiple components without duplicating lifecycle code or coupling components to specific UI templates.\n\n💡 Teenager Analogy: A power adapter: instead of soldering custom wiring into every lamp and toaster you own, you plug them into a standardized wall adapter that handles the voltage and current safely.",
    "seniorTip": "Always type your hook tuple return values with 'as const' (e.g. 'return [state, setState] as const;'). Without it, TypeScript infers the array as '(State | SetState)[]', losing the exact positional typing."
  },
  {
    "id": "fc-ui-9",
    "pillar": "ui",
    "topic": "TypeScript",
    "front": "How do TypeScript Generics (<T>) enable type-safe, reusable components and API clients?",
    "back": "TypeScript Generics allow you to write reusable, type-safe functions, classes, and components that work over a variety of types rather than a single one, while preserving full compile-time type information without resorting to 'any'. By parameterizing types (like `<T>`), callers can specify the exact data shape, giving autocomplete, compiler verification, and refactoring safety for HTTP API clients and reusable UI tables.\n\n💡 Teenager Analogy: A transparent mailing envelope: It can carry a birthday card, a bill, or a letter (flexible contents), but whatever you put inside remains completely visible and verified at the post office without tearing the envelope open.",
    "seniorTip": "Use 'Record<K, V>' and 'Partial<T>' generic utility types. In API requests, 'Partial<T>' makes all properties optional for PATCH updates, while 'Pick<T, \"id\" | \"name\">' selects exact subset properties safely."
  },
  {
    "id": "fc-ui-10",
    "pillar": "ui",
    "topic": "TypeScript",
    "front": "What is the difference between any, unknown, and never in TypeScript?",
    "back": "any completely disables all TypeScript type checking and safety, allowing any property access or method call without validation. unknown is the type-safe counterpart to any; it accepts any value, but TypeScript refuses to let you perform any operations or access properties on it until you narrow its type through type guards or assertions. never represents the type of values that never occur—such as the return type of a function that always throws an exception or enters an infinite loop, or in exhaustive switch statements.\n\n💡 Teenager Analogy: any is an uninspected package allowed onto an airplane with zero security checks. unknown is a package detained in customs that nobody can touch until it is scanned and certified safe. never is an empty void: a flight that is permanently canceled and never takes off.",
    "seniorTip": "Enable 'noImplicitAny': true and 'strict': true in tsconfig.json. When handling third-party API payloads or Zod/Yup schemas, always start with 'unknown' and parse through schema validation."
  },
  {
    "id": "fc-ui-11",
    "pillar": "ui",
    "topic": "TypeScript",
    "front": "What is the difference between interface and type in TypeScript, and which should you prefer?",
    "back": "Both interface and type alias can define object shapes and support inheritance. The key difference is that interfaces support Declaration Merging (multiple declarations with the same name merge their properties) and are optimized for object-oriented contracts. Types are more versatile: they can represent unions (string | number), primitives, tuples, mapped types, and intersections, but cannot be reopened. The general standard is to use interfaces for public API and component contracts, and type aliases for unions, primitives, and complex utilities.\n\n💡 Teenager Analogy: An interface is an open municipal building code: different departments can amend and add clauses to the code over time. A type alias is an exact chemical formula: it defines a precise mixture that cannot have ingredients silently appended later.",
    "seniorTip": "Rule of thumb: Default to 'interface' for React component props and domain models because interfaces provide cleaner error messages and slightly faster compile times. Use 'type' for unions, intersections, and mapped utilities."
  },
  {
    "id": "fc-ui-12",
    "pillar": "ui",
    "topic": "TypeScript",
    "front": "What is a Discriminated Union in TypeScript, and how does it prevent impossible UI states?",
    "back": "A Discriminated Union (also called tagged union or algebraic data type) is a union of object types where each variant shares a common, literal discriminator property (like 'status' or 'kind'). TypeScript uses this property to narrow down the exact variant inside conditionals. It eliminates impossible UI states by making mutually exclusive data shapes compile-time enforceable—such as preventing an error message from existing alongside successful payload data.\n\n💡 Teenager Analogy: A multi-tool with a selector switch: When set to 'Pliers', you can only grab and squeeze; when clicked to 'Knife', you can only cut. The switch position (discriminator) makes it physically impossible to deploy both at the same time.",
    "seniorTip": "Discriminated Unions combined with a Redux or useReducer pattern make complex forms and multistep wizards completely bug-free. You cannot accidentally transition to Step 3 without the validated data from Step 2."
  },
  {
    "id": "fc-ui-13",
    "pillar": "ui",
    "topic": "React",
    "front": "How do you build a robust API state architecture in React covering Loading, Error, Empty, and Success states?",
    "back": "A production-grade React API integration must explicitly account for four distinct UI states: 1) Loading (skeleton loaders or spinners), 2) Error (user-friendly alerts with retry capabilities), 3) Empty State (helpful empty screen when data is empty []), and 4) Success (the rendered data). Combining these with an AbortController for request cancellation and tools like TanStack React Query ensures automatic caching, deduplication, and stale-while-revalidate background refreshes.\n\n💡 Teenager Analogy: An airport luggage carousel: Loading is watching the belt start moving; Success is picking up your suitcase; Empty state is a screen showing 'No bags found for flight 104; please check claims counter'; and Error is an alarm sounding that the belt is jammed with a phone number to call maintenance.",
    "seniorTip": "In modern React, adopt TanStack Query (React Query). It eliminates 80% of boilerplate useEffect code, handles request deduplication across components, and provides out-of-the-box window focus refetching."
  },
  {
    "id": "fc-ui-14",
    "pillar": "ui",
    "topic": "React",
    "front": "How do you optimize slow data grids and virtualize massive lists (10,000+ items) in React?",
    "back": "Rendering 10,000 DOM nodes simultaneously exhausts browser memory and destroys frame rates during scrolling. Virtualization (using libraries like `react-window` or `@tanstack/react-virtual`) only renders the small slice of DOM elements currently visible within the user's viewport (plus a small buffer). As the user scrolls, off-screen nodes are recycled and unmounted, maintaining a constant DOM node count (~30 elements) regardless of whether the dataset contains 1,000 or 1,000,000 rows.\n\n💡 Teenager Analogy: A theater film projector: Even if a film has 200,000 individual frames on the reel, the projector only shines light through one single frame at a time as it passes through the lens. It does not try to display every frame across the entire theater wall simultaneously.",
    "seniorTip": "For dynamic variable row heights (e.g. comments with different text lengths), use '@tanstack/react-virtual'. It measures rendered DOM node heights dynamically and adjusts the virtual scroll offsets on the fly."
  },
  {
    "id": "fc-ui-15",
    "pillar": "ui",
    "topic": "React",
    "front": "How do you approach React Component Testing using Vitest, React Testing Library, and user-event?",
    "back": "React Testing Library follows the guiding principle: 'The more your tests resemble the way your software is used, the more confidence they can give you.' Rather than testing implementation details (like component internal state or private methods), we test user behavior: querying by accessible roles, labels, and text ('getByRole', 'getByLabelText') and simulating real browser events with '@testing-library/user-event'. Vitest provides an ultra-fast, ESM-native test runner compatible with Jest APIs.\n\n💡 Teenager Analogy: Testing a soda vending machine: A bad test opens the back panel and inspects the internal electrical gears. A good test puts a dollar into the slot, presses the button labeled 'Cola', and verifies that a cold Cola actually drops into the dispenser tray.",
    "seniorTip": "If you find it difficult to find an element with 'getByRole', your component likely has accessibility issues! React Testing Library naturally forces you to build fully accessible, WCAG-compliant web applications."
  },
  {
    "id": "fc-ui-16",
    "pillar": "ui",
    "topic": "React",
    "front": "How do React 18 Concurrent Features (useTransition, useDeferredValue) keep the UI responsive during heavy updates?",
    "back": "In React 18 Concurrent Mode, rendering is interruptible. Prior to React 18, once a render began, the main thread was blocked until completion. useTransition lets you mark specific state updates as non-urgent transitions; if a user types another keystroke while the transition is rendering, React pauses the low-priority render, processes the high-priority input event, and resumes rendering. useDeferredValue does the same for derived values when you don't control the state setter.\n\n💡 Teenager Analogy: A VIP lane at airport security: Immediate urgent tasks (typing in an input box, clicking a tab) get waved through the express lane instantly. Heavy background computations (rendering a graph of 5,000 data points) wait in the standard line and can be paused if another VIP shows up.",
    "seniorTip": "Use 'useTransition' when you have direct access to the state setter. Use 'useDeferredValue' when the value is received as a prop from an external parent or third-party library."
  },
  {
    "id": "fc-cloud-1",
    "pillar": "cloud",
    "topic": "DevOps",
    "front": "What is the difference between Continuous Integration (CI), Continuous Delivery (CD), and Continuous Deployment?",
    "back": "Continuous Integration (CI) is the practice of automatically building and running automated tests whenever code is merged into the shared repository. Continuous Delivery (CD) automatically packages and prepares release-ready build artifacts and deploys them to staging environments, with production deployment requiring a manual approval gate. Continuous Deployment takes it one step further by automatically releasing every passing change directly into production with zero human intervention.\n\n💡 Teenager Analogy: A bakery: CI is the kitchen mixing the dough and checking oven temperatures for every batch. Continuous Delivery is putting freshly baked bread into boxes on the delivery shelf, waiting for the store manager to stamp 'Approved for Sale'. Continuous Deployment is an automated conveyor belt that sends the bread straight into the customer's grocery bag the instant it comes out of the oven.",
    "seniorTip": "Most enterprise financial and healthcare companies practice Continuous Delivery rather than Continuous Deployment because regulatory compliance (SOC2, HIPAA, PCI-DSS) requires explicit audit trails and human approval gates before production releases."
  },
  {
    "id": "fc-cloud-2",
    "pillar": "cloud",
    "topic": "Azure DevOps",
    "front": "How do you structure Azure DevOps Pipeline Stages, Jobs, and Steps for a .NET application?",
    "back": "An Azure DevOps pipeline follows a clear hierarchy: Stages represent major lifecycle phases (Build, Staging, Production) and act as environment and approval boundaries; Jobs run inside a stage and execute concurrently on dedicated build agents; and Steps are sequential tasks, scripts, or tool commands executed within a single job. Breaking pipelines into discrete stages allows parallel agent execution, artifact reuse, and granular rollback control.\n\n💡 Teenager Analogy: A multi-stage rocket: The 1st Stage launches the rocket (Build & Test). The 2nd Stage enters low orbit (Staging Deploy). The 3rd Stage docks at the space station (Production Deploy). Each stage contains multiple astronauts doing specific jobs simultaneously.",
    "seniorTip": "Use 'deployment' jobs rather than standard 'job' definitions when deploying to environments. Deployment jobs integrate with Azure DevOps Environments, providing audit history, health checks, and automated rollback strategies."
  },
  {
    "id": "fc-cloud-3",
    "pillar": "cloud",
    "topic": "Azure DevOps",
    "front": "Why should teams choose YAML Pipelines over Classic UI Release Pipelines in Azure DevOps?",
    "back": "YAML pipelines implement 'Pipeline as Code', storing the pipeline definition directly in Git alongside the application code. This provides full version control, branch isolation (pipeline changes can be tested on a feature branch without breaking main), Pull Request reviews for infrastructure changes, and easy disaster recovery. Classic UI pipelines are configured via web browser clicks, cannot be branch-versioned, and make tracking configuration history painful.\n\n💡 Teenager Analogy: YAML pipelines are a recipe printed directly on the food box: if you change the recipe for a new flavor, the instructions travel with the box. Classic UI pipelines are sticky notes posted on the kitchen refrigerator: someone can accidentally change them without anyone knowing who did it or when.",
    "seniorTip": "Leverage YAML Templates ('template: templates/step.yml'). Templates let your platform engineering team define standardized security scanning and testing steps that every microservice repo includes with 2 lines of code."
  },
  {
    "id": "fc-cloud-4",
    "pillar": "cloud",
    "topic": "DevOps",
    "front": "How do Build Artifacts work in CI/CD, and why must they be immutable?",
    "back": "A Build Artifact is a compiled, versioned, deployable package (such as a zip file of compiled .NET binaries or a tagged Docker container image) produced once during the CI build stage. Immutability means the exact same artifact is promoted sequentially through Dev, QA, Staging, and Production without ever being recompiled. Recompiling per environment introduces non-deterministic risks where subtle code drifts, dependency updates, or compiler differences cause Staging and Production to behave differently.\n\n💡 Teenager Analogy: A passport: The government prints and seals your physical passport booklet once (immutable artifact). When you travel from airport to airport (Dev, Staging, Production), border guards stamp your passport to grant entry, but nobody ever cuts open your passport and reprints your pages in each country.",
    "seniorTip": "Follow the 12-Factor App methodology: Strictly separate configuration from code. Inject configuration via Azure App Configuration, Azure Key Vault, or Kubernetes ConfigMaps at runtime."
  },
  {
    "id": "fc-cloud-5",
    "pillar": "cloud",
    "topic": "Azure DevOps",
    "front": "How do Branch Policies and Pull Request Gates enforce code quality in Azure Repos / GitHub?",
    "back": "Branch policies protect critical branches (like `main` and `release/*`) by blocking direct commits and requiring code to pass through Pull Request gates before merging. Standard policies include: requiring a minimum number of peer code reviewers, enforcing linked work items for traceability, requiring all reviewer comment threads to be explicitly resolved, and running automated Build Validation pipelines that ensure the code builds cleanly and passes all unit tests.\n\n💡 Teenager Analogy: A bank vault with dual-key access: No single employee can walk into the vault and take money alone. Opening the door requires two authorized keys turned at the exact same time (peer reviews) and a log entry detailing why the vault was accessed (linked work item).",
    "seniorTip": "Enable 'Automatically include code reviewers' based on file paths. For example, automatically add the Senior Database Architect whenever any file under 'src/Database/Migrations/*' is touched in a PR."
  },
  {
    "id": "fc-cloud-6",
    "pillar": "cloud",
    "topic": "Azure DevOps",
    "front": "How do you securely handle Secrets and integrate Azure Key Vault into CI/CD pipelines?",
    "back": "Secrets (passwords, connection strings, API tokens) must never be stored in plaintext in Git repositories or pipeline YAML files. In Azure DevOps, secrets are stored either as Secret Variables (which are automatically masked in build logs with '***'), Variable Groups linked directly to Azure Key Vault, or fetched dynamically during pipeline execution using Managed Identities or Workload Identity Federation with the AzureKeyVault task.\n\n💡 Teenager Analogy: A hotel safety deposit box: Instead of leaving your passport and jewelry sitting on the bed, you lock them in the safe. The front desk gives you a temporary, expiring keycard (managed identity) that opens the safe only while you are an active guest.",
    "seniorTip": "Migrate your Azure DevOps Service Connections to 'Workload Identity Federation'. This eliminates client secrets and certificates entirely by using short-lived OIDC tokens exchanged between Azure DevOps and Microsoft Entra ID."
  },
  {
    "id": "fc-cloud-7",
    "pillar": "cloud",
    "topic": "Azure DevOps",
    "front": "How do you configure Multi-Stage Environments and Manual Approval Gates in Azure Pipelines?",
    "back": "Azure DevOps Environments represent physical or logical deployment targets (Dev, QA, Staging, Production). You configure Environment Checks—such as required human approvals, business hours restrictions, Azure Monitor alert checks, and branch controls—directly on the Environment in the Azure DevOps portal. When a pipeline's deployment job targets that environment, the pipeline automatically pauses, sends approval notifications, and verifies gates before proceeding.\n\n💡 Teenager Analogy: A rocket launch countdown: Before the booster fires, the Flight Director polls each station ('Propulsion? Go. Telemetry? Go. Medical? Go.'). If any station says 'No' or fails to respond, the launch is automatically halted.",
    "seniorTip": "Combine Manual Approvals with 'Azure Monitor Alert' checks. If an active P1 alert is currently firing in Azure Monitor, the environment check will automatically fail and block the deployment until the incident is resolved."
  },
  {
    "id": "fc-cloud-8",
    "pillar": "cloud",
    "topic": "DevOps",
    "front": "How do you systematically triage and diagnose a broken CI/CD pipeline?",
    "back": "I diagnose pipeline failures through a systematic 4-step triage process: 1) Identify the failure category (Code/Test failure vs Infrastructure/Agent issue vs Network/Permission error); 2) Inspect the raw task logs and enable system diagnostics ('system.debug=true'); 3) Reproduce locally by running the exact CLI commands on the same operating system and .NET SDK version; and 4) If infrastructure-related, verify agent disk space, expired service connection credentials, or package registry outages.\n\n💡 Teenager Analogy: A factory assembly line that stopped moving: First check if a defective part jammed a machine (test failure), then check if the power went out in the building (agent outage), then check if the delivery truck carrying raw materials was delayed (NuGet/NPM feed timeout).",
    "seniorTip": "Remember that Microsoft-hosted Ubuntu agents have CASE-SENSITIVE file systems. A C# project referencing 'MyModel.cs' when the file is named 'mymodel.cs' compiles perfectly on Windows laptops but fails immediately on Linux CI agents!"
  },
  {
    "id": "fc-cloud-9",
    "pillar": "cloud",
    "topic": "DevOps",
    "front": "How do Zero-Downtime Rollback Strategies work (Blue/Green, Canary, Slot Swaps)?",
    "back": "Zero-downtime deployment strategies eliminate service interruptions during releases and provide instant rollback capabilities. In Blue/Green deployments, two identical production environments exist; the new version is deployed to 'Green' and fully verified before router traffic is instantly switched from 'Blue'. Azure App Service Deployment Slots implement Blue/Green via Slot Swaps with zero downtime. Canary deployments route a small percentage of user traffic (e.g. 5%) to the new version to monitor error rates before expanding rollout.\n\n💡 Teenager Analogy: A high-speed train switching tracks: The railway maintenance team builds a brand new parallel track (Green). Once safety inspections pass, the switchman flips a single lever to route the oncoming train onto the new track without the train ever having to slow down or stop.",
    "seniorTip": "Use the 'Expand and Contract' (Parallel Run) database pattern: Phase 1: Add new nullable column. Phase 2: Deploy new app writing to both. Phase 3: Backfill old data. Phase 4: Deprecate and drop old column in a future release."
  },
  {
    "id": "fc-cloud-10",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "What is the difference between a Docker Image and a Docker Container?",
    "back": "A Docker Image is a read-only, immutable template or snapshot composed of layered file systems containing the application code, runtime libraries, environment variables, and dependencies. A Docker Container is a live, running instance of an image executed in an isolated process sandbox using Linux kernel primitives: Namespaces (which isolate process IDs, networking, and mount points) and Control Groups (cgroups, which limit CPU and memory consumption).\n\n💡 Teenager Analogy: An Image is a blueprint for a house printed on paper. A Container is the actual physical house built from that blueprint where people are living and using electricity.",
    "seniorTip": "Because containers share the host Linux kernel, container startup takes milliseconds compared to minutes for VMs. This lightweight isolation is what enables instantaneous auto-scaling in Kubernetes and Azure Container Apps."
  },
  {
    "id": "fc-cloud-11",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "How does Dockerfile Layer Caching work, and how do you optimize instruction order to speed up builds?",
    "back": "Each instruction in a Dockerfile (RUN, COPY, ADD) creates a cached, read-only filesystem layer. When rebuilding an image, Docker reuses previously cached layers unless the instruction or the files copied into it have changed. Once a layer's cache is invalidated, every subsequent layer after it must be rebuilt from scratch. To maximize build speed, order instructions from least frequently changing (base images, OS packages, NuGet restore) to most frequently changing (application source code).\n\n💡 Teenager Analogy: Packing a layered lasagna: You lay down the pasta sheets and cheese at the bottom once (rarely change). You only swap out the fresh garnishes on top at the very end. If you stir the bottom sauce layer, you have to rebuild the entire lasagna from scratch.",
    "seniorTip": "Always maintain a clean '.dockerignore' file containing '**/bin', '**/obj', '.git', and '*.user'. This prevents local machine build artifacts from polluting the container build context."
  },
  {
    "id": "fc-cloud-12",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "Why are Multi-Stage Docker Builds essential for .NET applications, and how do they reduce image size and attack surface?",
    "back": "Multi-Stage builds use multiple `FROM` instructions in a single Dockerfile. A heavy build stage (using the full .NET SDK ~800MB) compiles the code, executes tests, and publishes binaries; a minimal runtime stage (using the lightweight ASP.NET Core Runtime or Chiseled Ubuntu ~100MB) copies only the final published DLLs. This shrinks the production image size by over 80%, eliminates compilers and package managers from production, and drastically reduces the security attack surface and CVE vulnerabilities.\n\n💡 Teenager Analogy: A construction crane on a building site: You need massive scaffolding, heavy cranes, and cement mixers to build a skyscraper. Once the building is finished, you remove all the construction machinery; tenants don't need a 50-ton crane sitting in their living room.",
    "seniorTip": "In .NET 8+, use the Microsoft 'chiseled' images ('mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled'). They contain zero package managers and zero shell binaries ('/bin/sh' does not exist!), completely neutralizing shell injection attacks."
  },
  {
    "id": "fc-cloud-13",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "What is the difference between EXPOSE in a Dockerfile and Port Mapping (-p host:container)?",
    "back": "EXPOSE is documentation metadata inside the Dockerfile indicating which port the application inside the container is listening on; it does NOT publish or open the port to the outside world. Port Mapping (-p hostPort:containerPort) is an active Docker runtime command that configures host network routing and firewall iptables rules, actively forwarding incoming traffic from a physical host port into the container's private IP network.\n\n💡 Teenager Analogy: EXPOSE is painting 'Main Entrance on 5th Street' on your building wall (informational sign). Port Mapping is unlocking the front door, stationing a doorman, and connecting a private pedestrian bridge from 5th Street directly into your lobby.",
    "seniorTip": "Always remember the '-p host:container' order: Left is where you connect from on your computer (Host), Right is where the service listens inside Docker (Container)."
  },
  {
    "id": "fc-cloud-14",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "How does Container Data Persistence work (Volumes vs Bind Mounts vs Ephemeral Storage)?",
    "back": "By default, container storage is ephemeral: any data written to the container's writable layer is permanently destroyed when the container is deleted. Docker Volumes are directories managed entirely by Docker on the host filesystem—they are isolated from host OS details, support backup/encryption, and are the standard for databases and persistent application state. Bind Mounts map an exact file or directory path from the host machine directly into the container—ideal for local development hot-reloading.\n\n💡 Teenager Analogy: Ephemeral storage is writing on a hotel room notepad: when you check out, the maid throws it in the trash. A Bind Mount is opening a window to your own house across the street to grab a folder. A Docker Volume is renting a climate-controlled private storage locker managed by professional staff.",
    "seniorTip": "In cloud-native microservices, treat containers as disposable cattle, not pets. Never rely on container local disk persistence for application state; offload all files to object storage (Azure Blob Storage) and state to managed databases."
  },
  {
    "id": "fc-cloud-15",
    "pillar": "cloud",
    "topic": "Docker",
    "front": "How do you implement Container Health Checks and capture diagnostic logs effectively?",
    "back": "A container health check allows the container runtime and orchestrators to determine whether the application inside the container is actively healthy, degraded, or dead. In ASP.NET Core, we expose a `/healthz` endpoint using `Microsoft.Extensions.Diagnostics.HealthChecks` and register a `HEALTHCHECK` command in the Dockerfile. For logging, applications must write structured JSON logs directly to `stdout` and `stderr`; Docker captures this output into its logging driver without requiring file I/O.\n\n💡 Teenager Analogy: A submarine sonar ping: The control tower sends a ping every 30 seconds. If the submarine responds with an authentic status tone, the mission continues. If the submarine stops answering, the system automatically launches an emergency rescue buoy (orchestrator restarts the container).",
    "seniorTip": "Separate Liveness checks ('Am I alive and not deadlocked?') from Readiness checks ('Are my database migrations finished and am I ready to receive user traffic?'). In ASP.NET Core, you can map separate endpoints: '/healthz/live' and '/healthz/ready'."
  },
  {
    "id": "fc-cloud-16",
    "pillar": "cloud",
    "topic": "Azure",
    "front": "How do you deploy containerized .NET applications to Azure (Container Apps vs App Service)?",
    "back": "Azure Container Apps (ACA) is a serverless container platform built on Kubernetes (KEDA + Envoy + Dapr); it is ideal for microservices, background event-driven workers, and apps requiring scale-to-zero cost savings. Azure App Service for Containers is an enterprise PaaS offering ideal for standalone web applications that require simple deployment slots, integrated custom domains, and traditional enterprise networking without orchestrator complexity.\n\n💡 Teenager Analogy: Azure App Service is renting an apartment in a luxury high-rise: everything is fully furnished, utilities are included, and maintenance is handled for you. Azure Container Apps is renting a modular shipping container home in an eco-village: it expands or shrinks automatically based on how many friends visit, and costs nothing when you are away.",
    "seniorTip": "In Azure Container Apps, use KEDA autoscalers. You can scale your background worker containers automatically based on the number of unread messages in an Azure Service Bus queue, scaling up to 50 workers during sales and down to 0 when empty."
  },
  {
    "id": "fc-cloud-17",
    "pillar": "cloud",
    "topic": "Kubernetes",
    "front": "How do you explain Kubernetes and Container Orchestration honestly without overclaiming in an interview?",
    "back": "As a Senior .NET Developer, my core expertise is designing cloud-native, 12-factor containerized microservices, writing optimized Dockerfiles, configuring health endpoints, and setting up CI/CD pipelines. While I understand Kubernetes architecture—Pods as the atomic unit of execution, Deployments managing desired replica state, Services routing internal traffic, and Ingress controllers handling SSL termination—I work closely with dedicated Platform/DevOps engineers who manage the production cluster infrastructure, Helm charts, and network policies.\n\n💡 Teenager Analogy: A commercial airline pilot: You are an expert at flying the plane, navigating the instruments, and communicating with air traffic control. You don't claim to have personally manufactured the jet engine turbines or laid down the concrete runway tarmac.",
    "seniorTip": "Interviewers respect honesty. Saying 'I know the core Kubernetes workload concepts (Pods, Deployments, Services, ConfigMaps) and can troubleshoot applications via kubectl, but my specialty is application development rather than cluster networking' earns massive credibility."
  },
  {
    "id": "fc-cloud-18",
    "pillar": "cloud",
    "topic": "DevOps",
    "front": "What is Infrastructure as Code (IaC), and why should .NET teams use Bicep or Terraform?",
    "back": "Infrastructure as Code (IaC) defines and provisions cloud resources (App Services, SQL Databases, Key Vaults) using declarative code files rather than manual Azure portal clicks. Bicep is Microsoft's domain-specific language for Azure, offering zero-state management, day-zero Azure feature support, and clean syntax. Terraform is cloud-agnostic and maintains an external state file. IaC guarantees consistent, reproducible environments, eliminates configuration drift, and allows infrastructure changes to be audited through Pull Requests.\n\n💡 Teenager Analogy: A 3D printer file for car parts: Instead of a mechanic manually hammering and bending sheet metal by hand differently for every single car (portal clicks), you send an exact CAD blueprint to the 3D printer. Every single part produced is 100% mathematically identical.",
    "seniorTip": "If your stack is exclusively on Microsoft Azure, choose Azure Bicep over Terraform. Bicep has zero state-locking headaches, offers first-class VS Code intellisense, and guarantees immediate support for all Azure preview features."
  }
];
