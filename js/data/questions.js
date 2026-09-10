// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM (POPULAR QUESTIONS)
// Sourced from User's Layer 1-4 Guide, OOP Core Standards & Top GitHub .NET Repos
// 96 Popular, High-Frequency Questions Across 6 Pillars with Teenager Analogies
// ============================================================================

window.INTERVIEW_QUESTIONS = [
  {
    "id": "q-csharp-1",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "OOP",
      "Encapsulation",
      "Inheritance",
      "Polymorphism",
      "Abstraction"
    ],
    "title": "What are the 4 fundamental pillars of Object-Oriented Programming (OOP)?",
    "pitch": "The 4 pillars are Encapsulation (bundling data with methods and restricting direct access via access modifiers), Abstraction (exposing only essential interfaces while hiding internal complexity), Inheritance (enabling a derived class to acquire properties and behavior from a base class), and Polymorphism (allowing different classes to be treated through a common interface via method overriding or overloading).",
    "analogy": "Encapsulation is a car's engine under the hood; Abstraction is the steering wheel and pedals; Inheritance is a sports car sharing a chassis with a sedan; Polymorphism is pressing the gas pedal on either an electric or gas car and having each accelerate in its own way.",
    "deepDive": "Deep Dive & Architectural Role:\n1. Encapsulation: Prevents unauthorized state mutation by making fields private and exposing validation logic through properties and methods.\n2. Abstraction: Expressed via interfaces (IService) and abstract classes. Callers depend on contracts rather than concrete implementations.\n3. Inheritance: Models 'is-a' relationships in C# (single class inheritance). Derivation allows code reuse, but deep hierarchies introduce fragile base class problems.\n4. Polymorphism:\n   - Dynamic/Runtime Polymorphism: virtual methods and interface implementations resolved via the vtable (virtual method table) at runtime.\n   - Static/Compile-Time Polymorphism: Method overloading and generics resolved by the compiler.",
    "codeSnippet": "// 1. Abstraction & Interface Contract\npublic interface IPaymentProcessor\n{\n    Task<PaymentResult> ProcessPaymentAsync(decimal amount);\n}\n\n// 2. Encapsulation & Inheritance\npublic abstract class BaseProcessor : IPaymentProcessor\n{\n    private decimal _feeRate; // Encapsulated field\n\n    protected BaseProcessor(decimal feeRate) => _feeRate = feeRate;\n\n    // 3. Polymorphism (Runtime Virtual Overriding)\n    public virtual Task<PaymentResult> ProcessPaymentAsync(decimal amount)\n    {\n        var fee = amount * _feeRate;\n        return Task.FromResult(new PaymentResult(true, amount + fee));\n    }\n}\n\npublic class StripeProcessor : BaseProcessor\n{\n    public StripeProcessor() : base(0.029m) { }\n\n    public override async Task<PaymentResult> ProcessPaymentAsync(decimal amount)\n    {\n        // Custom Stripe API execution\n        return await base.ProcessPaymentAsync(amount);\n    }\n}",
    "redFlags": [
      "Listing the 4 pillars by name without being able to write a clear C# code example for each.",
      "Confusing Abstraction with Encapsulation (Encapsulation is information hiding/protection; Abstraction is interface simplicity).",
      "Claiming C# supports multiple class inheritance (C# only supports multiple interface inheritance)."
    ],
    "proTips": [
      "In enterprise .NET architecture, always mention favoring Composition over Inheritance: deep inheritance trees create tight coupling and testability headaches."
    ]
  },
  {
    "id": "q-csharp-2",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "OOP",
      "Polymorphism",
      "Overloading",
      "Overriding",
      "virtual",
      "override",
      "new"
    ],
    "title": "Method Overloading vs. Method Overriding: What is the difference?",
    "pitch": "Method Overloading is compile-time (static) polymorphism where multiple methods in the same class share the same name but differ in parameter types or counts. Method Overriding is runtime (dynamic) polymorphism where a derived class provides a specific implementation of a virtual or abstract method defined in its base class using the override keyword.",
    "analogy": "Overloading is a multi-tool that opens cans, bottles, or screws depending on what you hand it; Overriding is a child following the family recipe but substituting an ingredient to make their own version.",
    "deepDive": "Compiler & Runtime Mechanics:\n1. Overloading (Compile-Time):\n   - Resolved during compilation by Roslyn looking at method signatures (name + parameter types).\n   - Return types alone are NOT sufficient to overload a method.\n2. Overriding (Runtime):\n   - Base method must be marked 'virtual', 'abstract', or 'override'.\n   - Derived method must use 'override'.\n   - The CLR uses the object's method table (vtable) to dispatch the call based on the runtime type of the instance, regardless of the variable reference type.\n3. The 'new' Method Shadowing Trap:\n   - If a derived method uses 'new' instead of 'override', it hides the base method.\n   - Calling through a base class reference invokes the BASE implementation, NOT the derived one!",
    "codeSnippet": "public class Calculator\n{\n    // ✅ Method Overloading (Compile-Time Polymorphism)\n    public int Add(int a, int b) => a + b;\n    public decimal Add(decimal a, decimal b) => a + b;\n    public int Add(int a, int b, int c) => a + b + c;\n}\n\npublic class BaseReport\n{\n    public virtual string Generate() => \"Standard Report Data\";\n}\n\npublic class DetailedReport : BaseReport\n{\n    // ✅ Method Overriding (Runtime Polymorphism)\n    public override string Generate() => \"Detailed Executive Financial Metrics\";\n}\n\n// Runtime Resolution:\nBaseReport report = new DetailedReport();\nConsole.WriteLine(report.Generate()); // Outputs \"Detailed Executive Financial Metrics\"!",
    "redFlags": [
      "Claiming you can overload a method by simply changing the return type (produces a C# compile error).",
      "Using the 'new' keyword instead of 'override' without realizing it breaks polymorphic dispatch.",
      "Not knowing that private methods cannot be overridden."
    ],
    "proTips": [
      "Mark overridden methods as 'sealed' if you want to prevent further subclasses down the inheritance chain from overriding them again."
    ]
  },
  {
    "id": "q-csharp-3",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "OOP",
      "Interface",
      "Abstract Class",
      "Contracts",
      "Dependency Injection"
    ],
    "title": "Interface or abstract class: when would you use each?",
    "pitch": "Use an interface to define a capability or contract that unrelated classes can implement without dictating their hierarchy. Use an abstract class when related types need shared implementation behavior or protected internal state, while still leaving specific operations abstract for subclasses.",
    "analogy": "An interface is a driver's license requirement (anyone can qualify regardless of family); an abstract class is a basic car frame shared by related vehicle models.",
    "deepDive": "Architectural Decision Matrix:\n1. Interfaces:\n   - Defines pure contract capability (e.g., IDisposable, IEnumerable, IRepository<T>).\n   - Classes can implement multiple interfaces (supporting multiple inheritance of contracts).\n   - Perfect for Dependency Injection service boundaries and unit testing mocks.\n   - C# 8+ supports Default Interface Methods (DIM) for backward-compatible API evolution.\n2. Abstract Classes:\n   - Can hold state (fields), non-public constructors, and protected helper methods.\n   - Restricts derived classes to single inheritance.\n   - Ideal for Template Method patterns (e.g., BaseController, BaseEntity with Id and CreatedAtUtc).",
    "codeSnippet": "// Contract: Implemented by completely unrelated classes\npublic interface IAuditable\n{\n    DateTime CreatedAtUtc { get; }\n    string CreatedBy { get; }\n}\n\n// Abstract Class: Shares state & enforces base constructor invariants\npublic abstract class EntityBase : IAuditable\n{\n    public Guid Id { get; protected init; } = Guid.NewGuid();\n    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;\n    public string CreatedBy { get; private set; }\n\n    protected EntityBase(string createdBy) => CreatedBy = createdBy;\n\n    // Derived classes MUST provide domain validation\n    public abstract bool IsValid();\n}",
    "redFlags": [
      "Forcing inheritance just to share 3 lines of utility code (composition or extension methods are cleaner).",
      "Declaring instance fields in an interface (C# does not permit interface instance fields).",
      "Not knowing that interfaces are the primary foundation for Dependency Injection in ASP.NET Core."
    ],
    "proTips": [
      "Always design public API service boundaries with interfaces (e.g. ICustomerService); use abstract base classes internally within the domain model for shared entity invariants."
    ]
  },
  {
    "id": "q-csharp-4",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "SOLID",
      "Design Patterns",
      "Clean Code",
      "SRP",
      "OCP",
      "LSP",
      "ISP",
      "DIP"
    ],
    "title": "Explain the SOLID principles with concrete C# examples.",
    "pitch": "SOLID comprises 5 core object-oriented design principles: Single Responsibility (a class should have one reason to change), Open/Closed (open for extension, closed for modification), Liskov Substitution (subtypes must be substitutable for their base types), Interface Segregation (clients should not depend on interfaces they do not use), and Dependency Inversion (high-level modules should depend on abstractions, not concretions).",
    "analogy": "SRP is a chef cooking instead of delivering food; OCP is adding a phone attachment without opening the phone; LSP is a stunt double doing everything the actor can do; ISP is a TV remote with only the buttons you need; DIP is plugging into a wall outlet rather than hardwiring your appliance to the electric grid.",
    "deepDive": "Breakdown of Each Principle:\n1. Single Responsibility (SRP): Separate persistence from business logic (e.g., OrderService validates order, OrderRepository saves it).\n2. Open/Closed (OCP): Use strategy pattern or polymorphism to add new payment methods without modifying existing if/else blocks.\n3. Liskov Substitution (LSP): Subclasses must not throw NotImplementedException for base interface methods or violate base post-conditions.\n4. Interface Segregation (ISP): Split fat interfaces like IOrderService into IPaymentHandler, IInvoiceGenerator, IShippingCalculator.\n5. Dependency Inversion (DIP): Controllers inject interfaces (IOrderRepository) rather than instantiating concrete SqlOrderRepository with 'new'.",
    "codeSnippet": "// ❌ VIOLATION of DIP and SRP: Hardcoded dependency & mixed responsibilities\npublic class BadOrderController\n{\n    public void PlaceOrder(Order order)\n    {\n        var repo = new SqlOrderRepository(); // Direct concretion!\n        repo.Save(order);\n        var smtp = new SmtpClient();        // Direct email sending!\n        smtp.Send(\"Admin@domain.com\", \"Order Placed\");\n    }\n}\n\n// ✅ SOLID: Inverted dependencies, segregated interfaces, single responsibilities\npublic class GoodOrderController\n{\n    private readonly IOrderRepository _repository;\n    private readonly INotificationService _notifier;\n\n    public GoodOrderController(IOrderRepository repository, INotificationService notifier)\n    {\n        _repository = repository;\n        _notifier = notifier;\n    }\n\n    public async Task<IActionResult> PlaceOrderAsync(Order order, CancellationToken ct)\n    {\n        await _repository.SaveAsync(order, ct);\n        await _notifier.NotifyAsync(\"Order Placed\", ct);\n        return Ok();\n    }\n}",
    "redFlags": [
      "Reciting the SOLID acronym letters without explaining what problem each principle solves.",
      "Throwing NotImplementedException in a derived subclass (classic Liskov Substitution Principle violation).",
      "Creating god classes with 30 methods doing data access, logging, HTTP requests, and calculation."
    ],
    "proTips": [
      "In ASP.NET Core, the built-in DI container (IServiceCollection) is the direct manifestation of the Dependency Inversion Principle (DIP)."
    ]
  },
  {
    "id": "q-csharp-5",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Class",
      "Struct",
      "Value Types",
      "Reference Types",
      "Stack",
      "Heap",
      "Boxing"
    ],
    "title": "Class vs. Struct in C#: Value Types vs. Reference Types, Stack vs. Heap, and Boxing",
    "pitch": "A class is a reference type allocated on the managed heap, copied by reference pointer, and collected by the Garbage Collector. A struct is a value type allocated inline where declared (typically on the execution stack or inside an enclosing object), copied by value, and cleaned up when its scope exits. Boxing occurs when a value type is cast to object or an interface, forcing a heap allocation and copy.",
    "analogy": "A struct is like printing a physical coupon: handing it to someone gives them their own copy. A class is a Google Doc link: everyone points to the same document, and changes are visible to all.",
    "deepDive": "Memory & CLR Mechanics:\n1. Memory Allocation:\n   - Reference Types (class, string, delegate): Heap memory + 8-byte object header + 8-byte MethodTable pointer + stack pointer (8 bytes on 64-bit).\n   - Value Types (struct, int, bool, enum): Inline bytes. Zero heap GC overhead when kept on stack.\n2. Copy Semantics:\n   - Assigning struct B = A copies all fields. Mutating B does NOT affect A.\n   - Assigning class B = A copies the 8-byte reference pointer. Both point to the exact same heap memory.\n3. Boxing and Unboxing:\n   - object obj = 42; // Boxes 42 into a heap object!\n   - int x = (int)obj; // Unboxes back to stack.\n   - Causes GC Gen 0 churn in high-throughput loops.",
    "codeSnippet": "public struct PointStruct\n{\n    public int X, Y;\n}\n\npublic class PointClass\n{\n    public int X, Y;\n}\n\npublic static void DemonstrateMemory()\n{\n    PointStruct s1 = new PointStruct { X = 10, Y = 20 };\n    PointStruct s2 = s1; // Bitwise copy!\n    s2.X = 99;\n    Console.WriteLine(s1.X); // Still 10!\n\n    PointClass c1 = new PointClass { X = 10, Y = 20 };\n    PointClass c2 = c1; // Pointer copy!\n    c2.X = 99;\n    Console.WriteLine(c1.X); // Outputs 99!\n\n    // ⚠️ Boxing Trap:\n    object boxed = s1; // Allocates heap memory and copies struct!\n    int val = ((PointStruct)boxed).X; // Unboxes\n}",
    "redFlags": [
      "Believing structs are always faster than classes (large structs > 16 bytes take longer to pass as parameters because copying all fields is slow).",
      "Mutating fields on a struct through an interface or property (creates silent copy bugs).",
      "Not knowing what Boxing is or that it allocates heap memory."
    ],
    "proTips": [
      "Declare structs as 'readonly struct' in modern C#: the compiler guarantees immutability and eliminates hidden defensive copies when passed with the 'in' modifier."
    ]
  },
  {
    "id": "q-csharp-6",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Access Modifiers",
      "Encapsulation",
      "internal",
      "protected",
      "private protected"
    ],
    "title": "Access Modifiers in C#: public, private, protected, internal, and combinations",
    "pitch": "Access modifiers control member and type visibility. 'public' is accessible anywhere; 'private' is accessible only within the declaring type; 'protected' is accessible within the type and derived subclasses; 'internal' is accessible anywhere within the same assembly; 'protected internal' allows access from derived classes OR anywhere in the same assembly; 'private protected' allows access from derived classes ONLY within the same assembly.",
    "analogy": "Public is a public billboard; Private is your private diary; Protected is family heirlooms; Internal is an office bulletin board; Protected Internal is anyone in the building plus family outside; Private Protected is family members who work in the same building.",
    "deepDive": "Visibility Matrix & Assembly Boundaries:\n1. Default Visibilities:\n   - Classes and structs declared directly in a namespace default to 'internal'.\n   - Class members (methods, fields, properties) default to 'private'.\n   - Interface members default to 'public' (in C# 8+, can have private helper methods).\n2. 'InternalsVisibleTo' Attribute:\n   - Exposes 'internal' types to unit test projects without making them public to external consumers:\n     [assembly: InternalsVisibleTo(\"MyProject.Tests\")]\n3. Clean Architecture Usage:\n   - Use 'internal' for domain service implementations and EF Core DbContext entities so callers in API layers interact only via public interfaces.",
    "codeSnippet": "// Accessible only inside this assembly (clean encapsulation)\ninternal class OrderDomainService\n{\n    private readonly ILogger _logger; // Declaring class only\n\n    protected int RetryCount = 3;     // Subclasses can access\n\n    // Accessible in derived classes ONLY within this assembly\n    private protected void LogDiagnostic(string message)\n    {\n        _logger.LogInformation(message);\n    }\n\n    // Accessible anywhere in this assembly OR derived classes in other assemblies\n    protected internal void ResetCounter()\n    {\n        RetryCount = 0;\n    }\n}",
    "redFlags": [
      "Making all classes and methods 'public' by default, destroying encapsulation.",
      "Confusing 'protected internal' (OR condition) with 'private protected' (AND condition).",
      "Not knowing about '[InternalsVisibleTo]' for testing internal classes."
    ],
    "proTips": [
      "In Clean Architecture, make internal services and repository implementations 'internal' and expose only interfaces: this prevents junior developers from bypassing service layers and instantiating repositories directly."
    ]
  },
  {
    "id": "q-csharp-7",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "static",
      "Constructors",
      ".cctor",
      "Singleton",
      "Thread Safety"
    ],
    "title": "The static keyword: Static Classes, Methods, Constructors (.cctor), and Singletons",
    "pitch": "The 'static' keyword declares members that belong to the type itself rather than an instance. A static class cannot be instantiated, cannot inherit or be inherited from, and cannot implement interfaces. Static constructors (.cctor) are parameterless, run exactly once before the type is first accessed or instantiated, and are thread-safe and lazily invoked by the CLR.",
    "analogy": "A static class is the building's central heating furnace: there is only one for the entire building, and no tenant installs their own personal furnace.",
    "deepDive": "CLR Execution & Thread Safety:\n1. Static Constructors (.cctor):\n   - Executed automatically by the CLR before any instance is created or static member referenced.\n   - Guaranteed to be thread-safe by the CLR runtime without needing explicit locks.\n   - ⚠️ If an unhandled exception occurs in a static constructor, TypeInitializationException is thrown, and the type remains unusable for the entire lifetime of the AppDomain!\n2. Static Classes vs. DI Singletons:\n   - Static classes cannot implement interfaces, making them impossible to mock in unit tests.\n   - Favor Dependency Injection Singletons (AddSingleton<T>) over static classes for business services.",
    "codeSnippet": "public static class MathUtils // Cannot be instantiated\n{\n    public static readonly double Pi;\n\n    // Static constructor: Thread-safe, executes once by CLR\n    static MathUtils()\n    {\n        Pi = 3.14159265359;\n    }\n\n    public static double Circumference(double radius) => 2 * Pi * radius;\n}\n\n// High-Performance Thread-Safe Singleton using CLR Static Constructor\npublic sealed class CacheManager\n{\n    // CLR guarantees lazy, thread-safe initialization on first access\n    public static CacheManager Instance { get; } = new CacheManager();\n\n    private CacheManager() { } // Prevents external instantiation\n}",
    "redFlags": [
      "Storing mutable user or request state in static fields in an ASP.NET Core application (causes catastrophic cross-tenant data leaks across concurrent threads).",
      "Using static utility classes for database access or external HTTP calls (makes unit testing impossible).",
      "Throwing unhandled exceptions inside a static constructor."
    ],
    "proTips": [
      "Reserve static classes for pure, stateless utility functions (e.g. StringUtils, RegexHelpers, Math). For stateful services, always use DI Singletons (services.AddSingleton<T>)."
    ]
  },
  {
    "id": "q-csharp-8",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Composition",
      "Inheritance",
      "Has-A vs Is-A",
      "Fragile Base Class"
    ],
    "title": "Composition vs. Inheritance: Why favor composition?",
    "pitch": "Inheritance creates a tight, compile-time 'is-a' coupling where derived classes depend directly on base class implementation details (the fragile base class problem). Composition establishes a loose 'has-a' relationship where an object encapsulates references to interfaces, delegating tasks at runtime. Favoring composition provides superior flexibility, testability, and runtime interchangeability.",
    "analogy": "Inheritance is being born with your parents' physical traits; Composition is hiring a photographer, a caterer, and a DJ for an event: you can swap the DJ without changing who you are.",
    "deepDive": "The Fragile Base Class Problem:\n1. Tight Coupling:\n   - If class Base changes a method implementation or internal locking mechanism, all 50 derived classes can silently break or deadlock.\n2. Single Inheritance Constraint:\n   - In C#, a class can only inherit from one base class. Committing to a base class consumes your single inheritance hierarchy.\n3. Testability:\n   - Base classes with database or network calls cannot be easily mocked in unit tests.\n   - Composition with injected interfaces allows 100% mocked unit testing.",
    "codeSnippet": "// ❌ INHERITANCE: Fragile coupling, impossible to swap notification channel\npublic class UserRegistrationService : SmtpEmailService\n{\n    public void RegisterUser(string email)\n    {\n        // Must use inherited SmtpEmailService implementation\n        SendEmail(email, \"Welcome!\");\n    }\n}\n\n// ✅ COMPOSITION: Loose coupling, easily tested and swapped at runtime\npublic class FlexibleRegistrationService\n{\n    private readonly IMessageSender _sender; // 'Has-A' relationship\n\n    public FlexibleRegistrationService(IMessageSender sender)\n    {\n        _sender = sender;\n    }\n\n    public async Task RegisterUserAsync(string destination, CancellationToken ct)\n    {\n        // Can be EmailSender, SmsSender, or MockSender!\n        await _sender.SendMessageAsync(destination, \"Welcome!\", ct);\n    }\n}",
    "redFlags": [
      "Creating 5-level deep inheritance hierarchies (e.g. Animal -> Mammal -> Canine -> Dog -> Labrador).",
      "Inheriting from a class just to reuse a single helper method (use extension methods or a focused utility service instead).",
      "Stating that inheritance is always bad (inheritance is fine for shared entity identity, but composition is preferred for behavior)."
    ],
    "proTips": [
      "Apply the 'Is-A' vs 'Has-A' rule: If an object merely uses behavior, it 'Has-A' dependency (composition). Only use inheritance if Liskov Substitution holds true 100% of the time."
    ]
  },
  {
    "id": "q-csharp-9",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "ref",
      "out",
      "in",
      "Memory",
      "IL Lowering",
      "Defensive Copies"
    ],
    "title": "ref vs. out vs. in: Parameter Passing Semantics and Memory Safety",
    "pitch": "'ref' passes an existing variable by reference (must be initialized before calling, allows both read and write). 'out' passes by reference to return multiple values (the callee is required to assign before returning). 'in' passes a value type by read-only reference, eliminating stack-copy overhead for large structs while preventing modification. In IL, all three emit managed pointers (&).",
    "analogy": "ref is handing someone a notebook to add or edit notes; out is handing someone a blank form they must fill out before giving it back; in is letting someone read your notebook under glass without touching it.",
    "deepDive": "IL Lowering & Defensive Copies:\n1. IL Lowering:\n   - 'ref', 'out', and 'in' all pass an 8-byte managed pointer on 64-bit systems.\n2. The Defensive Copy Hazard:\n   - When passing a struct with 'in', if the struct is NOT declared as 'readonly struct', Roslyn creates a hidden stack copy before invoking any method or property on it to guarantee immutability!\n   - Always declare large structs as 'readonly struct' when using 'in'.",
    "codeSnippet": "public readonly struct BoundingBox // Must be readonly struct!\n{\n    public readonly double MinX, MinY, MaxX, MaxY; // 32 bytes\n    public BoundingBox(double x1, double y1, double x2, double y2) => (MinX, MinY, MaxX, MaxY) = (x1, y1, x2, y2);\n}\n\npublic class GeometryService\n{\n    // ✅ 'in': Zero-copy read-only reference\n    public static bool Intersects(in BoundingBox a, in BoundingBox b)\n    {\n        return a.MinX <= b.MaxX && a.MaxX >= b.MinX &&\n               a.MinY <= b.MaxY && a.MaxY >= b.MinY;\n    }\n\n    // ✅ 'out': Callee MUST assign before returning\n    public static bool TryParseCoords(string input, out double lat, out double lon)\n    {\n        lat = 0; lon = 0;\n        var parts = input.Split(',');\n        return parts.Length == 2 && double.TryParse(parts[0], out lat) && double.TryParse(parts[1], out lon);\n    }\n}",
    "redFlags": [
      "Using 'in' on primitive types like int or bool (passing an 8-byte pointer for a 4-byte int is slower than copying into a register).",
      "Failing to make structs 'readonly struct' when passing with 'in', incurring silent defensive copy overhead.",
      "Using 'out' parameters extensively in public APIs instead of returning clean tuples or records."
    ],
    "proTips": [
      "Use 'in' only for structs larger than 16 bytes (IntPtr.Size * 2). For primitives and small structs, pass by value directly."
    ]
  },
  {
    "id": "q-csharp-10",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Task",
      "Thread",
      "Async",
      "ThreadPool",
      "OS Thread"
    ],
    "title": "What is the difference between a Task and a Thread?",
    "pitch": "A Thread is an operating-system level execution resource with its own 1MB stack memory and context-switching overhead. A Task is a higher-level promise representing an asynchronous operation that may or may not occupy a thread continuously. For web I/O operations, tasks release threads back to the ThreadPool while waiting for database or network responses.",
    "analogy": "A thread is a hired worker; a task is a job ticket. The worker can pick up a ticket, start it, put it on hold while waiting for materials, work on another ticket, and resume later.",
    "deepDive": "Under the Hood Differences:\n1. Thread (OS Concept):\n   - Created via 'new Thread()'. Heavyweight (~1MB stack committed memory).\n   - Thread context switching requires CPU kernel transitions.\n2. Task (TPL - Task Parallel Library):\n   - Created via Task.Run or async I/O.\n   - Backed by the CLR ThreadPool or standard I/O Completion Ports (IOCP).\n   - When an async I/O call is awaited (e.g. database query), NO thread is blocked! The OS kernel signals completion via IOCP, and the ThreadPool assigns any available thread to resume MoveNext().",
    "codeSnippet": "// ❌ JUNIOR MISTAKE: Spawns heavy OS thread, exhausts server under load\npublic void BadHandleRequest()\n{\n    var thread = new Thread(() =>\n    {\n        Thread.Sleep(3000); // Blocks 1MB OS thread!\n    });\n    thread.Start();\n}\n\n// ✅ SENIOR PATTERN: Non-blocking Task releases thread to ThreadPool\npublic async Task GoodHandleRequestAsync(CancellationToken ct)\n{\n    // Releases thread immediately back to ThreadPool!\n    await Task.Delay(TimeSpan.FromSeconds(3), ct);\n}",
    "redFlags": [
      "Saying that every Task creates a new Thread (Tasks are scheduled on the ThreadPool or complete via IOCP).",
      "Creating manual 'new Thread()' in ASP.NET Core applications.",
      "Calling Thread.Sleep() inside an async controller method."
    ],
    "proTips": [
      "For compute-bound CPU tasks, use Task.Run() to queue work to the ThreadPool. For I/O-bound tasks (database, HTTP, disk), use native async/await APIs without Task.Run()."
    ]
  },
  {
    "id": "q-csharp-11",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "async/await",
      "Scalability",
      "ThreadPool",
      "Throughput",
      "I/O Completion Ports"
    ],
    "title": "How does async and await improve a web API?",
    "pitch": "For I/O-bound operations, await lets the HTTP request release its ThreadPool thread while waiting for the database or network response, freeing that thread to serve other concurrent web requests. This dramatically increases server throughput and scalability, though it does not make a single request run faster.",
    "analogy": "While laundry runs, you can do homework instead of staring at the machine: that is better use of time, not a faster washer.",
    "deepDive": "Internal Scalability Mechanics:\n1. The ThreadPool Bottleneck:\n   - A synchronous web server with 50 threads handling 50 requests that each wait 200ms for SQL Server will block all 50 threads, causing request queueing.\n2. Non-Blocking I/O:\n   - With async/await, when 'await db.SaveChangesAsync()' is called, the request thread is returned immediately to the pool.\n   - The same 50 threads can now easily handle 5,000 concurrent requests!\n3. The Async All The Way Principle:\n   - Async must flow through the entire call chain. Mixing sync and async (.Result, .Wait()) starves the ThreadPool and causes deadlocks.",
    "codeSnippet": "// ❌ THREADPOOL STARVATION: Blocks worker thread waiting for I/O\n[HttpGet(\"orders\")]\npublic IActionResult GetOrdersSync(AppDbContext db)\n{\n    var orders = db.Orders.ToList(); // Blocks ThreadPool thread!\n    return Ok(orders);\n}\n\n// ✅ HIGH-THROUGHPUT ASYNC: Releases worker thread during SQL I/O\n[HttpGet(\"orders\")]\npublic async Task<IActionResult> GetOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    var orders = await db.Orders.AsNoTracking().ToListAsync(ct); // Zero threads blocked!\n    return Ok(orders);\n}",
    "redFlags": [
      "Calling .Result, .Wait(), or .GetAwaiter().GetResult() in request code.",
      "Believing that async/await makes CPU-heavy calculations run faster.",
      "Not passing CancellationToken through async call chains."
    ],
    "proTips": [
      "Always configure CancellationToken parameters on API controller actions and pass them to all EF Core and HttpClient methods to terminate wasted database queries when users navigate away."
    ]
  },
  {
    "id": "q-csharp-12",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "Task",
      "ValueTask",
      "Heap Allocation",
      "Synchronous Fast Path",
      "AsTask"
    ],
    "title": "Task vs. ValueTask: When should you return which, and what are the traps?",
    "pitch": "Task is a reference type that always allocates an object on the managed heap. ValueTask is a struct that avoids heap allocations when an operation completes synchronously (e.g., in-memory cache hit). However, ValueTask cannot be awaited multiple times or awaited concurrently. If needed multiple times, convert it to Task using .AsTask().",
    "analogy": "Task is buying an expensive reusable container for every meal; ValueTask is a paper cup: zero-cost if you drink right away, but you cannot reuse it or pass it around to multiple people.",
    "deepDive": "State Machine Allocation Details:\n1. The Heap Allocation Problem:\n   - If a method returns Task<int> and gets called 100,000 times per second from a memory cache, each call allocates a Task object (~72 bytes on 64-bit), causing Gen 0 GC churn.\n2. ValueTask<T> Struct:\n   - Can wrap either a direct result value T OR an underlying Task<T>.\n   - When result is available immediately: ValueTask<int>(42) allocates 0 bytes on the heap!\n3. The Multiple Await Bug:\n   - Awaiting a ValueTask multiple times causes undefined behavior because the underlying IValueTaskSource may have already been pooled and reused!",
    "codeSnippet": "public class CachedDataService\n{\n    private readonly MemoryCache _cache = new();\n\n    // ✅ SENIOR PATTERN: Zero-allocation on cache hits\n    public ValueTask<string> GetDataAsync(string key, CancellationToken ct)\n    {\n        if (_cache.TryGetValue(key, out string? value) && value != null)\n        {\n            // Synchronous fast path: 0 heap allocations!\n            return new ValueTask<string>(value);\n        }\n\n        // Asynchronous slow path: Fetches from database\n        return new ValueTask<string>(FetchFromDbAsync(key, ct));\n    }\n\n    private async Task<string> FetchFromDbAsync(string key, CancellationToken ct)\n    {\n        await Task.Delay(100, ct);\n        return \"DbResult\";\n    }\n}",
    "redFlags": [
      "Awaiting a ValueTask multiple times or using Task.WhenAll on a list of ValueTasks without calling .AsTask().",
      "Using ValueTask blindly on methods that complete asynchronously 100% of the time (ValueTask is larger than Task and incurs extra state machine struct copies).",
      "Storing a ValueTask in a field for later inspection."
    ],
    "proTips": [
      "Rule of thumb: Return ValueTask<T> only if performance profiling shows high invocation frequency AND > 20% of calls complete synchronously."
    ]
  },
  {
    "id": "q-csharp-13",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "GC",
      "Gen 0/1/2",
      "LOH",
      "POH",
      "ArrayPool",
      "Mark-Sweep-Compact"
    ],
    "title": "CLR Garbage Collection: Generations (Gen 0/1/2), the 85KB LOH Threshold, and ArrayPool",
    "pitch": "The CLR GC is a generational, tracing garbage collector operating on three ephemeral generations (Gen 0 for short-lived items, Gen 1 as a buffer, and Gen 2 for long-lived singletons). Objects >= 85,000 bytes bypass ephemeral segments and go directly to the Large Object Heap (LOH), which is collected during Gen 2 and is not compacted by default, risking memory fragmentation. ArrayPool<T> prevents LOH allocation churn.",
    "analogy": "Gen 0 is the trash can by your desk; Gen 1 is the hallway dumpster; Gen 2 is the city landfill; LOH is oversize bulky trash that requires special pickup and is rarely rearranged.",
    "deepDive": "Internal GC Mechanics:\n1. The Generational Hypothesis:\n   - Most objects die young (> 90% of Gen 0 objects are collected in milliseconds).\n   - Gen 0 collections are fast (stop-the-world pause of < 1ms).\n   - Gen 2 collections (Full GC) inspect the entire heap and cause visible latency pauses.\n2. Large Object Heap (LOH):\n   - Threshold: >= 85,000 bytes.\n   - LOH objects are allocated in Gen 2 directly.\n   - Because copying large objects in RAM is expensive, LOH is swept without compaction, creating address space holes.\n3. Pinned Object Heap (POH):\n   - Introduced in .NET 5 to store pinned arrays so they do not block GC compaction in Gen 0/1/2.",
    "codeSnippet": "public class HighThroughputBufferManager\n{\n    // ❌ JUNIOR MISTAKE: Allocates 100KB buffer on LOH every request, causing Gen 2 GC churn\n    public void BadProcessLargeData(Stream stream)\n    {\n        byte[] buffer = new byte[100_000]; // >= 85,000 bytes -> Goes to LOH!\n        stream.Read(buffer, 0, buffer.Length);\n    }\n\n    // ✅ SENIOR PATTERN: Rent from ArrayPool, 0 heap allocations, 0 GC pauses\n    public void GoodProcessLargeData(Stream stream)\n    {\n        byte[] buffer = ArrayPool<byte>.Shared.Rent(100_000);\n        try\n        {\n            int bytesRead = stream.Read(buffer, 0, 100_000);\n            // Process data...\n        }\n        finally\n        {\n            ArrayPool<byte>.Shared.Return(buffer); // Always return in finally!\n        }\n    }\n}",
    "redFlags": [
      "Calling GC.Collect() manually in production web code (destroys GC self-tuning heuristics and freezes threads).",
      "Allocating byte arrays >= 85,000 bytes repeatedly inside high-frequency loops.",
      "Forgetting to return rented buffers to ArrayPool in a finally block."
    ],
    "proTips": [
      "Always inspect buffer.Length when renting from ArrayPool: ArrayPool may return an array larger than requested! Never assume rentedBuffer.Length == requestedSize."
    ]
  },
  {
    "id": "q-csharp-14",
    "pillar": "csharp",
    "seniority": "Senior",
    "tags": [
      "IDisposable",
      "IAsyncDisposable",
      "Finalizer",
      "GC.SuppressFinalize",
      "SafeHandle"
    ],
    "title": "The Standard IDisposable and IAsyncDisposable Pattern with Finalizers",
    "pitch": "The standard Dispose pattern provides deterministic cleanup of unmanaged OS resources (file handles, network sockets, unmanaged pointers) before non-deterministic GC collection. Implementing IDisposable with Dispose(bool disposing) and GC.SuppressFinalize(this) removes the object from the Finalization Queue, avoiding costly Gen 2 finalizer promotion. Modern .NET also requires IAsyncDisposable with DisposeAsync() for non-blocking asynchronous cleanup via 'await using'.",
    "analogy": "Dispose is turning off your car engine and locking the doors when you arrive; the Finalizer is the tow truck hauling away an abandoned car days later.",
    "deepDive": "Finalization Queue Internals:\n1. The Finalizer Cost:\n   - Objects with a Finalizer (~ClassName) that are NOT suppressed survive Gen 0/1 collection, get promoted to Gen 2, and are placed on the Finalizer Queue.\n   - The CLR's single-threaded Finalizer thread must run before their memory can be reclaimed on the NEXT GC cycle!\n   - Calling GC.SuppressFinalize(this) completely bypasses the finalizer thread.\n2. IAsyncDisposable (.NET Core 3.0+):\n   - Traditional Dispose() is synchronous: closing a network socket or flushing a buffered stream synchronously causes ThreadPool blocking.\n   - DisposeAsync() returns a ValueTask, enabling non-blocking asynchronous cleanup: 'await using var stream = ...;'",
    "codeSnippet": "public class ProductionResourceHolder : IDisposable, IAsyncDisposable\n{\n    private SafeHandle? _unmanagedHandle; // OS handle\n    private FileStream? _bufferedFile;     // Managed disposable\n    private int _disposed = 0;              // Interlocked flag\n\n    public ProductionResourceHolder(string path)\n    {\n        _bufferedFile = new FileStream(path, FileMode.OpenOrCreate);\n    }\n\n    public void Dispose()\n    {\n        Dispose(disposing: true);\n        GC.SuppressFinalize(this); // Remove from GC Finalization Queue!\n    }\n\n    protected virtual void Dispose(bool disposing)\n    {\n        if (Interlocked.Exchange(ref _disposed, 1) != 0) return;\n\n        if (disposing)\n        {\n            _bufferedFile?.Dispose();\n            _bufferedFile = null;\n        }\n\n        _unmanagedHandle?.Dispose();\n        _unmanagedHandle = null;\n    }\n\n    public async ValueTask DisposeAsync()\n    {\n        if (Interlocked.Exchange(ref _disposed, 1) != 0) return;\n\n        if (_bufferedFile is not null)\n        {\n            await _bufferedFile.DisposeAsync().ConfigureAwait(false);\n            _bufferedFile = null;\n        }\n\n        Dispose(disposing: false);\n        GC.SuppressFinalize(this);\n    }\n\n    ~ProductionResourceHolder() => Dispose(disposing: false); // Finalizer fallback\n}",
    "redFlags": [
      "Forgetting GC.SuppressFinalize(this) in Dispose(), forcing the object onto the slow Gen 2 finalizer queue.",
      "Accessing managed disposable objects inside the Finalizer (managed objects may have already been collected by the GC!).",
      "Calling synchronous .Dispose() on streams and network handles in high-throughput async pipelines instead of 'await using'."
    ],
    "proTips": [
      "Wrap native OS pointers with SafeHandle instead of raw IntPtr: SafeHandle derives from CriticalFinalizerObject and guarantees cleanup even during thread aborts or out-of-memory exceptions."
    ]
  },
  {
    "id": "q-csharp-15",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Delegates",
      "Events",
      "MulticastDelegate",
      "Memory Leaks",
      "Action/Func"
    ],
    "title": "Delegates vs. Events: Encapsulation and Memory Leak Traps",
    "pitch": "A delegate is a type-safe object-oriented function pointer inheriting from System.MulticastDelegate with an internal linked invocation list. An 'event' is a compiler-enforced encapsulation wrapper over a delegate: it restricts external consumers to only adding (+=) or removing (-=) handlers, preventing external code from invoking the delegate directly or accidentally resetting subscribers with '= null'. The classic senior bug is the 'Lapsed Listener' memory leak: subscribing a short-lived object's method to a long-lived publisher prevents the subscriber from ever being collected by GC.",
    "analogy": "A delegate is an open sign-up sheet anyone can erase or trigger; an event is a secure mailbox where you can submit or cancel your subscription, but only the owner can send the broadcast.",
    "deepDive": "Internal Architecture & Lowering:\n1. System.MulticastDelegate Anatomy:\n   - Holds '_target' (the instance object) and '_methodPtr' (the native function pointer).\n   - If multiple methods are hooked (+=), it allocates a new MulticastDelegate with an internal array '_invocationList'.\n2. Why the 'event' Keyword Exists:\n   - A public delegate field can be cleared by anyone: 'myClass.OnSave = null;' destroying all other subscribers!\n   - A public delegate can also be invoked externally: 'myClass.OnSave(data);'.\n   - The 'event' keyword turns the field into two accessor methods in IL: add_EventName and remove_EventName, locking down invocation to the declaring class only.\n3. The Lapsed Listener Memory Leak:\n   - When object B subscribes to publisher A: publisher A's delegate invocation list holds a strong reference to B!\n   - If A is a Singleton (or static) and B is a short-lived UI view or scoped service, B will NEVER be garbage collected until unsubscribed.",
    "codeSnippet": "public class OrderPublisher\n{\n    // ✅ Event encapsulates delegate against external tampering\n    public event EventHandler<OrderEventArgs>? OrderCompleted;\n\n    public void CompleteOrder(Guid orderId)\n    {\n        // Thread-safe invocation via null-conditional copy\n        OrderCompleted?.Invoke(this, new OrderEventArgs(orderId));\n    }\n}\n\n// Subscriber demonstrating clean unsubscription\npublic class OrderAuditLogger : IDisposable\n{\n    private readonly OrderPublisher _publisher;\n\n    public OrderAuditLogger(OrderPublisher publisher)\n    {\n        _publisher = publisher;\n        _publisher.OrderCompleted += HandleOrderCompleted; // Subscribes strong reference\n    }\n\n    private void HandleOrderCompleted(object? sender, OrderEventArgs e)\n    {\n        Console.WriteLine($\"Order {e.OrderId} completed.\");\n    }\n\n    // MUST unsubscribe to prevent Lapsed Listener memory leak!\n    public void Dispose()\n    {\n        _publisher.OrderCompleted -= HandleOrderCompleted;\n    }\n}",
    "redFlags": [
      "Declaring public delegate fields instead of 'event', allowing external callers to wipe out other subscribers.",
      "Failing to unsubscribe from events in long-lived publishers, leading to massive memory leaks.",
      "Not knowing that delegates in C# are immutable (calling += creates a brand-new MulticastDelegate instance)."
    ],
    "proTips": [
      "In modern C#, favor built-in Action<T> and Func<T, TResult> over custom delegate types unless you need 'ref' parameters or custom parameter names in API signatures."
    ]
  },
  {
    "id": "q-csharp-16",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "const",
      "readonly",
      "static readonly",
      "IL Inlining",
      "Assembly Versioning"
    ],
    "title": "const vs. readonly vs. static readonly: Compile-Time Inlining and Assembly Versioning",
    "pitch": "'const' is evaluated at compile-time: the Roslyn compiler literally inlines the literal primitive or string value directly into the calling assembly's IL bytecode. If assembly A changes a 'const' and is redeployed without recompiling assembly B, assembly B silently retains the stale hardcoded value. In contrast, 'readonly' and 'static readonly' fields are evaluated at runtime (in instance constructors or the static class constructor .cctor), referencing the live memory address and supporting reference types and cross-assembly updates without breaking changes.",
    "analogy": "const is printing the price on the box at the factory; static readonly is looking up the price at the register when the item is scanned.",
    "deepDive": "Compilation and Execution Mechanics:\n1. Roslyn IL Lowering of 'const':\n   - 'public const int MaxRetries = 3;'\n   - When referenced from another assembly: 'ldc.i4.3' (literal constant 3) is hardcoded directly into the caller's IL!\n   - There is NO runtime field lookup. If MaxRetries is changed to 5 in a shared NuGet library, the consumer will keep using 3 until recompiled!\n2. 'static readonly' Evaluation:\n   - Evaluated during the execution of the class's static constructor (.cctor) when the type is first initialized by the CLR.\n   - Emits 'ldsfld' (load static field) in the caller's IL, ensuring the current value from memory is always loaded.\n   - Allows constructing complex reference objects: 'public static readonly HttpClient Client = new();'",
    "codeSnippet": "public static class ApiConfig\n{\n    // ⚠️ DANGEROUS ACROSS ASSEMBLIES: Value is inlined into caller assembly IL!\n    public const string DefaultBaseUrl = \"https://api.domain.com/v1\";\n\n    // ✅ SENIOR PATTERN FOR PUBLIC LIBRARIES: Evaluated at runtime via ldsfld\n    public static readonly string SafeBaseUrl = \"https://api.domain.com/v1\";\n\n    // ✅ Supports complex reference types and environment lookups\n    public static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(\n        int.TryParse(Environment.GetEnvironmentVariable(\"HTTP_TIMEOUT\"), out var t) ? t : 30\n    );\n}",
    "redFlags": [
      "Exposing 'public const' in public shared NuGet packages for configuration values that could ever change.",
      "Believing that 'readonly' reference fields make the referenced object immutable (it only prevents reassigning the reference itself, not its properties).",
      "Attempting to assign a 'const' to a reference type other than string or null."
    ],
    "proTips": [
      "Rule of thumb: Only use 'const' for true mathematical or unchanging constants (like Math.PI, DaysInWeek = 7). For configuration defaults and URLs across assemblies, always use 'static readonly'."
    ]
  },
  {
    "id": "q-csharp-17",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "string",
      "StringBuilder",
      "Immutability",
      "String Pool",
      "String Interning"
    ],
    "title": "String Immutability, String Interning, and StringBuilder Performance",
    "pitch": "Strings in C# are immutable reference types: any modification (concatenation, Replace, Substring) allocates a brand-new string on the managed heap. Repeated string concatenation in loops generates massive Gen 0 GC churn. StringBuilder uses an internal mutable char buffer that expands as needed, eliminating intermediate allocations. String Interning maintains a CLR-wide table of unique string literals to share identical references across the AppDomain.",
    "analogy": "String immutability is writing in stone: to fix a typo, you must carve a brand-new stone tablet. StringBuilder is a whiteboard where you can write, erase, and append until you take the final photo.",
    "deepDive": "Memory Allocations in Loops:\n1. The O(N^2) Concatenation Trap:\n   - string s = \"\"; for (int i = 0; i < 10000; i++) s += i;\n   - Allocates 10,000 separate string objects on the heap, copying previous characters every iteration!\n2. StringBuilder Mechanics:\n   - Maintains a linked list of chunk buffers (default capacity 16 chars, doubling on demand).\n   - Appends characters in-place inside the buffer array.\n3. String Interning:\n   - String literals defined in code are automatically interned by the CLR into a hash table.\n   - String.Intern(s) and String.IsInterned(s) allow dynamic strings to reuse the intern pool.",
    "codeSnippet": "// ❌ JUNIOR MISTAKE: Allocates 5,000 string objects on Gen 0 heap!\npublic string BadBuildCsv(IEnumerable<int> ids)\n{\n    string result = \"\";\n    foreach (var id in ids)\n    {\n        result += id + \",\"; // Allocates new string every iteration!\n    }\n    return result;\n}\n\n// ✅ SENIOR PATTERN: StringBuilder with estimated capacity\npublic string GoodBuildCsv(IReadOnlyCollection<int> ids)\n{\n    var sb = new StringBuilder(ids.Count * 8); // Pre-allocate capacity!\n    foreach (var id in ids)\n    {\n        if (sb.Length > 0) sb.Append(',');\n        sb.Append(id);\n    }\n    return sb.ToString();\n}",
    "redFlags": [
      "Using string += in a loop over hundreds or thousands of elements.",
      "Instantiating a StringBuilder for a simple 2-string concatenation (e.g. var s = 'A' + 'B' is evaluated at compile-time by Roslyn; StringBuilder overhead is worse!).",
      "Not setting initial capacity on StringBuilder when the approximate size is known."
    ],
    "proTips": [
      "In modern .NET, for combining small sequences, prefer 'string.Join(',', ids)' or 'string.Create()' which allocate the exact buffer size up-front with zero intermediate allocations."
    ]
  },
  {
    "id": "q-csharp-18",
    "pillar": "csharp",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Exceptions",
      "throw vs throw ex",
      "try-catch-finally",
      "Stack Trace",
      "Custom Exceptions"
    ],
    "title": "Exception Handling Best Practices: throw vs. throw ex, try-catch-finally, and Custom Exceptions",
    "pitch": "In C#, using 'throw;' rethrows the caught exception while fully preserving the original call stack and line numbers. Using 'throw ex;' overwrites the stack trace, making it appear that the error originated right at that catch block and obscuring the true root cause. Catch blocks should only be used when you can genuinely handle the failure, add domain context, or log diagnostics before rethrowing.",
    "analogy": "throw; is forwarding the original police report with all timestamps intact; throw ex; is tearing up the report and filing a new one in your own name, erasing where the crime actually happened.",
    "deepDive": "Stack Trace Preservation:\n1. 'throw;' vs 'throw ex;':\n   - 'throw ex;' tells the CLR to reset the Exception.StackTrace to the current line!\n   - In production logs, the error will point to the catch block instead of the deeply nested repository method that threw it.\n2. Custom Domain Exceptions:\n   - Always inherit from 'Exception' (not ApplicationException).\n   - Provide standard constructors (message, innerException).\n   - Use them for business validation errors (e.g. InsufficientFundsException, EntityNotFoundException).\n3. Exception Filters ('when'):\n   - C# 6+ supports 'catch (SqlException ex) when (ex.Number == 1205)' to intercept specific error codes without unwinding the stack!",
    "codeSnippet": "public async Task ProcessOrderAsync(Guid orderId, CancellationToken ct)\n{\n    try\n    {\n        await ExecutePaymentWorkflowAsync(orderId, ct);\n    }\n    // ✅ Exception Filter: Catches ONLY deadlock exceptions without unwinding stack\n    catch (SqlException ex) when (ex.Number == 1205)\n    {\n        _logger.LogWarning(ex, \"Deadlock detected for order {OrderId}. Retrying...\", orderId);\n        await RetryWorkflowAsync(orderId, ct);\n    }\n    catch (Exception ex)\n    {\n        _logger.LogError(ex, \"Failed to process order {OrderId}\", orderId);\n        \n        // ❌ NEVER DO: throw ex; (Erases root stack trace!)\n        // ✅ CORRECT: Preserves full original stack trace\n        throw; \n    }\n}",
    "redFlags": [
      "Using 'throw ex;' inside a catch block.",
      "Catching the generic 'Exception' type and swallowing it with an empty catch block (silent errors).",
      "Using exceptions for ordinary business control flow (e.g., throwing an exception when a password is wrong instead of returning a Result object)."
    ],
    "proTips": [
      "Use C# Exception Filters 'catch (Exception ex) when (condition)': if the condition is false, the stack is NOT unwound, which preserves the original crash dump state for tools like Azure Application Insights."
    ]
  },
  {
    "id": "q-aspnet-1",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Controllers",
      "Thin Controller",
      "Clean Architecture",
      "Separation of Concerns"
    ],
    "title": "How do you keep an ASP.NET Core controller thin?",
    "pitch": "The controller should handle only HTTP-level concerns: route matching, model validation, authorization checks, and HTTP status code mapping. All business calculations, workflow coordination, domain rules, and data access should be delegated to a dedicated service or manager layer. This keeps workflow logic reusable, maintainable, and easily unit-testable without mocking HttpContext.",
    "analogy": "A restaurant waiter takes the order and delivers the result; the kitchen contains the cooking rules and prepares the meal.",
    "deepDive": "Architectural Boundaries:\n1. Controller Responsibilities:\n   - Accept [FromBody] DTOs and bind query/route parameters.\n   - Return appropriate HTTP ActionResults (Ok, Created, NotFound, BadRequest).\n   - Pass the request's CancellationToken to the service.\n2. Service Layer Responsibilities:\n   - Enforce business logic and transactional boundaries.\n   - Coordinate multiple repositories or external integrations.\n   - Return clean Result<T> or domain DTOs to the controller.\n3. Common Anti-Pattern:\n   - Moving 1,000 lines of controller code into a single 'God Service' method. Keep service methods focused around specific business use cases.",
    "codeSnippet": "[ApiController]\n[Route(\"api/[controller]\")]\npublic class OrdersController : ControllerBase\n{\n    private readonly IOrderService _orderService;\n\n    public OrdersController(IOrderService orderService) => _orderService = orderService;\n\n    // ✅ THIN CONTROLLER: Only maps HTTP input/output; delegates business logic to service\n    [HttpPost]\n    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken ct)\n    {\n        var result = await _orderService.CreateOrderAsync(request, ct);\n\n        if (!result.IsSuccess)\n        {\n            return Problem(detail: result.Error, statusCode: StatusCodes.Status400BadRequest);\n        }\n\n        return CreatedAtAction(nameof(GetOrderById), new { id = result.Value.Id }, result.Value);\n    }\n}",
    "redFlags": [
      "Querying the DbContext directly inside the controller action methods.",
      "Writing 200-line controller actions filled with raw business calculations, email sending, and file writes.",
      "Moving all controller logic into one giant service method instead of preserving focused domain boundaries."
    ],
    "proTips": [
      "Use CQRS with MediatR (IRequest<TResponse>) or Minimal API endpoint filters to keep endpoint handlers strictly under 15 lines of code."
    ]
  },
  {
    "id": "q-aspnet-2",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Dependency Injection",
      "IoC",
      "Loose Coupling",
      "Testability",
      "IServiceCollection"
    ],
    "title": "What is dependency injection, and why use it?",
    "pitch": "Dependency Injection (DI) supplies a class with the dependencies it needs from the outside (typically via constructor injection) instead of letting the class construct them directly with 'new'. It reduces tight coupling, centralizes component configuration and lifetimes, and makes units trivial to test by substituting mock implementations.",
    "analogy": "A school provides each classroom with approved supplies instead of every teacher building their own desks and printers from scratch.",
    "deepDive": "Inversion of Control (IoC) Mechanics:\n1. Constructor Injection:\n   - The ASP.NET Core built-in container inspects class constructors via reflection, resolves registered service types, and instantiates the graph automatically.\n2. Testability Benefits:\n   - Allows unit tests to pass an in-memory 'Mock<IOrderRepository>' to 'OrderService' without standing up a real SQL database.\n3. The Service Locator Anti-Pattern:\n   - Injecting 'IServiceProvider' directly into classes and manually calling 'provider.GetService<T>()' is a major code smell: it hides actual class dependencies and breaks design contracts.",
    "codeSnippet": "// ❌ TIGHT COUPLING: Hardcodes concrete implementation\npublic class BadCustomerService\n{\n    private readonly SqlCustomerRepository _repo = new SqlCustomerRepository(); // Cannot mock!\n}\n\n// ✅ DEPENDENCY INJECTION: Injects interface contract\npublic class GoodCustomerService\n{\n    private readonly ICustomerRepository _repo;\n\n    // ASP.NET Core DI resolves ICustomerRepository automatically\n    public GoodCustomerService(ICustomerRepository repo)\n    {\n        _repo = repo ?? throw new ArgumentNullException(nameof(repo));\n    }\n}\n\n// Registration in Program.cs\nbuilder.Services.AddScoped<ICustomerRepository, SqlCustomerRepository>();\nbuilder.Services.AddScoped<GoodCustomerService>();",
    "redFlags": [
      "Using 'new' to instantiate database repositories or HTTP clients inside business services.",
      "Injecting IServiceProvider as a Service Locator and resolving everything manually at runtime.",
      "Creating circular dependencies where ServiceA injects ServiceB and ServiceB injects ServiceA."
    ],
    "proTips": [
      "Always program against interfaces (e.g. IEmailSender) rather than concrete classes: this makes swapping providers (e.g., SendGrid to AWS SES) a one-line change in Program.cs."
    ]
  },
  {
    "id": "q-aspnet-3",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DI Lifetimes",
      "Transient",
      "Scoped",
      "Singleton",
      "Captive Dependency"
    ],
    "title": "Explain transient, scoped, and singleton service lifetimes in ASP.NET Core.",
    "pitch": "Transient creates a brand-new instance every single time the service is requested. Scoped creates one single instance per client HTTP request (shared across all components within that request). Singleton creates one instance the first time it is requested and reuses that same instance for the entire lifetime of the application. A scoped service (like DbContext) must NEVER be injected into a singleton.",
    "analogy": "Transient is a fresh worksheet per use; Scoped is one shared folder for a student's office visit; Singleton is the school clock on the wall shared all year by everyone.",
    "deepDive": "Lifetime Mechanics & The Captive Dependency Trap:\n1. AddTransient:\n   - Best for lightweight, stateless utility operations.\n2. AddScoped:\n   - Best for services with per-request state, such as EF Core's DbContext or current user context.\n   - When the HTTP request completes, the container automatically calls Dispose() on all scoped instances.\n3. AddSingleton:\n   - Best for expensive, stateless resources or caches (e.g., IMemoryCache, HttpClient, connection multiplexers).\n   - ⚠️ MUST be thread-safe! Singleton methods are accessed concurrently by hundreds of request threads.\n4. The Captive Dependency Bug:\n   - A Singleton service injecting a Scoped service captures it for the entire process, causing thread-safety crashes and memory leaks.\n   - Enabled by default in Development: 'ValidateScopes = true'.",
    "codeSnippet": "var builder = WebApplication.CreateBuilder(args);\n\n// 1. Transient: New instance every injection\nbuilder.Services.AddTransient<ITokenGenerator, TokenGenerator>();\n\n// 2. Scoped: One instance per HTTP request (DbContext default)\nbuilder.Services.AddScoped<IOrderService, OrderService>();\nbuilder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(...));\n\n// 3. Singleton: One instance for entire app lifetime\nbuilder.Services.AddSingleton<IMemoryCache, MemoryCache>();\n\n// ⚠️ Resolving Scoped inside Singleton (Background Worker Pattern):\npublic class QueueWorker : BackgroundService\n{\n    private readonly IServiceScopeFactory _scopeFactory; // Injected singleton\n\n    public QueueWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;\n\n    protected override async Task ExecuteAsync(CancellationToken stoppingToken)\n    {\n        using var scope = _scopeFactory.CreateScope(); // Explicit scope!\n        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();\n        await db.Database.ExecuteSqlRawAsync(\"...\", stoppingToken);\n    }\n}",
    "redFlags": [
      "Injecting a Scoped service (like DbContext) into a Singleton (Captive Dependency).",
      "Assuming Singleton means thread-safe (you must write thread-safe code for singletons!).",
      "Using Transient for expensive objects like DbContext or HttpClient."
    ],
    "proTips": [
      "Always leave 'builder.Host.UseDefaultServiceProvider(o => o.ValidateScopes = true)' enabled in development to fail fast on startup if a captive dependency is introduced."
    ]
  },
  {
    "id": "q-aspnet-4",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Middleware",
      "Filters",
      "HTTP Pipeline",
      "MVC Pipeline",
      "ActionFilter"
    ],
    "title": "What is the difference between middleware and filters in ASP.NET Core?",
    "pitch": "Middleware participates in the global HTTP pipeline and executes for every incoming request (including static files, WebSockets, and health checks) before routing reaches an endpoint. It has access only to raw HttpContext. MVC Filters run inside the MVC routing pipeline after an endpoint is selected: they have access to controller context, action arguments, model binding, and ModelState.",
    "analogy": "Middleware is school security at the main building entrance; a filter is a hall pass check applied inside a specific classroom.",
    "deepDive": "Pipeline Sequencing:\n1. Middleware Pipeline:\n   - Request -> Middleware A -> Middleware B (UseRouting) -> Endpoint Selected ->\n   - Filters (Authorization -> Resource -> Model Binding -> Action Filter) ->\n   - Controller Action -> Result Filter -> Middleware B -> Middleware A -> Response.\n2. When to Use Middleware:\n   - Cross-cutting infrastructure concerns: CORS, Request logging, SSL enforcement, Rate limiting, Static file serving.\n3. When to Use Filters:\n   - Business request validation, action-level permission checks, audit logging with parameter values, custom action result transformation.",
    "codeSnippet": "// 1. Middleware: Operates on raw HttpContext globally\npublic class RequestTimingMiddleware\n{\n    private readonly RequestDelegate _next;\n    public RequestTimingMiddleware(RequestDelegate next) => _next = next;\n\n    public async Task InvokeAsync(HttpContext context)\n    {\n        var sw = Stopwatch.StartNew();\n        await _next(context); // Calls next middleware in chain\n        sw.Stop();\n        context.Response.Headers[\"X-Response-Time-Ms\"] = sw.ElapsedMilliseconds.ToString();\n    }\n}\n\n// 2. Action Filter: Operates inside MVC with model state & parameters\npublic class ValidateModelFilter : IAsyncActionFilter\n{\n    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)\n    {\n        if (!context.ModelState.IsValid)\n        {\n            context.Result = new BadRequestObjectResult(context.ModelState); // Short-circuit!\n            return;\n        }\n        await next(); // Proceed to controller action\n    }\n}",
    "redFlags": [
      "Using Action Filters for global concerns like CORS or Global Exception Handling (should be middleware).",
      "Trying to read and deserialize request bodies inside middleware without calling 'context.Request.EnableBuffering()'.",
      "Not knowing that middleware executes in the exact order registered in Program.cs."
    ],
    "proTips": [
      "Use Resource Filters for performance-sensitive caching: they execute before model binding, allowing you to return cached responses without paying the CPU cost of deserializing large JSON request bodies."
    ]
  },
  {
    "id": "q-aspnet-5",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "REST",
      "HTTP Status Codes",
      "API Design",
      "ProblemDetails",
      "Idempotency"
    ],
    "title": "How do you design a REST API response and choose appropriate HTTP status codes?",
    "pitch": "Use resource-oriented routes, validate input upfront, return a consistent JSON response shape, and choose HTTP status codes that accurately match the outcome: 200 for OK, 201 for Created (with Location header), 204 for No Content (successful update/delete), 400 for Bad Request (validation errors), 401 for Unauthorized, 403 for Forbidden, 404 for Not Found, and 409 for Conflict.",
    "analogy": "A package tracking code should clearly say delivered, wrong address, missing package, or duplicate request instead of always saying 'something happened'.",
    "deepDive": "Standardized REST Status Code Matrix:\n1. Success Codes (2xx):\n   - 200 OK: Standard successful GET/PUT.\n   - 201 Created: POST that created a new resource. Returns 'Location' header pointing to new resource.\n   - 204 No Content: Successful DELETE or PUT where no response body is needed.\n2. Client Error Codes (4xx):\n   - 400 Bad Request: Malformed payload or validation failure.\n   - 401 Unauthorized: Caller is unauthenticated (missing or invalid JWT).\n   - 403 Forbidden: Caller is authenticated but lacks required role/permission.\n   - 404 Not Found: Requested resource ID does not exist.\n   - 409 Conflict: State collision (e.g. optimistic concurrency failure or duplicate unique key).\n3. The RFC 7807 Standard:\n   - Always return error responses using the RFC 7807 ProblemDetails specification.",
    "codeSnippet": "[HttpPost]\npublic async Task<IActionResult> CreateProduct([FromBody] ProductDto dto, CancellationToken ct)\n{\n    if (await _repo.ExistsAsync(dto.Sku, ct))\n    {\n        // 409 Conflict: Duplicate unique resource\n        return Conflict(new ProblemDetails { Title = \"Duplicate SKU\", Detail = $\"SKU {dto.Sku} already exists.\" });\n    }\n\n    var product = await _repo.CreateAsync(dto, ct);\n\n    // 201 Created with Location header pointing to GET endpoint\n    return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);\n}\n\n[HttpDelete(\"{id:guid}\")]\npublic async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)\n{\n    var deleted = await _repo.DeleteAsync(id, ct);\n    if (!deleted) return NotFound();\n\n    return NoContent(); // 204 No Content\n}",
    "redFlags": [
      "Returning HTTP 200 OK with a body containing '{ success: false, error: ... }' (violates REST conventions).",
      "Confusing 401 Unauthorized (unauthenticated) with 403 Forbidden (unauthorized/forbidden).",
      "Exposing internal exception messages or database table names in 500 error responses."
    ],
    "proTips": [
      "In ASP.NET Core 7/8, call 'builder.Services.AddProblemDetails()' in Program.cs: it automatically standardizes all validation and runtime errors to the RFC 7807 ProblemDetails format."
    ]
  },
  {
    "id": "q-aspnet-6",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Idempotency",
      "REST",
      "HTTP Methods",
      "Retries",
      "Idempotency-Key"
    ],
    "title": "What is idempotency, and why does it matter in web APIs and background jobs?",
    "pitch": "An operation is idempotent if executing it multiple times produces the exact same server state as executing it once. In REST, GET, PUT, and DELETE are idempotent by definition, while POST is not. Idempotency is critical for network reliability: when mobile clients or payment systems experience timeout retries, idempotent endpoints prevent duplicate orders, double billing, or corrupt data.",
    "analogy": "Pressing an elevator button five times requests one elevator, not five elevators. Setting a thermostat to 72 degrees ten times still results in 72 degrees.",
    "deepDive": "Implementing Idempotency in Production:\n1. HTTP Methods & Idempotency:\n   - GET: Safe and idempotent (read-only).\n   - PUT: Idempotent (replaces entire resource state).\n   - DELETE: Idempotent (resource is gone after 1st call; subsequent calls still result in resource being gone).\n   - POST: Non-idempotent by default (creates new record every call).\n2. The Idempotency Key Pattern (Stripe/Payment standard):\n   - Client sends header: 'Idempotency-Key: <unique-uuid>'.\n   - Server checks Redis or SQL table: if key exists, returns cached response without re-executing payment!\n3. Background Jobs (Hangfire / Queues):\n   - Workers must check if the job ID or business invoice has already been processed before mutating balances.",
    "codeSnippet": "// Idempotent Payment Handler using Idempotency Key\npublic async Task<PaymentResult> ChargeCustomerAsync(ChargeRequest request, string idempotencyKey, CancellationToken ct)\n{\n    // Check if operation was already completed\n    var existingRecord = await _db.IdempotencyRecords\n        .FirstOrDefaultAsync(r => r.Key == idempotencyKey, ct);\n\n    if (existingRecord != null)\n    {\n        // Return original response without re-charging customer card!\n        return JsonSerializer.Deserialize<PaymentResult>(existingRecord.ResponsePayload)!;\n    }\n\n    // Execute credit card charge...\n    var result = await _paymentGateway.ExecuteChargeAsync(request, ct);\n\n    // Persist idempotency record\n    _db.IdempotencyRecords.Add(new IdempotencyRecord\n    {\n        Key = idempotencyKey,\n        ResponsePayload = JsonSerializer.Serialize(result),\n        CreatedAtUtc = DateTime.UtcNow\n    });\n    await _db.SaveChangesAsync(ct);\n\n    return result;\n}",
    "redFlags": [
      "Assuming database transactions alone make an external API request idempotent (external HTTP calls outside SQL will still duplicate!).",
      "Designing DELETE endpoints that increment a counter or perform non-idempotent side effects.",
      "Not handling client retry storms after network timeouts."
    ],
    "proTips": [
      "Store idempotency keys with an expiration time (e.g. 24 hours) in Redis with atomic SETNX (Set if Not Exists) to prevent race conditions during rapid retries."
    ]
  },
  {
    "id": "q-aspnet-7",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Exception Handling",
      "ProblemDetails",
      "Middleware",
      "IExceptionHandler",
      "RFC 7807"
    ],
    "title": "How do you handle exceptions in ASP.NET Core centrally?",
    "pitch": "Handle unexpected exceptions centrally using ASP.NET Core's UseExceptionHandler middleware or .NET 8's IExceptionHandler interface. Log sufficient diagnostics with correlation IDs, return safe standardized RFC 7807 ProblemDetails responses without exposing stack traces, and catch exceptions locally only when you can genuinely recover or enrich domain context.",
    "analogy": "A school principal's office handles major campus emergencies consistently, while a teacher handles a missing pencil locally because the teacher can solve it immediately.",
    "deepDive": "Modern Centralized Handling (.NET 8+):\n1. IExceptionHandler Interface:\n   - Registered via 'services.AddExceptionHandler<GlobalExceptionHandler>()'.\n   - Receives HttpContext, Exception, and CancellationToken.\n   - Returns true if the exception was handled, stopping further propagation.\n2. Security Best Practice:\n   - NEVER expose internal stack traces, connection strings, or SQL syntax to clients in production.\n   - Include a unique 'traceId' (Activity.Current?.Id ?? HttpContext.TraceIdentifier) so users can quote the ID to customer support.\n3. Distinguish Expected from Unexpected:\n   - Expected validation failures (e.g. invalid email) should return 400 Bad Request directly without throwing expensive C# exceptions.",
    "codeSnippet": "// .NET 8 Standard Global Exception Handler\npublic class GlobalExceptionHandler : IExceptionHandler\n{\n    private readonly ILogger<GlobalExceptionHandler> _logger;\n\n    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;\n\n    public async ValueTask<bool> TryHandleAsync(\n        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)\n    {\n        _logger.LogError(exception, \"Unhandled exception occurred: {Message}\", exception.Message);\n\n        var problemDetails = new ProblemDetails\n        {\n            Status = exception switch\n            {\n                KeyNotFoundException => StatusCodes.Status404NotFound,\n                InvalidOperationException => StatusCodes.Status409Conflict,\n                _ => StatusCodes.Status500InternalServerError\n            },\n            Title = \"An error occurred while processing your request.\",\n            Detail = httpContext.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment() \n                ? exception.Message \n                : \"Internal server error. Please contact support with the trace ID.\",\n            Instance = httpContext.Request.Path\n        };\n\n        problemDetails.Extensions[\"traceId\"] = httpContext.TraceIdentifier;\n\n        httpContext.Response.StatusCode = problemDetails.Status.Value;\n        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);\n        return true;\n    }\n}",
    "redFlags": [
      "Wrapping every single controller action in identical try/catch blocks instead of using centralized middleware.",
      "Swallowing exceptions with empty catch blocks, hiding production bugs.",
      "Exposing full stack traces in production 500 error responses."
    ],
    "proTips": [
      "In .NET 8, combine 'builder.Services.AddProblemDetails()' with 'builder.Services.AddExceptionHandler<GlobalExceptionHandler>()' and 'app.UseExceptionHandler()' for full RFC 7807 compliance."
    ]
  },
  {
    "id": "q-aspnet-8",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Authentication",
      "Authorization",
      "JWT",
      "Claims",
      "Roles",
      "Policies"
    ],
    "title": "Authentication versus Authorization: What is the difference and how do they work in ASP.NET Core?",
    "pitch": "Authentication establishes WHO the caller is (verifying identity via credentials, tokens, or certificates). Authorization decides WHAT the authenticated caller is allowed to do (verifying permissions, roles, or claims). In ASP.NET Core, UseAuthentication() must precede UseAuthorization(), and authorization rules must always be enforced on the server regardless of what the UI hides.",
    "analogy": "Authentication is checking your driver's license at airport security to verify your identity; Authorization is checking your boarding pass to see if you are allowed to enter the first-class lounge.",
    "deepDive": "Pipeline Execution & ClaimsPrincipal:\n1. Authentication Middleware (UseAuthentication):\n   - Inspects the request (e.g. 'Bearer <token>' in Authorization header).\n   - Validates token signature, expiration, and issuer.\n   - If valid, constructs a 'ClaimsPrincipal' and attaches it to 'HttpContext.User'.\n2. Authorization Middleware (UseAuthorization):\n   - Inspects 'HttpContext.User.Claims' against endpoint requirements:\n     [Authorize(Roles = \"Admin\")] or [Authorize(Policy = \"CanApproveBudget\")].\n3. Policy-Based Authorization:\n   - Superior to role-based authorization because policies evaluate custom requirement handlers (e.g. Must be department manager AND budget <= $50,000).",
    "codeSnippet": "// Policy Configuration in Program.cs\nbuilder.Services.AddAuthorization(options =>\n{\n    options.AddPolicy(\"CanApproveDiscounts\", policy =>\n        policy.RequireClaim(\"Permission\", \"discounts.approve\")\n              .RequireRole(\"Manager\"));\n});\n\n// Enforcement on Controller\n[ApiController]\n[Route(\"api/[controller]\")]\n[Authorize] // Requires authentication for all actions\npublic class DiscountsController : ControllerBase\n{\n    [HttpPost(\"approve\")]\n    [Authorize(Policy = \"CanApproveDiscounts\")] // Requires specific claim & role!\n    public IActionResult ApproveDiscount()\n    {\n        return Ok(new { status = \"Approved\" });\n    }\n}",
    "redFlags": [
      "Placing app.UseAuthorization() before app.UseAuthentication() in Program.cs.",
      "Relying on frontend UI button hiding as a security control without server-side [Authorize] checks.",
      "Hardcoding role strings across 50 controllers instead of using reusable authorization policies."
    ],
    "proTips": [
      "Use custom 'AuthorizationHandler<TRequirement>' for resource-based authorization (e.g., verifying that a user can only edit their OWN order: 'order.UserId == user.Id')."
    ]
  },
  {
    "id": "q-aspnet-9",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "CancellationToken",
      "Cooperative Cancellation",
      "Async",
      "SQL Cancellation"
    ],
    "title": "Why pass a CancellationToken through backend code?",
    "pitch": "A CancellationToken allows database queries, HTTP client calls, and long-running operations to stop immediately when the client aborts the request, closes their browser tab, or when a timeout policy triggers. Passing it through async layers prevents server CPU, memory, and database connection pools from being wasted on computations whose results will never be read.",
    "analogy": "If a customer leaves the restaurant, the waiter should notify the kitchen to stop cooking the meal before wasting ingredients nobody will eat.",
    "deepDive": "Cooperative Cancellation Mechanics:\n1. Cancellation is Cooperative:\n   - The CLR does not kill threads; downstream methods must check 'token.IsCancellationRequested' or pass the token to awaitable APIs.\n2. What Happens in SQL Server:\n   - When EF Core's 'ToListAsync(ct)' receives cancellation, it sends an attention packet over the TDS network connection, instructing SQL Server to cancel query execution and rollback locks immediately!\n3. Controller Binding:\n   - ASP.NET Core automatically binds 'HttpContext.RequestAborted' to any action parameter of type 'CancellationToken'.",
    "codeSnippet": "[HttpGet(\"heavy-report\")]\npublic async Task<IActionResult> GenerateReport(CancellationToken ct)\n{\n    // If user cancels or navigates away, EF Core cancels SQL query execution!\n    var data = await _db.Orders\n        .AsNoTracking()\n        .Where(o => o.Total > 500)\n        .ToListAsync(ct);\n\n    for (int i = 0; i < data.Count; i++)\n    {\n        // Periodic check in CPU-intensive processing\n        ct.ThrowIfCancellationRequested();\n        ProcessRow(data[i]);\n    }\n\n    return Ok(data);\n}",
    "redFlags": [
      "Accepting CancellationToken in the controller action but failing to pass it to underlying EF Core or HttpClient calls.",
      "Swallowing OperationCanceledException in catch blocks without rethrowing or exiting.",
      "Assuming passing the token automatically stops synchronous CPU loops without calling 'token.ThrowIfCancellationRequested()'."
    ],
    "proTips": [
      "Combine client tokens with server-side timeouts using 'CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutToken)' to enforce hard maximum execution limits."
    ]
  },
  {
    "id": "q-aspnet-10",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Hangfire",
      "Background Jobs",
      "Idempotency",
      "Retries",
      "CorrelationId"
    ],
    "title": "How do you make a Hangfire or background job safe to retry?",
    "pitch": "Make the job idempotent, persist state changes to durable storage, log a correlation identifier, and separate retryable transient network failures from permanent validation errors. Inputs should be minimal and serializable (e.g. passing an entity ID rather than an entire object), with the job reloading fresh data from the database upon execution.",
    "analogy": "A delivery driver may retry the route if a gate was locked, but the system must prevent the package from being delivered and charged twice.",
    "deepDive": "Safe Background Processing Patterns:\n1. Pass IDs, Not State:\n   - Background job arguments are serialized to JSON in SQL/Redis.\n   - Passing an entire OrderDto causes the job to execute against stale data if updated before the worker picks it up. Pass 'Guid orderId' and reload from DbContext.\n2. Idempotency Guards:\n   - If the job crashes midway through sending emails, a retry will rerun the method.\n   - Check an atomic status flag (e.g., 'if (order.Status == Paid) return;') before performing side effects.\n3. Separate Transient from Fatal Failures:\n   - Network timeouts should retry with exponential backoff.\n   - Validation errors (e.g. invalid credit card format) should fail permanently without burning retry cycles.",
    "codeSnippet": "public class InvoiceGenerationJob\n{\n    private readonly AppDbContext _db;\n    private readonly IPdfGenerator _pdf;\n\n    public InvoiceGenerationJob(AppDbContext db, IPdfGenerator pdf)\n    {\n        _db = db;\n        _pdf = pdf;\n    }\n\n    // ✅ Safe, idempotent job accepting only a Guid ID\n    public async Task ExecuteAsync(Guid invoiceId, CancellationToken ct)\n    {\n        var invoice = await _db.Invoices.FindAsync(new object[] { invoiceId }, ct);\n        if (invoice == null || invoice.Status == InvoiceStatus.Generated)\n        {\n            return; // Already processed! Safe idempotent exit on retry\n        }\n\n        var pdfBytes = await _pdf.RenderAsync(invoice, ct);\n        invoice.MarkGenerated(pdfBytes);\n\n        await _db.SaveChangesAsync(ct);\n    }\n}",
    "redFlags": [
      "Passing complex domain objects with circular references as background job parameters.",
      "Assuming automatic retries are safe when the job performs non-idempotent operations like charging credit cards.",
      "Not handling database concurrency collisions when multiple background worker instances poll the same queue."
    ],
    "proTips": [
      "Use the Hangfire attribute '[AutomaticRetry(Attempts = 3, OnAttemptsExceeded = AttemptsExceededAction.Fail)]' and log the Hangfire JobId as a correlation identifier in structured logs."
    ]
  },
  {
    "id": "q-aspnet-11",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "IHttpClientFactory",
      "HttpClient",
      "Socket Exhaustion",
      "TIME_WAIT",
      "DNS Refresh"
    ],
    "title": "IHttpClientFactory: Solving TIME_WAIT socket exhaustion and stale DNS resolution",
    "pitch": "Instantiating 'new HttpClient()' for every request exhausts operating system TCP sockets in the TIME_WAIT state under high traffic. Conversely, reusing a single static HttpClient indefinitely never honors DNS changes when backend IPs rotate. IHttpClientFactory solves both: it pools underlying HttpMessageHandler instances to eliminate socket exhaustion, while rotating them every 2 minutes to refresh DNS records.",
    "analogy": "new HttpClient() is buying a new phone for every phone call; static HttpClient is never checking if your doctor's office changed their phone number; IHttpClientFactory is a shared company phone pool with an updated directory.",
    "deepDive": "Under the Hood Architecture:\n1. TCP Socket Exhaustion:\n   - When HttpClient is disposed, the underlying TCP connection remains in TIME_WAIT for up to 240 seconds (RFC 793).\n   - Under heavy load (e.g. 1,000 req/sec), all 65,535 outbound port numbers are exhausted, throwing SocketException.\n2. The DNS Caching Trap:\n   - A static HttpClient holds the connection open forever, never issuing new DNS lookups if the target server scales or fails over.\n3. How IHttpClientFactory Works:\n   - Decouples the user-facing HttpClient from the underlying HttpMessageHandler.\n   - Handlers are pooled and expired after 2 minutes (PooledConnectionLifetime). Expired handlers are gracefully disposed once active requests drain.",
    "codeSnippet": "// Program.cs: Register Typed Client with resilience\nbuilder.Services.AddHttpClient<IWeatherService, WeatherService>(client =>\n{\n    client.BaseAddress = new Uri(\"https://api.weather.com/\");\n    client.Timeout = TimeSpan.FromSeconds(10);\n})\n.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler\n{\n    PooledConnectionLifetime = TimeSpan.FromMinutes(2) // Refreshes DNS every 2 minutes!\n});\n\n// Typed Client consumed via DI\npublic class WeatherService : IWeatherService\n{\n    private readonly HttpClient _client;\n    public WeatherService(HttpClient client) => _client = client;\n\n    public async Task<WeatherData?> GetForecastAsync(string city, CancellationToken ct)\n    {\n        return await _client.GetFromJsonAsync<WeatherData>($\"forecast/{city}\", ct);\n    }\n}",
    "redFlags": [
      "Wrapping 'new HttpClient()' inside a 'using' statement in API controllers.",
      "Creating static HttpClient without setting PooledConnectionLifetime or SocketsHttpHandler.",
      "Not configuring timeouts on HttpClient, causing threads to hang indefinitely on stalled servers."
    ],
    "proTips": [
      "In modern .NET Core / .NET 8, using a single SocketsHttpHandler with 'PooledConnectionLifetime = TimeSpan.FromMinutes(2)' achieves the exact same benefits as IHttpClientFactory without requiring the factory dependency."
    ]
  },
  {
    "id": "q-aspnet-12",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "CORS",
      "Same-Origin Policy",
      "OPTIONS Preflight",
      "Middleware Order",
      "Security"
    ],
    "title": "CORS Architecture: Same-Origin Policy, Preflight OPTIONS, and Middleware Ordering",
    "pitch": "CORS is a browser-enforced security policy preventing unauthorized cross-origin HTTP requests. For requests with custom headers, PUT/DELETE, or JSON, browsers send an HTTP OPTIONS preflight request. In ASP.NET Core, app.UseCors() must be placed strictly after app.UseRouting() and before app.UseAuthentication() and app.UseAuthorization(). A fatal trap is configuring AllowAnyOrigin() with AllowCredentials(), which browsers reject outright.",
    "analogy": "CORS is the bouncer at the door checking an approved guest list; the preflight OPTIONS request is calling ahead to verify the dress code before arriving.",
    "deepDive": "Protocol & Pipeline Order:\n1. Browser Enforcement:\n   - CORS is enforced by the client browser, NOT the server. Postman or curl completely bypass CORS.\n2. Preflight Criteria:\n   - Any request with 'application/json', Authorization headers, or non-GET/POST verbs triggers an automatic browser OPTIONS preflight.\n3. The Credential Conflict:\n   - If an API sets 'AllowCredentials()', the W3C spec forbids using wildcard '*' for AllowAnyOrigin. You must specify exact trusted origins.\n4. Middleware Order:\n   - app.UseRouting() -> app.UseCors() -> app.UseAuthentication() -> app.UseAuthorization().",
    "codeSnippet": "var builder = WebApplication.CreateBuilder(args);\n\nbuilder.Services.AddCors(options =>\n{\n    options.AddPolicy(\"TrustedAppOrigins\", policy =>\n    {\n        policy.WithOrigins(\"https://portal.company.com\", \"https://admin.company.com\")\n              .AllowAnyMethod()\n              .AllowAnyHeader()\n              .AllowCredentials() // ✅ Allowed because explicit origins are defined!\n              .SetPreflightMaxAge(TimeSpan.FromHours(2)); // Caches OPTIONS check in browser\n    });\n});\n\nvar app = builder.Build();\n\napp.UseRouting();\n\n// ✅ CRITICAL ORDER: After UseRouting, BEFORE Auth & Endpoints\napp.UseCors(\"TrustedAppOrigins\");\n\napp.UseAuthentication();\napp.UseAuthorization();\n\napp.MapControllers();\napp.Run();",
    "redFlags": [
      "Configuring AllowAnyOrigin() and AllowCredentials() together.",
      "Placing app.UseCors() before app.UseRouting() or after app.UseAuthorization().",
      "Thinking CORS protects an API against hackers (CORS only protects browser users from cross-origin script forgery)."
    ],
    "proTips": [
      "Set 'SetPreflightMaxAge(TimeSpan.FromHours(2))' in production CORS policies to prevent browsers from issuing a wasteful HTTP OPTIONS round-trip before every single API call."
    ]
  },
  {
    "id": "q-aspnet-13",
    "pillar": "aspnet",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Minimal APIs",
      "Controllers",
      "Endpoint Routing",
      "Performance",
      "Endpoint Filters"
    ],
    "title": "Minimal APIs vs. Controller-Based APIs: Performance, Architecture, and Endpoint Filters",
    "pitch": "Minimal APIs route HTTP requests directly to lambda handlers or static methods, completely bypassing MVC controller discovery, reflection overhead, and filter pipelines. This yields faster cold starts, lower memory usage, and higher throughput. Controller-based APIs provide structured conventions for large enterprise applications with dozens of endpoints. Minimal APIs in .NET 7/8 support Endpoint Filters, validation, and full OpenAPI documentation.",
    "analogy": "A Controller is a multi-story department store with escalators and cashiers; a Minimal API is an express drive-thru window serving exactly what you ordered.",
    "deepDive": "Under the Hood Differences:\n1. Performance Mechanics:\n   - Controllers require MVC infrastructure (ActionInvoker, ModelMetadataProvider, ControllerFactory).\n   - Minimal APIs use Source Generators and direct RequestDelegate compilation, executing up to 3x faster with near-zero allocations.\n2. Endpoint Filters (.NET 7+):\n   - Replace MVC Action Filters for Minimal APIs:\n     'app.MapPost(...).AddEndpointFilter<ValidationFilter>();'\n3. Architectural Recommendation:\n   - Use Minimal APIs for high-throughput microservices, event handlers, and lightweight services.\n   - Use Controllers for massive monolithic applications where teams rely on established MVC scaffolding.",
    "codeSnippet": "var app = WebApplication.Create();\n\n// High-Performance Minimal API with Endpoint Filter\napp.MapPost(\"/api/users\", async (CreateUserDto dto, IUserService service, CancellationToken ct) =>\n{\n    var user = await service.CreateAsync(dto, ct);\n    return Results.Created($\"/api/users/{user.Id}\", user);\n})\n.AddEndpointFilter(async (invocationContext, next) =>\n{\n    var dto = invocationContext.GetArgument<CreateUserDto>(0);\n    if (string.IsNullOrWhiteSpace(dto.Email))\n    {\n        return Results.ValidationProblem(new Dictionary<string, string[]>\n        {\n            [\"Email\"] = new[] { \"Email is required.\" }\n        });\n    }\n    return await next(invocationContext);\n});\n\napp.Run();",
    "redFlags": [
      "Dumping 50 Minimal API endpoints into a single giant Program.cs file (use extension methods like 'app.MapUserEndpoints()' to organize).",
      "Stating that Minimal APIs lack validation or dependency injection (they support both via Endpoint Filters).",
      "Rewriting complex, working Controller apps to Minimal APIs without measuring performance bottlenecks first."
    ],
    "proTips": [
      "Organize Minimal APIs in enterprise apps using 'ICarterModule' or extension methods on 'IEndpointRouteBuilder' to group endpoints by business aggregate."
    ]
  },
  {
    "id": "q-aspnet-14",
    "pillar": "aspnet",
    "seniority": "Senior",
    "tags": [
      "JWT",
      "Authentication",
      "Refresh Token",
      "Rotation",
      "Reuse Detection",
      "Security"
    ],
    "title": "Production JWT Authentication and Refresh Token Rotation with Reuse Detection",
    "pitch": "Stateless JWT access tokens should be short-lived (e.g. 15 minutes) to minimize exposure if intercepted. Refresh Token Rotation issues a brand-new single-use refresh token every time the access token is refreshed, immediately invalidating the previous refresh token. Reuse Detection detects if an already-used refresh token is presented: if detected, the auth server identifies a token theft breach, revokes the entire token family, and forces re-authentication.",
    "analogy": "An access token is a 15-minute visitor badge; a refresh token is a numbered claim ticket. Every time you show your claim ticket, it gets shredded and you receive a new one. If someone shows an already-shredded ticket, the alarm sounds because a clone exists.",
    "deepDive": "Token Family & Reuse Detection Protocol:\n1. Token Storage:\n   - Access tokens kept in memory (or secure Authorization header).\n   - Refresh tokens stored in HttpOnly, SameSite=Strict, Secure cookies to prevent XSS exfiltration.\n2. The Theft Scenario:\n   - Attacker steals Refresh Token R1.\n   - Legitimate user uses R1 -> gets Access Token A2 + Refresh Token R2.\n   - Attacker later tries to use R1 -> Server sees R1 has already been used!\n   - Action: Server revokes R2, R1, and all tokens associated with that user session.",
    "codeSnippet": "public async Task<TokenResponse> RefreshTokenAsync(string oldRefreshToken, CancellationToken ct)\n{\n    var tokenRecord = await _db.RefreshTokens\n        .FirstOrDefaultAsync(t => t.Token == oldRefreshToken, ct);\n\n    if (tokenRecord == null) throw new SecurityException(\"Invalid token.\");\n\n    // 🚨 REUSE DETECTION: If already revoked, token theft has occurred!\n    if (tokenRecord.IsRevoked)\n    {\n        // Compromised family: Revoke ALL tokens in this session!\n        await _db.RefreshTokens\n            .Where(t => t.TokenFamilyId == tokenRecord.TokenFamilyId)\n            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true), ct);\n\n        throw new SecurityException(\"Token theft detected. All sessions revoked.\");\n    }\n\n    // Invalidate current refresh token\n    tokenRecord.IsRevoked = true;\n\n    // Issue new pair with same family ID\n    var newAccess = GenerateJwt(tokenRecord.UserId);\n    var newRefresh = new RefreshToken\n    {\n        UserId = tokenRecord.UserId,\n        Token = Guid.NewGuid().ToString(\"N\"),\n        TokenFamilyId = tokenRecord.TokenFamilyId,\n        ExpiresUtc = DateTime.UtcNow.AddDays(7)\n    };\n    _db.RefreshTokens.Add(newRefresh);\n    await _db.SaveChangesAsync(ct);\n\n    return new TokenResponse(newAccess, newRefresh.Token);\n}",
    "redFlags": [
      "Creating JWT access tokens with 30-day expiration periods without revocation capabilities.",
      "Storing refresh tokens in browser localStorage where JavaScript XSS attacks can read them.",
      "Failing to implement Reuse Detection when using refresh token rotation."
    ],
    "proTips": [
      "Always store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies: this makes them completely invisible to malicious client-side JavaScript."
    ]
  },
  {
    "id": "q-efcore-1",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "LINQ",
      "IEnumerable",
      "IQueryable",
      "Expression Trees",
      "SQL Translation"
    ],
    "title": "What is the difference between IEnumerable and IQueryable in LINQ?",
    "pitch": "IEnumerable represents in-memory iteration using compiled delegates (Func<T, bool>) where filtering executes on the client machine in CLR memory. IQueryable represents an out-of-process query using Expression Trees (Expression<Func<T, bool>>) that a provider like Entity Framework translates into native SQL for database-side execution. Calling .ToList() too early moves expensive filtering and sorting into application memory.",
    "analogy": "IQueryable gives the librarian a precise request so they fetch only the 3 books you need; IEnumerable brings every single book in the library to your desk and forces you to search through them yourself.",
    "deepDive": "Under the Hood Differences:\n1. Method Signatures:\n   - Enumerable.Where takes Func<TSource, bool> (compiled IL bytecode).\n   - Queryable.Where takes Expression<Func<TSource, bool>> (data structure representing code).\n2. The Fatal Performance Trap:\n   - If an EF Core query is cast to IEnumerable before filtering:\n     IEnumerable<Order> orders = db.Orders; // Still IQueryable under hood\n     var top = orders.Where(o => o.Total > 500).Take(10);\n   - Because Where is invoked on IEnumerable, EF Core generates: SELECT * FROM Orders;\n   - All 5,000,000 rows are transferred across the network to client RAM, where the CLR filters in-memory!\n   - On IQueryable, it generates: SELECT TOP (10) * FROM Orders WHERE Total > 500;",
    "codeSnippet": "// ❌ JUNIOR MISTAKE: Pulls all 2,000,000 orders into RAM before filtering!\npublic List<OrderDto> BadGetRecentOrders(AppDbContext db)\n{\n    IEnumerable<Order> query = db.Orders; // Cast to IEnumerable!\n    return query\n        .Where(o => o.Status == \"Completed\") // Filters in C# RAM, NOT in SQL!\n        .Take(20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToList();\n}\n\n// ✅ SENIOR PATTERN: Evaluates WHERE and TOP on SQL Server\npublic async Task<List<OrderDto>> GoodGetRecentOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    IQueryable<Order> query = db.Orders.AsNoTracking(); // Retains IQueryable\n    return await query\n        .Where(o => o.Status == \"Completed\") // SQL: WHERE [o].[Status] = N'Completed'\n        .Take(20)                            // SQL: TOP (20)\n        .Select(o => new OrderDto(o.Id, o.Total))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Calling '.ToList()' or '.AsEnumerable()' before applying WHERE filters, pagination, or projections.",
      "Thinking IEnumerable and IQueryable execute in the exact same location.",
      "Writing business methods that return IEnumerable<T> from a repository while still constructing SQL."
    ],
    "proTips": [
      "Keep query specifications as IQueryable<T> inside Repository layers only while building clauses; materialize to Task<List<TDto>> before returning to API controllers to prevent leaky abstraction bugs."
    ]
  },
  {
    "id": "q-efcore-2",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "EF Core",
      "AsNoTracking",
      "Change Tracker",
      "Performance",
      "Read-Only Queries"
    ],
    "title": "When do you use AsNoTracking in Entity Framework Core?",
    "pitch": "Use AsNoTracking for read-only queries when you do not intend to modify, update, or delete the returned entities in the current DbContext. Bypassing the Change Tracker eliminates snapshot creation, identity map registration, and memory retention, providing a 40–60% performance and memory gain on large datasets.",
    "analogy": "When reading a library book's title, you do not need a clipboard tracking every single page you touched.",
    "deepDive": "Internal Change Tracker Mechanics:\n1. Tracked Query Cost:\n   - When EF Core queries tracked entities, it creates a snapshot copy of every property value in the DbContext's StateManager.\n   - When SaveChanges() is called, EF Core compares the current entity values against the snapshot copies (DetectChanges).\n2. AsNoTracking Benefits:\n   - Completely bypasses snapshot creation and StateManager registration.\n   - Garbage collector reclaims entity memory immediately after the request completes.\n3. AsNoTrackingWithIdentityResolution (.NET 5+):\n   - Bypasses tracking but retains the identity map, ensuring duplicate parent rows in JOINs share the same C# object reference.",
    "codeSnippet": "// ❌ WASTE OF MEMORY: Tracking 5,000 read-only report rows\npublic async Task<List<ProductReportDto>> BadGetReportAsync(AppDbContext db, CancellationToken ct)\n{\n    // Allocates snapshots in ChangeTracker for all 5,000 objects!\n    return await db.Products\n        .Select(p => new ProductReportDto(p.Id, p.Name, p.Price))\n        .ToListAsync(ct);\n}\n\n// ✅ SENIOR PATTERN: Bypasses Change Tracker completely\npublic async Task<List<ProductReportDto>> GoodGetReportAsync(AppDbContext db, CancellationToken ct)\n{\n    return await db.Products\n        .AsNoTracking() // 40-60% faster, zero tracker memory\n        .Select(p => new ProductReportDto(p.Id, p.Name, p.Price))\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Using AsNoTracking on entities that you subsequently modify and expect db.SaveChangesAsync() to persist (changes will be ignored!).",
      "Believing projection queries (.Select()) require explicit tracking when DTOs are already non-tracked by default.",
      "Leaving change tracking enabled for high-throughput public read APIs."
    ],
    "proTips": [
      "Configure 'UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)' globally on DbContext in read-heavy applications, and explicitly call '.AsTracking()' only on update paths."
    ]
  },
  {
    "id": "q-efcore-3",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "EF Core",
      "N+1 Problem",
      "Projection",
      "Include",
      "AsSplitQuery"
    ],
    "title": "How do you avoid the N+1 query problem in Entity Framework Core?",
    "pitch": "The N+1 problem occurs when an application executes 1 initial query to fetch parent rows, followed by N separate SQL queries inside a loop to fetch child rows for each parent. Avoid it by inspecting generated SQL and using direct DTO projection (.Select()), deliberate eager loading (.Include()), or purpose-built join queries instead of lazy loading navigations.",
    "analogy": "Do not visit the grocery store once for each ingredient; make one complete shopping list and execute one planned trip.",
    "deepDive": "Eager Loading vs Projection:\n1. The Lazy Loading Trap:\n   - Accessing 'customer.Orders' inside a foreach loop generates 1 query for customers + 100 individual queries for each customer's orders (101 round trips!).\n2. Eager Loading (.Include):\n   - Fetches parents and children in a single query via SQL JOINs.\n   - ⚠️ Hazard: Multiple .Include() calls create Cartesian multiplication (10 orders * 5 items = 50 rows per customer).\n3. The Ultimate Senior Fix: DTO Projection:\n   - Using '.Select(c => new CustomerDto { Orders = c.Orders.Select(...) })' generates the exact optimal SQL, selects only required columns, and eliminates both N+1 and Cartesian explosion.",
    "codeSnippet": "// ❌ N+1 PROBLEM: Generates 1 query for customers + 100 queries for orders!\npublic async Task BadProcessCustomers(AppDbContext db)\n{\n    var customers = await db.Customers.ToListAsync(); // 1 query\n    foreach (var c in customers)\n    {\n        var orderCount = c.Orders.Count; // Fires 1 new SQL query per customer!\n    }\n}\n\n// ✅ SENIOR PATTERN: Single SQL query with direct DTO projection\npublic async Task<List<CustomerSummaryDto>> GoodGetCustomersAsync(AppDbContext db, CancellationToken ct)\n{\n    return await db.Customers\n        .AsNoTracking()\n        .Select(c => new CustomerSummaryDto\n        {\n            CustomerId = c.Id,\n            CustomerName = c.Name,\n            OrderCount = c.Orders.Count // Translated to SQL COUNT(*) in 1 query!\n        })\n        .ToListAsync(ct);\n}",
    "redFlags": [
      "Enabling Lazy Loading proxies in production ASP.NET Core APIs without monitoring SQL round trips.",
      "Solving every N+1 query by chaining 6 .Include() calls, causing massive Cartesian data duplication.",
      "Not inspecting EF Core SQL output using tools like EF Core logging, MiniProfiler, or SQL Server Profiler."
    ],
    "proTips": [
      "Always prefer direct LINQ projection (.Select()) over .Include(): projection only pulls requested columns, bypassing the change tracker and generating optimal SQL subqueries."
    ]
  },
  {
    "id": "q-efcore-4",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DbContext",
      "Scoped Lifetime",
      "Thread Safety",
      "Unit of Work",
      "Captive Dependency"
    ],
    "title": "What is the correct lifetime and usage of DbContext in ASP.NET Core?",
    "pitch": "DbContext represents a short-lived Unit of Work and Identity Map that should typically be registered with a Scoped lifetime (one instance per HTTP request). DbContext is NOT thread-safe: it must never be shared across concurrent asynchronous operations, stored in static fields, or injected directly into a Singleton service.",
    "analogy": "A DbContext is one student's assignment folder for one class period, not a school-wide cabinet edited by 500 students at the same moment.",
    "deepDive": "Thread Safety & Scope Mechanics:\n1. Thread Safety Invariant:\n   - Any attempt to execute concurrent operations on the same DbContext instance (e.g. Task.WhenAll running two queries on the same context) throws 'InvalidOperationException: A second operation was started on this context instance before a previous operation completed'.\n2. Scoped Cleanup:\n   - When the HTTP request pipeline terminates, the DI container automatically calls Dispose() on the DbContext, closing the database connection and freeing tracked memory.\n3. Background Worker Usage:\n   - In Singleton workers (IHostedService), inject 'IServiceScopeFactory' and create an explicit 'using var scope = _scopeFactory.CreateScope()' to resolve a short-lived DbContext per iteration.",
    "codeSnippet": "// ❌ CONCURRENCY CRASH: Parallel queries on same DbContext instance\npublic async Task BadParallelQuery(AppDbContext db)\n{\n    var task1 = db.Customers.ToListAsync();\n    var task2 = db.Orders.ToListAsync();\n    await Task.WhenAll(task1, task2); // 💥 CRASH: Concurrent access on same DbContext!\n}\n\n// ✅ SENIOR PATTERN: Sequential awaits OR separate pooled contexts\npublic async Task GoodQuery(AppDbContext db, CancellationToken ct)\n{\n    var customers = await db.Customers.AsNoTracking().ToListAsync(ct);\n    var orders = await db.Orders.AsNoTracking().ToListAsync(ct); // Safe sequential execution\n}\n\n// ✅ Resolving DbContext safely in Background Workers\npublic class ReportWorker : BackgroundService\n{\n    private readonly IServiceScopeFactory _scopeFactory;\n    public ReportWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;\n\n    protected override async Task ExecuteAsync(CancellationToken stoppingToken)\n    {\n        using var scope = _scopeFactory.CreateScope();\n        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();\n        // Safe scoped work...\n    }\n}",
    "redFlags": [
      "Running Task.WhenAll with multiple LINQ queries on the exact same DbContext instance.",
      "Injecting AppDbContext directly into a Singleton service.",
      "Keeping a DbContext alive for hours in a desktop or background application without clearing the Change Tracker."
    ],
    "proTips": [
      "Use 'AddDbContextPool<AppDbContext>' in high-throughput APIs: it pools reusable DbContext instances, reducing the memory allocation cost of instantiating contexts on every HTTP request."
    ]
  },
  {
    "id": "q-efcore-5",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Transactions",
      "ACID",
      "Atomic",
      "BeginTransactionAsync",
      "Rollback"
    ],
    "title": "When do you use a database transaction, and how do you implement it in EF Core?",
    "pitch": "Use an explicit database transaction when multiple database operations across one or more SaveChanges() calls or raw SQL commands must succeed or fail together as a single atomic unit. Keep the transaction as short as practical, choose an appropriate isolation level, and avoid slow external HTTP or filesystem calls while database locks are held.",
    "analogy": "Buying a plane ticket and assigning its seat must happen together: you should not pay for the ticket and then discover the seat was given away.",
    "deepDive": "Default vs Explicit Transactions:\n1. SaveChanges() Default Behavior:\n   - By default, a single call to 'context.SaveChangesAsync()' automatically wraps all tracked inserts, updates, and deletes inside an atomic transaction.\n2. When to Use Explicit Transactions:\n   - When an operation requires multiple SaveChanges() calls (e.g., generating an invoice number, then creating dependent ledger items).\n   - When coordinating EF Core operations with raw ADO.NET / Dapper commands on the same connection.\n3. The Golden Rule of Database Locks:\n   - NEVER make an external HTTP call or send an email inside an open database transaction! Network timeouts will hold table locks, creating severe blocking and deadlocks.",
    "codeSnippet": "public async Task TransferFundsAsync(Guid fromAccountId, Guid toAccountId, decimal amount, CancellationToken ct)\n{\n    // ✅ EXPLICIT TRANSACTION: Ensures both balance updates succeed or fail atomically\n    await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);\n    try\n    {\n        var fromAccount = await _db.Accounts.FindAsync(new object[] { fromAccountId }, ct);\n        var toAccount = await _db.Accounts.FindAsync(new object[] { toAccountId }, ct);\n\n        fromAccount.Debit(amount);\n        toAccount.Credit(amount);\n\n        await _db.SaveChangesAsync(ct);\n\n        // Commit transaction after all operations succeed\n        await transaction.CommitAsync(ct);\n    }\n    catch\n    {\n        // Automatically rolled back on dispose if not committed\n        await transaction.RollbackAsync(ct);\n        throw;\n    }\n}",
    "redFlags": [
      "Making external HTTP requests or third-party payment calls inside an open SQL transaction block.",
      "Starting an explicit transaction for a single SaveChangesAsync() call (EF Core already does this automatically).",
      "Holding transactions open across user think-time or UI prompts."
    ],
    "proTips": [
      "In modern C#, 'await using var tx = await db.Database.BeginTransactionAsync(ct);' guarantees an automatic rollback upon disposal if CommitAsync was not reached due to an exception."
    ]
  },
  {
    "id": "q-efcore-6",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Concurrency",
      "Optimistic Concurrency",
      "RowVersion",
      "DbUpdateConcurrencyException",
      "Pessimistic Locks"
    ],
    "title": "How do you handle concurrent updates in EF Core? (Optimistic vs. Pessimistic Concurrency)",
    "pitch": "Choose the concurrency control based on conflict frequency: Optimistic Concurrency works best when collisions are rare, using a SQL Server RowVersion / byte[] column to detect if another session changed the row before committing. If changed, EF Core throws DbUpdateConcurrencyException. Pessimistic Concurrency uses database locks (e.g. sp_getapplock or UPDLOCK) when collisions are frequent or for critical workflow operations where retries are unacceptable.",
    "analogy": "Optimistic concurrency is checking whether the shared document changed before clicking save; a workflow lock is the physical key to a shared equipment room that only one person can hold at a time.",
    "deepDive": "Optimistic Concurrency Under the Hood:\n1. RowVersion / Timestamp:\n   - In SQL Server, 'ROWVERSION' is an 8-byte auto-incrementing binary counter that changes automatically on every row UPDATE.\n2. The Generated SQL:\n   - 'UPDATE Accounts SET Balance = @b WHERE Id = @id AND RowVersion = @originalRowVersion;'\n   - If another transaction committed first, the RowVersion no longer matches, resulting in 0 rows affected.\n3. Catching Concurrency Conflicts:\n   - EF Core checks rows affected: if 0, it throws 'DbUpdateConcurrencyException'.\n   - The application can catch the exception, reload 'entry.GetDatabaseValuesAsync()', and resolve the conflict.",
    "codeSnippet": "public class BankAccount\n{\n    public Guid Id { get; set; }\n    public decimal Balance { get; set; }\n\n    [Timestamp] // Concurrency token\n    public byte[] RowVersion { get; set; } = default!;\n}\n\n// Resolving concurrency conflicts gracefully\npublic async Task<bool> UpdateBalanceAsync(Guid accountId, decimal amount, CancellationToken ct)\n{\n    var account = await _db.Accounts.FindAsync(new object[] { accountId }, ct);\n    account.Balance += amount;\n\n    try\n    {\n        await _db.SaveChangesAsync(ct);\n        return true;\n    }\n    catch (DbUpdateConcurrencyException ex)\n    {\n        var entry = ex.Entries.Single();\n        var databaseValues = await entry.GetDatabaseValuesAsync(ct);\n        if (databaseValues == null)\n        {\n            throw new InvalidOperationException(\"Account was deleted by another user.\");\n        }\n\n        // Senior conflict resolution: Reload database values and retry\n        entry.OriginalValues.SetValues(databaseValues);\n        return false; // Signal conflict to caller for retry\n    }\n}",
    "redFlags": [
      "Assuming that C# 'lock' statements protect database updates across multiple load-balanced web servers.",
      "Overwriting concurrent database changes blindly with Last-Write-Wins without auditing or detection.",
      "Promising zero deadlocks when implementing high-volume concurrent updates."
    ],
    "proTips": [
      "For financial workflows or state transitions where retries are dangerous, combine optimistic RowVersion checks with SQL Server application locks ('sp_getapplock') to serialize critical execution paths."
    ]
  },
  {
    "id": "q-efcore-7",
    "pillar": "efcore",
    "seniority": "Senior",
    "tags": [
      "EF Core",
      "Split Queries",
      "AsSplitQuery",
      "Cartesian Explosion",
      "Performance"
    ],
    "title": "EF Core Split Queries (.AsSplitQuery): Mitigating Cartesian Product Explosions",
    "pitch": "When eagerly loading multiple 1:N child collections in a single LINQ query via .Include(), SQL Server creates a Cartesian product JOIN that duplicates parent columns for every child combination. .AsSplitQuery() splits the operation into multiple distinct SQL queries (one for the parent table, one for each child collection), drastically reducing transferred data volume and database memory grants.",
    "analogy": "If a student has 10 classes and 5 clubs, sending one spreadsheet pairing every class with every club creates 50 redundant rows; sending one class list and one club list sends only 15 rows.",
    "deepDive": "Cartesian Explosion Mathematics:\n1. The Problem:\n   - 1 Order with 10 OrderItems and 5 OrderShipments.\n   - A single SQL query with JOINs returns: 1 * 10 * 5 = 50 rows, duplicating customer address and order details 50 times across the network!\n2. How .AsSplitQuery() Resolves It:\n   - Query 1: SELECT * FROM Orders WHERE Id = @id;\n   - Query 2: SELECT * FROM OrderItems WHERE OrderId = @id;\n   - Query 3: SELECT * FROM OrderShipments WHERE OrderId = @id;\n   - Total rows returned: 1 + 10 + 5 = 16 rows!\n3. The Trade-Off:\n   - Split queries execute multiple network round-trips. If not wrapped in a transaction, concurrent updates between queries can produce inconsistent reads.",
    "codeSnippet": "public async Task<Order?> GetOrderWithFullGraphAsync(AppDbContext db, Guid orderId, CancellationToken ct)\n{\n    return await db.Orders\n        .AsNoTracking()\n        // ✅ SENIOR PATTERN: Splits multiple collection joins into separate SELECT queries\n        .AsSplitQuery()\n        .Include(o => o.Items)\n            .ThenInclude(i => i.Product)\n        .Include(o => o.Shipments)\n        .Include(o => o.Discounts)\n        .FirstOrDefaultAsync(o => o.Id == orderId, ct);\n}",
    "redFlags": [
      "Including 3 or more child collections in a single LINQ query without using .AsSplitQuery().",
      "Using split queries blindly on single-table queries where no collections are included.",
      "Ignoring the EF Core compiler warning 'Compiling a query which loads related collections for more than one collection navigation'."
    ],
    "proTips": [
      "Configure 'UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)' globally in Program.cs for applications that frequently load multi-collection aggregates."
    ]
  },
  {
    "id": "q-efcore-8",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "First",
      "FirstOrDefault",
      "Single",
      "SingleOrDefault",
      "TOP 1 vs TOP 2"
    ],
    "title": "First vs. FirstOrDefault vs. Single vs. SingleOrDefault: SQL Generation (TOP 1 vs TOP 2)",
    "pitch": "First and FirstOrDefault generate 'SELECT TOP (1)' in SQL Server, stopping index traversal immediately on the first match. Single and SingleOrDefault generate 'SELECT TOP (2)' because SQL Server must verify that a second matching row does NOT exist to guarantee uniqueness. If more than one row matches, Single throws InvalidOperationException.",
    "analogy": "FirstOrDefault is finding the first student wearing a red shirt and stopping; SingleOrDefault checks the entire classroom to make sure NO OTHER student is wearing a red shirt.",
    "deepDive": "Under the Hood Differences:\n1. SQL Generation:\n   - 'FirstOrDefaultAsync' -> SELECT TOP (1) ... (Terminates scan at first row).\n   - 'SingleOrDefaultAsync' -> SELECT TOP (2) ... (Forces query engine to scan until finding a second row or reaching the end of the table).\n2. Exception Behavior:\n   - First(): Throws if sequence is EMPTY.\n   - FirstOrDefault(): Returns default/null if sequence is EMPTY.\n   - Single(): Throws if EMPTY, and throws if > 1 match exists.\n   - SingleOrDefault(): Returns default/null if EMPTY, but throws if > 1 match exists!",
    "codeSnippet": "// ❌ PERFORMANCE PENALTY: Scans for TOP (2) on non-unique indexed column\npublic async Task<User?> BadGetUserByEmail(AppDbContext db, string email, CancellationToken ct)\n{\n    // If Email has no unique index, SQL scans until it finds 2 rows or scans the entire table!\n    return await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);\n}\n\n// ✅ OPTIMAL: Stops immediately at first row\npublic async Task<User?> GoodGetUserByEmail(AppDbContext db, string email, CancellationToken ct)\n{\n    return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, ct);\n}",
    "redFlags": [
      "Using SingleOrDefault on large, non-unique tables when business logic only requires FirstOrDefault.",
      "Calling First() on an empty list without handling InvalidOperationException.",
      "Not knowing that Single generates 'TOP (2)' in SQL."
    ],
    "proTips": [
      "In .NET 6+, use 'FirstOrDefault(predicate, defaultValue)' to specify an explicit non-null fallback object instead of checking for null after execution."
    ]
  },
  {
    "id": "q-efcore-9",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Eager Loading",
      "Explicit Loading",
      "Lazy Loading",
      "Navigation Properties"
    ],
    "title": "Eager Loading vs. Explicit Loading vs. Lazy Loading in EF Core",
    "pitch": "Eager loading (.Include()) loads related entities upfront in the initial query via SQL JOINs. Explicit loading (entry.Collection().LoadAsync()) loads navigations on-demand for an entity that is already tracked. Lazy loading automatically loads related data when a virtual navigation property is accessed, which introduces hidden N+1 query storms and circular JSON serialization crashes.",
    "analogy": "Eager loading is packing all travel luggage into the car before leaving; Explicit loading is stopping at a store to buy an item only if needed; Lazy loading is driving back home every time you realize you forgot a toothbrush.",
    "deepDive": "Comparison & Hazards:\n1. Eager Loading (.Include):\n   - Best for APIs returning composite parent-child DTOs.\n2. Explicit Loading (db.Entry(order).Collection(...).LoadAsync()):\n   - Ideal for conditional branches: only fetch items if business validation passes.\n3. Lazy Loading Hazards:\n   - Requires marking properties 'virtual' and installing Microsoft.EntityFrameworkCore.Proxies.\n   - Accessing 'user.Orders' in a loop executes N hidden SQL queries.\n   - Passing lazy-loaded entities into System.Text.Json causes infinite recursive loops and stack overflow crashes.",
    "codeSnippet": "public class LoadingDemo\n{\n    // 1. Eager Loading (Best Practice)\n    public async Task<Order?> EagerLoadAsync(AppDbContext db, Guid id, CancellationToken ct)\n    {\n        return await db.Orders\n            .AsNoTracking()\n            .Include(o => o.Customer)\n            .Include(o => o.Items)\n            .FirstOrDefaultAsync(o => o.Id == id, ct);\n    }\n\n    // 2. Explicit Loading (Conditional)\n    public async Task ExplicitLoadAsync(AppDbContext db, Order order, CancellationToken ct)\n    {\n        if (order.Total > 1000)\n        {\n            // Only loads discounts when condition is met\n            await db.Entry(order).Collection(o => o.Discounts).LoadAsync(ct);\n        }\n    }\n}",
    "redFlags": [
      "Enabling Lazy Loading proxies in production Web APIs without knowing how to prevent N+1 queries.",
      "Returning untracked lazy-loading proxy entities directly to JSON serializers.",
      "Using multiple .Include() calls without testing for Cartesian explosion."
    ],
    "proTips": [
      "In high-performance REST APIs, prefer direct DTO projection (.Select()) over .Include(): EF Core will only query the exact columns requested and completely bypass entity tracking overhead."
    ]
  },
  {
    "id": "q-efcore-10",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Code-First",
      "Database-First",
      "Migrations",
      "Scaffold",
      "Schema Governance"
    ],
    "title": "Code-First vs. Database-First: Scaffolding, Migrations, and Team Schema Governance",
    "pitch": "Code-First defines database models using C# classes and Fluent API configurations, automating incremental schema evolution via 'dotnet ef migrations add'. Database-First begins with an existing relational database and generates C# entities using 'dotnet ef dbcontext scaffold'. For enterprise production deployments, never run Database.Migrate() at application startup; use idempotent SQL migration bundles in CI/CD pipelines.",
    "analogy": "Code-First is architecting a house from modern architectural software blueprints; Database-First is scanning an existing building to produce architectural drawings.",
    "deepDive": "Production Governance Best Practices:\n1. The Startup Migration Race Condition:\n   - Calling 'context.Database.Migrate()' inside Program.cs causes race conditions, table locks, and crashes when multiple Kubernetes pods or App Service instances boot simultaneously.\n2. Idempotent Migration Scripts:\n   - Generate idempotent SQL scripts in CI/CD pipelines:\n     'dotnet ef migrations script --idempotent --output migrate.sql'\n   - Allows database administrators (DBAs) to review DDL changes before execution.\n3. Migration Bundles (.NET 6+):\n   - Generates a standalone, lightweight executable containing only the migrations:\n     'dotnet ef migrations bundle'",
    "codeSnippet": "// Fluent API Best Practice: Implement IEntityTypeConfiguration<T>\npublic class OrderConfig : IEntityTypeConfiguration<Order>\n{\n    public void Configure(EntityTypeBuilder<Order> builder)\n    {\n        builder.ToTable(\"Orders\", \"sales\");\n        builder.HasKey(o => o.Id);\n\n        builder.Property(o => o.OrderNumber)\n            .IsRequired()\n            .HasMaxLength(32)\n            .IsUnicode(false); // VARCHAR(32) instead of NVARCHAR(32)\n\n        builder.Property(o => o.RowVersion)\n            .IsRowVersion();\n\n        builder.HasIndex(o => o.OrderNumber)\n            .IsUnique();\n    }\n}\n\n// Program.cs: Auto-apply all configurations in assembly\n// modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);",
    "redFlags": [
      "Running 'context.Database.EnsureCreated()' in a production environment (bypasses migration history and cannot evolve schema).",
      "Executing Database.Migrate() in application startup across multi-instance cloud deployments.",
      "Modifying an already-applied migration snapshot file after it has been deployed to production."
    ],
    "proTips": [
      "Use 'dotnet ef migrations bundle' in Docker-based CI/CD pipelines: it creates a self-contained executable that applies migrations without requiring the full .NET SDK to be installed on the deployment agent."
    ]
  },
  {
    "id": "q-efcore-11",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "LINQ",
      "Deferred Execution",
      "Multiple Enumeration",
      "Re-evaluation",
      "Yield"
    ],
    "title": "LINQ Deferred Execution vs. Immediate Execution and the Multiple Enumeration Bug",
    "pitch": "LINQ query definitions (Where, Select, Skip, Take) use deferred execution: defining the query does not execute it or allocate collection memory. Execution occurs only when the sequence is enumerated (via foreach, .ToList(), .Count(), etc.). However, iterating an unmaterialized deferred query multiple times causes the entire query (and underlying database round-trip or calculation) to re-execute every single time.",
    "analogy": "A recipe is deferred execution: writing the recipe does not bake the cake; following the instructions bakes the cake. If you bake the cake every time someone asks if you have one, you waste hours.",
    "deepDive": "The Multiple Enumeration Hazard:\n1. Iterators & Yield:\n   - Operators like Where and Select return custom enumerator structs implementing IEnumerator<T>.\n   - Code executes one item at a time upon MoveNext().\n2. The Bug in Action:\n   public void Process(IEnumerable<User> users)\n   {\n       if (users.Any()) // Enumeration 1: Runs SQL query or generator\n       {\n           foreach (var u in users) // Enumeration 2: Re-runs the entire SQL query!\n           { ... }\n       }\n   }\n3. The Fix:\n   - If a sequence will be enumerated multiple times, materialize it upfront using '.ToList()' or '.ToArray()'.",
    "codeSnippet": "// ❌ MULTIPLE ENUMERATION BUG: Executes database query twice!\npublic async Task BadProcessOrdersAsync(IQueryable<Order> ordersQuery)\n{\n    // Enumeration 1: Executes SQL query to check existence\n    if (await ordersQuery.AnyAsync())\n    {\n        // Enumeration 2: Re-executes the entire SQL query from scratch!\n        var orders = await ordersQuery.ToListAsync();\n        SendNotifications(orders);\n    }\n}\n\n// ✅ SENIOR PATTERN: Materializes once into memory\npublic async Task GoodProcessOrdersAsync(IQueryable<Order> ordersQuery, CancellationToken ct)\n{\n    // Executes SQL once and materializes into memory list\n    var orders = await ordersQuery.AsNoTracking().ToListAsync(ct);\n\n    if (orders.Count > 0)\n    {\n        SendNotifications(orders); // Iterates in-memory list with zero SQL overhead\n    }\n}",
    "redFlags": [
      "Iterating an IEnumerable parameter multiple times without knowing whether it is a deferred generator or database query.",
      "Calling '.ToList()' inside a loop on a deferred LINQ query.",
      "Ignoring JetBrains / Roslyn analyzer warning 'Possible multiple enumeration of IEnumerable'."
    ],
    "proTips": [
      "In API contracts, if a method returns an already-materialized collection, specify 'IReadOnlyList<T>' or 'List<T>' as the return type instead of 'IEnumerable<T>' to communicate that the sequence is safe to enumerate repeatedly."
    ]
  },
  {
    "id": "q-efcore-12",
    "pillar": "efcore",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Any()",
      "Count()",
      "Short-Circuiting",
      "SQL Execution Plan",
      "Performance"
    ],
    "title": "LINQ Any() vs. Count() > 0: Short-Circuiting vs. Full Table Scans",
    "pitch": "To check for the presence of elements, .Any() is asymptotically superior because it short-circuits on the very first match: in-memory, it calls MoveNext() once and returns true immediately. In EF Core, it compiles to 'IF EXISTS (SELECT 1 FROM ...)', terminating index traversal at row 1. In contrast, .Count() > 0 forces an eager evaluation of the entire sequence: in SQL, it generates 'SELECT COUNT(*)', reading all matching pages.",
    "analogy": "Any() is checking if a restaurant has an open table and taking the first one you see; Count() > 0 is counting every empty chair in the entire building before deciding to sit down.",
    "deepDive": "Under the Hood Execution:\n1. In-Memory:\n   - '.Any()': O(1) best case. Stops at element 0 if matching.\n   - '.Count() > 0': O(N) guaranteed. Must count all items in collection.\n2. EF Core SQL Translation:\n   - 'db.Orders.Any(o => o.Status == \"Pending\")' ->\n     SELECT CASE WHEN EXISTS (SELECT 1 FROM [Orders] WHERE [Status] = 'Pending') THEN 1 ELSE 0 END.\n   - 'db.Orders.Count(o => o.Status == \"Pending\") > 0' ->\n     SELECT COUNT(*) FROM [Orders] WHERE [Status] = 'Pending' (reads entire index or table!).\n3. List<T>.Exists Optimization:\n   - On in-memory List<T>, '.Exists(predicate)' is slightly faster than '.Any()' because it avoids allocating an enumerator object on the heap.",
    "codeSnippet": "// ❌ SLOW: Scans all 1,000,000 records to count total\npublic async Task<bool> BadHasOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    return await db.Orders.CountAsync(o => o.Status == \"Pending\", ct) > 0;\n}\n\n// ✅ FAST: Generates IF EXISTS (SELECT 1 ...), stops immediately at row 1\npublic async Task<bool> GoodHasOrdersAsync(AppDbContext db, CancellationToken ct)\n{\n    return await db.Orders.AnyAsync(o => o.Status == \"Pending\", ct);\n}",
    "redFlags": [
      "Using '.Count() > 0' or '.Count() != 0' to check if a collection or query has items.",
      "Calling '.ToList()' before calling '.Any()' on an IQueryable.",
      "Assuming SQL Server always rewrites COUNT(*) > 0 into an EXISTS."
    ],
    "proTips": [
      "For in-memory List<T>, use 'list.Exists(match)' instead of 'list.Any(match)': Exists is an optimized struct-based internal loop that does not allocate an enumerator instance on the heap."
    ]
  },
  {
    "id": "q-sql-1",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Joins",
      "Relational Database",
      "NULL Handling"
    ],
    "title": "What is the difference between INNER JOIN and LEFT JOIN, and how do they handle NULLs?",
    "pitch": "An INNER JOIN returns only records that have matching keys in both tables. A LEFT JOIN returns all records from the left table, plus matched records from the right table; if no match exists, all columns from the right table are filled with NULLs. For filtering out existing records (anti-joins), a LEFT JOIN with a WHERE right.Key IS NULL is a classic pattern.",
    "analogy": "A dance class: INNER JOIN pairs up dancers who both have partners; LEFT JOIN lists every dancer from your school, pairing them if a partner showed up or leaving the partner spot empty (NULL) if nobody came.",
    "deepDive": "Join Engine Mechanics:\n1. INNER JOIN:\n   - Evaluates ON predicate and discards rows without a match on both sides.\n   - Evaluated by the query optimizer using Nested Loops, Merge Join, or Hash Match based on table sizes and index availability.\n2. LEFT JOIN (Outer Join):\n   - Preserves all rows from the outer (left) stream regardless of match.\n   - Any column selected from the unmatching right table yields NULL.\n3. Common Anti-Join Pattern:\n   - 'SELECT c.Id FROM Customers c LEFT JOIN Orders o ON c.Id = o.CustomerId WHERE o.CustomerId IS NULL' finds customers without orders.\n4. Predicate Placement Critical Difference:\n   - Filtering right table in the ON clause preserves all left rows (e.g. 'ON o.CustomerId = c.Id AND o.Status = 1').\n   - Filtering right table in the WHERE clause (e.g. 'WHERE o.Status = 1') converts the LEFT JOIN into an INNER JOIN because NULL == 1 evaluates to UNKNOWN!",
    "codeSnippet": "-- 1. INNER JOIN: Only customers with at least one order\nSELECT c.CustomerId, c.CompanyName, o.OrderId, o.TotalAmount\nFROM dbo.Customers c\nINNER JOIN dbo.Orders o ON c.CustomerId = o.CustomerId;\n\n-- 2. LEFT JOIN Anti-Pattern fix: Preserves left rows even when no orders exist\nSELECT c.CustomerId, c.CompanyName, o.OrderId, COALESCE(o.TotalAmount, 0.00) AS TotalAmount\nFROM dbo.Customers c\nLEFT JOIN dbo.Orders o ON c.CustomerId = o.CustomerId;\n\n-- 3. Anti-Join: Find all customers who have NEVER placed an order\nSELECT c.CustomerId, c.CompanyName\nFROM dbo.Customers c\nLEFT JOIN dbo.Orders o ON c.CustomerId = o.CustomerId\nWHERE o.OrderId IS NULL;",
    "redFlags": [
      "Putting right-table filter predicates in the WHERE clause of a LEFT JOIN without realizing it silently turns it into an INNER JOIN.",
      "Assuming INNER JOIN and LEFT JOIN perform identically on unindexed foreign keys.",
      "Not understanding how three-valued logic (TRUE, FALSE, UNKNOWN) interacts with NULLs in JOIN criteria."
    ],
    "proTips": [
      "For anti-joins on large datasets, test 'NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerId = c.CustomerId)' against 'LEFT JOIN ... WHERE o.Id IS NULL'. In SQL Server, the optimizer often generates identical anti-semi-join plans, but NOT EXISTS is clearer and immune to NULL-in-WHERE conversion bugs."
    ]
  },
  {
    "id": "q-sql-2",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "WHERE",
      "HAVING",
      "Aggregation",
      "Query Execution"
    ],
    "title": "What is the difference between WHERE and HAVING in SQL?",
    "pitch": "WHERE filters raw individual rows before any grouping or aggregate functions are calculated. HAVING filters the summarized groups after the GROUP BY and aggregate functions have executed. You cannot use aggregate functions like SUM() or COUNT() in a WHERE clause, and filtering non-aggregate columns in HAVING instead of WHERE forces SQL Server to aggregate unnecessary rows first, destroying performance.",
    "analogy": "Grading high schoolers: WHERE filters out students who were absent before calculating the class averages; HAVING filters out entire classrooms whose overall average score fell below 75%.",
    "deepDive": "SQL Logical Query Processing Phase Order:\n1. FROM (and JOINs)\n2. WHERE (Row-level filtering)\n3. GROUP BY (Bucket rows into groups)\n4. HAVING (Group-level aggregate filtering)\n5. SELECT (Column evaluation, aliases created)\n6. DISTINCT\n7. ORDER BY (Sorting)\n8. TOP / OFFSET-FETCH (Paging)\n\nPerformance Rule:\nAlways filter as many rows as possible in WHERE before they reach GROUP BY. Putting non-aggregated columns in HAVING (e.g. 'HAVING DepartmentId = 5') forces the engine to aggregate all departments across the entire table before discarding them!",
    "codeSnippet": "-- ✅ CORRECT: Pre-filters rows in WHERE, filters aggregate in HAVING\nSELECT \n    o.CustomerId,\n    COUNT(o.OrderId) AS OrderCount,\n    SUM(o.TotalAmount) AS TotalSpent\nFROM dbo.Orders o\nWHERE o.OrderDate >= '2024-01-01' -- Row filter: only 2024 orders evaluated\nGROUP BY o.CustomerId\nHAVING SUM(o.TotalAmount) > 10000.00; -- Aggregate filter: high-value customers only\n\n-- ❌ AVOID: Filtering raw columns inside HAVING\n-- Forces SQL Server to group all dates across history before discarding them!\nSELECT o.CustomerId, SUM(o.TotalAmount)\nFROM dbo.Orders o\nGROUP BY o.CustomerId, o.OrderDate\nHAVING o.OrderDate >= '2024-01-01';",
    "redFlags": [
      "Trying to use aggregates in WHERE like 'WHERE COUNT(OrderId) > 5' (syntax error).",
      "Filtering unaggregated columns in HAVING instead of WHERE, forcing unnecessary row aggregation.",
      "Not knowing the logical order of query processing operations."
    ],
    "proTips": [
      "Remember the query processing mnemonic: 'Fresh Wind Gives Heavy Scented Daisies Open' -> FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY."
    ]
  },
  {
    "id": "q-sql-3",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Window Functions",
      "GROUP BY",
      "Ranking",
      "Analytics"
    ],
    "title": "How do Window Functions differ from GROUP BY, and when do you use ROW_NUMBER vs DENSE_RANK vs RANK?",
    "pitch": "GROUP BY collapses multiple rows into a single summary row per group. Window functions (OVER clause) calculate aggregates or rankings across a partitioned window of rows while preserving each individual row's identity and detail columns. Among ranking functions: ROW_NUMBER assigns unique sequential integers (1,2,3,4) regardless of ties; RANK skips numbers on ties (1,2,2,4); and DENSE_RANK does not skip numbers on ties (1,2,2,3).",
    "analogy": "GROUP BY replaces every row in a department with one manager report stating '5 employees, average salary $100k'. A Window Function leaves every employee seated at their desk, but tapes a sticker to their computer showing their rank and the department average salary next to their individual name.",
    "deepDive": "Ranking Function Tie-Break Mechanics:\nGiven salaries: [100k, 90k, 90k, 80k]:\n- ROW_NUMBER(): 1, 2, 3, 4 (Deterministic only if secondary ORDER BY key provided).\n- RANK(): 1, 2, 2, 4 (Leaves a gap because 2 people tied for 2nd place).\n- DENSE_RANK(): 1, 2, 2, 3 (No gap; next highest gets the consecutive rank).\n\nCore Use Cases:\n1. De-duplication: Delete duplicates keeping the newest row ('WHERE RowNum = 1').\n2. Top-N per Group: Top 3 highest earning employees in each department.\n3. Running Totals: 'SUM(Amount) OVER (PARTITION BY CustomerId ORDER BY OrderDate ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)'.",
    "codeSnippet": "-- 1. Top 2 highest-paid employees per department using DENSE_RANK\nWITH RankedEmployees AS (\n    SELECT \n        EmployeeId,\n        DepartmentId,\n        Salary,\n        ROW_NUMBER() OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS RowNum,\n        RANK()       OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS RankVal,\n        DENSE_RANK() OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS DenseRankVal\n    FROM dbo.Employees\n)\nSELECT EmployeeId, DepartmentId, Salary, DenseRankVal\nFROM RankedEmployees\nWHERE DenseRankVal <= 2;\n\n-- 2. Safe deduplication pattern\nWITH DuplicateRecords AS (\n    SELECT \n        Id,\n        Email,\n        ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedDate DESC) AS rn\n    FROM dbo.Users\n)\nDELETE FROM DuplicateRecords WHERE rn > 1;",
    "redFlags": [
      "Using GROUP BY when individual row details still need to be returned alongside aggregates.",
      "Confusing RANK() and DENSE_RANK() and getting missing rank numbers or unexpected duplicates in Top-N queries.",
      "Trying to put a window function directly in the WHERE clause (Must wrap in a CTE or subquery)."
    ],
    "proTips": [
      "Window functions cannot be placed directly in WHERE or HAVING clauses because WHERE is evaluated in Step 2, long before Step 5 (Window/SELECT). Always wrap in a CTE or subquery to filter on 'rn = 1'."
    ]
  },
  {
    "id": "q-sql-4",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Indexes",
      "Clustered Index",
      "Nonclustered Index",
      "B-Tree"
    ],
    "title": "What is the difference between a Clustered Index and a Nonclustered Index?",
    "pitch": "A Clustered Index physically determines the storage order of the actual table data rows on disk; therefore, a table can only have one clustered index (usually the Primary Key). The leaf level of a clustered index IS the table data. A Nonclustered Index is a separate B-tree structure that stores indexed key columns plus a row locator (pointer or clustering key) pointing back to the actual data row. A table can have many nonclustered indexes.",
    "analogy": "A phone book is a Clustered Index (entries are physically sorted alphabetically by last name from page 1 to the end). The index at the back of a textbook is a Nonclustered Index (topics sorted alphabetically, each with a page number pointing to where the full text lives).",
    "deepDive": "Storage Architecture:\n1. Heap: A table without a clustered index. Rows are stored in arbitrary order across 8KB data pages.\n2. Clustered Index B-Tree:\n   - Root and intermediate pages contain index navigation keys.\n   - Leaf pages contain the actual table rows (all columns).\n   - Ideal clustered key: Unique, narrow (e.g. INT/BIGINT), static (never updated), and sequential (e.g. IDENTITY) to avoid B-Tree page splits.\n3. Nonclustered Index B-Tree:\n   - Leaf level contains indexed columns + the Clustering Key (Row Locator).\n   - If a query requests columns not present in the nonclustered index, SQL Server must execute a 'Key Lookup' back into the clustered index, incurring random I/O.",
    "codeSnippet": "-- 1. Clustered Index (Typically created automatically by PRIMARY KEY constraint)\nCREATE TABLE dbo.Orders (\n    OrderId INT IDENTITY(1,1) NOT NULL,\n    CustomerId INT NOT NULL,\n    OrderDate DATETIME2 NOT NULL,\n    TotalAmount DECIMAL(18,2) NOT NULL,\n    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderId)\n);\n\n-- 2. Nonclustered Index on Foreign Key\nCREATE NONCLUSTERED INDEX IX_Orders_CustomerId\nON dbo.Orders (CustomerId);\n\n-- 3. Composite Nonclustered Index with Sort Order\nCREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate\nON dbo.Orders (CustomerId ASC, OrderDate DESC);",
    "redFlags": [
      "Putting a clustered index on a non-sequential GUID (GUID page splits fragment physical disk pages).",
      "Believing a table can have multiple clustered indexes.",
      "Creating dozens of nonclustered indexes without considering the overhead on INSERT, UPDATE, and DELETE operations."
    ],
    "proTips": [
      "If you use GUIDs as primary keys, use 'NEWSEQUENTIALID()' instead of 'NEWID()', or keep the primary key as a nonclustered GUID and cluster on an internal sequential BIGINT IDENTITY column to prevent devastating B-Tree page splitting."
    ]
  },
  {
    "id": "q-sql-5",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Covering Index",
      "INCLUDE",
      "Key Lookup",
      "Performance Optimization"
    ],
    "title": "What is a Covering Index and how do INCLUDE columns prevent Key Lookups?",
    "pitch": "A Covering Index contains all columns requested by a specific query in its B-tree structure, allowing SQL Server to fulfill the entire query directly from index pages without touching the underlying table data. By using the INCLUDE clause, non-key columns are stored only at the leaf level of the nonclustered index. This satisfies SELECT queries while keeping the intermediate index tree levels narrow and fast without the 900-byte index key width limitation.",
    "analogy": "Carrying a cheat sheet with your friend's name, phone number, and address into a call. If you need their address, it is already on the cheat sheet (Covering Index). If the cheat sheet only had names and phone numbers, you'd have to drive to their house just to look up their address (Key Lookup).",
    "deepDive": "Key Lookup Elimination Mechanics:\n1. When a query filters by CustomerId and selects OrderDate and TotalAmount:\n   - With IX(CustomerId): SQL searches IX for matching CustomerIds, then performs a 'Key Lookup' into the Clustered Index for each row to fetch TotalAmount.\n   - If 10,000 rows match, that is 10,000 random I/O seek operations!\n2. The Fix - Covering Index:\n   - 'CREATE NONCLUSTERED INDEX IX_Orders_Cust ON dbo.Orders(CustomerId) INCLUDE (OrderDate, TotalAmount);'\n   - SQL Server seeks the CustomerId in the B-Tree and reads OrderDate and TotalAmount directly from the leaf node.\n   - Execution plan changes from 'Index Seek + Key Lookup + Nested Loops' (costly) to pure 'Index Seek' (near-zero I/O).\n3. INCLUDE vs Composite Key:\n   - Key columns participate in B-Tree sorting and affect tree depth and size (limit 1,700 bytes in modern SQL Server).\n   - INCLUDE columns reside ONLY on leaf pages, allowing columns like VARCHAR(MAX) (or large text) without bloating intermediate branch nodes.",
    "codeSnippet": "-- ❌ Uncovered Query: Generates expensive Key Lookup if IX only has CustomerId\n-- SELECT CustomerId, OrderDate, TotalAmount FROM dbo.Orders WHERE CustomerId = @CustId;\n\n-- ✅ PERFECT COVERING INDEX:\nCREATE NONCLUSTERED INDEX IX_Orders_CustomerId_Covering\nON dbo.Orders (CustomerId)\nINCLUDE (OrderDate, TotalAmount, Status);\n\n-- Now this query is 100% COVERED:\nSELECT CustomerId, OrderDate, TotalAmount, Status\nFROM dbo.Orders\nWHERE CustomerId = 1042;\n-- In Execution Plan: 100% Index Seek, 0 Key Lookups, 0 Table Scans!",
    "redFlags": [
      "Adding every single column to the index key columns instead of using INCLUDE.",
      "Leaving Key Lookups inside high-frequency OLTP queries where thousands of rows are touched per second.",
      "Over-indexing every query by including 20+ columns, causing massive storage inflation and slow INSERT/UPDATE writes."
    ],
    "proTips": [
      "Look at SQL Server execution plans for thick arrow lines going into a 'Key Lookup (Clustered)' with a high cost percentage. Add the missing output columns to the INCLUDE list of the seeking index to eliminate the lookup instantly."
    ]
  },
  {
    "id": "q-sql-6",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "SARGable",
      "Indexes",
      "Index Scan",
      "Performance"
    ],
    "title": "What does SARGable mean, and why does wrapping columns in functions destroy index utilization?",
    "pitch": "SARGable stands for 'Search Argument Able'. A query predicate is SARGable when SQL Server can utilize an Index Seek along the B-Tree rather than having to scan the entire index or table. Wrapping an indexed column inside a scalar function like WHERE YEAR(OrderDate) = 2024 or WHERE LEFT(LastName, 3) = 'SMI' is non-SARGable; SQL Server cannot evaluate the index's sorted order and must execute the function against every single row in the table (Index Scan).",
    "analogy": "Looking for 'Smith' in a telephone book: SARGable is flipping directly to the 'S-m-i' page (Index Seek). Non-SARGable is hiring someone to read every single name in the entire book and check 'Does the 3rd letter match 'i'?' (Full Scan).",
    "deepDive": "Common Non-SARGable Culprits & SARGable Rewrites:\n1. Date Functions:\n   - Non-SARGable: WHERE YEAR(OrderDate) = 2024 (Scans 100% of rows).\n   - SARGable: WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01' (Seeks exact B-Tree range).\n2. String Concatenation & Substrings:\n   - Non-SARGable: WHERE FirstName + ' ' + LastName = 'John Doe'\n   - SARGable: WHERE FirstName = 'John' AND LastName = 'Doe'\n3. Implicit Data Type Conversion:\n   - Comparing a VARCHAR column to an NVARCHAR parameter ('@nvcVar') causes SQL Server to execute CONVERT_IMPLICIT on the column, disabling index seek!\n4. Leading Wildcards:\n   - Non-SARGable: WHERE Email LIKE '%@gmail.com' (Cannot seek start of string).\n   - SARGable: WHERE Email LIKE 'john%' (Can seek the prefix).",
    "codeSnippet": "-- ❌ NON-SARGABLE: SQL Server must run YEAR() on 10,000,000 rows (Index Scan)\nSELECT OrderId, CustomerId, TotalAmount\nFROM dbo.Orders\nWHERE YEAR(OrderDate) = 2024;\n\n-- ✅ SARGABLE REWRITE: Direct Index Seek over closed-open date boundary\nSELECT OrderId, CustomerId, TotalAmount\nFROM dbo.Orders\nWHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';\n\n-- ❌ NON-SARGABLE: ISNULL / COALESCE on column\nSELECT Id FROM dbo.Customers WHERE ISNULL(Status, 0) = 0;\n\n-- ✅ SARGABLE REWRITE:\nSELECT Id FROM dbo.Customers WHERE Status = 0 OR Status IS NULL;",
    "redFlags": [
      "Using functions on column names in WHERE or JOIN conditions (e.g. DATEDIFF, UPPER, SUBSTRING).",
      "Using implicit type conversion (passing string to integer column or nvarchar parameter to varchar column).",
      "Using '%search%' leading wildcard searches on large tables without Full-Text Indexing."
    ],
    "proTips": [
      "In EF Core, writing 'where o.OrderDate.Year == 2024' translates to non-SARGable 'DATEPART(year, ...)' in older versions. Always use date ranges 'o.OrderDate >= startDate && o.OrderDate < endDate' to guarantee SARGable index seeks."
    ]
  },
  {
    "id": "q-sql-7",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Execution Plan",
      "Performance Tuning",
      "Index Seek",
      "Table Scan"
    ],
    "title": "How do you read a SQL Server Execution Plan to diagnose query performance?",
    "pitch": "You read an Execution Plan from right-to-left and top-to-bottom, following the data stream arrows. Thick arrows indicate high row counts. Key operators to look for include: Table Scan (scanning unindexed heap), Clustered Index Scan (reading every row of the table), Index Seek (optimal B-tree key navigation), Key Lookup (fetching missing columns from clustered index), and Sort / Hash Match (high-memory operations). You also compare 'Actual Number of Rows' with 'Estimated Number of Rows' to spot stale statistics.",
    "analogy": "Reading a factory assembly line blueprint from the loading dock (right) to the shipping warehouse (left). If you see a forklift carrying 10 million parts when the blueprint estimated 1 part, you immediately found where the bottleneck is.",
    "deepDive": "Step-by-Step Execution Plan Audit:\n1. Operator Hierarchy:\n   - Index Seek (Good): B-Tree traversal directly to target rows.\n   - Index Scan (Warning): Read every leaf page of an index.\n   - Table Scan (Critical): Table has no clustered index and must scan all pages.\n   - Key Lookup (Warning): Missing columns in nonclustered index; causes random I/O per row.\n2. Join Operators:\n   - Nested Loops: Great for small outer set seeking into indexed inner set.\n   - Merge Join: Extremely fast if both inputs are pre-sorted on join key.\n   - Hash Match: High memory consumption; used for large unsorted sets.\n3. Statistics Health Check:\n   - Hover over operators: Check 'Estimated Number of Rows' vs 'Actual Number of Rows'.\n   - A 10x or 1000x disparity indicates stale table statistics, causing the query optimizer to pick terrible join strategies.\n4. Warning Icons:\n   - Yellow exclamation mark on operators indicates implicit conversions, tempdb spilling, or missing index recommendations.",
    "codeSnippet": "-- Display Actual Execution Plan in SSMS: Press Ctrl + M before executing\nSET STATISTICS IO, TIME ON;\n\nSELECT o.OrderId, o.OrderDate, c.CompanyName\nFROM dbo.Orders o\nINNER JOIN dbo.Customers c ON o.CustomerId = c.CustomerId\nWHERE o.OrderDate >= '2024-01-01';\n\nSET STATISTICS IO, TIME OFF;\n\n-- Output in Messages Tab shows logical reads:\n-- Table 'Orders'. Scan count 1, logical reads 34...\n-- Table 'Customers'. Scan count 1, logical reads 6...\n-- Goal: Minimize logical reads! Every 8KB read saved = faster queries.",
    "redFlags": [
      "Relying solely on query execution time instead of checking 'Logical Reads' via 'STATISTICS IO'.",
      "Ignoring yellow warning triangles on SELECT nodes (which signal cardinality estimate errors or missing indexes).",
      "Accepting SSMS 'Missing Index' recommendations blindly without evaluating existing overlapping indexes."
    ],
    "proTips": [
      "Always look for 'Tempdb Spills' (Sort Warnings or Hash Warnings). When SQL Server drastically underestimates row counts, it allocates too little memory workspace; the sort spills to tempdb disk, multiplying query latency by 100x."
    ]
  },
  {
    "id": "q-sql-8",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Stored Procedures",
      "EF Core",
      "Architecture",
      "Trade-offs"
    ],
    "title": "When should you use Stored Procedures vs EF Core / ORM, and how do they compare?",
    "pitch": "EF Core is ideal for standard OLTP operations, rapid feature delivery, compile-time type safety, automated database migrations, and clean domain modeling. Stored Procedures are superior for complex batch transformations, high-security environments requiring zero direct table permissions, heavy reporting aggregations where raw SQL tuning is paramount, and reducing cross-network round-trips for multi-step transactional procedures.",
    "analogy": "EF Core is an Uber ride: effortless, standardized, and handles the driving for your everyday commutes. A Stored Procedure is a specialized cargo freight train: requires track maintenance and specialized operators, but moves massive tonnage across the system far more efficiently.",
    "deepDive": "Comparative Architectural Matrix:\n1. EF Core Advantages:\n   - Strong typing, compile-time verification with LINQ.\n   - Change Tracking & Unit of Work pattern out of the box.\n   - Cross-database flexibility and automated schema migrations.\n   - Fast developer velocity for standard CRUD.\n2. Stored Procedure Advantages:\n   - Network Efficiency: Multi-step calculations run directly on the database engine; zero payload transfer between server and DB until final output.\n   - Security: DB users can be granted EXECUTE permissions on procedures without granting SELECT/UPDATE on raw tables.\n   - Fine-Tuned Query Plans: Ability to use query hints (FORCESEEK, RECOMPILE, OPTION(MAXDOP)).\n3. Modern Senior Consensus (Hybrid Architecture):\n   - 90% of business domain logic and CRUD lives in ASP.NET Core via EF Core / Dapper.\n   - 10% high-throughput bulk processing, financial reconciliations, and nightly batch jobs live in Stored Procedures.",
    "codeSnippet": "-- Calling Stored Procedure from EF Core safely\npublic async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year, CancellationToken ct)\n{\n    var yearParam = new SqlParameter(\"@Year\", year);\n\n    // ✅ Strongly typed mapping using EF Core's SqlQuery\n    return await _context.Database\n        .SqlQueryRaw<MonthlyRevenueDto>(\n            \"EXEC dbo.usp_GetMonthlyRevenueReport @Year\", \n            yearParam)\n        .ToListAsync(ct);\n}\n\n-- Stored Procedure Definition:\nCREATE PROCEDURE dbo.usp_GetMonthlyRevenueReport\n    @Year INT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    \n    SELECT \n        MONTH(OrderDate) AS [Month],\n        COUNT(OrderId) AS TotalOrders,\n        SUM(TotalAmount) AS TotalRevenue\n    FROM dbo.Orders\n    WHERE YEAR(OrderDate) = @Year\n    GROUP BY MONTH(OrderDate)\n    ORDER BY [Month];\nEND;",
    "redFlags": [
      "Claiming 'Stored procedures are always faster because they are precompiled' (SQL Server caches execution plans for parameterized queries identically).",
      "Embedding all business domain validation rules in stored procedures, making unit testing impossible without live DB instances.",
      "String-concatenating user input into dynamic SQL inside a stored procedure."
    ],
    "proTips": [
      "Always specify 'SET NOCOUNT ON;' at the start of every Stored Procedure to suppress the 'X rows affected' wire messages sent to the client after every INSERT/UPDATE statement."
    ]
  },
  {
    "id": "q-sql-9",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "SQL",
      "Parameter Sniffing",
      "Execution Plan",
      "Performance Tuning"
    ],
    "title": "What is Parameter Sniffing in SQL Server, how do you detect it, and how do you fix it?",
    "pitch": "Parameter Sniffing occurs when SQL Server compiles and caches an execution plan based on the specific parameter values passed on the very first execution of a stored procedure. If the first run passes an atypical or rare value (e.g. a tenant with 1 row vs a tenant with 5,000,000 rows), the optimizer chooses a plan tailored to that value (e.g. Index Seek + Key Lookup instead of Table Scan). Subsequent executions with typical parameters are forced to use the suboptimal cached plan, causing severe performance degradation.",
    "analogy": "A tailor makes clothes for an entire basketball team based solely on measurements taken from the 5-foot-2 team mascot because he walked into the shop first. Now none of the 6-foot-8 players can fit into their uniforms.",
    "deepDive": "Diagnostic and Resolution Workflow:\n1. How to Identify:\n   - Procedure runs instantly in SSMS with local variables ('DECLARE @Id INT = 5') but times out when called from the application with parameters.\n   - Execution plan properties show a massive difference between 'Parameter Compiled Value' and 'Parameter Runtime Value'.\n2. Remediation Options:\n   - OPTION (RECOMPILE): Optimizer creates a fresh plan on every execution. Ideal if procedure is called infrequently or parameter variability is high.\n   - OPTION (OPTIMIZE FOR (@Param = <Value>)): Tells the optimizer to build a plan tailored to the typical average distribution.\n   - Local Variable Copy: Copying parameter to local variable ('DECLARE @LocalId INT = @Id') prevents the optimizer from sniffing the parameter at compile time (uses average density statistics).\n   - SQL Server 2022 Parameter Sensitive Plan (PSP) Optimization: Automatically caches multiple plans for different parameter sizes.",
    "codeSnippet": "-- ❌ VULNERABLE: Caches plan based on first execution\nCREATE PROCEDURE dbo.GetOrdersByStatus\n    @Status INT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    SELECT OrderId, CustomerId, TotalAmount \n    FROM dbo.Orders \n    WHERE Status = @Status;\nEND;\n\n-- ✅ FIX 1: Use OPTION (RECOMPILE) for uneven distribution (e.g. Status=1 has 10 rows, Status=2 has 5M)\nCREATE PROCEDURE dbo.GetOrdersByStatus_Recompile\n    @Status INT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    SELECT OrderId, CustomerId, TotalAmount \n    FROM dbo.Orders \n    WHERE Status = @Status\n    OPTION (RECOMPILE);\nEND;\n\n-- ✅ FIX 2: OPTIMIZE FOR UNKNOWN (Uses general density statistics)\nCREATE PROCEDURE dbo.GetOrdersByStatus_OptimizeUnknown\n    @Status INT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    SELECT OrderId, CustomerId, TotalAmount \n    FROM dbo.Orders \n    WHERE Status = @Status\n    OPTION (OPTIMIZE FOR (@Status UNKNOWN));\nEND;",
    "redFlags": [
      "Assuming a stored procedure that suddenly becomes slow must have an index corruption problem instead of checking parameter sniffing.",
      "Placing OPTION (RECOMPILE) on a stored procedure called 5,000 times per second (causing severe CPU pressure from compilation).",
      "Restarting SQL Server or clearing the entire procedure cache ('DBCC FREEPROCCACHE') in production as a permanent fix."
    ],
    "proTips": [
      "Check SQL Server query plan XML for the tags '<ParameterList>' -> '<ColumnReference ParameterCompiledValue=\"...\" ParameterRuntimeValue=\"...\" />'. If Compiled is '1' and Runtime is '500,000', parameter sniffing is confirmed."
    ]
  },
  {
    "id": "q-sql-10",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "ACID",
      "Transactions",
      "Isolation Levels",
      "Concurrency"
    ],
    "title": "What are ACID properties and how do SQL Server Transaction Isolation Levels balance consistency vs concurrency?",
    "pitch": "ACID guarantees database reliability: Atomicity (all or nothing), Consistency (preserves schema/business invariants), Isolation (concurrent transactions do not interfere), and Durability (committed data survives server crashes). SQL Server provides isolation levels with increasing protection: READ UNCOMMITTED (allows dirty reads), READ COMMITTED (default, prevents dirty reads), REPEATABLE READ (prevents non-repeatable reads), SERIALIZABLE (prevents phantom reads via range locks), and SNAPSHOT (optimistic row-versioning in tempdb).",
    "analogy": "Atomicity is buying a flight and hotel together—if the hotel fails, your flight is refunded. Durability is an airplane black box that survives a crash. Isolation is taking a private test where no other student can see or edit your test sheet while you are writing.",
    "deepDive": "Concurrency Phenomena & Isolation Levels:\n1. Concurrency Anomalies:\n   - Dirty Read: Reading uncommitted, rollback-prone data from another transaction.\n   - Non-Repeatable Read: Re-reading the same row within a transaction and finding modified data because another transaction committed an UPDATE.\n   - Phantom Read: Re-executing a range query and finding newly inserted rows committed by another transaction.\n2. Isolation Levels Matrix:\n   - Read Uncommitted: Dirty Reads YES, Non-Repeatable YES, Phantoms YES (Zero shared locks).\n   - Read Committed: Dirty Reads NO, Non-Repeatable YES, Phantoms YES.\n   - Repeatable Read: Dirty Reads NO, Non-Repeatable NO, Phantoms YES (Holds shared locks till end).\n   - Serializable: Dirty Reads NO, Non-Repeatable NO, Phantoms NO (Key-range locks).\n   - Read Committed Snapshot Isolation (RCSI): Readers do not block writers, writers do not block readers! Uses row versioning in tempdb.",
    "codeSnippet": "-- 1. Enabling Read Committed Snapshot Isolation (RCSI) at database level\n-- Highly recommended for modern high-concurrency ASP.NET Core apps:\nALTER DATABASE CurrentDatabase\nSET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;\n\n-- 2. Explicit Transaction with Isolation Level\nSET TRANSACTION ISOLATION LEVEL SNAPSHOT;\n\nBEGIN TRANSACTION;\nBEGIN TRY\n    UPDATE dbo.Accounts SET Balance = Balance - 100 WHERE AccountId = 1;\n    UPDATE dbo.Accounts SET Balance = Balance + 100 WHERE AccountId = 2;\n    \n    COMMIT TRANSACTION;\nEND TRY\nBEGIN CATCH\n    IF @@TRANCOUNT > 0\n        ROLLBACK TRANSACTION;\n    THROW;\nEND CATCH;",
    "redFlags": [
      "Using 'WITH (NOLOCK)' on every SELECT query as a lazy fix for blocking, resulting in dirty reads and duplicated/skipped rows.",
      "Leaving transactions open across external HTTP API calls or user think time.",
      "Not checking '@@TRANCOUNT > 0' before issuing a ROLLBACK TRANSACTION inside a CATCH block."
    ],
    "proTips": [
      "Enable RCSI (Read Committed Snapshot Isolation) on your SQL Server database. It eliminates read-write blocking by serving row versions from tempdb without modifying your C# application code or adding NOLOCK hints."
    ]
  },
  {
    "id": "q-sql-11",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "SQL",
      "Deadlocks",
      "Concurrency",
      "Locking",
      "Troubleshooting"
    ],
    "title": "What causes Deadlocks in SQL Server, and how do you diagnose and prevent them?",
    "pitch": "A deadlock occurs when two or more transactions hold exclusive locks on resources the other transaction needs to proceed, creating a cyclic dependency where neither can continue. SQL Server automatically detects deadlocks within seconds, chooses the transaction with the lowest rollback cost as the 'Deadlock Victim', and kills it with Error 1205. Deadlocks are diagnosed using Extended Events or Deadlock Graphs and prevented by accessing tables in identical order, keeping transactions brief, and using appropriate indexing.",
    "analogy": "Two cars enter a one-lane bridge from opposite sides: Car A won't reverse until Car B moves, and Car B won't reverse until Car A moves. The bridge controller (SQL Server) steps in and tows Car A away so Car B can pass.",
    "deepDive": "Root Causes & Remediation Strategies:\n1. Opposite Object Access Order:\n   - Tx 1 updates Table A then Table B.\n   - Tx 2 updates Table B then Table A.\n   - Resolution: Standardize access order across all codebase stored procedures and services (Always Table A -> Table B).\n2. Missing Indexes causing Lock Escalation:\n   - An UPDATE lacking a covering index escalates from row-level locks to page or table locks, colliding with concurrent reads.\n3. Long-Running Transactions:\n   - Transactions wrapping external HTTP calls, email sending, or heavy processing keep exclusive (X) locks open far too long.\n4. How to Capture:\n   - Extended Events session 'system_health' captures all xml_deadlock_report events by default.\n   - In C#, implement Polly exponential backoff retries on SqlException with Number 1205.",
    "codeSnippet": "-- Capture Deadlock Graph from system_health session:\nSELECT \n    XEvent.value('(event/@timestamp)[1]', 'datetime2') AS [Timestamp],\n    XEvent.query('(event/data[@name=\"xml_report\"]/value/deadlock)[1]') AS DeadlockGraph\nFROM (\n    SELECT CAST(target_data AS XML) AS TargetData\n    FROM sys.dm_xe_session_targets st\n    JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address\n    WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'\n) AS Data\nCROSS APPLY TargetData.nodes('RingBufferTarget/event[@name=\"xml_deadlock_report\"]') AS XEventData(XEvent);\n\n-- C# Polly Deadlock Retry Policy\nvar deadlockPolicy = Policy\n    .Handle<SqlException>(ex => ex.Number == 1205) // SQL Server Deadlock Error Code\n    .WaitAndRetryAsync(3, retryAttempt => \n        TimeSpan.FromMilliseconds(50 * Math.Pow(2, retryAttempt)));",
    "redFlags": [
      "Assuming deadlocks are purely a database DBA problem rather than application-layer code ordering issues.",
      "Not catching SQL Error 1205 in C# microservices to provide graceful automatic retries.",
      "Setting transaction isolation level to SERIALIZABLE everywhere, which dramatically increases lock contention and deadlocks."
    ],
    "proTips": [
      "In the XML Deadlock Graph, look for the 'victim-list' and 'resource-list'. Pay special attention to 'inputbuf'—it reveals the exact SQL statement or stored procedure executed by each colliding transaction."
    ]
  },
  {
    "id": "q-sql-12",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "SQL",
      "sp_getapplock",
      "Distributed Lock",
      "Concurrency",
      "Synchronization"
    ],
    "title": "How and when do you use sp_getapplock for application-level distributed locking?",
    "pitch": "sp_getapplock is a built-in SQL Server stored procedure that lets applications acquire custom named locks using SQL Server's enterprise lock manager. It allows you to synchronize distributed processes or prevent duplicate concurrent executions across multiple web server instances without creating custom lock tables or managing external lock stores like Redis. Locks can be bound to the lifetime of a transaction or an explicit database session.",
    "analogy": "Borrowing the conference room key from the front desk concierge. Even if 10 different employees from different offices rush to use the room at the exact same second, only the person with the physical key gets in; the rest wait outside until it is returned.",
    "deepDive": "Mechanics of sp_getapplock:\n1. Syntax & Parameters:\n   - 'sp_getapplock [@Resource =] 'LockName', [@LockMode =] 'Exclusive', [@LockOwner =] 'Transaction' | 'Session', [@LockTimeout =] milliseconds'\n2. Return Values:\n   - 0: Lock acquired synchronously.\n   - 1: Lock acquired after waiting.\n   - -1: Lock request timed out.\n   - -2: Lock request canceled.\n   - -3: Lock request was chosen as deadlock victim.\n3. Why Not Custom Lock Tables?\n   - Custom lock tables ('UPDATE LockTable SET IsLocked = 1') require manual cleanup if a server crashes midway, risking permanent deadlocks.\n   - SQL Server automatically releases 'Transaction' or 'Session' applocks immediately if the connection drops or server restarts!",
    "codeSnippet": "-- Thread-safe payment or invoice generation across 10 API instances\nCREATE PROCEDURE dbo.usp_ProcessMonthlyBilling\n    @TenantId INT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    DECLARE @LockResource VARCHAR(100) = 'BillingLock_Tenant_' + CAST(@TenantId AS VARCHAR(10));\n    DECLARE @Result INT;\n\n    BEGIN TRANSACTION;\n\n    -- Acquire exclusive lock for this tenant with 5-second timeout\n    EXEC @Result = sp_getapplock \n        @Resource = @LockResource,\n        @LockMode = 'Exclusive',\n        @LockOwner = 'Transaction',\n        @LockTimeout = 5000;\n\n    IF @Result < 0\n    BEGIN\n        ROLLBACK TRANSACTION;\n        THROW 50001, 'Unable to acquire billing lock. Another billing run is in progress.', 1;\n    END;\n\n    -- CRITICAL SECTION: Safe from concurrent duplicate billing runs\n    -- Execute complex billing queries here...\n\n    -- Lock is automatically released upon COMMIT or ROLLBACK\n    COMMIT TRANSACTION;\nEND;",
    "redFlags": [
      "Using session-level locks ('Session') without calling 'sp_releaseapplock', leaking locks in connection pools.",
      "Setting LockTimeout to indefinitely wait without monitoring potential queue pileups.",
      "Creating physical database tables with boolean flags to handle distributed locking instead of using sp_getapplock."
    ],
    "proTips": [
      "For .NET microservices that already use SQL Server, 'sp_getapplock' gives you rock-solid distributed locking across all ECS/Kubernetes pods for free, eliminating the operational overhead of deploying and clustering Redis Redlock."
    ]
  },
  {
    "id": "q-sql-13",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Pagination",
      "OFFSET FETCH",
      "Performance",
      "Query Optimization"
    ],
    "title": "How do you implement high-performance pagination in SQL Server, and why is OFFSET / FETCH better than subqueries?",
    "pitch": "Modern SQL Server uses the ANSI-standard OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY clause, which requires an explicit ORDER BY clause. For deep pagination (e.g. page 10,000), OFFSET/FETCH can degrade because SQL Server must still traverse and discard all preceding 100,000 rows. In massive datasets, Keyset Pagination (Seek Pagination / 'WHERE Id > @LastSeenId') delivers constant O(1) time complexity by seeking directly off the clustered or covered index.",
    "analogy": "Reading a 1,000-page book: OFFSET 500 requires flipping through and counting the first 500 pages one by one before reading. Keyset pagination is using a bookmark: you open directly to page 501 in one motion.",
    "deepDive": "Pagination Paradigms:\n1. OFFSET / FETCH NEXT:\n   - Clean, standard, and translates directly from EF Core's '.Skip(x).Take(y)'.\n   - Cost increases linearly: Page 1 reads 20 rows; Page 10,000 reads 200,020 rows and discards 200,000.\n2. Keyset Pagination (Keyset / Seek Method):\n   - Client sends the last seen value: 'WHERE (CreatedDate < @LastDate) OR (CreatedDate = @LastDate AND Id < @LastId) ORDER BY CreatedDate DESC, Id DESC'.\n   - Direct B-Tree Index Seek regardless of whether you are on item 10 or item 10,000,000.\n   - Prevents 'missed row' or 'duplicated row' anomalies when new records are inserted while users navigate pages.",
    "codeSnippet": "-- 1. Standard OFFSET / FETCH (EF Core Skip/Take translation)\nDECLARE @PageNumber INT = 3;\nDECLARE @PageSize INT = 20;\n\nSELECT OrderId, CustomerId, OrderDate, TotalAmount\nFROM dbo.Orders\nORDER BY OrderDate DESC, OrderId DESC\nOFFSET (@PageNumber - 1) * @PageSize ROWS\nFETCH NEXT @PageSize ROWS ONLY;\n\n-- 2. High-Scale Keyset Pagination (Constant O(1) performance at any depth)\nDECLARE @LastSeenDate DATETIME2 = '2024-05-15 14:22:10';\nDECLARE @LastSeenId INT = 89452;\n\nSELECT TOP (20) OrderId, CustomerId, OrderDate, TotalAmount\nFROM dbo.Orders\nWHERE (OrderDate < @LastSeenDate)\n   OR (OrderDate = @LastSeenDate AND OrderId < @LastSeenId)\nORDER BY OrderDate DESC, OrderId DESC;",
    "redFlags": [
      "Using OFFSET / FETCH without a deterministic, tie-breaking ORDER BY (e.g. ordering only by non-unique OrderDate causes random row jumping between pages).",
      "Using legacy ROW_NUMBER() subquery pagination in modern SQL Server 2012+ projects.",
      "Performing in-memory pagination by loading all 50,000 records to the C# web server and running LINQ '.Skip().Take()'."
    ],
    "proTips": [
      "Always include a unique tie-breaker column (such as the Primary Key 'OrderId') at the end of your ORDER BY clause. Without it, SQL Server does not guarantee row stability across consecutive page queries if two rows share the exact same timestamp."
    ]
  },
  {
    "id": "q-sql-14",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "CTE",
      "Temp Tables",
      "Table Variables",
      "Tempdb"
    ],
    "title": "What are the trade-offs between CTEs, Temporary Tables (#temp), and Table Variables (@table)?",
    "pitch": "A CTE is an in-memory syntactic expression that exists only for the duration of a single query; it does not persist data and is re-evaluated every time it is referenced. A Temporary Table (#temp) is a physical table stored in tempdb with full statistics, indexability, and transaction logging—ideal for medium-to-large datasets. A Table Variable (@table) is also stored in tempdb but lacks column statistics (assumed 1 row in older SQL Server) and cannot participate in parallel query plans, making it suitable only for very small sets (< 100 rows).",
    "analogy": "A CTE is a formula written on a whiteboard that you erase when you leave the room. A Table Variable is a sticky note in your pocket. A Temp Table is a full metal filing cabinet brought into your office with folders, dividers, and alphabetical tabs.",
    "deepDive": "Deep Performance Comparison:\n1. Common Table Expression (CTE):\n   - Zero physical storage overhead. Great for recursive queries (organizational hierarchies) and readability.\n   - Gotcha: If referenced multiple times in the same statement, SQL Server evaluates it multiple times! It is NOT a cache.\n2. Temporary Table (#temp):\n   - Physical table in tempdb.\n   - Has full distribution statistics; query optimizer can make highly accurate cost estimations.\n   - Supports creating custom Nonclustered Indexes after population.\n   - Excellent for large intermediate result sets (> 1,000 rows).\n3. Table Variable (@table):\n   - Lives in tempdb (NOT memory-only, despite popular myth!).\n   - Does NOT have column statistics (cardinality estimation defaults to 1 row in SQL Server pre-2019).\n   - Does not allow explicit CREATE INDEX (only PRIMARY KEY / UNIQUE constraints).\n   - Changes are NOT rolled back if the outer transaction rolls back!",
    "codeSnippet": "-- 1. CTE: Great for hierarchical recursion\nWITH OrgChartCTE AS (\n    SELECT EmployeeId, ManagerId, Title, 1 AS Level\n    FROM dbo.Employees WHERE ManagerId IS NULL\n    UNION ALL\n    SELECT e.EmployeeId, e.ManagerId, e.Title, o.Level + 1\n    FROM dbo.Employees e\n    INNER JOIN OrgChartCTE o ON e.ManagerId = o.EmployeeId\n)\nSELECT * FROM OrgChartCTE;\n\n-- 2. Temp Table: Best for heavy intermediate processing\nCREATE TABLE #FilteredOrders (\n    OrderId INT PRIMARY KEY,\n    CustomerId INT,\n    TotalAmount DECIMAL(18,2)\n);\n\nINSERT INTO #FilteredOrders (OrderId, CustomerId, TotalAmount)\nSELECT OrderId, CustomerId, TotalAmount FROM dbo.Orders WHERE OrderDate >= '2024-01-01';\n\n-- Can add dedicated indexes to temp tables!\nCREATE NONCLUSTERED INDEX IX_Temp_Customer ON #FilteredOrders (CustomerId);\n\nSELECT * FROM #FilteredOrders;\nDROP TABLE #FilteredOrders;",
    "redFlags": [
      "Believing Table Variables exist only in RAM (they write to tempdb just like temp tables).",
      "Using Table Variables with 100,000 rows, causing the optimizer to pick terrible 1-row nested loop plans.",
      "Assuming referencing a CTE three times in a query runs the CTE logic once and caches it (it runs 3 separate times)."
    ],
    "proTips": [
      "If you have a complex CTE that is joined multiple times in a query, materialize it into a '#temp' table first. The query optimizer can generate accurate statistics and use indexes, often reducing execution time from minutes to milliseconds."
    ]
  },
  {
    "id": "q-sql-15",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Set-Based",
      "Cursors",
      "WHILE Loops",
      "Query Optimization"
    ],
    "title": "Why are Set-Based operations vastly superior to Cursors and iterative loops in SQL?",
    "pitch": "SQL Server is a relational engine designed mathematically for relational algebra and set theory. Set-based operations process entire datasets simultaneously in bulk, allowing the query optimizer to leverage parallelism, B-tree indexes, vector CPU instructions, and bulk logging. Cursors and WHILE loops operate iteratively (row-by-agonizing-row / RBAR), incurring massive transaction log overhead, repeated context switching, lock escalation, and disabling query parallelism.",
    "analogy": "Moving a truckload of bricks: A Set-Based operation is a forklift lifting an entire pallet of 500 bricks into the truck in one 5-second movement. A Cursor is an individual walking back and forth 500 times, carrying one brick in each hand.",
    "deepDive": "The Cost of RBAR (Row By Agonizing Row):\n1. Lock Overhead: Each fetch in a cursor acquires and releases row locks individually.\n2. Transaction Log Writes: Iterative updates create thousands of separate log records instead of a single bulk transaction entry.\n3. Optimization Prevention: The optimizer cannot build a global execution plan across iterations; it treats each row execution as an isolated step.\n4. When are Cursors acceptable?\n   - Administrative maintenance tasks (e.g. iterating over database names to run DBCC CHECKDB or BACKUP DATABASE).\n   - Calling external stored procedures that cannot accept table-valued parameters.",
    "codeSnippet": "-- ❌ TERRIBLE: Cursor / RBAR updating interest row-by-row\nDECLARE @AccId INT, @Bal DECIMAL(18,2);\nDECLARE cur CURSOR FAST_FORWARD FOR \n    SELECT AccountId, Balance FROM dbo.Accounts WHERE IsActive = 1;\nOPEN cur;\nFETCH NEXT FROM cur INTO @AccId, @Bal;\nWHILE @@FETCH_STATUS = 0\nBEGIN\n    UPDATE dbo.Accounts SET Balance = Balance * 1.05 WHERE AccountId = @AccId;\n    FETCH NEXT FROM cur INTO @AccId, @Bal;\nEND;\nCLOSE cur;\nDEALLOCATE cur;\n\n-- ✅ SET-BASED: Single atomic vectorized statement; 100x-1000x faster!\nUPDATE dbo.Accounts\nSET Balance = Balance * 1.05\nWHERE IsActive = 1;",
    "redFlags": [
      "Using a cursor or WHILE loop to calculate running totals instead of using window functions ('SUM() OVER (...)').",
      "Using cursors to perform bulk data inserts or updates.",
      "Leaving cursors open in production without closing and deallocating them in an error handler."
    ],
    "proTips": [
      "If you find yourself reaching for a cursor to format strings or aggregate child rows, use 'STRING_AGG(ColumnName, \", \")' (SQL Server 2017+) or Set-Based Window Functions instead."
    ]
  },
  {
    "id": "q-sql-16",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Security",
      "SQL Injection",
      "Parameterized Queries",
      "sp_executesql"
    ],
    "title": "How do you prevent SQL Injection, and why is dynamic SQL so dangerous?",
    "pitch": "SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL command string, allowing an attacker to alter the query's syntax and execute arbitrary commands. You prevent SQL Injection by using Parameterized Queries via SqlCommand, EF Core, or sp_executesql. Parameters treat user input strictly as literal values, never as executable SQL tokens, regardless of whether the string contains quotes, semicolons, or DROP statements.",
    "analogy": "Sending money through a drive-through teller tube: A Parameterized Query places the money inside an airtight, sealed capsule that the teller opens safely. SQL Injection is throwing loose paper into the pneumatic pipe where someone slipped in an explosive firecracker disguised as cash.",
    "deepDive": "Vulnerability Vectors & Defenses:\n1. Direct String Concatenation:\n   - 'SELECT * FROM Users WHERE User = '' + userInput + '''\n   - Input: 'admin' --' comments out the password verification.\n2. Dynamic SQL in Stored Procedures:\n   - Stored procedures are NOT automatically immune to SQL injection if they concatenate strings inside 'EXEC(@sql)'.\n   - Secure fix: Use 'sp_executesql' with strongly-typed parameter definitions.\n3. EF Core Safety & Pitfalls:\n   - LINQ queries ('db.Users.Where(u => u.Name == input)') are 100% immune (parameterized by design).\n   - 'FromSqlInterpolated($\"SELECT * FROM Users WHERE Name = {input}\")' is SAFE (EF Core parameterizes interpolated strings).\n   - 'FromSqlRaw(\"SELECT * FROM Users WHERE Name = '\" + input + \"'\")' is VULNERABLE!",
    "codeSnippet": "-- ❌ VULNERABLE Dynamic SQL inside Stored Procedure\nCREATE PROCEDURE dbo.UnsafeSearch @SearchText NVARCHAR(100) AS\nBEGIN\n    DECLARE @sql NVARCHAR(MAX) = 'SELECT * FROM dbo.Products WHERE Name LIKE ''%' + @SearchText + '%''';\n    EXEC(@sql); -- If @SearchText is \"'; DROP TABLE dbo.Products; --\" -> DISASTER!\nEND;\n\n-- ✅ SECURE: sp_executesql with explicit strongly-typed parameter definitions\nCREATE PROCEDURE dbo.SafeSearch @SearchText NVARCHAR(100) AS\nBEGIN\n    DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM dbo.Products WHERE Name LIKE @SearchPattern';\n    DECLARE @pattern NVARCHAR(102) = '%' + @SearchText + '%';\n    \n    EXEC sp_executesql \n        @stmt = @sql,\n        @params = N'@SearchPattern NVARCHAR(102)',\n        @SearchPattern = @pattern;\nEND;",
    "redFlags": [
      "Claiming 'Stored procedures automatically prevent SQL Injection' (Dynamic SQL inside an SP is completely vulnerable).",
      "Using 'FromSqlRaw' with string concatenation in EF Core.",
      "Attempting to sanitize input by stripping out single quotes instead of using parameterized queries."
    ],
    "proTips": [
      "In EF Core 7+, use 'context.Database.SqlQuery<T>()' or 'FromSqlInterpolated()'. If dynamic column sorting is required (which cannot be parameterized), validate the column name against an explicit whitelist of allowed property names before appending it."
    ]
  },
  {
    "id": "q-sql-17",
    "pillar": "sql",
    "seniority": "Senior",
    "tags": [
      "SQL",
      "Performance Tuning",
      "DMVs",
      "Troubleshooting",
      "Production"
    ],
    "title": "How do you systematically diagnose and fix a slow query in a production SQL Server?",
    "pitch": "I follow a systematic 5-step triage process: 1) Measure actual resource consumption (CPU vs I/O vs Duration) using 'SET STATISTICS IO, TIME ON' or DMVs; 2) Inspect the Actual Execution Plan to locate expensive operators, missing indexes, or cardinality misestimates; 3) Check wait statistics to see if the query is CPU-bound (SOS_SCHEDULER_YIELD) or I/O-bound (PAGEIOLATCH); 4) Inspect table statistics and index fragmentation; and 5) Apply targeted fixes—such as rewriting non-SARGable predicates, creating covering indexes with INCLUDE, updating statistics, or using query hints.",
    "analogy": "A doctor examining a sick patient: First check vitals (blood pressure, temperature = wait stats and IO reads), take an X-ray (execution plan), inspect previous lab history (statistics), and then prescribe targeted medication instead of doing random surgery.",
    "deepDive": "The Senior Diagnostic Playbook:\n1. Find the Slow Query:\n   - Query 'sys.dm_exec_query_stats' ordered by 'total_worker_time' (CPU) or 'total_logical_reads' (Disk I/O).\n2. Is it Waiting? Check Wait Types:\n   - 'PAGEIOLATCH_SH': Waiting for disk reads (missing indexes, insufficient RAM / buffer pool pressure).\n   - 'LCK_M_*': Query is being blocked by another uncommitted transaction.\n   - 'CXPACKET': Query is parallelized; often unbalanced work distribution.\n3. Cardinality Estimates:\n   - Compare Actual vs Estimated rows. If off by orders of magnitude, run 'UPDATE STATISTICS TableName WITH FULLSCAN'.\n4. Index Verification:\n   - Eliminate Key Lookups by adding INCLUDE columns to nonclustered indexes.\n   - Remove functions on columns in WHERE clauses to convert scans into seeks.",
    "codeSnippet": "-- Top 5 most resource-intensive queries by Total Logical Reads (I/O)\nSELECT TOP 5\n    qs.total_logical_reads / qs.execution_count AS AvgLogicalReads,\n    qs.total_worker_time / qs.execution_count / 1000 AS AvgCpuMs,\n    qs.total_elapsed_time / qs.execution_count / 1000 AS AvgDurationMs,\n    qs.execution_count,\n    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,\n        ((CASE qs.statement_end_offset\n            WHEN -1 THEN DATALENGTH(qt.text)\n            ELSE qs.statement_end_offset\n        END - qs.statement_start_offset)/2) + 1) AS QueryText,\n    qp.query_plan\nFROM sys.dm_exec_query_stats qs\nCROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt\nCROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp\nORDER BY AvgLogicalReads DESC;",
    "redFlags": [
      "Guessing what is wrong and blindly adding indexes to production without inspecting execution plans.",
      "Tuning queries in SSMS with small test datasets instead of realistic production-sized data distributions.",
      "Assuming slow queries are always caused by missing indexes when blocking or stale statistics are the real culprit."
    ],
    "proTips": [
      "Always query 'sys.dm_os_waiting_tasks' when an active query is hanging in production. It tells you immediately if the query is actively executing or blocked waiting for a lock held by another session ID."
    ]
  },
  {
    "id": "q-sql-18",
    "pillar": "sql",
    "seniority": "Mid-to-Senior",
    "tags": [
      "SQL",
      "Normalization",
      "Denormalization",
      "Database Design",
      "Architecture"
    ],
    "title": "What is Database Normalization (1NF, 2NF, 3NF), and when do you intentionally denormalize?",
    "pitch": "Normalization organizes relational tables to minimize data redundancy and prevent update, insert, and delete anomalies. First Normal Form (1NF) eliminates duplicate columns and ensures atomic values. Second Normal Form (2NF) requires 1NF and ensures all non-key columns depend on the entire primary key. Third Normal Form (3NF) requires 2NF and ensures non-key columns depend only on the primary key (no transitive dependencies). We intentionally denormalize in read-heavy reporting systems, OLAP data warehouses, or high-throughput caches to eliminate expensive multi-table joins.",
    "analogy": "Packing clothes for a trip: Normalization is putting all shirts in one packing cube, pants in another, and shoes in a separate bag so nothing gets crumpled and duplicates are easy to spot. Denormalization is pre-packing complete outfits together in a carry-on so you can grab a full set in 2 seconds without searching 3 different bags.",
    "deepDive": "The Normal Forms Breakdown:\n1. 1NF (Atomic):\n   - No repeating groups or comma-separated lists in a single cell (e.g. 'Phones: 555-1234, 555-5678' violates 1NF).\n   - Must have a primary key.\n2. 2NF (Full Functional Dependency):\n   - Applies to tables with composite primary keys.\n   - Every column must depend on the whole primary key, not just part of it.\n3. 3NF (No Transitive Dependency):\n   - 'Non-key attributes must depend on the key, the whole key, and nothing but the key'.\n   - Example violation: Storing 'ZipCode' and 'State' in the Customers table where State is functionally dependent on ZipCode.\n4. When to Denormalize:\n   - High-throughput read dashboards where joining 8 normalized tables introduces latency.\n   - Storing pre-calculated aggregates (e.g. 'TotalOrderCount', 'CurrentBalance') updated via background events or triggers.",
    "codeSnippet": "-- ❌ Denormalized / Violates 1NF & 3NF:\n-- Comma-separated tags violate 1NF; CategoryName depends on CategoryId (3NF violation)\nCREATE TABLE dbo.UnsafeProducts (\n    ProductId INT PRIMARY KEY,\n    ProductName VARCHAR(100),\n    Tags VARCHAR(255), -- 'tech,laptop,sale' -> ❌ Violates 1NF\n    CategoryId INT,\n    CategoryName VARCHAR(100) -- ❌ Violates 3NF (transitive dependency)\n);\n\n-- ✅ Normalized (3NF Compliant):\nCREATE TABLE dbo.Categories (\n    CategoryId INT PRIMARY KEY,\n    CategoryName VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE dbo.Products (\n    ProductId INT PRIMARY KEY,\n    ProductName VARCHAR(100) NOT NULL,\n    CategoryId INT REFERENCES dbo.Categories(CategoryId)\n);\n\nCREATE TABLE dbo.ProductTags (\n    ProductId INT REFERENCES dbo.Products(ProductId),\n    Tag VARCHAR(50),\n    PRIMARY KEY (ProductId, Tag)\n);",
    "redFlags": [
      "Storing comma-separated strings in database columns to represent collections.",
      "Denormalizing transactional OLTP tables prematurely before measuring actual query performance.",
      "Not having synchronization strategies (like messaging or transactions) when duplicating denormalized data."
    ],
    "proTips": [
      "In transactional systems (OLTP), normalize to 3NF to guarantee absolute data integrity. In read-heavy reporting systems (OLAP / CQRS Read Models), denormalize into flat summary tables or Materialized Views to achieve sub-10ms query times."
    ]
  },
  {
    "id": "q-ui-1",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Props",
      "State",
      "Architecture",
      "Unidirectional Data Flow"
    ],
    "title": "What is the difference between Props and State in React, and how does unidirectional data flow work?",
    "pitch": "Props are read-only inputs passed down from a parent component to a child to configure its appearance and behavior; a child component must never mutate its own props. State is private, internal memory managed within the component itself that changes over time in response to user events or network requests. When state changes, React triggers a re-render of that component and its children along a predictable unidirectional (top-down) data flow.",
    "analogy": "Props are your genetic traits passed down from your parents (eye color, blood type)—you can't change them. State is your current mood or what you're wearing right now—you can change it whenever you want throughout the day.",
    "deepDive": "Architectural Principles:\n1. Immutability:\n   - Props: Frozen; components must act like pure functions with respect to their props.\n   - State: Never mutate directly ('state.count = 5' fails to trigger re-renders). Always use setter functions ('setCount(5)') or reducers.\n2. Unidirectional Data Flow:\n   - Data flows DOWN through props; events/signals flow UP through callback functions.\n   - Prevents cascading circular update loops common in two-way binding frameworks.\n3. Where to place State:\n   - Keep state as local as possible. If two sibling components need access to the same state, 'lift state up' to their closest common ancestor.",
    "codeSnippet": "interface UserCardProps {\n  userId: string;\n  initialRole: string;\n  onRoleChanged: (newRole: string) => void; // Event flowing UP\n}\n\nexport const UserCard: React.FC<UserCardProps> = ({ userId, initialRole, onRoleChanged }) => {\n  // ✅ Private internal component state\n  const [role, setRole] = useState<string>(initialRole);\n\n  const handlePromote = () => {\n    const updated = \"Senior Developer\";\n    setRole(updated);            // Update local state -> re-renders card\n    onRoleChanged(updated);       // Notify parent -> unidirectional flow\n  };\n\n  return (\n    <div className=\"card\">\n      <h3>User: {userId}</h3>\n      <p>Role: {role}</p>\n      <button onClick={handlePromote}>Promote User</button>\n    </div>\n  );\n};",
    "redFlags": [
      "Directly mutating props inside a child component ('props.items.push(newItem)').",
      "Copying every prop into state blindly without understanding derived state.",
      "Mutating state objects directly instead of creating shallow copies ('state.user.name = \"Alice\"')."
    ],
    "proTips": [
      "Avoid redundant state! If a value can be calculated directly from existing props or state on the fly (e.g. 'const fullName = `${firstName} ${lastName}`'), calculate it during render instead of syncing it in state with useEffect."
    ]
  },
  {
    "id": "q-ui-2",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Forms",
      "Controlled Components",
      "Uncontrolled",
      "useRef"
    ],
    "title": "What is the difference between Controlled and Uncontrolled Components in React?",
    "pitch": "A Controlled Component is one where form input data is handled directly by React state; the input's value is driven by the state variable and updated on every keystroke via an onChange handler. An Uncontrolled Component lets the browser DOM maintain the form data internally, and React reads the current value on-demand using a useRef hook. Controlled is preferred in modern React for real-time validation, dynamic disabling, and conditional fields.",
    "analogy": "A Controlled component is a modern digital dashboard where the computer regulates the speed and updates the speedometer readout every millisecond. An Uncontrolled component is a traditional bicycle odometer: it ticks on its own, and you only glance at it when you decide to stop and check your distance.",
    "deepDive": "Trade-Offs & Patterns:\n1. Controlled Components:\n   - Single source of truth in React state.\n   - Pros: Instant validation, formatting on typing (e.g. phone number masks), disabling submit buttons dynamically.\n   - Cons: More boilerplate and triggers component re-renders on every keystroke (usually negligible, but matters in massive 100-field forms).\n2. Uncontrolled Components:\n   - DOM is source of truth; values accessed via 'inputRef.current.value'.\n   - Pros: High performance for massive forms; trivial integration with non-React DOM libraries.\n   - Cons: Harder to enforce real-time cross-field validation rules.\n3. Modern Form Libraries:\n   - Libraries like React Hook Form leverage uncontrolled inputs under the hood via refs for maximum performance while offering a controlled-like developer API.",
    "codeSnippet": "// 1. Controlled Component (React State is Source of Truth)\nexport const ControlledInput = () => {\n  const [email, setEmail] = useState(\"\");\n\n  return (\n    <div>\n      <input \n        value={email} \n        onChange={(e) => setEmail(e.target.value.toLowerCase())} \n        placeholder=\"Enter email\"\n      />\n      {email.includes(\"@\") ? <span>Valid</span> : <span>Invalid email</span>}\n    </div>\n  );\n};\n\n// 2. Uncontrolled Component (DOM holds value, accessed via Ref)\nexport const UncontrolledInput = () => {\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    console.log(\"Submitted value:\", inputRef.current?.value);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input ref={inputRef} defaultValue=\"test@example.com\" />\n      <button type=\"submit\">Submit</button>\n    </form>\n  );\n};",
    "redFlags": [
      "Switching an input from uncontrolled to controlled during its lifetime (e.g. passing 'value={undefined}' on initial render and later passing a string).",
      "Using uncontrolled inputs when the UI requires live input formatting or cross-field validation.",
      "Re-rendering the entire page on every single keypress in large data entry tables."
    ],
    "proTips": [
      "To prevent the classic 'Warning: A component is changing an uncontrolled input to be controlled', always initialize input state with an empty string ('\"\"') rather than 'undefined' or 'null'."
    ]
  },
  {
    "id": "q-ui-3",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "State",
      "Functional Updates",
      "Concurrency",
      "Batching"
    ],
    "title": "Why and when should you use functional state updates (setCount(prev => prev + 1)) in React?",
    "pitch": "In React, state setter calls are batched and asynchronous; the state variable within the current render scope does not change immediately after calling the setter. If a state calculation depends on the prior state value, passing an updater function ('prev => prev + 1') guarantees you receive the freshest, pending state value from the queue. This prevents race conditions, stale closures in asynchronous callbacks, and duplicate update drops.",
    "analogy": "Sending instructions to an ATM: If you tell the ATM 'Set balance to $100' three times in the same second, your balance ends up at $100. If you give functional instructions: 'Add $1 to whatever the current balance is' three times, your balance accurately increases by $3.",
    "deepDive": "Batching & Closure Mechanics:\n1. React 18 Automatic Batching:\n   - React batches all state updates inside promises, timeouts, and native event handlers into a single re-render.\n2. The Stale Value Trap:\n   - If 'count' is currently 0:\n     setCount(count + 1); // setCount(0 + 1) -> 1\n     setCount(count + 1); // setCount(0 + 1) -> 1\n     setCount(count + 1); // setCount(0 + 1) -> 1\n   - Result: count becomes 1, NOT 3!\n3. Functional Fix:\n   - setCount(prev => prev + 1); // receives 0 -> returns 1\n   - setCount(prev => prev + 1); // receives 1 -> returns 2\n   - setCount(prev => prev + 1); // receives 2 -> returns 3\n   - Result: count becomes 3!\n4. Async Callbacks & Intervals:\n   - In 'setInterval' or async fetch handlers, closures capture the state from the render in which they were created. Using functional updates avoids needing the state variable in the dependency array!",
    "codeSnippet": "export const BatchingCounter = () => {\n  const [count, setCount] = useState(0);\n\n  const handleTripleIncrement = () => {\n    // ❌ WRONG: All three lines read the same closed-over 'count' (e.g. 0)\n    // setCount(count + 1);\n    // setCount(count + 1);\n    // setCount(count + 1); // Final count is 1, not 3!\n\n    // ✅ CORRECT: Chains through pending state queue\n    setCount(prev => prev + 1);\n    setCount(prev => prev + 1);\n    setCount(prev => prev + 1); // Final count is 3!\n  };\n\n  // ✅ In setInterval, functional updates avoid restarting the timer every tick\n  useEffect(() => {\n    const timer = setInterval(() => {\n      setCount(prev => prev + 1); // No dependency on 'count' needed!\n    }, 1000);\n    return () => clearInterval(timer);\n  }, []); // Empty dependency array: timer runs once!\n\n  return <button onClick={handleTripleIncrement}>Count: {count}</button>;\n};",
    "redFlags": [
      "Referencing state directly inside intervals or debounced handlers without using functional updates or refs.",
      "Assuming state updates execute synchronously immediately following the setter line.",
      "Putting state variables into useEffect dependency arrays when a functional update would have eliminated the need."
    ],
    "proTips": [
      "Whenever the next state depends on the previous state, ALWAYS use the functional updater form 'setState(prev => ...)'. It is bulletproof against React 18 concurrent updates and asynchronous closures."
    ]
  },
  {
    "id": "q-ui-4",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "useEffect",
      "Hooks",
      "Lifecycle",
      "Memory Leaks"
    ],
    "title": "How does the useEffect lifecycle work, and why are dependency arrays and cleanup functions critical?",
    "pitch": "useEffect executes side-effects after React has committed updates to the DOM. The dependency array tells React when to re-run the effect: no array runs after every render; an empty array ([]) runs once on mount; and specific dependencies run when any listed value changes referentially. A cleanup function returned by useEffect runs before the effect is re-executed and on component unmount to prevent memory leaks, cancel subscriptions, clear timers, or abort fetch requests.",
    "analogy": "Hiring a cleaning crew for an Airbnb: The effect is the crew preparing the room when guests arrive. The cleanup function is the crew washing the sheets and locking the doors when the guest checks out so the room is clean for the next person.",
    "deepDive": "Deep Lifecycle Mechanics:\n1. StrictMode in React 18:\n   - In development, React mounts, unmounts, and re-mounts components immediately to verify that cleanup functions correctly reverse any side effects (e.g. duplicate subscriptions).\n2. The Stale Closure Bug:\n   - If an effect uses a variable or function but omits it from the dependency array, the effect is trapped with the old values from its creation render.\n3. Cleanup Responsibility:\n   - Timers: 'clearInterval(timerId)'\n   - Event Listeners: 'window.removeEventListener(\"resize\", handler)'\n   - Network Requests: 'abortController.abort()' to prevent updating unmounted components.",
    "codeSnippet": "interface UserProfileProps {\n  userId: string;\n}\n\nexport const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {\n  const [data, setData] = useState<UserData | null>(null);\n\n  useEffect(() => {\n    // 1. Create AbortController to cancel in-flight request if userId changes quickly\n    const controller = new AbortController();\n\n    async function fetchUser() {\n      try {\n        const response = await fetch(`/api/users/${userId}`, { signal: controller.signal });\n        const json = await response.json();\n        setData(json);\n      } catch (err: any) {\n        if (err.name !== 'AbortError') {\n          console.error(\"Fetch error:\", err);\n        }\n      }\n    }\n\n    fetchUser();\n\n    // 2. CLEANUP FUNCTION: Runs before next effect execution or on unmount\n    return () => {\n      controller.abort();\n    };\n  }, [userId]); // Only re-run when userId prop changes!\n\n  return <div>{data ? data.name : \"Loading...\"}</div>;\n};",
    "redFlags": [
      "Omitting values used inside useEffect from the dependency array (disabling eslint-plugin-react-hooks).",
      "Forgetting to clean up event listeners, WebSocket connections, or intervals.",
      "Triggering an infinite loop by updating state inside useEffect without a proper dependency array."
    ],
    "proTips": [
      "Never disable 'react-hooks/exhaustive-deps' with an ESLint suppression comment. If a dependency triggers too many runs, memoize that dependency with 'useCallback' or 'useMemo', or extract it outside the component."
    ]
  },
  {
    "id": "q-ui-5",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Performance",
      "useMemo",
      "useCallback",
      "React.memo"
    ],
    "title": "How do useMemo, useCallback, and React.memo optimize performance, and when are they counterproductive?",
    "pitch": "React.memo wraps a component to skip re-rendering if its props have not changed by shallow comparison. useMemo caches the result of an expensive calculation between renders. useCallback caches a callback function instance between renders to preserve referential equality when passing functions to memoized child components. They are counterproductive when used prematurely on trivial operations because instantiating dependency arrays and shallow comparisons consumes more CPU and memory than the re-render itself.",
    "analogy": "React.memo is a guard at an office door checking if anything changed before letting workers rebuild the room. useMemo is saving a complex financial calculation on a whiteboard so you don't recalculate it from scratch every minute. useCallback is keeping the exact same keycard rather than printing a new plastic card every time you walk through the door.",
    "deepDive": "Referential Equality & Re-render Chain:\n1. The Problem:\n   - Every time a parent renders, all functions declared inside it ('const handleClick = () => ...') and object literals ('const opts = { ... }') receive NEW memory references.\n   - Any child wrapped in 'React.memo' still re-renders because 'newFunction !== oldFunction'!\n2. The Solution:\n   - Wrap the handler in 'useCallback(..., [deps])' and the child in 'React.memo(ChildComponent)'.\n3. When NOT to Memoize:\n   - Basic arithmetic or string concatenation (faster to recalculate than checking 5 dependencies).\n   - Passing callbacks to standard HTML tags ('<button onClick={...}>')—DOM elements don't benefit from referential equality.",
    "codeSnippet": "interface ListItemProps {\n  id: string;\n  name: string;\n  onSelect: (id: string) => void;\n}\n\n// 1. React.memo: Only re-renders if props referentially change\nconst ListItem = React.memo<ListItemProps>(({ id, name, onSelect }) => {\n  console.log(\"Render ListItem:\", id);\n  return <li onClick={() => onSelect(id)}>{name}</li>;\n});\n\nexport const UserList = ({ users }: { users: User[] }) => {\n  const [filter, setFilter] = useState(\"\");\n\n  // 2. useMemo: Expensive filtering only re-evaluates when users or filter changes\n  const filteredUsers = useMemo(() => {\n    return users.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));\n  }, [users, filter]);\n\n  // 3. useCallback: Preserves identical function reference across renders\n  const handleSelect = useCallback((id: string) => {\n    console.log(\"Selected user:\", id);\n  }, []); // Stable forever\n\n  return (\n    <div>\n      <input value={filter} onChange={e => setFilter(e.target.value)} />\n      <ul>\n        {filteredUsers.map(user => (\n          <ListItem key={user.id} id={user.id} name={user.name} onSelect={handleSelect} />\n        ))}\n      </ul>\n    </div>\n  );\n};",
    "redFlags": [
      "Wrapping every single function in 'useCallback' by default without profiling or passing to memoized children.",
      "Wrapping a component in 'React.memo' but passing unmemoized inline arrow functions or object literals as props.",
      "Forgetting dependencies in the array, resulting in stale data inside the memoized function."
    ],
    "proTips": [
      "Use the React DevTools Profiler ('Record why each component rendered') before optimizing. In 90% of cases, optimizing your component tree structure (colocating state) solves performance issues without needing any memoization hooks."
    ]
  },
  {
    "id": "q-ui-6",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Keys",
      "Virtual DOM",
      "Reconciliation",
      "Bugs"
    ],
    "title": "Why are Keys essential in React lists, and why is using array index as key a critical anti-pattern?",
    "pitch": "Keys give elements a stable identity across renders, allowing React's reconciliation algorithm to determine whether an item was added, removed, reordered, or modified in the Virtual DOM. Using an array index as a key is a dangerous anti-pattern when lists can be filtered, sorted, or mutated; inserting an item at the beginning shifts all subsequent indexes, causing React to associate old component state and uncontrolled DOM inputs with the wrong data rows.",
    "analogy": "Assigned seating at a wedding: If seats are numbered by row order (index: 1, 2, 3), and someone cuts to the front of the line, everyone is forced to take the seat and name-card of whoever was ahead of them. If seats are labeled by the person's actual name (stable unique ID), people can sit in any order and their meal preference follows them accurately.",
    "deepDive": "Reconciliation Algorithm Mechanics:\n1. Diffing with Keys:\n   - When rendering a list, React compares current keys with previous keys.\n   - If key 'id_42' moved from position 1 to position 5, React moves the existing DOM node instead of destroying and recreating it.\n2. Index-As-Key Catastrophes:\n   - Consider a list of todo items with checkboxes.\n   - You delete item 0.\n   - Item 1 now becomes index 0!\n   - React sees key '0' already existed and preserves the internal checkbox DOM checked state on the newly promoted item, visually checking the wrong todo!",
    "codeSnippet": "// ❌ DANGEROUS: Using index as key when list can be reordered or deleted\nexport const BadTodoList = ({ todos, onDelete }: { todos: Todo[]; onDelete: (id: string) => void }) => (\n  <ul>\n    {todos.map((todo, index) => (\n      // If item 0 is deleted, index shifts, causing checked checkboxes to persist on wrong items!\n      <li key={index}>\n        <input type=\"checkbox\" /> {todo.title}\n        <button onClick={() => onDelete(todo.id)}>Delete</button>\n      </li>\n    ))}\n  </ul>\n);\n\n// ✅ PRODUCTION READY: Using permanent unique business identifier\nexport const GoodTodoList = ({ todos, onDelete }: { todos: Todo[]; onDelete: (id: string) => void }) => (\n  <ul>\n    {todos.map((todo) => (\n      <li key={todo.id}>\n        <input type=\"checkbox\" /> {todo.title}\n        <button onClick={() => onDelete(todo.id)}>Delete</button>\n      </li>\n    ))}\n  </ul>\n);",
    "redFlags": [
      "Using 'key={index}' on dynamic lists that support filtering, sorting, or deletion.",
      "Generating random keys on the fly ('key={Math.random()}'), which forces React to destroy and rebuild the entire DOM tree on every single render.",
      "Using duplicate keys in the same list, corrupting React's internal fiber tree."
    ],
    "proTips": [
      "When a list genuinely has no unique ID (e.g. read-only static marketing bullets that will NEVER reorder, sort, or paginate), index as a key is acceptable. In all other scenarios, use unique entity IDs or generate UUIDs upon creation."
    ]
  },
  {
    "id": "q-ui-7",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "State Management",
      "Context API",
      "Redux",
      "Zustand",
      "Architecture"
    ],
    "title": "How do you choose between Lifting State Up, React Context, and Global State (Redux/Zustand)?",
    "pitch": "Lift State Up when two closely related sibling components need to share state. Use React Context for low-frequency global data that many deeply nested components need—such as current user authentication, theme, or localization. Use a dedicated state manager like Zustand or Redux Toolkit for complex, high-frequency state with many cross-component mutations, heavy business logic, or where you need granular component re-rendering without the Context re-render performance tax.",
    "analogy": "Lifting State is asking the teacher sitting between two students to hold their shared pencil. React Context is the school PA system broadcasting the fire alarm to every room. Global Store (Zustand/Redux) is the school central records database with dedicated clerks and audit logs for student grades.",
    "deepDive": "State Architecture Comparison:\n1. Lifting State Up:\n   - Simplest, zero dependencies. Pass props down and callbacks up.\n   - Limitation: 'Prop Drilling' if passed down 5+ levels through intermediary components that don't need the data.\n2. React Context API:\n   - Eliminates prop drilling.\n   - Major Drawback: Every component consuming the context ('useContext(MyContext)') re-renders whenever ANY property in the context value object changes!\n3. Zustand / Redux Toolkit:\n   - Selective subscriptions: 'const userName = useStore(state => state.user.name)' only re-renders when 'user.name' specifically changes.\n   - Built-in devtools, middleware, persistence, and decoupling of business logic from UI rendering.",
    "codeSnippet": "// 1. Lightweight Modern Global Store with Zustand\nimport { create } from 'zustand';\n\ninterface AuthState {\n  user: User | null;\n  token: string | null;\n  login: (user: User, token: string) => void;\n  logout: () => void;\n}\n\nexport const useAuthStore = create<AuthState>((set) => ({\n  user: null,\n  token: null,\n  login: (user, token) => set({ user, token }),\n  logout: () => set({ user: null, token: null }),\n}));\n\n// 2. High-Performance Granular Component Subscription:\nexport const UserNavBadge = () => {\n  // ✅ Only re-renders if 'user.name' changes, ignores changes to token or other state!\n  const userName = useAuthStore((state) => state.user?.name);\n  return <span>Welcome, {userName ?? \"Guest\"}</span>;\n};",
    "redFlags": [
      "Using React Context as a global store for high-frequency updates (e.g. cursor positions, live stock tickers), causing entire app trees to re-render constantly.",
      "Reaching for Redux Toolkit on small, simple apps that only need local state.",
      "Prop drilling state through 8 intermediary components instead of using Context or composition."
    ],
    "proTips": [
      "If using React Context, split contexts by domain and update frequency: keep 'AuthContext' (rare updates) separate from 'CartContext' or 'ThemeContext'. Never put everything into one monolithic 'AppContext'."
    ]
  },
  {
    "id": "q-ui-8",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Custom Hooks",
      "Clean Code",
      "Design Patterns"
    ],
    "title": "How do you build Custom Hooks to encapsulate and share reusable stateful logic?",
    "pitch": "A Custom Hook is a JavaScript/TypeScript function whose name starts with 'use' and that can call other built-in React hooks. Custom hooks encapsulate stateful logic, asynchronous operations, or browser API integrations so they can be reused cleanly across multiple components without duplicating lifecycle code or coupling components to specific UI templates.",
    "analogy": "A power adapter: instead of soldering custom wiring into every lamp and toaster you own, you plug them into a standardized wall adapter that handles the voltage and current safely.",
    "deepDive": "Custom Hook Engineering Rules:\n1. Rules of Hooks Apply:\n   - Call hooks ONLY at the top level (never inside loops, conditions, or nested functions).\n   - Must start with 'use' (e.g. 'useDebounce', 'useWindowSize', 'useLocalStorage').\n2. State Isolation:\n   - Custom hooks share stateful LOGIC, not state itself. Each component calling 'useCounter()' receives its own isolated, independent state sandbox.\n3. Return Types:\n   - Tuples ('[value, setValue] as const') for simple state-like semantics.\n   - Objects ('{ data, isLoading, isError, refetch }') for complex operations with named properties.",
    "codeSnippet": "// Reusable Debounce Hook in TypeScript\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delayMs: number = 300): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delayMs);\n\n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delayMs]);\n\n  return debouncedValue;\n}\n\n// Consumption in a Search Component:\nexport const SearchBox = () => {\n  const [searchTerm, setSearchTerm] = useState(\"\");\n  const debouncedSearch = useDebounce(searchTerm, 400);\n\n  useEffect(() => {\n    if (debouncedSearch) {\n      console.log(\"Triggering backend search for:\", debouncedSearch);\n    }\n  }, [debouncedSearch]);\n\n  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;\n};",
    "redFlags": [
      "Writing a custom hook that doesn't call any built-in React hooks (that's just a normal utility function).",
      "Calling hooks conditionally inside an 'if' block within a custom hook.",
      "Assuming two components calling the same custom hook share the exact same state instance."
    ],
    "proTips": [
      "Always type your hook tuple return values with 'as const' (e.g. 'return [state, setState] as const;'). Without it, TypeScript infers the array as '(State | SetState)[]', losing the exact positional typing."
    ]
  },
  {
    "id": "q-ui-9",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "TypeScript",
      "Generics",
      "Type Safety",
      "API Clients"
    ],
    "title": "How do TypeScript Generics (<T>) enable type-safe, reusable components and API clients?",
    "pitch": "TypeScript Generics allow you to write reusable, type-safe functions, classes, and components that work over a variety of types rather than a single one, while preserving full compile-time type information without resorting to 'any'. By parameterizing types (like `<T>`), callers can specify the exact data shape, giving autocomplete, compiler verification, and refactoring safety for HTTP API clients and reusable UI tables.",
    "analogy": "A transparent mailing envelope: It can carry a birthday card, a bill, or a letter (flexible contents), but whatever you put inside remains completely visible and verified at the post office without tearing the envelope open.",
    "deepDive": "Generic Patterns in Modern Full-Stack:\n1. Generic HTTP Client Wrapper:\n   - 'async function get<T>(url: string): Promise<T>' returns strongly typed data without casting.\n2. Generic Constraints:\n   - 'function getById<T extends { id: string }>(item: T)' ensures that whatever type is passed is guaranteed to possess an 'id' property.\n3. Generic React Components:\n   - '<Table<T> data={items} renderRow={(item: T) => ...} />' ensures that the row renderer receives the exact item type of the data array.",
    "codeSnippet": "// 1. Generic API Client Wrapper\nexport interface ApiResponse<T> {\n  data: T;\n  statusCode: number;\n  message: string;\n}\n\nexport async function apiClient<T>(url: string): Promise<T> {\n  const response = await fetch(url);\n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n  }\n  const body: ApiResponse<T> = await response.json();\n  return body.data;\n}\n\n// 2. Generic React Table Component\ninterface TableProps<T> {\n  items: T[];\n  renderRow: (item: T) => React.ReactNode;\n  keyExtractor: (item: T) => string;\n}\n\nexport function GenericTable<T extends { id: string }>({ items, renderRow, keyExtractor }: TableProps<T>) {\n  return (\n    <table>\n      <tbody>\n        {items.map(item => (\n          <tr key={keyExtractor(item)}>{renderRow(item)}</tr>\n        ))}\n      </tbody>\n    </table>\n  );\n}",
    "redFlags": [
      "Using 'any' instead of generics, throwing away all TypeScript compile-time safety.",
      "Over-complicating types with unnecessary nested generics when a simple union would suffice.",
      "Not adding constraints ('<T extends Base>') when the code relies on specific object properties."
    ],
    "proTips": [
      "Use 'Record<K, V>' and 'Partial<T>' generic utility types. In API requests, 'Partial<T>' makes all properties optional for PATCH updates, while 'Pick<T, \"id\" | \"name\">' selects exact subset properties safely."
    ]
  },
  {
    "id": "q-ui-10",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "TypeScript",
      "any",
      "unknown",
      "never",
      "Type System"
    ],
    "title": "What is the difference between any, unknown, and never in TypeScript?",
    "pitch": "any completely disables all TypeScript type checking and safety, allowing any property access or method call without validation. unknown is the type-safe counterpart to any; it accepts any value, but TypeScript refuses to let you perform any operations or access properties on it until you narrow its type through type guards or assertions. never represents the type of values that never occur—such as the return type of a function that always throws an exception or enters an infinite loop, or in exhaustive switch statements.",
    "analogy": "any is an uninspected package allowed onto an airplane with zero security checks. unknown is a package detained in customs that nobody can touch until it is scanned and certified safe. never is an empty void: a flight that is permanently canceled and never takes off.",
    "deepDive": "Type Hierarchy & Comparison:\n1. Top Types:\n   - 'any' and 'unknown' are top types (every type is assignable to them).\n   - Rule: Always prefer 'unknown' over 'any' for external inputs (JSON.parse, 3rd party APIs, form payloads).\n2. Bottom Type:\n   - 'never' is the bottom type (assignable to nothing except never itself).\n3. Exhaustiveness Checking with 'never':\n   - In a switch statement handling all cases of a union, assign the default branch to 'const _exhaustive: never = val;'.\n   - If someone later adds a new variant to the union and forgets to update the switch, the compiler throws an error!",
    "codeSnippet": "// 1. Safe parsing with 'unknown'\nfunction parseApiResponse(jsonString: string): void {\n  const result: unknown = JSON.parse(jsonString);\n\n  // ❌ Compile error: Object is of type 'unknown'\n  // console.log(result.data.id);\n\n  // ✅ Type narrowing with guards\n  if (typeof result === \"object\" && result !== null && \"data\" in result) {\n    console.log(\"Safe access:\", (result as any).data);\n  }\n}\n\n// 2. Exhaustive checking with 'never'\ntype Shape = { kind: \"circle\"; radius: number } | { kind: \"square\"; size: number };\n\nfunction getArea(shape: Shape): number {\n  switch (shape.kind) {\n    case \"circle\":\n      return Math.PI * shape.radius ** 2;\n    case \"square\":\n      return shape.size * shape.size;\n    default:\n      // If a new shape like \"triangle\" is added, TypeScript flags this line at COMPILE TIME!\n      const _exhaustiveCheck: never = shape;\n      return _exhaustiveCheck;\n  }\n}",
    "redFlags": [
      "Using 'any' as an escape hatch to silence compiler errors instead of properly typing models.",
      "Assuming 'unknown' is identical to 'any' and trying to access properties without narrowing.",
      "Not leveraging 'never' for exhaustiveness checking in mission-critical domain logic."
    ],
    "proTips": [
      "Enable 'noImplicitAny': true and 'strict': true in tsconfig.json. When handling third-party API payloads or Zod/Yup schemas, always start with 'unknown' and parse through schema validation."
    ]
  },
  {
    "id": "q-ui-11",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "TypeScript",
      "Interface",
      "Type Alias",
      "Best Practices"
    ],
    "title": "What is the difference between interface and type in TypeScript, and which should you prefer?",
    "pitch": "Both interface and type alias can define object shapes and support inheritance. The key difference is that interfaces support Declaration Merging (multiple declarations with the same name merge their properties) and are optimized for object-oriented contracts. Types are more versatile: they can represent unions (string | number), primitives, tuples, mapped types, and intersections, but cannot be reopened. The general standard is to use interfaces for public API and component contracts, and type aliases for unions, primitives, and complex utilities.",
    "analogy": "An interface is an open municipal building code: different departments can amend and add clauses to the code over time. A type alias is an exact chemical formula: it defines a precise mixture that cannot have ingredients silently appended later.",
    "deepDive": "Feature Comparison Matrix:\n1. Declaration Merging:\n   - Interface: YES. Declaring 'interface Window { myGlobal: string; }' adds the property to the global Window object.\n   - Type: NO. Duplicate type aliases cause compiler error 'Duplicate identifier'.\n2. Unions and Primitives:\n   - Type: 'type Status = \"open\" | \"closed\"' (Unions only possible with type).\n   - Type: 'type Point = [number, number]' (Tuples).\n   - Interface: Cannot define raw union or primitive aliases directly.\n3. Performance:\n   - TypeScript compiler caches interfaces by internal type identity better than complex type intersections ('&').",
    "codeSnippet": "// 1. Interface with Declaration Merging & Inheritance\ninterface UserProfile {\n  id: string;\n  name: string;\n}\n\ninterface UserProfile {\n  email: string; // ✅ Automatically merges with previous definition!\n}\n\ninterface AdminProfile extends UserProfile {\n  permissions: string[];\n}\n\n// 2. Type Alias with Unions, Tuples & Intersections\ntype Status = \"Pending\" | \"Approved\" | \"Rejected\"; // Union: ONLY possible with type\n\ntype Coordinates = [latitude: number, longitude: number]; // Tuple\n\ntype ApiResponse<T> = \n  | { success: true; data: T }\n  | { success: false; error: string }; // Discriminated Union",
    "redFlags": [
      "Using interface when a union is needed ('interface Foo = A | B' is invalid syntax).",
      "Accidental declaration merging when naming interfaces identically across different files without namespaces.",
      "Believing types and interfaces have runtime differences (both are completely erased by the TypeScript compiler)."
    ],
    "proTips": [
      "Rule of thumb: Default to 'interface' for React component props and domain models because interfaces provide cleaner error messages and slightly faster compile times. Use 'type' for unions, intersections, and mapped utilities."
    ]
  },
  {
    "id": "q-ui-12",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "TypeScript",
      "Discriminated Unions",
      "Type Narrowing",
      "UI Architecture"
    ],
    "title": "What is a Discriminated Union in TypeScript, and how does it prevent impossible UI states?",
    "pitch": "A Discriminated Union (also called tagged union or algebraic data type) is a union of object types where each variant shares a common, literal discriminator property (like 'status' or 'kind'). TypeScript uses this property to narrow down the exact variant inside conditionals. It eliminates impossible UI states by making mutually exclusive data shapes compile-time enforceable—such as preventing an error message from existing alongside successful payload data.",
    "analogy": "A multi-tool with a selector switch: When set to 'Pliers', you can only grab and squeeze; when clicked to 'Knife', you can only cut. The switch position (discriminator) makes it physically impossible to deploy both at the same time.",
    "deepDive": "Eliminating the 'Boolean Flag Hell':\n1. The Bad Pattern (Impossible States):\n   - '{ isLoading: boolean, isError: boolean, error: string | null, data: User | null }'\n   - What happens when 'isLoading: true' AND 'isError: true' AND 'data: {...}'? Which one wins? The UI enters an inconsistent state.\n2. The Discriminated Union Solution:\n   - 'type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: User };'\n   - When 'state.status === 'success'', TypeScript guarantees 'state.data' exists and 'state.message' DOES NOT exist.",
    "codeSnippet": "// ✅ IMPOSSIBLE TO REPRESENT INVALID STATES:\ntype FetchState<T> =\n  | { status: 'idle' }\n  | { status: 'loading' }\n  | { status: 'success'; data: T }\n  | { status: 'error'; error: string };\n\nfunction renderUserView(state: FetchState<User>) {\n  switch (state.status) {\n    case 'idle':\n      return <div>Click search to begin.</div>;\n    case 'loading':\n      return <Spinner />;\n    case 'error':\n      // TypeScript knows 'error' exists here, but 'data' DOES NOT\n      return <Alert variant=\"danger\">{state.error}</Alert>;\n    case 'success':\n      // TypeScript knows 'data' exists here with full type safety\n      return <div>Welcome, {state.data.name}!</div>;\n  }\n}",
    "redFlags": [
      "Modeling asynchronous state with 4 independent booleans ('isLoading', 'isError', 'isSuccess', 'isIdle').",
      "Using non-literal types as discriminators (e.g. using generic 'string' instead of literal '\"loading\"').",
      "Using non-null assertions ('state.data!') instead of allowing the discriminator to narrow the type."
    ],
    "proTips": [
      "Discriminated Unions combined with a Redux or useReducer pattern make complex forms and multistep wizards completely bug-free. You cannot accidentally transition to Step 3 without the validated data from Step 2."
    ]
  },
  {
    "id": "q-ui-13",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "API",
      "State Management",
      "UI UX",
      "Error Handling"
    ],
    "title": "How do you build a robust API state architecture in React covering Loading, Error, Empty, and Success states?",
    "pitch": "A production-grade React API integration must explicitly account for four distinct UI states: 1) Loading (skeleton loaders or spinners), 2) Error (user-friendly alerts with retry capabilities), 3) Empty State (helpful empty screen when data is empty []), and 4) Success (the rendered data). Combining these with an AbortController for request cancellation and tools like TanStack React Query ensures automatic caching, deduplication, and stale-while-revalidate background refreshes.",
    "analogy": "An airport luggage carousel: Loading is watching the belt start moving; Success is picking up your suitcase; Empty state is a screen showing 'No bags found for flight 104; please check claims counter'; and Error is an alarm sounding that the belt is jammed with a phone number to call maintenance.",
    "deepDive": "Production State Management Matrix:\n1. The Forgotten State - Empty State:\n   - Junior developers render an empty blank page when 'data.length === 0'.\n   - Senior developers provide a call-to-action: 'No orders found. Create your first order now!'\n2. TanStack Query / SWR Standard:\n   - Avoid manual useEffect data fetching in modern React apps.\n   - TanStack Query provides: 'isLoading', 'isError', 'data', 'error', 'refetch' out of the box with caching and garbage collection.\n3. Error Boundary Integration:\n   - Use React Error Boundaries to catch unhandled rendering exceptions without crashing the entire single-page application.",
    "codeSnippet": "import { useQuery } from '@tanstack/react-query';\n\nexport const OrdersList = () => {\n  const { data: orders, isLoading, isError, error, refetch } = useQuery({\n    queryKey: ['orders'],\n    queryFn: fetchOrdersApi,\n  });\n\n  // 1. Loading State\n  if (isLoading) return <SkeletonLoader count={5} />;\n\n  // 2. Error State with Retry\n  if (isError) {\n    return (\n      <div className=\"error-panel\">\n        <p>Failed to load orders: {(error as Error).message}</p>\n        <button onClick={() => refetch()}>Try Again</button>\n      </div>\n    );\n  }\n\n  // 3. Empty State with Call To Action\n  if (!orders || orders.length === 0) {\n    return (\n      <div className=\"empty-state\">\n        <p>No orders placed yet.</p>\n        <button onClick={openNewOrderModal}>Create First Order</button>\n      </div>\n    );\n  }\n\n  // 4. Success State\n  return (\n    <ul className=\"orders-grid\">\n      {orders.map(order => (\n        <OrderItem key={order.id} order={order} />\n      ))}\n    </ul>\n  );\n};",
    "redFlags": [
      "Failing to handle the empty array state, leaving users staring at a broken or blank white screen.",
      "Not providing a 'Retry' button on network error screens.",
      "Rendering flashes of loading spinners on background refetches instead of using optimistic UI or stale-while-revalidate."
    ],
    "proTips": [
      "In modern React, adopt TanStack Query (React Query). It eliminates 80% of boilerplate useEffect code, handles request deduplication across components, and provides out-of-the-box window focus refetching."
    ]
  },
  {
    "id": "q-ui-14",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "React",
      "Performance",
      "Virtualization",
      "DOM Optimization",
      "react-window"
    ],
    "title": "How do you optimize slow data grids and virtualize massive lists (10,000+ items) in React?",
    "pitch": "Rendering 10,000 DOM nodes simultaneously exhausts browser memory and destroys frame rates during scrolling. Virtualization (using libraries like `react-window` or `@tanstack/react-virtual`) only renders the small slice of DOM elements currently visible within the user's viewport (plus a small buffer). As the user scrolls, off-screen nodes are recycled and unmounted, maintaining a constant DOM node count (~30 elements) regardless of whether the dataset contains 1,000 or 1,000,000 rows.",
    "analogy": "A theater film projector: Even if a film has 200,000 individual frames on the reel, the projector only shines light through one single frame at a time as it passes through the lens. It does not try to display every frame across the entire theater wall simultaneously.",
    "deepDive": "Virtualization Mechanics:\n1. Viewport Calculation:\n   - Outer container has fixed height (e.g. 600px) with 'overflow: auto'.\n   - Inner container has total height calculated as 'totalRows * rowHeight' (e.g. 10,000 * 50px = 500,000px) to give the scrollbar authentic proportions.\n   - React calculates: 'startIndex = Math.floor(scrollTop / rowHeight)' and 'endIndex = startIndex + visibleCount'.\n   - Only rows between startIndex and endIndex are mounted into the DOM using CSS absolute positioning.\n2. Additional Grid Optimizations:\n   - Avoid inline functions and object creation in row renderers.\n   - Use CSS 'contain: content' to isolate layout and paint calculations.",
    "codeSnippet": "import { FixedSizeList as List } from 'react-window';\n\ninterface RowProps {\n  index: number;\n  style: React.CSSProperties;\n  data: Transaction[];\n}\n\n// Row component only mounted when inside viewport!\nconst TransactionRow = ({ index, style, data }: RowProps) => {\n  const item = data[index];\n  return (\n    <div style={style} className=\"grid-row\">\n      <span>#{item.id}</span>\n      <span>{item.date}</span>\n      <span>${item.amount.toFixed(2)}</span>\n    </div>\n  );\n};\n\nexport const VirtualizedGrid = ({ transactions }: { transactions: Transaction[] }) => {\n  return (\n    <List\n      height={500}             // Viewport height\n      itemCount={transactions.length} // 100,000 items!\n      itemSize={45}            // 45px per row\n      width=\"100%\"\n      itemData={transactions}\n    >\n      {TransactionRow}\n    </List>\n  );\n};",
    "redFlags": [
      "Rendering 50,000 raw table rows directly into the DOM and wondering why the browser crashes.",
      "Attempting to paginate client-side without virtualizing or server-side pagination.",
      "Not setting explicit row heights when using fixed-size virtualizers."
    ],
    "proTips": [
      "For dynamic variable row heights (e.g. comments with different text lengths), use '@tanstack/react-virtual'. It measures rendered DOM node heights dynamically and adjusts the virtual scroll offsets on the fly."
    ]
  },
  {
    "id": "q-ui-15",
    "pillar": "ui",
    "seniority": "Mid-to-Senior",
    "tags": [
      "React",
      "Testing",
      "Vitest",
      "React Testing Library",
      "TDD"
    ],
    "title": "How do you approach React Component Testing using Vitest, React Testing Library, and user-event?",
    "pitch": "React Testing Library follows the guiding principle: 'The more your tests resemble the way your software is used, the more confidence they can give you.' Rather than testing implementation details (like component internal state or private methods), we test user behavior: querying by accessible roles, labels, and text ('getByRole', 'getByLabelText') and simulating real browser events with '@testing-library/user-event'. Vitest provides an ultra-fast, ESM-native test runner compatible with Jest APIs.",
    "analogy": "Testing a soda vending machine: A bad test opens the back panel and inspects the internal electrical gears. A good test puts a dollar into the slot, presses the button labeled 'Cola', and verifies that a cold Cola actually drops into the dispenser tray.",
    "deepDive": "Testing Hierarchy & Best Practices:\n1. Query Priority Order:\n   - 1st: 'getByRole' (e.g. 'button', 'textbox', 'heading') - Enforces accessible HTML.\n   - 2nd: 'getByLabelText' (form inputs).\n   - 3rd: 'getByPlaceholderText' / 'getByText'.\n   - Last Resort: 'getByTestId' (only when no semantic or accessible query exists).\n2. 'fireEvent' vs 'user-event':\n   - 'fireEvent.click' dispatches a synthetic DOM click directly.\n   - 'user-event.click' simulates the real user interaction: hovers, focuses, presses mouse down, mouse up, and triggers click. Always prefer 'user-event'!\n3. Mocking HTTP Requests:\n   - Use MSW (Mock Service Worker) to intercept network calls at the network level rather than mocking fetch or Axios functions directly.",
    "codeSnippet": "import { describe, it, expect } from 'vitest';\nimport { render, screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { LoginForm } from './LoginForm';\n\ndescribe('<LoginForm />', () => {\n  it('submits user credentials and displays welcome message on success', async () => {\n    const user = userEvent.setup();\n    const handleLogin = vitest.fn();\n\n    render(<LoginForm onSubmit={handleLogin} />);\n\n    // 1. Query elements by accessible role and label\n    const emailInput = screen.getByLabelText(/email address/i);\n    const passwordInput = screen.getByLabelText(/password/i);\n    const submitBtn = screen.getByRole('button', { name: /sign in/i });\n\n    // 2. Simulate realistic user typing and click\n    await user.type(emailInput, 'sami@example.com');\n    await user.type(passwordInput, 'P@ssword123!');\n    await user.click(submitBtn);\n\n    // 3. Assert on user-observable behavior\n    expect(handleLogin).toHaveBeenCalledWith({\n      email: 'sami@example.com',\n      password: 'P@ssword123!',\n    });\n  });\n});",
    "redFlags": [
      "Testing implementation details like internal component state values or instance methods.",
      "Querying DOM nodes by CSS classes or internal tag names ('container.querySelector(\".btn-primary\")').",
      "Using 'fireEvent' instead of 'user-event' for user interactions."
    ],
    "proTips": [
      "If you find it difficult to find an element with 'getByRole', your component likely has accessibility issues! React Testing Library naturally forces you to build fully accessible, WCAG-compliant web applications."
    ]
  },
  {
    "id": "q-ui-16",
    "pillar": "ui",
    "seniority": "Senior",
    "tags": [
      "React",
      "React 18",
      "Concurrent Mode",
      "useTransition",
      "useDeferredValue"
    ],
    "title": "How do React 18 Concurrent Features (useTransition, useDeferredValue) keep the UI responsive during heavy updates?",
    "pitch": "In React 18 Concurrent Mode, rendering is interruptible. Prior to React 18, once a render began, the main thread was blocked until completion. useTransition lets you mark specific state updates as non-urgent transitions; if a user types another keystroke while the transition is rendering, React pauses the low-priority render, processes the high-priority input event, and resumes rendering. useDeferredValue does the same for derived values when you don't control the state setter.",
    "analogy": "A VIP lane at airport security: Immediate urgent tasks (typing in an input box, clicking a tab) get waved through the express lane instantly. Heavy background computations (rendering a graph of 5,000 data points) wait in the standard line and can be paused if another VIP shows up.",
    "deepDive": "Mechanics of Non-Blocking Updates:\n1. Urgent vs Transition Updates:\n   - Urgent: Direct interactions (typing, clicking, hovering) must provide immediate feedback within 16ms to prevent perceived lag.\n   - Transition: UI view transitions (filtering a giant list, switching tabs, rendering complex chart).\n2. 'isPending' Flag:\n   - 'const [isPending, startTransition] = useTransition()'\n   - 'isPending' lets you render an inline opacity fade or spinner while the background render completes without freezing the text box!\n3. useDeferredValue:\n   - Similar to debouncing, but instead of waiting for a fixed timeout, React immediately renders with the old value and updates to the deferred value as soon as the main thread is free.",
    "codeSnippet": "import { useState, useTransition, useDeferredValue } from 'react';\n\nexport const FastSearch = ({ massiveCatalog }: { massiveCatalog: Product[] }) => {\n  const [searchTerm, setSearchTerm] = useState(\"\");\n  const [isPending, startTransition] = useTransition();\n  const [filteredList, setFilteredList] = useState(massiveCatalog);\n\n  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const value = e.target.value;\n    \n    // 1. URGENT UPDATE: Updates input text field instantly (zero typing lag!)\n    setSearchTerm(value);\n\n    // 2. NON-URGENT TRANSITION: Heavy list filtering marked as interruptible\n    startTransition(() => {\n      const filtered = massiveCatalog.filter(item => \n        item.name.toLowerCase().includes(value.toLowerCase())\n      );\n      setFilteredList(filtered);\n    });\n  };\n\n  return (\n    <div>\n      <input value={searchTerm} onChange={handleChange} placeholder=\"Search 20,000 items...\" />\n      {isPending && <span className=\"loading-badge\">Updating results...</span>}\n      <div style={{ opacity: isPending ? 0.6 : 1 }}>\n        <CatalogGrid items={filteredList} />\n      </div>\n    </div>\n  );\n};",
    "redFlags": [
      "Wrapping controlled text input setters in 'startTransition' (causes noticeable typing lag).",
      "Confusing 'useDeferredValue' with 'setTimeout' debounce (deferred value updates immediately when CPU is idle, not after a fixed delay).",
      "Using transitions for fast, simple operations where the overhead provides no user benefit."
    ],
    "proTips": [
      "Use 'useTransition' when you have direct access to the state setter. Use 'useDeferredValue' when the value is received as a prop from an external parent or third-party library."
    ]
  },
  {
    "id": "q-cloud-1",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DevOps",
      "CI/CD",
      "Azure Pipelines",
      "Automation",
      "Architecture"
    ],
    "title": "What is the difference between Continuous Integration (CI), Continuous Delivery (CD), and Continuous Deployment?",
    "pitch": "Continuous Integration (CI) is the practice of automatically building and running automated tests whenever code is merged into the shared repository. Continuous Delivery (CD) automatically packages and prepares release-ready build artifacts and deploys them to staging environments, with production deployment requiring a manual approval gate. Continuous Deployment takes it one step further by automatically releasing every passing change directly into production with zero human intervention.",
    "analogy": "A bakery: CI is the kitchen mixing the dough and checking oven temperatures for every batch. Continuous Delivery is putting freshly baked bread into boxes on the delivery shelf, waiting for the store manager to stamp 'Approved for Sale'. Continuous Deployment is an automated conveyor belt that sends the bread straight into the customer's grocery bag the instant it comes out of the oven.",
    "deepDive": "Pipeline Progression Matrix:\n1. Continuous Integration (CI):\n   - Trigger: PR creation or commit to main/develop.\n   - Tasks: 'dotnet restore', 'dotnet build --no-restore', 'dotnet test', static code analysis (SonarQube).\n   - Output: Immutable build drop / container image pushed to Azure Container Registry (ACR).\n2. Continuous Delivery (CD):\n   - Deploys automatically to Dev, QA, and Staging.\n   - Deploys to Production only after a Human Approval Gate (e.g. Lead Engineer or Release Manager signs off).\n3. Continuous Deployment:\n   - Full automated pipeline from commit to Production, guarded by automated smoke tests, canary metrics, and synthetic monitoring.",
    "codeSnippet": "# Conceptual Azure DevOps Pipeline Flow\ntrigger:\n  branches:\n    include:\n      - main\n\nstages:\n- stage: BuildAndTest # CI Stage\n  displayName: 'Continuous Integration'\n  jobs:\n  - job: Compile\n    steps:\n    - task: DotNetCoreCLI@2\n      inputs:\n        command: 'build'\n    - task: DotNetCoreCLI@2\n      inputs:\n        command: 'test'\n\n- stage: DeployStaging # CD Stage (Automated)\n  displayName: 'Continuous Delivery to Staging'\n  dependsOn: BuildAndTest\n\n- stage: DeployProduction # CD (Manual Approval) or Continuous Deployment (Automatic)\n  displayName: 'Deploy to Production'\n  dependsOn: DeployStaging\n  # Configured with Azure DevOps Environment Approval Check",
    "redFlags": [
      "Confusing Continuous Delivery (has manual production gate) with Continuous Deployment (fully autonomous production release).",
      "Running CI builds only once a week or manually before releases.",
      "Skipping unit tests during CI builds to make the pipeline run faster."
    ],
    "proTips": [
      "Most enterprise financial and healthcare companies practice Continuous Delivery rather than Continuous Deployment because regulatory compliance (SOC2, HIPAA, PCI-DSS) requires explicit audit trails and human approval gates before production releases."
    ]
  },
  {
    "id": "q-cloud-2",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure DevOps",
      "YAML",
      "Pipelines",
      "Architecture",
      "CI/CD"
    ],
    "title": "How do you structure Azure DevOps Pipeline Stages, Jobs, and Steps for a .NET application?",
    "pitch": "An Azure DevOps pipeline follows a clear hierarchy: Stages represent major lifecycle phases (Build, Staging, Production) and act as environment and approval boundaries; Jobs run inside a stage and execute concurrently on dedicated build agents; and Steps are sequential tasks, scripts, or tool commands executed within a single job. Breaking pipelines into discrete stages allows parallel agent execution, artifact reuse, and granular rollback control.",
    "analogy": "A multi-stage rocket: The 1st Stage launches the rocket (Build & Test). The 2nd Stage enters low orbit (Staging Deploy). The 3rd Stage docks at the space station (Production Deploy). Each stage contains multiple astronauts doing specific jobs simultaneously.",
    "deepDive": "Hierarchy and Execution Rules:\n1. Pipeline -> Stage -> Job -> Step:\n   - Pipeline: The complete root workflow defined in 'azure-pipelines.yml'.\n   - Stage: Boundary for approvals and environments. Stages can depend on previous stages ('dependsOn: Build').\n   - Job: Allocates a fresh virtual machine (or container) agent. Multiple jobs within a stage run in PARALLEL by default.\n   - Step: Lowest level; runs sequentially on the agent (e.g. 'script', 'task: DotNetCoreCLI@2').\n2. Agent Workspace Isolation:\n   - Each Job starts on a clean VM disk. Files created in Job A do NOT exist in Job B unless explicitly published and downloaded via Pipeline Artifacts!",
    "codeSnippet": "stages:\n- stage: Build\n  displayName: 'Build & Unit Test'\n  jobs:\n  - job: BuildJob\n    pool:\n      vmImage: 'ubuntu-latest'\n    steps:\n    - task: UseDotNet@2\n      inputs:\n        version: '8.0.x'\n    - script: dotnet build --configuration Release\n      displayName: 'dotnet build'\n    - script: dotnet test --configuration Release --logger trx\n      displayName: 'dotnet test'\n    - task: PublishBuildArtifacts@1\n      inputs:\n        PathtoPublish: '$(Build.ArtifactStagingDirectory)'\n        ArtifactName: 'drop'\n\n- stage: DeployProd\n  displayName: 'Deploy to Production'\n  dependsOn: Build\n  condition: succeeded()\n  jobs:\n  - deployment: DeployWeb\n    environment: 'production' # Triggers Azure DevOps Approvals\n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - download: current\n            artifact: drop\n          - script: echo \"Deploying artifact to Azure App Service...\"",
    "redFlags": [
      "Putting build, test, staging, and production deployment into a single monolithic script step.",
      "Assuming files created in one Job are automatically available in another Job without publishing artifacts.",
      "Not setting 'condition: succeeded()' on deployment stages."
    ],
    "proTips": [
      "Use 'deployment' jobs rather than standard 'job' definitions when deploying to environments. Deployment jobs integrate with Azure DevOps Environments, providing audit history, health checks, and automated rollback strategies."
    ]
  },
  {
    "id": "q-cloud-3",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure DevOps",
      "YAML",
      "Pipelines-as-Code",
      "Best Practices"
    ],
    "title": "Why should teams choose YAML Pipelines over Classic UI Release Pipelines in Azure DevOps?",
    "pitch": "YAML pipelines implement 'Pipeline as Code', storing the pipeline definition directly in Git alongside the application code. This provides full version control, branch isolation (pipeline changes can be tested on a feature branch without breaking main), Pull Request reviews for infrastructure changes, and easy disaster recovery. Classic UI pipelines are configured via web browser clicks, cannot be branch-versioned, and make tracking configuration history painful.",
    "analogy": "YAML pipelines are a recipe printed directly on the food box: if you change the recipe for a new flavor, the instructions travel with the box. Classic UI pipelines are sticky notes posted on the kitchen refrigerator: someone can accidentally change them without anyone knowing who did it or when.",
    "deepDive": "Key Advantages of Pipeline-as-Code (YAML):\n1. Branching & Testing:\n   - When migrating to .NET 8, you update 'azure-pipelines.yml' on your feature branch to test the build. Main branch continues running .NET 7 unaffected!\n2. Pull Request Auditing:\n   - Every change to build scripts, environment variables, or deploy steps requires a code review approval before merging.\n3. Disaster Recovery & Cloning:\n   - Recreating a pipeline in a new Azure DevOps organization takes 30 seconds: just point the pipeline to the existing YAML file.\n4. Microsoft Direction:\n   - Classic pipelines are legacy and in maintenance mode. All modern features (environments, templates, container jobs) are YAML-first.",
    "codeSnippet": "# Reusable YAML Template Pattern\n# templates/build-dotnet.yml\nparameters:\n  - name: projectPath\n    type: string\n\nsteps:\n- task: DotNetCoreCLI@2\n  displayName: 'Build ${{ parameters.projectPath }}'\n  inputs:\n    command: 'build'\n    projects: '${{ parameters.projectPath }}'\n\n# Main azure-pipelines.yml consuming the template:\nsteps:\n- template: templates/build-dotnet.yml\n  parameters:\n    projectPath: 'src/Api/Api.csproj'",
    "redFlags": [
      "Configuring new production pipelines using Classic Web UI in modern projects.",
      "Hardcoding secrets or environment-specific passwords directly into YAML files.",
      "Not modularizing complex pipelines using YAML templates."
    ],
    "proTips": [
      "Leverage YAML Templates ('template: templates/step.yml'). Templates let your platform engineering team define standardized security scanning and testing steps that every microservice repo includes with 2 lines of code."
    ]
  },
  {
    "id": "q-cloud-4",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DevOps",
      "Build Artifacts",
      "Immutability",
      "Pipelines"
    ],
    "title": "How do Build Artifacts work in CI/CD, and why must they be immutable?",
    "pitch": "A Build Artifact is a compiled, versioned, deployable package (such as a zip file of compiled .NET binaries or a tagged Docker container image) produced once during the CI build stage. Immutability means the exact same artifact is promoted sequentially through Dev, QA, Staging, and Production without ever being recompiled. Recompiling per environment introduces non-deterministic risks where subtle code drifts, dependency updates, or compiler differences cause Staging and Production to behave differently.",
    "analogy": "A passport: The government prints and seals your physical passport booklet once (immutable artifact). When you travel from airport to airport (Dev, Staging, Production), border guards stamp your passport to grant entry, but nobody ever cuts open your passport and reprints your pages in each country.",
    "deepDive": "The 'Build Once, Deploy Anywhere' Golden Rule:\n1. Why Recompilation is an Anti-Pattern:\n   - If you run 'dotnet build' on Dev, and then run 'dotnet build' on Prod 3 days later, an unpinned NuGet dependency or floating patch could introduce a breaking bug only on Prod!\n2. How to Handle Environment Differences:\n   - Separate code from configuration.\n   - The compiled DLLs/container image remain IDENTICAL across all environments.\n   - Environment-specific settings (database connection strings, API keys) are injected at RUNTIME via environment variables or Azure App Service Configuration.",
    "codeSnippet": "# 1. CI Stage: Package immutable drop\n- task: DotNetCoreCLI@2\n  inputs:\n    command: 'publish'\n    publishWebProjects: true\n    arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)'\n\n- task: PublishPipelineArtifact@1\n  inputs:\n    targetPath: '$(Build.ArtifactStagingDirectory)'\n    artifact: 'ProductionReadyDrop'\n\n# 2. CD Stage: Download and deploy THE EXACT SAME DROP to multiple environments\n- stage: DeployProd\n  jobs:\n  - job: Deploy\n    steps:\n    - download: current\n      artifact: 'ProductionReadyDrop'\n    - task: AzureWebApp@1\n      inputs:\n        appType: 'webApp'\n        appName: 'my-production-app'\n        package: '$(Pipeline.Workspace)/ProductionReadyDrop/**/*.zip'",
    "redFlags": [
      "Running 'dotnet publish' separately inside each deployment stage for Dev, Staging, and Production.",
      "Baking environment-specific connection strings directly into appsettings.json inside the compiled artifact.",
      "Modifying files directly inside the compiled drop folder before deployment."
    ],
    "proTips": [
      "Follow the 12-Factor App methodology: Strictly separate configuration from code. Inject configuration via Azure App Configuration, Azure Key Vault, or Kubernetes ConfigMaps at runtime."
    ]
  },
  {
    "id": "q-cloud-5",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure DevOps",
      "Branch Policies",
      "Pull Requests",
      "Code Quality",
      "Governance"
    ],
    "title": "How do Branch Policies and Pull Request Gates enforce code quality in Azure Repos / GitHub?",
    "pitch": "Branch policies protect critical branches (like `main` and `release/*`) by blocking direct commits and requiring code to pass through Pull Request gates before merging. Standard policies include: requiring a minimum number of peer code reviewers, enforcing linked work items for traceability, requiring all reviewer comment threads to be explicitly resolved, and running automated Build Validation pipelines that ensure the code builds cleanly and passes all unit tests.",
    "analogy": "A bank vault with dual-key access: No single employee can walk into the vault and take money alone. Opening the door requires two authorized keys turned at the exact same time (peer reviews) and a log entry detailing why the vault was accessed (linked work item).",
    "deepDive": "Essential Branch Policy Checklist:\n1. Minimum Number of Reviewers:\n   - Require at least 1 or 2 approvals; automatically reset approvals when new commits are pushed to the PR branch.\n2. Build Validation:\n   - Azure DevOps automatically triggers the CI pipeline against a simulated merge commit of the PR branch into main. If tests fail, merge button is disabled!\n3. Check for Linked Work Items:\n   - Enforces that every line of code traces back to an approved user story or bug ticket in Azure Boards.\n4. Comment Resolution:\n   - Prevents merging while questions or change requests remain open.\n5. Merge Strategy:\n   - Enforce Squash Merge (keeps main branch history linear and clean) or Semi-linear Merge.",
    "codeSnippet": "# Azure CLI script to programmatically configure Branch Policies on 'main':\naz repos policy required-reviewer create   --branch main   --enabled true   --minimum-approver-count 2   --repository-id $REPO_ID\n\naz repos policy build create   --branch main   --build-definition-id $BUILD_DEF_ID   --display-name \"PR Build Validation\"   --enabled true   --queue-build-on-commit true   --repository-id $REPO_ID\n\naz repos policy comment-resolution create   --branch main   --enabled true   --repository-id $REPO_ID",
    "redFlags": [
      "Allowing developers (even admins) to push commits directly to the 'main' branch without a PR.",
      "Not resetting approvals when a developer pushes subsequent commits to an already approved PR.",
      "Ignoring build validation failures and bypassing PR gates to 'push fixes quickly'."
    ],
    "proTips": [
      "Enable 'Automatically include code reviewers' based on file paths. For example, automatically add the Senior Database Architect whenever any file under 'src/Database/Migrations/*' is touched in a PR."
    ]
  },
  {
    "id": "q-cloud-6",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure DevOps",
      "Security",
      "Azure Key Vault",
      "Secrets Management"
    ],
    "title": "How do you securely handle Secrets and integrate Azure Key Vault into CI/CD pipelines?",
    "pitch": "Secrets (passwords, connection strings, API tokens) must never be stored in plaintext in Git repositories or pipeline YAML files. In Azure DevOps, secrets are stored either as Secret Variables (which are automatically masked in build logs with '***'), Variable Groups linked directly to Azure Key Vault, or fetched dynamically during pipeline execution using Managed Identities or Workload Identity Federation with the AzureKeyVault task.",
    "analogy": "A hotel safety deposit box: Instead of leaving your passport and jewelry sitting on the bed, you lock them in the safe. The front desk gives you a temporary, expiring keycard (managed identity) that opens the safe only while you are an active guest.",
    "deepDive": "Security Architecture:\n1. Azure Key Vault Integration:\n   - Link an Azure DevOps Variable Group directly to an Azure Key Vault instance.\n   - Azure DevOps authenticates using an Azure Service Principal or Workload Identity.\n   - Pipeline reads secrets as variables (e.g. '$(DbPassword)').\n2. Secret Masking:\n   - Azure DevOps scans pipeline logs and replaces any printed secret values with '***'.\n   - Warning: If a secret is base64-encoded or split across lines, log masking can be bypassed!\n3. Zero-Trust Access:\n   - Build agents should only have read access (GET/LIST) on specific Key Vault secrets, never administrative or delete permissions.",
    "codeSnippet": "# Fetch secrets dynamically from Azure Key Vault in pipeline:\nsteps:\n- task: AzureKeyVault@2\n  displayName: 'Retrieve Production Secrets'\n  inputs:\n    azureSubscription: 'Azure-Production-ServiceConnection'\n    KeyVaultName: 'kv-ecommerce-prod'\n    SecretsFilter: 'DatabaseConnectionString, StripeApiKey'\n    RunAsPreJob: true\n\n# Consuming secrets in subsequent task:\n- task: AzureWebApp@1\n  inputs:\n    azureSubscription: 'Azure-Production-ServiceConnection'\n    appName: 'my-payment-api'\n    appSettings: '-ConnectionStrings:DefaultConnection \"$(DatabaseConnectionString)\" -Stripe:SecretKey \"$(StripeApiKey)\"'",
    "redFlags": [
      "Committing appsettings.Production.json with live database passwords into Git.",
      "Echoing secrets into pipeline logs using 'echo $(SecretVariable)'.",
      "Using personal access tokens (PATs) that never expire instead of Managed Identities."
    ],
    "proTips": [
      "Migrate your Azure DevOps Service Connections to 'Workload Identity Federation'. This eliminates client secrets and certificates entirely by using short-lived OIDC tokens exchanged between Azure DevOps and Microsoft Entra ID."
    ]
  },
  {
    "id": "q-cloud-7",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure DevOps",
      "Environments",
      "Approvals",
      "Governance",
      "CD"
    ],
    "title": "How do you configure Multi-Stage Environments and Manual Approval Gates in Azure Pipelines?",
    "pitch": "Azure DevOps Environments represent physical or logical deployment targets (Dev, QA, Staging, Production). You configure Environment Checks—such as required human approvals, business hours restrictions, Azure Monitor alert checks, and branch controls—directly on the Environment in the Azure DevOps portal. When a pipeline's deployment job targets that environment, the pipeline automatically pauses, sends approval notifications, and verifies gates before proceeding.",
    "analogy": "A rocket launch countdown: Before the booster fires, the Flight Director polls each station ('Propulsion? Go. Telemetry? Go. Medical? Go.'). If any station says 'No' or fails to respond, the launch is automatically halted.",
    "deepDive": "Environment Governance Capabilities:\n1. Approvals:\n   - Specify designated approvers (e.g. Lead Developer, QA Lead, Product Owner).\n   - Require approvers to be different from the person who submitted the PR (separation of duties).\n2. Branch Control Checks:\n   - Ensure that deployments to the 'Production' environment can ONLY originate from the 'main' or 'release/*' branches.\n3. Business Hours Restriction:\n   - Prevent deployments during high-traffic peak hours (e.g. allow prod deployments only Tuesdays to Thursdays between 6 PM and 10 PM).\n4. Invoke REST API / Azure Monitor Alerts:\n   - Query Azure Monitor to ensure staging CPU and error rates are healthy for 15 minutes before permitting production deployment.",
    "codeSnippet": "# azure-pipelines.yml targeting protected environment\n- stage: DeployProduction\n  displayName: 'Production Deployment'\n  dependsOn: DeployStaging\n  jobs:\n  - deployment: ProductionDeploy\n    displayName: 'Deploy to Production App Service'\n    pool:\n      vmImage: 'ubuntu-latest'\n    # 'production' environment has Approvals and Branch Checks configured in Azure Portal:\n    environment: 'production' \n    strategy:\n      runOnce:\n        deploy:\n          steps:\n          - script: echo \"Pipeline paused until approver clicks Approve in Azure DevOps UI!\"\n          - script: echo \"Deploying to live production...\"",
    "redFlags": [
      "Deploying straight from developer feature branches directly to Production.",
      "Having zero manual approval gates or smoke tests between Staging and Production.",
      "Allowing the developer who wrote the code to unilaterally approve their own deployment to production without peer review."
    ],
    "proTips": [
      "Combine Manual Approvals with 'Azure Monitor Alert' checks. If an active P1 alert is currently firing in Azure Monitor, the environment check will automatically fail and block the deployment until the incident is resolved."
    ]
  },
  {
    "id": "q-cloud-8",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DevOps",
      "Troubleshooting",
      "Pipeline Failures",
      "Debugging"
    ],
    "title": "How do you systematically triage and diagnose a broken CI/CD pipeline?",
    "pitch": "I diagnose pipeline failures through a systematic 4-step triage process: 1) Identify the failure category (Code/Test failure vs Infrastructure/Agent issue vs Network/Permission error); 2) Inspect the raw task logs and enable system diagnostics ('system.debug=true'); 3) Reproduce locally by running the exact CLI commands on the same operating system and .NET SDK version; and 4) If infrastructure-related, verify agent disk space, expired service connection credentials, or package registry outages.",
    "analogy": "A factory assembly line that stopped moving: First check if a defective part jammed a machine (test failure), then check if the power went out in the building (agent outage), then check if the delivery truck carrying raw materials was delayed (NuGet/NPM feed timeout).",
    "deepDive": "The 4 Failure Archetypes & Diagnosis:\n1. Code / Unit Test Failures (70% of issues):\n   - Symptoms: 'dotnet build' or 'dotnet test' exits with code 1.\n   - Action: Check test output in the Azure DevOps 'Tests' tab. Look for failed assertions or environment-specific path bugs (e.g. Linux path separator '/' vs Windows '\\').\n2. Authentication / Permission Failures (15%):\n   - Symptoms: 'HTTP 401 Unauthorized' or 'HTTP 403 Forbidden' when downloading packages or pushing to ACR.\n   - Action: Check if Azure Service Connection secret or Entra App Registration expired.\n3. Transient Network / Feed Failures (10%):\n   - Symptoms: Timeout connecting to nuget.org or npmjs.com.\n   - Action: Implement retry logic or use Azure Artifacts upstream caching.\n4. Agent Disk / Resource Exhaustion (5%):\n   - Symptoms: 'No space left on device'.\n   - Action: Clean temporary files, prune old Docker images, or increase agent disk size.",
    "codeSnippet": "# Enable System Diagnostics in Pipeline definition:\nvariables:\n  system.debug: 'true' # Outputs verbose debug logging for all tasks\n\n# Local Reproduction Steps (matching pipeline container/agent):\n# 1. Pull exact SDK container used by agent:\n# docker run -it --rm -v ${PWD}:/app -w /app mcr.microsoft.com/dotnet/sdk:8.0 bash\n\n# 2. Run the exact pipeline commands inside Linux:\n# dotnet restore\n# dotnet build --configuration Release --no-restore\n# dotnet test --configuration Release --no-build",
    "redFlags": [
      "Randomly pushing 10 'test fix' commits to main without reading the failure logs.",
      "Developing exclusively on Windows without checking if Linux build agents handle case-sensitive file paths.",
      "Assuming a failure is 'just a flaky pipeline' without investigating the root cause."
    ],
    "proTips": [
      "Remember that Microsoft-hosted Ubuntu agents have CASE-SENSITIVE file systems. A C# project referencing 'MyModel.cs' when the file is named 'mymodel.cs' compiles perfectly on Windows laptops but fails immediately on Linux CI agents!"
    ]
  },
  {
    "id": "q-cloud-9",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "DevOps",
      "Deployment Strategies",
      "Zero-Downtime",
      "Blue-Green",
      "Canary",
      "Rollback"
    ],
    "title": "How do Zero-Downtime Rollback Strategies work (Blue/Green, Canary, Slot Swaps)?",
    "pitch": "Zero-downtime deployment strategies eliminate service interruptions during releases and provide instant rollback capabilities. In Blue/Green deployments, two identical production environments exist; the new version is deployed to 'Green' and fully verified before router traffic is instantly switched from 'Blue'. Azure App Service Deployment Slots implement Blue/Green via Slot Swaps with zero downtime. Canary deployments route a small percentage of user traffic (e.g. 5%) to the new version to monitor error rates before expanding rollout.",
    "analogy": "A high-speed train switching tracks: The railway maintenance team builds a brand new parallel track (Green). Once safety inspections pass, the switchman flips a single lever to route the oncoming train onto the new track without the train ever having to slow down or stop.",
    "deepDive": "Mechanics of Azure App Service Slot Swaps:\n1. Pre-Swap Warmup:\n   - The new build deploys to the 'Staging' slot.\n   - Azure warms up the app: triggers HTTP requests to your health check endpoint ('/healthz') to compile JIT code and prime database connection pools.\n2. The Atomic IP / Virtual Router Swap:\n   - Once healthy, Azure flips the virtual IP routing rules.\n   - The Staging slot becomes Production, and previous Production becomes Staging.\n3. Instant 10-Second Rollback:\n   - If unexpected errors occur in production, execute another Slot Swap! The old, proven version is immediately restored with zero rebuild delay.\n4. Database Backward-Compatibility Requirement:\n   - Database migrations must support BOTH versions simultaneously (Expand and Contract pattern). Never drop columns in a release!",
    "codeSnippet": "# Azure App Service Slot Swap Pipeline Task\n- task: AzureAppServiceManage@0\n  displayName: 'Deploy to Staging Slot & Warm Up'\n  inputs:\n    azureSubscription: 'Azure-Production-Connection'\n    Action: 'Swap Slots'\n    WebAppName: 'ecommerce-api-prod'\n    ResourceGroupName: 'rg-ecommerce-prod'\n    SourceSlot: 'staging'\n    SwapWithProduction: true\n    # Azure warms up the application before traffic routing flips!",
    "redFlags": [
      "Deploying database schema changes that break the previous version of the application before the slot swap is verified.",
      "Deploying directly to production during business hours without warmup, causing the first 100 users to suffer 15-second cold-start latency.",
      "Not testing the instant rollback procedure regularly."
    ],
    "proTips": [
      "Use the 'Expand and Contract' (Parallel Run) database pattern: Phase 1: Add new nullable column. Phase 2: Deploy new app writing to both. Phase 3: Backfill old data. Phase 4: Deprecate and drop old column in a future release."
    ]
  },
  {
    "id": "q-cloud-10",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Containers",
      "Virtualization",
      "Linux Internals"
    ],
    "title": "What is the difference between a Docker Image and a Docker Container?",
    "pitch": "A Docker Image is a read-only, immutable template or snapshot composed of layered file systems containing the application code, runtime libraries, environment variables, and dependencies. A Docker Container is a live, running instance of an image executed in an isolated process sandbox using Linux kernel primitives: Namespaces (which isolate process IDs, networking, and mount points) and Control Groups (cgroups, which limit CPU and memory consumption).",
    "analogy": "An Image is a blueprint for a house printed on paper. A Container is the actual physical house built from that blueprint where people are living and using electricity.",
    "deepDive": "Under the Hood (Linux Kernel Primitives):\n1. Docker Image:\n   - Composed of read-only Union File System layers (Overlay2).\n   - Once built and tagged with a SHA256 digest, it can never be altered.\n2. Docker Container:\n   - Docker adds a thin, read-write 'Container Layer' on top of the read-only image layers.\n   - Any files modified while the container is running are stored in this ephemeral layer (discarded on container destroy).\n3. Namespaces vs Cgroups:\n   - Namespaces isolate what a container can SEE (Process tree, IP address, hostname, filesystem mounts).\n   - Cgroups limit what a container can USE (Max 2 CPU cores, Max 4GB RAM).",
    "codeSnippet": "# 1. Build an immutable Image from Dockerfile:\n# docker build -t my-dotnet-api:v1.0 .\n\n# 2. Inspect Image layers and size:\n# docker image history my-dotnet-api:v1.0\n\n# 3. Instantiate a live, isolated Container with CPU and memory cgroup limits:\n# docker run -d #   --name api-instance-1 #   -p 8080:8080 #   --cpus=\"1.5\" #   --memory=\"1g\" #   my-dotnet-api:v1.0\n\n# 4. View running containers and resource metrics:\n# docker ps\n# docker stats api-instance-1",
    "redFlags": [
      "Believing a Docker container is a full virtual machine with its own guest OS kernel (containers share the host OS kernel).",
      "Treating containers as persistent virtual machines by logging into them and manually modifying configuration files.",
      "Not placing memory and CPU limits on containers in production."
    ],
    "proTips": [
      "Because containers share the host Linux kernel, container startup takes milliseconds compared to minutes for VMs. This lightweight isolation is what enables instantaneous auto-scaling in Kubernetes and Azure Container Apps."
    ]
  },
  {
    "id": "q-cloud-11",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Dockerfile",
      "Layer Caching",
      "Build Optimization"
    ],
    "title": "How does Dockerfile Layer Caching work, and how do you optimize instruction order to speed up builds?",
    "pitch": "Each instruction in a Dockerfile (RUN, COPY, ADD) creates a cached, read-only filesystem layer. When rebuilding an image, Docker reuses previously cached layers unless the instruction or the files copied into it have changed. Once a layer's cache is invalidated, every subsequent layer after it must be rebuilt from scratch. To maximize build speed, order instructions from least frequently changing (base images, OS packages, NuGet restore) to most frequently changing (application source code).",
    "analogy": "Packing a layered lasagna: You lay down the pasta sheets and cheese at the bottom once (rarely change). You only swap out the fresh garnishes on top at the very end. If you stir the bottom sauce layer, you have to rebuild the entire lasagna from scratch.",
    "deepDive": "The Cache Invalidation Domino Effect:\n1. Cache Invalidation Rules:\n   - For 'RUN', Docker checks if the exact command string matches the cache.\n   - For 'COPY', Docker calculates a checksum of the files being copied.\n2. The Anti-Pattern:\n   - 'COPY . .' before 'RUN dotnet restore' invalidates the NuGet restore cache on EVERY single character typed in a C# file!\n   - Result: 3-minute build time on every commit.\n3. The Optimized Pattern:\n   - Copy ONLY '.csproj' and '.sln' files first.\n   - Run 'dotnet restore'.\n   - THEN copy the remaining source code ('COPY . .').\n   - Result: NuGet packages are cached; rebuild takes 4 seconds!",
    "codeSnippet": "# ❌ BAD DOCKERFILE: Copies everything before restore\n# COPY . .\n# RUN dotnet restore # Re-downloads NuGet packages on EVERY code change!\n\n# ✅ HIGHLY OPTIMIZED DOCKERFILE:\nFROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\nWORKDIR /src\n\n# Step 1: Copy ONLY project files (changes rarely)\nCOPY [\"src/Api/Api.csproj\", \"src/Api/\"]\nCOPY [\"src/Core/Core.csproj\", \"src/Core/\"]\n\n# Step 2: Restore NuGet dependencies (Cached unless .csproj changes!)\nRUN dotnet restore \"src/Api/Api.csproj\"\n\n# Step 3: Copy source code (changes frequently)\nCOPY . .\nWORKDIR \"/src/src/Api\"\nRUN dotnet build \"Api.csproj\" -c Release -o /app/build",
    "redFlags": [
      "Copying the entire source repository before running dependency restore ('COPY . .').",
      "Running 'apt-get update' and 'apt-get install' in separate RUN instructions (can result in stale package caches).",
      "Not including a '.dockerignore' file, causing 'bin/', 'obj/', and '.git/' to be copied into the image."
    ],
    "proTips": [
      "Always maintain a clean '.dockerignore' file containing '**/bin', '**/obj', '.git', and '*.user'. This prevents local machine build artifacts from polluting the container build context."
    ]
  },
  {
    "id": "q-cloud-12",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Multi-Stage",
      "Security",
      "Optimization",
      ".NET 8"
    ],
    "title": "Why are Multi-Stage Docker Builds essential for .NET applications, and how do they reduce image size and attack surface?",
    "pitch": "Multi-Stage builds use multiple `FROM` instructions in a single Dockerfile. A heavy build stage (using the full .NET SDK ~800MB) compiles the code, executes tests, and publishes binaries; a minimal runtime stage (using the lightweight ASP.NET Core Runtime or Chiseled Ubuntu ~100MB) copies only the final published DLLs. This shrinks the production image size by over 80%, eliminates compilers and package managers from production, and drastically reduces the security attack surface and CVE vulnerabilities.",
    "analogy": "A construction crane on a building site: You need massive scaffolding, heavy cranes, and cement mixers to build a skyscraper. Once the building is finished, you remove all the construction machinery; tenants don't need a 50-ton crane sitting in their living room.",
    "deepDive": "Architectural Benefits:\n1. Image Size Reduction:\n   - .NET SDK Image: ~850 MB.\n   - .NET ASP.NET Runtime: ~220 MB.\n   - .NET Chiseled (Distroless): ~100 MB!\n2. Security Hardening:\n   - No compiler ('csc' / 'dotnet build') in production.\n   - No package managers ('apt', 'yum', 'npm') that attackers can use to install malware after a remote code execution exploit.\n   - Runs as a non-root user by default in .NET 8+.\n3. Portability:\n   - The entire build environment is containerized; developers don't even need the .NET SDK installed on their host machines to build the app.",
    "codeSnippet": "# Stage 1: Heavy Build Environment (.NET SDK)\nFROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env\nWORKDIR /app\n\nCOPY *.csproj ./\nRUN dotnet restore\n\nCOPY . ./\nRUN dotnet publish -c Release -o /app/out --no-restore\n\n# Stage 2: Minimal Production Runtime (Distroless / Non-Root)\nFROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS runtime\nWORKDIR /app\nCOPY --from=build-env /app/out .\n\n# Runs as non-root user 'app' (UID 1654) by default in .NET 8!\nUSER app\nEXPOSE 8080\nENTRYPOINT [\"dotnet\", \"MyApi.dll\"]",
    "redFlags": [
      "Shipping the entire .NET SDK image to production.",
      "Running production containers as the 'root' user.",
      "Leaving source code, git metadata, and build tools inside the production container."
    ],
    "proTips": [
      "In .NET 8+, use the Microsoft 'chiseled' images ('mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled'). They contain zero package managers and zero shell binaries ('/bin/sh' does not exist!), completely neutralizing shell injection attacks."
    ]
  },
  {
    "id": "q-cloud-13",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Networking",
      "Ports",
      "EXPOSE",
      "Port Mapping"
    ],
    "title": "What is the difference between EXPOSE in a Dockerfile and Port Mapping (-p host:container)?",
    "pitch": "EXPOSE is documentation metadata inside the Dockerfile indicating which port the application inside the container is listening on; it does NOT publish or open the port to the outside world. Port Mapping (-p hostPort:containerPort) is an active Docker runtime command that configures host network routing and firewall iptables rules, actively forwarding incoming traffic from a physical host port into the container's private IP network.",
    "analogy": "EXPOSE is painting 'Main Entrance on 5th Street' on your building wall (informational sign). Port Mapping is unlocking the front door, stationing a doorman, and connecting a private pedestrian bridge from 5th Street directly into your lobby.",
    "deepDive": "Networking Mechanics:\n1. Dockerfile 'EXPOSE 8080':\n   - Functions as documentation for developers and container orchestrators.\n   - Does NOT make the port accessible from the host machine browser.\n2. Runtime '-p 5000:8080':\n   - Tells Docker engine to bind port 5000 on the host machine network interface.\n   - When a browser hits 'http://localhost:5000', Docker bridges the request to port 8080 inside the container's isolated network namespace.\n3. .NET 8 Port Change:\n   - In .NET 8+, ASP.NET Core default HTTP port changed from port 80 to port 8080 to enable non-root user execution (ports below 1024 require Linux root privileges).",
    "codeSnippet": "# In Dockerfile:\n# Tells Docker and Azure that the app listens on 8080\nEXPOSE 8080\n\n# Shell execution to run container and map host port 5000 -> container port 8080:\n# docker run -d -p 5000:8080 --name myapi my-dotnet-api:latest\n\n# Verifying port forwarding rules:\n# docker port myapi\n# Output: 8080/tcp -> 0.0.0.0:5000",
    "redFlags": [
      "Assuming adding 'EXPOSE 8080' to a Dockerfile automatically makes the container accessible on 'http://localhost:8080' without port mapping.",
      "Binding production containers to host port 80 without SSL/TLS termination at the reverse proxy or ingress controller.",
      "Trying to bind multiple containers to the exact same host port simultaneously (Port conflict error)."
    ],
    "proTips": [
      "Always remember the '-p host:container' order: Left is where you connect from on your computer (Host), Right is where the service listens inside Docker (Container)."
    ]
  },
  {
    "id": "q-cloud-14",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Storage",
      "Volumes",
      "Bind Mounts",
      "Statefulness"
    ],
    "title": "How does Container Data Persistence work (Volumes vs Bind Mounts vs Ephemeral Storage)?",
    "pitch": "By default, container storage is ephemeral: any data written to the container's writable layer is permanently destroyed when the container is deleted. Docker Volumes are directories managed entirely by Docker on the host filesystem—they are isolated from host OS details, support backup/encryption, and are the standard for databases and persistent application state. Bind Mounts map an exact file or directory path from the host machine directly into the container—ideal for local development hot-reloading.",
    "analogy": "Ephemeral storage is writing on a hotel room notepad: when you check out, the maid throws it in the trash. A Bind Mount is opening a window to your own house across the street to grab a folder. A Docker Volume is renting a climate-controlled private storage locker managed by professional staff.",
    "deepDive": "Storage Mechanism Breakdown:\n1. Ephemeral Container Layer:\n   - Copy-on-Write (CoW) layer. High write latency, destroyed on 'docker rm'.\n2. Docker Volumes ('-v volume_name:/data'):\n   - Stored in '/var/lib/docker/volumes/' on Linux.\n   - Independent of container lifecycle: container can be destroyed and recreated; data remains intact.\n   - Recommended for SQL Server, PostgreSQL, Redis persistence.\n3. Bind Mounts ('-v /host/path:/container/path'):\n   - Relies on host folder structure.\n   - Great for mounting source code into containers during local development ('dotnet watch').\n4. 12-Factor Stateless Rule:\n   - For web APIs, containers should be 100% STATELESS. Store files in Azure Blob Storage / AWS S3, not on local disks.",
    "codeSnippet": "# 1. Named Volume for SQL Server Database Persistence:\n# docker volume create sqlserver_data\n# docker run -d #   --name mssql #   -e \"ACCEPT_EULA=Y\" #   -e \"MSSQL_SA_PASSWORD=P@ssword123!\" #   -v sqlserver_data:/var/opt/mssql #   -p 1433:1433 #   mcr.microsoft.com/mssql/server:2022-latest\n\n# 2. Bind Mount for Local Development Hot-Reload:\n# docker run -it --rm #   -v ${PWD}:/app #   -w /app #   mcr.microsoft.com/dotnet/sdk:8.0 #   dotnet watch run",
    "redFlags": [
      "Storing persistent files (e.g. uploaded user PDFs or avatars) inside the ephemeral container file system.",
      "Using bind mounts in production Kubernetes/Azure Container Apps environments.",
      "Hardcoding Windows-specific file paths inside Docker volume mounts."
    ],
    "proTips": [
      "In cloud-native microservices, treat containers as disposable cattle, not pets. Never rely on container local disk persistence for application state; offload all files to object storage (Azure Blob Storage) and state to managed databases."
    ]
  },
  {
    "id": "q-cloud-15",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Docker",
      "Health Checks",
      "Logging",
      "Observability",
      "ASP.NET Core"
    ],
    "title": "How do you implement Container Health Checks and capture diagnostic logs effectively?",
    "pitch": "A container health check allows the container runtime and orchestrators to determine whether the application inside the container is actively healthy, degraded, or dead. In ASP.NET Core, we expose a `/healthz` endpoint using `Microsoft.Extensions.Diagnostics.HealthChecks` and register a `HEALTHCHECK` command in the Dockerfile. For logging, applications must write structured JSON logs directly to `stdout` and `stderr`; Docker captures this output into its logging driver without requiring file I/O.",
    "analogy": "A submarine sonar ping: The control tower sends a ping every 30 seconds. If the submarine responds with an authentic status tone, the mission continues. If the submarine stops answering, the system automatically launches an emergency rescue buoy (orchestrator restarts the container).",
    "deepDive": "Health Checks & Logging Architecture:\n1. HEALTHCHECK Directive:\n   - Parameters: '--interval=30s --timeout=3s --start-period=5s --retries=3'.\n   - Status transitions from starting -> healthy -> unhealthy.\n   - Unhealthy containers are marked for automatic recycling by Kubernetes/Azure Container Apps.\n2. Logging to stdout / stderr (12-Factor Principle XI):\n   - Never write application logs to internal text files ('C:\\logs\\app.log').\n   - Writing to console allows Docker, Azure Log Analytics, Datadog, or Fluentd to stream and aggregate logs centrally without disk contention.",
    "codeSnippet": "// 1. ASP.NET Core Program.cs Health Checks Setup\nvar builder = WebApplication.CreateBuilder(args);\n\nbuilder.Services.AddHealthChecks()\n    .AddSqlServer(builder.Configuration.GetConnectionString(\"DefaultConnection\")!)\n    .AddCheck(\"Self\", () => HealthCheckResult.Healthy());\n\nvar app = builder.Build();\n\napp.MapHealthChecks(\"/healthz\");\napp.Run();\n\n# 2. Dockerfile HEALTHCHECK instruction\nHEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\\n  CMD curl -f http://localhost:8080/healthz || exit 1",
    "redFlags": [
      "Writing application logs to physical disk files inside the container instead of stdout.",
      "Exposing health check endpoints that perform heavy database queries without caching or timeouts, causing false-positive pod restarts.",
      "Not configuring a 'start-period' on health checks, causing slow-starting apps to be killed prematurely."
    ],
    "proTips": [
      "Separate Liveness checks ('Am I alive and not deadlocked?') from Readiness checks ('Are my database migrations finished and am I ready to receive user traffic?'). In ASP.NET Core, you can map separate endpoints: '/healthz/live' and '/healthz/ready'."
    ]
  },
  {
    "id": "q-cloud-16",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "Azure",
      "Azure Container Apps",
      "App Service",
      "Deployment",
      "Architecture"
    ],
    "title": "How do you deploy containerized .NET applications to Azure (Container Apps vs App Service)?",
    "pitch": "Azure Container Apps (ACA) is a serverless container platform built on Kubernetes (KEDA + Envoy + Dapr); it is ideal for microservices, background event-driven workers, and apps requiring scale-to-zero cost savings. Azure App Service for Containers is an enterprise PaaS offering ideal for standalone web applications that require simple deployment slots, integrated custom domains, and traditional enterprise networking without orchestrator complexity.",
    "analogy": "Azure App Service is renting an apartment in a luxury high-rise: everything is fully furnished, utilities are included, and maintenance is handled for you. Azure Container Apps is renting a modular shipping container home in an eco-village: it expands or shrinks automatically based on how many friends visit, and costs nothing when you are away.",
    "deepDive": "Decision Matrix:\n1. Azure Container Apps (ACA):\n   - Built on top of managed Kubernetes and KEDA (Kubernetes Event-driven Autoscaling).\n   - Can scale to ZERO replicas (zero cost when idle!).\n   - Native microservice features: Dapr service-to-service communication, internal ingress, revision management.\n2. Azure App Service (Containers):\n   - Traditional PaaS.\n   - Minimum 1 running VM instance (incurring fixed monthly cost).\n   - Best for traditional monolithic ASP.NET Core web apps with deployment slots and straightforward SSL bindings.",
    "codeSnippet": "# Azure CLI deployment to Azure Container Apps\n# 1. Create Azure Container Registry (ACR) & Container App Environment\naz acr create --resource-group rg-microservices --name acrmyapi --sku Basic\n\n# 2. Build and push image to ACR:\naz acr build --registry acrmyapi --image ecommerce-api:v1.0 .\n\n# 3. Deploy to serverless Azure Container App:\naz containerapp create   --name ecommerce-api   --resource-group rg-microservices   --environment my-env   --image acrmyapi.azurecr.io/ecommerce-api:v1.0   --target-port 8080   --ingress 'external'   --min-replicas 0   --max-replicas 10   --cpu 0.5 --memory 1.0Gi",
    "redFlags": [
      "Deploying complex microservices suites with 15 interconnected APIs directly onto monolithic App Service plans.",
      "Leaving container images in public Docker Hub instead of private Azure Container Registry (ACR).",
      "Not configuring min/max replica boundaries on autoscaling container apps."
    ],
    "proTips": [
      "In Azure Container Apps, use KEDA autoscalers. You can scale your background worker containers automatically based on the number of unread messages in an Azure Service Bus queue, scaling up to 50 workers during sales and down to 0 when empty."
    ]
  },
  {
    "id": "q-cloud-17",
    "pillar": "cloud",
    "seniority": "Senior",
    "tags": [
      "Kubernetes",
      "Architecture",
      "Interview Strategy",
      "Containers",
      "DevOps"
    ],
    "title": "How do you explain Kubernetes and Container Orchestration honestly without overclaiming in an interview?",
    "pitch": "As a Senior .NET Developer, my core expertise is designing cloud-native, 12-factor containerized microservices, writing optimized Dockerfiles, configuring health endpoints, and setting up CI/CD pipelines. While I understand Kubernetes architecture—Pods as the atomic unit of execution, Deployments managing desired replica state, Services routing internal traffic, and Ingress controllers handling SSL termination—I work closely with dedicated Platform/DevOps engineers who manage the production cluster infrastructure, Helm charts, and network policies.",
    "analogy": "A commercial airline pilot: You are an expert at flying the plane, navigating the instruments, and communicating with air traffic control. You don't claim to have personally manufactured the jet engine turbines or laid down the concrete runway tarmac.",
    "deepDive": "The Senior 'Honest Fallback' Formula:\n1. Acknowledge the Architecture Confidently:\n   - Pod: The smallest deployable unit; wraps one or more containers sharing an IP and network localhost.\n   - Deployment: Manages replica sets, declarative updates, and rolling rollbacks.\n   - Service (ClusterIP / LoadBalancer): Provides a permanent virtual IP and DNS name across ephemeral pod lifecycles.\n   - Ingress: Reverse proxy (Nginx, Traefik) routing external HTTP/HTTPS traffic to internal services.\n2. State Your Exact Practical Boundaries:\n   - 'In my projects, I build and debug the containerized services, configure KEDA triggers, inspect pod logs via 'kubectl logs', and write deployment YAML manifests, while our SRE team handles cluster upgrades and security admission controllers.'",
    "codeSnippet": "# Standard Kubernetes Deployment Manifest for a .NET API\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\n  labels:\n    app: order-service\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: order-service\n  template:\n    metadata:\n      labels:\n        app: order-service\n    spec:\n      containers:\n      - name: api\n        image: acrmyapi.azurecr.io/orders:v1.0\n        ports:\n        - containerPort: 8080\n        resources:\n          limits:\n            cpu: \"1\"\n            memory: \"512Mi\"\n          requests:\n            cpu: \"250m\"\n            memory: \"256Mi\"\n        livenessProbe:\n          httpGet:\n            path: /healthz\n            port: 8080\n          initialDelaySeconds: 15\n          periodSeconds: 20",
    "redFlags": [
      "Overclaiming full CKA (Certified Kubernetes Administrator) expertise when you only know how to run 'docker run'.",
      "Claiming you manage bare-metal Kubernetes clusters single-handedly on top of writing 100% of full-stack code.",
      "Not knowing the difference between a Pod and a Container."
    ],
    "proTips": [
      "Interviewers respect honesty. Saying 'I know the core Kubernetes workload concepts (Pods, Deployments, Services, ConfigMaps) and can troubleshoot applications via kubectl, but my specialty is application development rather than cluster networking' earns massive credibility."
    ]
  },
  {
    "id": "q-cloud-18",
    "pillar": "cloud",
    "seniority": "Mid-to-Senior",
    "tags": [
      "DevOps",
      "IaC",
      "Azure Bicep",
      "Terraform",
      "Cloud Architecture"
    ],
    "title": "What is Infrastructure as Code (IaC), and why should .NET teams use Bicep or Terraform?",
    "pitch": "Infrastructure as Code (IaC) defines and provisions cloud resources (App Services, SQL Databases, Key Vaults) using declarative code files rather than manual Azure portal clicks. Bicep is Microsoft's domain-specific language for Azure, offering zero-state management, day-zero Azure feature support, and clean syntax. Terraform is cloud-agnostic and maintains an external state file. IaC guarantees consistent, reproducible environments, eliminates configuration drift, and allows infrastructure changes to be audited through Pull Requests.",
    "analogy": "A 3D printer file for car parts: Instead of a mechanic manually hammering and bending sheet metal by hand differently for every single car (portal clicks), you send an exact CAD blueprint to the 3D printer. Every single part produced is 100% mathematically identical.",
    "deepDive": "Bicep vs Terraform for .NET on Azure:\n1. Azure Bicep:\n   - Native to Azure; compiles down to ARM templates.\n   - Day-Zero Support: Every new Azure feature is supported immediately on launch day.\n   - No State File: Azure itself represents the live state engine.\n2. Terraform:\n   - Multi-cloud (Azure, AWS, GCP).\n   - Requires managing a 'terraform.tfstate' file (locked in remote storage with concurrency protection).\n3. Core IaC Benefits:\n   - Spin up an identical ephemeral testing environment for a PR in 5 minutes and tear it down automatically.\n   - Disaster recovery: Rebuild an entire cloud region if a datacenter goes dark.",
    "codeSnippet": "// Azure Bicep definition: Provisioning an App Service & Key Vault\nparam location string = resourceGroup().location\nparam appName string = 'ecommerce-api-${uniqueString(resourceGroup().id)}'\n\nresource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {\n  name: '${appName}-plan'\n  location: location\n  sku: {\n    name: 'B1'\n    tier: 'Basic'\n  }\n}\n\nresource appService 'Microsoft.Web/sites@2022-09-01' = {\n  name: appName\n  location: location\n  properties: {\n    serverFarmId: appServicePlan.id\n    siteConfig: {\n      netFrameworkVersion: 'v8.0'\n      appSettings: [\n        {\n          name: 'ASPNETCORE_ENVIRONMENT'\n          value: 'Production'\n        }\n      ]\n    }\n  }\n}",
    "redFlags": [
      "Provisioning production cloud infrastructure by clicking manually in the Azure Portal (ClickOps).",
      "Storing Terraform state files unencrypted in public repositories.",
      "Not reviewing infrastructure code changes in Pull Requests."
    ],
    "proTips": [
      "If your stack is exclusively on Microsoft Azure, choose Azure Bicep over Terraform. Bicep has zero state-locking headaches, offers first-class VS Code intellisense, and guarantees immediate support for all Azure preview features."
    ]
  }
];
