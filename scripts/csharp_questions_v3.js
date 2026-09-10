// ============================================================================
// BUILD POPULAR CURRICULUM SCRIPT
// Replaces niche/esoteric questions with 100% popular, high-frequency interview questions
// directly from the user's study guide (Layers 1-4) and classic OOP interview standards.
// ============================================================================

const fs = require('fs');

const questions = [];

// ============================================================================
// PILLAR 1: C# LANGUAGE & OOP FUNDAMENTALS (18 Questions)
// ============================================================================
const csharpQuestions = [
  {
    title: "What are the 4 fundamental pillars of Object-Oriented Programming (OOP)?",
    seniority: "Mid-to-Senior",
    tags: ["OOP", "Encapsulation", "Inheritance", "Polymorphism", "Abstraction"],
    pitch: "The 4 pillars are Encapsulation (bundling data with methods and restricting direct access via access modifiers), Abstraction (exposing only essential interfaces while hiding internal complexity), Inheritance (enabling a derived class to acquire properties and behavior from a base class), and Polymorphism (allowing different classes to be treated through a common interface via method overriding or overloading).",
    analogy: "Encapsulation is a car's engine under the hood; Abstraction is the steering wheel and pedals; Inheritance is a sports car sharing a chassis with a sedan; Polymorphism is pressing the gas pedal on either an electric or gas car and having each accelerate in its own way.",
    deepDive: `Deep Dive & Architectural Role:
1. Encapsulation: Prevents unauthorized state mutation by making fields private and exposing validation logic through properties and methods.
2. Abstraction: Expressed via interfaces (IService) and abstract classes. Callers depend on contracts rather than concrete implementations.
3. Inheritance: Models 'is-a' relationships in C# (single class inheritance). Derivation allows code reuse, but deep hierarchies introduce fragile base class problems.
4. Polymorphism:
   - Dynamic/Runtime Polymorphism: virtual methods and interface implementations resolved via the vtable (virtual method table) at runtime.
   - Static/Compile-Time Polymorphism: Method overloading and generics resolved by the compiler.`,
    codeSnippet: `// 1. Abstraction & Interface Contract
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessPaymentAsync(decimal amount);
}

// 2. Encapsulation & Inheritance
public abstract class BaseProcessor : IPaymentProcessor
{
    private decimal _feeRate; // Encapsulated field

    protected BaseProcessor(decimal feeRate) => _feeRate = feeRate;

    // 3. Polymorphism (Runtime Virtual Overriding)
    public virtual Task<PaymentResult> ProcessPaymentAsync(decimal amount)
    {
        var fee = amount * _feeRate;
        return Task.FromResult(new PaymentResult(true, amount + fee));
    }
}

public class StripeProcessor : BaseProcessor
{
    public StripeProcessor() : base(0.029m) { }

    public override async Task<PaymentResult> ProcessPaymentAsync(decimal amount)
    {
        // Custom Stripe API execution
        return await base.ProcessPaymentAsync(amount);
    }
}`,
    redFlags: [
      "Listing the 4 pillars by name without being able to write a clear C# code example for each.",
      "Confusing Abstraction with Encapsulation (Encapsulation is information hiding/protection; Abstraction is interface simplicity).",
      "Claiming C# supports multiple class inheritance (C# only supports multiple interface inheritance)."
    ],
    proTips: [
      "In enterprise .NET architecture, always mention favoring Composition over Inheritance: deep inheritance trees create tight coupling and testability headaches."
    ]
  },
  {
    title: "Method Overloading vs. Method Overriding: What is the difference?",
    seniority: "Mid-to-Senior",
    tags: ["OOP", "Polymorphism", "Overloading", "Overriding", "virtual", "override", "new"],
    pitch: "Method Overloading is compile-time (static) polymorphism where multiple methods in the same class share the same name but differ in parameter types or counts. Method Overriding is runtime (dynamic) polymorphism where a derived class provides a specific implementation of a virtual or abstract method defined in its base class using the override keyword.",
    analogy: "Overloading is a multi-tool that opens cans, bottles, or screws depending on what you hand it; Overriding is a child following the family recipe but substituting an ingredient to make their own version.",
    deepDive: `Compiler & Runtime Mechanics:
1. Overloading (Compile-Time):
   - Resolved during compilation by Roslyn looking at method signatures (name + parameter types).
   - Return types alone are NOT sufficient to overload a method.
2. Overriding (Runtime):
   - Base method must be marked 'virtual', 'abstract', or 'override'.
   - Derived method must use 'override'.
   - The CLR uses the object's method table (vtable) to dispatch the call based on the runtime type of the instance, regardless of the variable reference type.
3. The 'new' Method Shadowing Trap:
   - If a derived method uses 'new' instead of 'override', it hides the base method.
   - Calling through a base class reference invokes the BASE implementation, NOT the derived one!`,
    codeSnippet: `public class Calculator
{
    // ✅ Method Overloading (Compile-Time Polymorphism)
    public int Add(int a, int b) => a + b;
    public decimal Add(decimal a, decimal b) => a + b;
    public int Add(int a, int b, int c) => a + b + c;
}

public class BaseReport
{
    public virtual string Generate() => "Standard Report Data";
}

public class DetailedReport : BaseReport
{
    // ✅ Method Overriding (Runtime Polymorphism)
    public override string Generate() => "Detailed Executive Financial Metrics";
}

// Runtime Resolution:
BaseReport report = new DetailedReport();
Console.WriteLine(report.Generate()); // Outputs "Detailed Executive Financial Metrics"!`,
    redFlags: [
      "Claiming you can overload a method by simply changing the return type (produces a C# compile error).",
      "Using the 'new' keyword instead of 'override' without realizing it breaks polymorphic dispatch.",
      "Not knowing that private methods cannot be overridden."
    ],
    proTips: [
      "Mark overridden methods as 'sealed' if you want to prevent further subclasses down the inheritance chain from overriding them again."
    ]
  },
  {
    title: "Interface or abstract class: when would you use each?",
    seniority: "Mid-to-Senior",
    tags: ["OOP", "Interface", "Abstract Class", "Contracts", "Dependency Injection"],
    pitch: "Use an interface to define a capability or contract that unrelated classes can implement without dictating their hierarchy. Use an abstract class when related types need shared implementation behavior or protected internal state, while still leaving specific operations abstract for subclasses.",
    analogy: "An interface is a driver's license requirement (anyone can qualify regardless of family); an abstract class is a basic car frame shared by related vehicle models.",
    deepDive: `Architectural Decision Matrix:
1. Interfaces:
   - Defines pure contract capability (e.g., IDisposable, IEnumerable, IRepository<T>).
   - Classes can implement multiple interfaces (supporting multiple inheritance of contracts).
   - Perfect for Dependency Injection service boundaries and unit testing mocks.
   - C# 8+ supports Default Interface Methods (DIM) for backward-compatible API evolution.
2. Abstract Classes:
   - Can hold state (fields), non-public constructors, and protected helper methods.
   - Restricts derived classes to single inheritance.
   - Ideal for Template Method patterns (e.g., BaseController, BaseEntity with Id and CreatedAtUtc).`,
    codeSnippet: `// Contract: Implemented by completely unrelated classes
public interface IAuditable
{
    DateTime CreatedAtUtc { get; }
    string CreatedBy { get; }
}

// Abstract Class: Shares state & enforces base constructor invariants
public abstract class EntityBase : IAuditable
{
    public Guid Id { get; protected init; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public string CreatedBy { get; private set; }

    protected EntityBase(string createdBy) => CreatedBy = createdBy;

    // Derived classes MUST provide domain validation
    public abstract bool IsValid();
}`,
    redFlags: [
      "Forcing inheritance just to share 3 lines of utility code (composition or extension methods are cleaner).",
      "Declaring instance fields in an interface (C# does not permit interface instance fields).",
      "Not knowing that interfaces are the primary foundation for Dependency Injection in ASP.NET Core."
    ],
    proTips: [
      "Always design public API service boundaries with interfaces (e.g. ICustomerService); use abstract base classes internally within the domain model for shared entity invariants."
    ]
  },
  {
    title: "Explain the SOLID principles with concrete C# examples.",
    seniority: "Senior",
    tags: ["SOLID", "Design Patterns", "Clean Code", "SRP", "OCP", "LSP", "ISP", "DIP"],
    pitch: "SOLID comprises 5 core object-oriented design principles: Single Responsibility (a class should have one reason to change), Open/Closed (open for extension, closed for modification), Liskov Substitution (subtypes must be substitutable for their base types), Interface Segregation (clients should not depend on interfaces they do not use), and Dependency Inversion (high-level modules should depend on abstractions, not concretions).",
    analogy: "SRP is a chef cooking instead of delivering food; OCP is adding a phone attachment without opening the phone; LSP is a stunt double doing everything the actor can do; ISP is a TV remote with only the buttons you need; DIP is plugging into a wall outlet rather than hardwiring your appliance to the electric grid.",
    deepDive: `Breakdown of Each Principle:
1. Single Responsibility (SRP): Separate persistence from business logic (e.g., OrderService validates order, OrderRepository saves it).
2. Open/Closed (OCP): Use strategy pattern or polymorphism to add new payment methods without modifying existing if/else blocks.
3. Liskov Substitution (LSP): Subclasses must not throw NotImplementedException for base interface methods or violate base post-conditions.
4. Interface Segregation (ISP): Split fat interfaces like IOrderService into IPaymentHandler, IInvoiceGenerator, IShippingCalculator.
5. Dependency Inversion (DIP): Controllers inject interfaces (IOrderRepository) rather than instantiating concrete SqlOrderRepository with 'new'.`,
    codeSnippet: `// ❌ VIOLATION of DIP and SRP: Hardcoded dependency & mixed responsibilities
public class BadOrderController
{
    public void PlaceOrder(Order order)
    {
        var repo = new SqlOrderRepository(); // Direct concretion!
        repo.Save(order);
        var smtp = new SmtpClient();        // Direct email sending!
        smtp.Send("Admin@domain.com", "Order Placed");
    }
}

// ✅ SOLID: Inverted dependencies, segregated interfaces, single responsibilities
public class GoodOrderController
{
    private readonly IOrderRepository _repository;
    private readonly INotificationService _notifier;

    public GoodOrderController(IOrderRepository repository, INotificationService notifier)
    {
        _repository = repository;
        _notifier = notifier;
    }

    public async Task<IActionResult> PlaceOrderAsync(Order order, CancellationToken ct)
    {
        await _repository.SaveAsync(order, ct);
        await _notifier.NotifyAsync("Order Placed", ct);
        return Ok();
    }
}`,
    redFlags: [
      "Reciting the SOLID acronym letters without explaining what problem each principle solves.",
      "Throwing NotImplementedException in a derived subclass (classic Liskov Substitution Principle violation).",
      "Creating god classes with 30 methods doing data access, logging, HTTP requests, and calculation."
    ],
    proTips: [
      "In ASP.NET Core, the built-in DI container (IServiceCollection) is the direct manifestation of the Dependency Inversion Principle (DIP)."
    ]
  },
  {
    title: "Class vs. Struct in C#: Value Types vs. Reference Types, Stack vs. Heap, and Boxing",
    seniority: "Mid-to-Senior",
    tags: ["Class", "Struct", "Value Types", "Reference Types", "Stack", "Heap", "Boxing"],
    pitch: "A class is a reference type allocated on the managed heap, copied by reference pointer, and collected by the Garbage Collector. A struct is a value type allocated inline where declared (typically on the execution stack or inside an enclosing object), copied by value, and cleaned up when its scope exits. Boxing occurs when a value type is cast to object or an interface, forcing a heap allocation and copy.",
    analogy: "A struct is like printing a physical coupon: handing it to someone gives them their own copy. A class is a Google Doc link: everyone points to the same document, and changes are visible to all.",
    deepDive: `Memory & CLR Mechanics:
1. Memory Allocation:
   - Reference Types (class, string, delegate): Heap memory + 8-byte object header + 8-byte MethodTable pointer + stack pointer (8 bytes on 64-bit).
   - Value Types (struct, int, bool, enum): Inline bytes. Zero heap GC overhead when kept on stack.
2. Copy Semantics:
   - Assigning struct B = A copies all fields. Mutating B does NOT affect A.
   - Assigning class B = A copies the 8-byte reference pointer. Both point to the exact same heap memory.
3. Boxing and Unboxing:
   - object obj = 42; // Boxes 42 into a heap object!
   - int x = (int)obj; // Unboxes back to stack.
   - Causes GC Gen 0 churn in high-throughput loops.`,
    codeSnippet: `public struct PointStruct
{
    public int X, Y;
}

public class PointClass
{
    public int X, Y;
}

public static void DemonstrateMemory()
{
    PointStruct s1 = new PointStruct { X = 10, Y = 20 };
    PointStruct s2 = s1; // Bitwise copy!
    s2.X = 99;
    Console.WriteLine(s1.X); // Still 10!

    PointClass c1 = new PointClass { X = 10, Y = 20 };
    PointClass c2 = c1; // Pointer copy!
    c2.X = 99;
    Console.WriteLine(c1.X); // Outputs 99!

    // ⚠️ Boxing Trap:
    object boxed = s1; // Allocates heap memory and copies struct!
    int val = ((PointStruct)boxed).X; // Unboxes
}`,
    redFlags: [
      "Believing structs are always faster than classes (large structs > 16 bytes take longer to pass as parameters because copying all fields is slow).",
      "Mutating fields on a struct through an interface or property (creates silent copy bugs).",
      "Not knowing what Boxing is or that it allocates heap memory."
    ],
    proTips: [
      "Declare structs as 'readonly struct' in modern C#: the compiler guarantees immutability and eliminates hidden defensive copies when passed with the 'in' modifier."
    ]
  },
  {
    title: "Access Modifiers in C#: public, private, protected, internal, and combinations",
    seniority: "Mid-to-Senior",
    tags: ["Access Modifiers", "Encapsulation", "internal", "protected", "private protected"],
    pitch: "Access modifiers control member and type visibility. 'public' is accessible anywhere; 'private' is accessible only within the declaring type; 'protected' is accessible within the type and derived subclasses; 'internal' is accessible anywhere within the same assembly; 'protected internal' allows access from derived classes OR anywhere in the same assembly; 'private protected' allows access from derived classes ONLY within the same assembly.",
    analogy: "Public is a public billboard; Private is your private diary; Protected is family heirlooms; Internal is an office bulletin board; Protected Internal is anyone in the building plus family outside; Private Protected is family members who work in the same building.",
    deepDive: `Visibility Matrix & Assembly Boundaries:
1. Default Visibilities:
   - Classes and structs declared directly in a namespace default to 'internal'.
   - Class members (methods, fields, properties) default to 'private'.
   - Interface members default to 'public' (in C# 8+, can have private helper methods).
2. 'InternalsVisibleTo' Attribute:
   - Exposes 'internal' types to unit test projects without making them public to external consumers:
     [assembly: InternalsVisibleTo("MyProject.Tests")]
3. Clean Architecture Usage:
   - Use 'internal' for domain service implementations and EF Core DbContext entities so callers in API layers interact only via public interfaces.`,
    codeSnippet: `// Accessible only inside this assembly (clean encapsulation)
internal class OrderDomainService
{
    private readonly ILogger _logger; // Declaring class only

    protected int RetryCount = 3;     // Subclasses can access

    // Accessible in derived classes ONLY within this assembly
    private protected void LogDiagnostic(string message)
    {
        _logger.LogInformation(message);
    }

    // Accessible anywhere in this assembly OR derived classes in other assemblies
    protected internal void ResetCounter()
    {
        RetryCount = 0;
    }
}`,
    redFlags: [
      "Making all classes and methods 'public' by default, destroying encapsulation.",
      "Confusing 'protected internal' (OR condition) with 'private protected' (AND condition).",
      "Not knowing about '[InternalsVisibleTo]' for testing internal classes."
    ],
    proTips: [
      "In Clean Architecture, make internal services and repository implementations 'internal' and expose only interfaces: this prevents junior developers from bypassing service layers and instantiating repositories directly."
    ]
  },
  {
    title: "The static keyword: Static Classes, Methods, Constructors (.cctor), and Singletons",
    seniority: "Mid-to-Senior",
    tags: ["static", "Constructors", ".cctor", "Singleton", "Thread Safety"],
    pitch: "The 'static' keyword declares members that belong to the type itself rather than an instance. A static class cannot be instantiated, cannot inherit or be inherited from, and cannot implement interfaces. Static constructors (.cctor) are parameterless, run exactly once before the type is first accessed or instantiated, and are thread-safe and lazily invoked by the CLR.",
    analogy: "A static class is the building's central heating furnace: there is only one for the entire building, and no tenant installs their own personal furnace.",
    deepDive: `CLR Execution & Thread Safety:
1. Static Constructors (.cctor):
   - Executed automatically by the CLR before any instance is created or static member referenced.
   - Guaranteed to be thread-safe by the CLR runtime without needing explicit locks.
   - ⚠️ If an unhandled exception occurs in a static constructor, TypeInitializationException is thrown, and the type remains unusable for the entire lifetime of the AppDomain!
2. Static Classes vs. DI Singletons:
   - Static classes cannot implement interfaces, making them impossible to mock in unit tests.
   - Favor Dependency Injection Singletons (AddSingleton<T>) over static classes for business services.`,
    codeSnippet: `public static class MathUtils // Cannot be instantiated
{
    public static readonly double Pi;

    // Static constructor: Thread-safe, executes once by CLR
    static MathUtils()
    {
        Pi = 3.14159265359;
    }

    public static double Circumference(double radius) => 2 * Pi * radius;
}

// High-Performance Thread-Safe Singleton using CLR Static Constructor
public sealed class CacheManager
{
    // CLR guarantees lazy, thread-safe initialization on first access
    public static CacheManager Instance { get; } = new CacheManager();

    private CacheManager() { } // Prevents external instantiation
}`,
    redFlags: [
      "Storing mutable user or request state in static fields in an ASP.NET Core application (causes catastrophic cross-tenant data leaks across concurrent threads).",
      "Using static utility classes for database access or external HTTP calls (makes unit testing impossible).",
      "Throwing unhandled exceptions inside a static constructor."
    ],
    proTips: [
      "Reserve static classes for pure, stateless utility functions (e.g. StringUtils, RegexHelpers, Math). For stateful services, always use DI Singletons (services.AddSingleton<T>)."
    ]
  },
  {
    title: "Composition vs. Inheritance: Why favor composition?",
    seniority: "Mid-to-Senior",
    tags: ["Composition", "Inheritance", "Has-A vs Is-A", "Fragile Base Class"],
    pitch: "Inheritance creates a tight, compile-time 'is-a' coupling where derived classes depend directly on base class implementation details (the fragile base class problem). Composition establishes a loose 'has-a' relationship where an object encapsulates references to interfaces, delegating tasks at runtime. Favoring composition provides superior flexibility, testability, and runtime interchangeability.",
    analogy: "Inheritance is being born with your parents' physical traits; Composition is hiring a photographer, a caterer, and a DJ for an event: you can swap the DJ without changing who you are.",
    deepDive: `The Fragile Base Class Problem:
1. Tight Coupling:
   - If class Base changes a method implementation or internal locking mechanism, all 50 derived classes can silently break or deadlock.
2. Single Inheritance Constraint:
   - In C#, a class can only inherit from one base class. Committing to a base class consumes your single inheritance hierarchy.
3. Testability:
   - Base classes with database or network calls cannot be easily mocked in unit tests.
   - Composition with injected interfaces allows 100% mocked unit testing.`,
    codeSnippet: `// ❌ INHERITANCE: Fragile coupling, impossible to swap notification channel
public class UserRegistrationService : SmtpEmailService
{
    public void RegisterUser(string email)
    {
        // Must use inherited SmtpEmailService implementation
        SendEmail(email, "Welcome!");
    }
}

// ✅ COMPOSITION: Loose coupling, easily tested and swapped at runtime
public class FlexibleRegistrationService
{
    private readonly IMessageSender _sender; // 'Has-A' relationship

    public FlexibleRegistrationService(IMessageSender sender)
    {
        _sender = sender;
    }

    public async Task RegisterUserAsync(string destination, CancellationToken ct)
    {
        // Can be EmailSender, SmsSender, or MockSender!
        await _sender.SendMessageAsync(destination, "Welcome!", ct);
    }
}`,
    redFlags: [
      "Creating 5-level deep inheritance hierarchies (e.g. Animal -> Mammal -> Canine -> Dog -> Labrador).",
      "Inheriting from a class just to reuse a single helper method (use extension methods or a focused utility service instead).",
      "Stating that inheritance is always bad (inheritance is fine for shared entity identity, but composition is preferred for behavior)."
    ],
    proTips: [
      "Apply the 'Is-A' vs 'Has-A' rule: If an object merely uses behavior, it 'Has-A' dependency (composition). Only use inheritance if Liskov Substitution holds true 100% of the time."
    ]
  },
  {
    title: "ref vs. out vs. in: Parameter Passing Semantics and Memory Safety",
    seniority: "Mid-to-Senior",
    tags: ["ref", "out", "in", "Memory", "IL Lowering", "Defensive Copies"],
    pitch: "'ref' passes an existing variable by reference (must be initialized before calling, allows both read and write). 'out' passes by reference to return multiple values (the callee is required to assign before returning). 'in' passes a value type by read-only reference, eliminating stack-copy overhead for large structs while preventing modification. In IL, all three emit managed pointers (&).",
    analogy: "ref is handing someone a notebook to add or edit notes; out is handing someone a blank form they must fill out before giving it back; in is letting someone read your notebook under glass without touching it.",
    deepDive: `IL Lowering & Defensive Copies:
1. IL Lowering:
   - 'ref', 'out', and 'in' all pass an 8-byte managed pointer on 64-bit systems.
2. The Defensive Copy Hazard:
   - When passing a struct with 'in', if the struct is NOT declared as 'readonly struct', Roslyn creates a hidden stack copy before invoking any method or property on it to guarantee immutability!
   - Always declare large structs as 'readonly struct' when using 'in'.`,
    codeSnippet: `public readonly struct BoundingBox // Must be readonly struct!
{
    public readonly double MinX, MinY, MaxX, MaxY; // 32 bytes
    public BoundingBox(double x1, double y1, double x2, double y2) => (MinX, MinY, MaxX, MaxY) = (x1, y1, x2, y2);
}

public class GeometryService
{
    // ✅ 'in': Zero-copy read-only reference
    public static bool Intersects(in BoundingBox a, in BoundingBox b)
    {
        return a.MinX <= b.MaxX && a.MaxX >= b.MinX &&
               a.MinY <= b.MaxY && a.MaxY >= b.MinY;
    }

    // ✅ 'out': Callee MUST assign before returning
    public static bool TryParseCoords(string input, out double lat, out double lon)
    {
        lat = 0; lon = 0;
        var parts = input.Split(',');
        return parts.Length == 2 && double.TryParse(parts[0], out lat) && double.TryParse(parts[1], out lon);
    }
}`,
    redFlags: [
      "Using 'in' on primitive types like int or bool (passing an 8-byte pointer for a 4-byte int is slower than copying into a register).",
      "Failing to make structs 'readonly struct' when passing with 'in', incurring silent defensive copy overhead.",
      "Using 'out' parameters extensively in public APIs instead of returning clean tuples or records."
    ],
    proTips: [
      "Use 'in' only for structs larger than 16 bytes (IntPtr.Size * 2). For primitives and small structs, pass by value directly."
    ]
  },
  {
    title: "What is the difference between a Task and a Thread?",
    seniority: "Mid-to-Senior",
    tags: ["Task", "Thread", "Async", "ThreadPool", "OS Thread"],
    pitch: "A Thread is an operating-system level execution resource with its own 1MB stack memory and context-switching overhead. A Task is a higher-level promise representing an asynchronous operation that may or may not occupy a thread continuously. For web I/O operations, tasks release threads back to the ThreadPool while waiting for database or network responses.",
    analogy: "A thread is a hired worker; a task is a job ticket. The worker can pick up a ticket, start it, put it on hold while waiting for materials, work on another ticket, and resume later.",
    deepDive: `Under the Hood Differences:
1. Thread (OS Concept):
   - Created via 'new Thread()'. Heavyweight (~1MB stack committed memory).
   - Thread context switching requires CPU kernel transitions.
2. Task (TPL - Task Parallel Library):
   - Created via Task.Run or async I/O.
   - Backed by the CLR ThreadPool or standard I/O Completion Ports (IOCP).
   - When an async I/O call is awaited (e.g. database query), NO thread is blocked! The OS kernel signals completion via IOCP, and the ThreadPool assigns any available thread to resume MoveNext().`,
    codeSnippet: `// ❌ JUNIOR MISTAKE: Spawns heavy OS thread, exhausts server under load
public void BadHandleRequest()
{
    var thread = new Thread(() =>
    {
        Thread.Sleep(3000); // Blocks 1MB OS thread!
    });
    thread.Start();
}

// ✅ SENIOR PATTERN: Non-blocking Task releases thread to ThreadPool
public async Task GoodHandleRequestAsync(CancellationToken ct)
{
    // Releases thread immediately back to ThreadPool!
    await Task.Delay(TimeSpan.FromSeconds(3), ct);
}`,
    redFlags: [
      "Saying that every Task creates a new Thread (Tasks are scheduled on the ThreadPool or complete via IOCP).",
      "Creating manual 'new Thread()' in ASP.NET Core applications.",
      "Calling Thread.Sleep() inside an async controller method."
    ],
    proTips: [
      "For compute-bound CPU tasks, use Task.Run() to queue work to the ThreadPool. For I/O-bound tasks (database, HTTP, disk), use native async/await APIs without Task.Run()."
    ]
  },
  {
    title: "How does async and await improve a web API?",
    seniority: "Mid-to-Senior",
    tags: ["async/await", "Scalability", "ThreadPool", "Throughput", "I/O Completion Ports"],
    pitch: "For I/O-bound operations, await lets the HTTP request release its ThreadPool thread while waiting for the database or network response, freeing that thread to serve other concurrent web requests. This dramatically increases server throughput and scalability, though it does not make a single request run faster.",
    analogy: "While laundry runs, you can do homework instead of staring at the machine: that is better use of time, not a faster washer.",
    deepDive: `Internal Scalability Mechanics:
1. The ThreadPool Bottleneck:
   - A synchronous web server with 50 threads handling 50 requests that each wait 200ms for SQL Server will block all 50 threads, causing request queueing.
2. Non-Blocking I/O:
   - With async/await, when 'await db.SaveChangesAsync()' is called, the request thread is returned immediately to the pool.
   - The same 50 threads can now easily handle 5,000 concurrent requests!
3. The Async All The Way Principle:
   - Async must flow through the entire call chain. Mixing sync and async (.Result, .Wait()) starves the ThreadPool and causes deadlocks.`,
    codeSnippet: `// ❌ THREADPOOL STARVATION: Blocks worker thread waiting for I/O
[HttpGet("orders")]
public IActionResult GetOrdersSync(AppDbContext db)
{
    var orders = db.Orders.ToList(); // Blocks ThreadPool thread!
    return Ok(orders);
}

// ✅ HIGH-THROUGHPUT ASYNC: Releases worker thread during SQL I/O
[HttpGet("orders")]
public async Task<IActionResult> GetOrdersAsync(AppDbContext db, CancellationToken ct)
{
    var orders = await db.Orders.AsNoTracking().ToListAsync(ct); // Zero threads blocked!
    return Ok(orders);
}`,
    redFlags: [
      "Calling .Result, .Wait(), or .GetAwaiter().GetResult() in request code.",
      "Believing that async/await makes CPU-heavy calculations run faster.",
      "Not passing CancellationToken through async call chains."
    ],
    proTips: [
      "Always configure CancellationToken parameters on API controller actions and pass them to all EF Core and HttpClient methods to terminate wasted database queries when users navigate away."
    ]
  },
  {
    title: "Task vs. ValueTask: When should you return which, and what are the traps?",
    seniority: "Senior",
    tags: ["Task", "ValueTask", "Heap Allocation", "Synchronous Fast Path", "AsTask"],
    pitch: "Task is a reference type that always allocates an object on the managed heap. ValueTask is a struct that avoids heap allocations when an operation completes synchronously (e.g., in-memory cache hit). However, ValueTask cannot be awaited multiple times or awaited concurrently. If needed multiple times, convert it to Task using .AsTask().",
    analogy: "Task is buying an expensive reusable container for every meal; ValueTask is a paper cup: zero-cost if you drink right away, but you cannot reuse it or pass it around to multiple people.",
    deepDive: `State Machine Allocation Details:
1. The Heap Allocation Problem:
   - If a method returns Task<int> and gets called 100,000 times per second from a memory cache, each call allocates a Task object (~72 bytes on 64-bit), causing Gen 0 GC churn.
2. ValueTask<T> Struct:
   - Can wrap either a direct result value T OR an underlying Task<T>.
   - When result is available immediately: ValueTask<int>(42) allocates 0 bytes on the heap!
3. The Multiple Await Bug:
   - Awaiting a ValueTask multiple times causes undefined behavior because the underlying IValueTaskSource may have already been pooled and reused!`,
    codeSnippet: `public class CachedDataService
{
    private readonly MemoryCache _cache = new();

    // ✅ SENIOR PATTERN: Zero-allocation on cache hits
    public ValueTask<string> GetDataAsync(string key, CancellationToken ct)
    {
        if (_cache.TryGetValue(key, out string? value) && value != null)
        {
            // Synchronous fast path: 0 heap allocations!
            return new ValueTask<string>(value);
        }

        // Asynchronous slow path: Fetches from database
        return new ValueTask<string>(FetchFromDbAsync(key, ct));
    }

    private async Task<string> FetchFromDbAsync(string key, CancellationToken ct)
    {
        await Task.Delay(100, ct);
        return "DbResult";
    }
}`,
    redFlags: [
      "Awaiting a ValueTask multiple times or using Task.WhenAll on a list of ValueTasks without calling .AsTask().",
      "Using ValueTask blindly on methods that complete asynchronously 100% of the time (ValueTask is larger than Task and incurs extra state machine struct copies).",
      "Storing a ValueTask in a field for later inspection."
    ],
    proTips: [
      "Rule of thumb: Return ValueTask<T> only if performance profiling shows high invocation frequency AND > 20% of calls complete synchronously."
    ]
  },
  {
    title: "CLR Garbage Collection: Generations (Gen 0/1/2), the 85KB LOH Threshold, and ArrayPool",
    seniority: "Senior",
    tags: ["GC", "Gen 0/1/2", "LOH", "POH", "ArrayPool", "Mark-Sweep-Compact"],
    pitch: "The CLR GC is a generational, tracing garbage collector operating on three ephemeral generations (Gen 0 for short-lived items, Gen 1 as a buffer, and Gen 2 for long-lived singletons). Objects >= 85,000 bytes bypass ephemeral segments and go directly to the Large Object Heap (LOH), which is collected during Gen 2 and is not compacted by default, risking memory fragmentation. ArrayPool<T> prevents LOH allocation churn.",
    analogy: "Gen 0 is the trash can by your desk; Gen 1 is the hallway dumpster; Gen 2 is the city landfill; LOH is oversize bulky trash that requires special pickup and is rarely rearranged.",
    deepDive: `Internal GC Mechanics:
1. The Generational Hypothesis:
   - Most objects die young (> 90% of Gen 0 objects are collected in milliseconds).
   - Gen 0 collections are fast (stop-the-world pause of < 1ms).
   - Gen 2 collections (Full GC) inspect the entire heap and cause visible latency pauses.
2. Large Object Heap (LOH):
   - Threshold: >= 85,000 bytes.
   - LOH objects are allocated in Gen 2 directly.
   - Because copying large objects in RAM is expensive, LOH is swept without compaction, creating address space holes.
3. Pinned Object Heap (POH):
   - Introduced in .NET 5 to store pinned arrays so they do not block GC compaction in Gen 0/1/2.`,
    codeSnippet: `public class HighThroughputBufferManager
{
    // ❌ JUNIOR MISTAKE: Allocates 100KB buffer on LOH every request, causing Gen 2 GC churn
    public void BadProcessLargeData(Stream stream)
    {
        byte[] buffer = new byte[100_000]; // >= 85,000 bytes -> Goes to LOH!
        stream.Read(buffer, 0, buffer.Length);
    }

    // ✅ SENIOR PATTERN: Rent from ArrayPool, 0 heap allocations, 0 GC pauses
    public void GoodProcessLargeData(Stream stream)
    {
        byte[] buffer = ArrayPool<byte>.Shared.Rent(100_000);
        try
        {
            int bytesRead = stream.Read(buffer, 0, 100_000);
            // Process data...
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer); // Always return in finally!
        }
    }
}`,
    redFlags: [
      "Calling GC.Collect() manually in production web code (destroys GC self-tuning heuristics and freezes threads).",
      "Allocating byte arrays >= 85,000 bytes repeatedly inside high-frequency loops.",
      "Forgetting to return rented buffers to ArrayPool in a finally block."
    ],
    proTips: [
      "Always inspect buffer.Length when renting from ArrayPool: ArrayPool may return an array larger than requested! Never assume rentedBuffer.Length == requestedSize."
    ]
  },
  {
    title: "The Standard IDisposable and IAsyncDisposable Pattern with Finalizers",
    seniority: "Senior",
    tags: ["IDisposable", "IAsyncDisposable", "Finalizer", "GC.SuppressFinalize", "SafeHandle"],
    pitch: "The standard Dispose pattern provides deterministic cleanup of unmanaged OS resources (file handles, network sockets, unmanaged pointers) before non-deterministic GC collection. Implementing IDisposable with Dispose(bool disposing) and GC.SuppressFinalize(this) removes the object from the Finalization Queue, avoiding costly Gen 2 finalizer promotion. Modern .NET also requires IAsyncDisposable with DisposeAsync() for non-blocking asynchronous cleanup via 'await using'.",
    analogy: "Dispose is turning off your car engine and locking the doors when you arrive; the Finalizer is the tow truck hauling away an abandoned car days later.",
    deepDive: `Finalization Queue Internals:
1. The Finalizer Cost:
   - Objects with a Finalizer (~ClassName) that are NOT suppressed survive Gen 0/1 collection, get promoted to Gen 2, and are placed on the Finalizer Queue.
   - The CLR's single-threaded Finalizer thread must run before their memory can be reclaimed on the NEXT GC cycle!
   - Calling GC.SuppressFinalize(this) completely bypasses the finalizer thread.
2. IAsyncDisposable (.NET Core 3.0+):
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
            _bufferedFile?.Dispose();
            _bufferedFile = null;
        }

        _unmanagedHandle?.Dispose();
        _unmanagedHandle = null;
    }

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
      "Accessing managed disposable objects inside the Finalizer (managed objects may have already been collected by the GC!).",
      "Calling synchronous .Dispose() on streams and network handles in high-throughput async pipelines instead of 'await using'."
    ],
    proTips: [
      "Wrap native OS pointers with SafeHandle instead of raw IntPtr: SafeHandle derives from CriticalFinalizerObject and guarantees cleanup even during thread aborts or out-of-memory exceptions."
    ]
  },
  {
    title: "Delegates vs. Events: Encapsulation and Memory Leak Traps",
    seniority: "Mid-to-Senior",
    tags: ["Delegates", "Events", "MulticastDelegate", "Memory Leaks", "Action/Func"],
    pitch: "A delegate is a type-safe object-oriented function pointer inheriting from System.MulticastDelegate with an internal linked invocation list. An 'event' is a compiler-enforced encapsulation wrapper over a delegate: it restricts external consumers to only adding (+=) or removing (-=) handlers, preventing external code from invoking the delegate directly or accidentally resetting subscribers with '= null'. The classic senior bug is the 'Lapsed Listener' memory leak: subscribing a short-lived object's method to a long-lived publisher prevents the subscriber from ever being collected by GC.",
    analogy: "A delegate is an open sign-up sheet anyone can erase or trigger; an event is a secure mailbox where you can submit or cancel your subscription, but only the owner can send the broadcast.",
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
   - If A is a Singleton (or static) and B is a short-lived UI view or scoped service, B will NEVER be garbage collected until unsubscribed.`,
    codeSnippet: `public class OrderPublisher
{
    // ✅ Event encapsulates delegate against external tampering
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
    seniority: "Mid-to-Senior",
    tags: ["const", "readonly", "static readonly", "IL Inlining", "Assembly Versioning"],
    pitch: "'const' is evaluated at compile-time: the Roslyn compiler literally inlines the literal primitive or string value directly into the calling assembly's IL bytecode. If assembly A changes a 'const' and is redeployed without recompiling assembly B, assembly B silently retains the stale hardcoded value. In contrast, 'readonly' and 'static readonly' fields are evaluated at runtime (in instance constructors or the static class constructor .cctor), referencing the live memory address and supporting reference types and cross-assembly updates without breaking changes.",
    analogy: "const is printing the price on the box at the factory; static readonly is looking up the price at the register when the item is scanned.",
    deepDive: `Compilation and Execution Mechanics:
1. Roslyn IL Lowering of 'const':
   - 'public const int MaxRetries = 3;'
   - When referenced from another assembly: 'ldc.i4.3' (literal constant 3) is hardcoded directly into the caller's IL!
   - There is NO runtime field lookup. If MaxRetries is changed to 5 in a shared NuGet library, the consumer will keep using 3 until recompiled!
2. 'static readonly' Evaluation:
   - Evaluated during the execution of the class's static constructor (.cctor) when the type is first initialized by the CLR.
   - Emits 'ldsfld' (load static field) in the caller's IL, ensuring the current value from memory is always loaded.
   - Allows constructing complex reference objects: 'public static readonly HttpClient Client = new();'`,
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
  },
  {
    title: "String Immutability, String Interning, and StringBuilder Performance",
    seniority: "Mid-to-Senior",
    tags: ["string", "StringBuilder", "Immutability", "String Pool", "String Interning"],
    pitch: "Strings in C# are immutable reference types: any modification (concatenation, Replace, Substring) allocates a brand-new string on the managed heap. Repeated string concatenation in loops generates massive Gen 0 GC churn. StringBuilder uses an internal mutable char buffer that expands as needed, eliminating intermediate allocations. String Interning maintains a CLR-wide table of unique string literals to share identical references across the AppDomain.",
    analogy: "String immutability is writing in stone: to fix a typo, you must carve a brand-new stone tablet. StringBuilder is a whiteboard where you can write, erase, and append until you take the final photo.",
    deepDive: `Memory Allocations in Loops:
1. The O(N^2) Concatenation Trap:
   - string s = ""; for (int i = 0; i < 10000; i++) s += i;
   - Allocates 10,000 separate string objects on the heap, copying previous characters every iteration!
2. StringBuilder Mechanics:
   - Maintains a linked list of chunk buffers (default capacity 16 chars, doubling on demand).
   - Appends characters in-place inside the buffer array.
3. String Interning:
   - String literals defined in code are automatically interned by the CLR into a hash table.
   - String.Intern(s) and String.IsInterned(s) allow dynamic strings to reuse the intern pool.`,
    codeSnippet: `// ❌ JUNIOR MISTAKE: Allocates 5,000 string objects on Gen 0 heap!
public string BadBuildCsv(IEnumerable<int> ids)
{
    string result = "";
    foreach (var id in ids)
    {
        result += id + ","; // Allocates new string every iteration!
    }
    return result;
}

// ✅ SENIOR PATTERN: StringBuilder with estimated capacity
public string GoodBuildCsv(IReadOnlyCollection<int> ids)
{
    var sb = new StringBuilder(ids.Count * 8); // Pre-allocate capacity!
    foreach (var id in ids)
    {
        if (sb.Length > 0) sb.Append(',');
        sb.Append(id);
    }
    return sb.ToString();
}`,
    redFlags: [
      "Using string += in a loop over hundreds or thousands of elements.",
      "Instantiating a StringBuilder for a simple 2-string concatenation (e.g. var s = 'A' + 'B' is evaluated at compile-time by Roslyn; StringBuilder overhead is worse!).",
      "Not setting initial capacity on StringBuilder when the approximate size is known."
    ],
    proTips: [
      "In modern .NET, for combining small sequences, prefer 'string.Join(',', ids)' or 'string.Create()' which allocate the exact buffer size up-front with zero intermediate allocations."
    ]
  },
  {
    title: "Exception Handling Best Practices: throw vs. throw ex, try-catch-finally, and Custom Exceptions",
    seniority: "Mid-to-Senior",
    tags: ["Exceptions", "throw vs throw ex", "try-catch-finally", "Stack Trace", "Custom Exceptions"],
    pitch: "In C#, using 'throw;' rethrows the caught exception while fully preserving the original call stack and line numbers. Using 'throw ex;' overwrites the stack trace, making it appear that the error originated right at that catch block and obscuring the true root cause. Catch blocks should only be used when you can genuinely handle the failure, add domain context, or log diagnostics before rethrowing.",
    analogy: "throw; is forwarding the original police report with all timestamps intact; throw ex; is tearing up the report and filing a new one in your own name, erasing where the crime actually happened.",
    deepDive: `Stack Trace Preservation:
1. 'throw;' vs 'throw ex;':
   - 'throw ex;' tells the CLR to reset the Exception.StackTrace to the current line!
   - In production logs, the error will point to the catch block instead of the deeply nested repository method that threw it.
2. Custom Domain Exceptions:
   - Always inherit from 'Exception' (not ApplicationException).
   - Provide standard constructors (message, innerException).
   - Use them for business validation errors (e.g. InsufficientFundsException, EntityNotFoundException).
3. Exception Filters ('when'):
   - C# 6+ supports 'catch (SqlException ex) when (ex.Number == 1205)' to intercept specific error codes without unwinding the stack!`,
    codeSnippet: `public async Task ProcessOrderAsync(Guid orderId, CancellationToken ct)
{
    try
    {
        await ExecutePaymentWorkflowAsync(orderId, ct);
    }
    // ✅ Exception Filter: Catches ONLY deadlock exceptions without unwinding stack
    catch (SqlException ex) when (ex.Number == 1205)
    {
        _logger.LogWarning(ex, "Deadlock detected for order {OrderId}. Retrying...", orderId);
        await RetryWorkflowAsync(orderId, ct);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to process order {OrderId}", orderId);
        
        // ❌ NEVER DO: throw ex; (Erases root stack trace!)
        // ✅ CORRECT: Preserves full original stack trace
        throw; 
    }
}`,
    redFlags: [
      "Using 'throw ex;' inside a catch block.",
      "Catching the generic 'Exception' type and swallowing it with an empty catch block (silent errors).",
      "Using exceptions for ordinary business control flow (e.g., throwing an exception when a password is wrong instead of returning a Result object)."
    ],
    proTips: [
      "Use C# Exception Filters 'catch (Exception ex) when (condition)': if the condition is false, the stack is NOT unwound, which preserves the original crash dump state for tools like Azure Application Insights."
    ]
  }
];

console.log('Total C# questions:', csharpQuestions.length);

module.exports = { csharpQuestions };
