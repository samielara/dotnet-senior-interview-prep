# ⚡ .NET Senior Full-Stack Interview Preparation Platform (3–8+ YOE)

A production-grade, interactive single-page application (SPA) engineered specifically for preparing for Mid-to-Senior Full-Stack .NET Developer (3–8+ YOE) technical and coding interviews.

Live interactive platform designed with a dark-theme glassmorphism developer UI, procedural Web Audio synthesizer, live code refactoring test runner, timed mock simulator with rubrics, system design whiteboard blueprints, and spaced-repetition flashcards.

---

## 🏛️ The 5 Pillars Curriculum Coverage

### 1. C# Internals & Concurrency
- **Task vs ValueTask**: Allocation mechanics, state machine structs, synchronous fast paths, and the hazards of multiple awaits (`.AsTask()`).
- **Async/Await Under the Hood**: Roslyn compiler state machine lowering (`IAsyncStateMachine`, `MoveNext()`, `AsyncTaskMethodBuilder`, `ExecutionContext` vs `SynchronizationContext`).
- **CLR Garbage Collection**: Gen 0/1/2 ephemeral segments, mark-sweep-compact, the 85,000-byte LOH threshold, POH (Pinned Object Heap in .NET 5+), and `ArrayPool<T>`.
- **Span<T> & Memory<T>**: `ref struct` stack-only guarantees, interior pointers, why Span cannot be boxed or used across awaits, and `Memory<T>` for async pipelines.
- **Records & Pattern Matching**: Positional records, value-based equality, non-destructive mutation (`with`), property, relational, and list patterns.
- **Async Synchronization**: `SemaphoreSlim` vs `lock`, non-blocking `WaitAsync()`, and concurrency throttling without thread starvation.
- **High-Throughput Channels**: `System.Threading.Channels`, bounded capacity backpressure, and lock-free circular ring buffers.

### 2. ASP.NET Core & Web APIs
- **Middleware Pipeline**: `RequestDelegate` execution order, short-circuiting, branching (`Map`, `MapWhen`), and RFC 7807 global exception handling.
- **Dependency Injection**: Transient, Scoped, and Singleton lifetimes; Captive Dependency prevention (`ValidateScopes = true`), and resolving scoped services via `IServiceScopeFactory`.
- **IHttpClientFactory**: TIME_WAIT socket exhaustion, stale DNS resolution, message handler rotation, and `SocketsHttpHandler.PooledConnectionLifetime`.
- **JWT & Token Rotation**: Stateless access tokens, HttpOnly secure cookies, Refresh Token Rotation with automated reuse detection and token family revocation.
- **Clean Architecture & CQRS**: Onion/Hexagonal boundaries, MediatR pipeline behaviors (`IPipelineBehavior`) for validation, logging, and transactions.
- **Rate Limiting (.NET 8)**: Fixed Window, Sliding Window, Token Bucket, and Concurrency Limiter partitioned by Client ID or IP.
- **Output Caching**: .NET 8 server-side output caching, tag-based eviction (`EvictByTagAsync`), and cache stampede mitigation.

### 3. SQL Server & EF Core
- **Index Structures**: Clustered index (leaf = data pages) vs Non-Clustered index (leaf = row locator), and avoiding Key Lookups.
- **Covering Indexes**: The `INCLUDE` clause for leaf-level columns to bypass the 1,700-byte key limit and eliminate bookmark lookups.
- **SARGable Queries**: Why functions on indexed columns (`YEAR()`, `UPPER()`, `ISNULL()`) degrade B-Tree seeks to table scans, and half-open date interval patterns.
- **Isolation Levels & RCSI**: Read Committed Snapshot Isolation (RCSI) using tempdb row versioning to eliminate reader-writer blocking.
- **Change Tracker Overhead**: Identity map, snapshot copying, and 40–60% performance gains with `.AsNoTracking()` / `.AsNoTrackingWithIdentityResolution()`.
- **Eliminating N+1 Queries**: Eager loading (`.Include()`), projection (`.Select()`), and `.AsSplitQuery()` to prevent Cartesian explosions.
- **Optimistic Concurrency**: SQL Server `RowVersion` / `byte[]`, `DbUpdateConcurrencyException`, and conflict resolution strategies.
- **Dapper Hybrid CQRS**: Combining EF Core for domain write aggregates with Dapper for ultra-fast read DTO hydration.

### 4. Frontend (React 19 & TypeScript)
- **Fiber Architecture**: Virtual DOM diffing, singly-linked list fiber tree, double buffering (`current` vs `workInProgress`), and Lane scheduling.
- **Concurrent Features**: `useTransition`, `useDeferredValue`, non-blocking state updates, and React 19 Server Actions (`useActionState`).
- **Hooks & Closures**: Stale closure traps in `useEffect`, cleanup functions, and the latest-ref pattern (`useRef`).
- **State Management**: Zustand vs Redux Toolkit vs React Context (fine-grained atomic selectors vs subtree re-renders).
- **List Virtualization**: Windowing 100,000 rows with 60 FPS performance, calculating scroll offsets, and recycling DOM nodes.
- **TypeScript Type System**: Discriminated Unions with exhaustive checking (`never`), and advanced utility types (`ReturnType`, `Parameters`, `infer`, mapped types).

### 5. Azure DevOps & Cloud CI/CD
- **Multi-Stage YAML Pipelines**: Build, Test, Security (SonarQube/Trivy), Staging, and Production stages with Environments and approval gates.
- **App Service Deployment Slots**: Zero-downtime blue/green deployments, warmup probes (`applicationInitialization`), and instant IP rollback.
- **Managed Identities**: Passwordless authentication to Azure SQL and Key Vault using `DefaultAzureCredential()`.
- **Ubuntu Chiseled Containers**: Distroless `<100MB` Docker images (`mcr.microsoft.com/dotnet/aspnet:8.0-chiseled`), non-root user, zero shell attack surface.
- **Service Bus & Transactional Outbox**: Eliminating dual-write distributed transaction failures, local ACID outbox table, and idempotent consumers.

---

## 🚀 Quickstart & Running Locally

### Option A: Python (Standard)
```bash
python server.py
```
*Automatically binds to `http://localhost:5050` and launches your browser.*

### Option B: Node.js (Fallback)
```bash
node server.js
```
*Automatically binds to `http://localhost:5050` and launches your browser.*

---

## 🛠️ Project Structure

```
dotnet-senior-interview-prep/
├── index.html                 # Complete Single Page Application UI
├── css/
│   └── styles.css             # Glassmorphism dark theme, syntax styling, responsive layout
├── js/
│   ├── data/
│   │   ├── questions.js       # 53 High-Yield senior questions with 5-part architecture
│   │   ├── challenges.js      # 5 Interactive code refactoring & bug-fixing challenges
│   │   ├── architectures.js   # 4 System design whiteboard blueprints with inspectable nodes
│   │   └── flashcards.js      # 40 Rapid-fire spaced-repetition cards across all 5 pillars
│   ├── audio.js               # Procedural Web Audio API sound synthesizer (zero external files)
│   └── app.js                 # SPA router, state manager, mock simulator, code editor runner
├── server.py                  # Zero-dependency Python HTTP server (Port 5050 + auto-browser)
├── server.js                  # Zero-dependency Node HTTP server (Port 5050 + auto-browser fallback)
└── README.md                  # Platform documentation
```

---

## 🌐 Deploying to GitHub Pages

1. Initialize Git and commit all files:
```bash
cd dotnet-senior-interview-prep
git init
git add .
git commit -m "Initial release of .NET Senior Interview Prep Platform"
```

2. Add remote origin and push to GitHub:
```bash
git remote add origin https://github.com/samielara/dotnet-senior-interview-prep.git
git branch -M main
git push -u origin main
```

3. Enable GitHub Pages:
- In GitHub, go to **Settings > Pages**
- Under **Build and deployment > Source**, select **Deploy from a branch**
- Select branch: `main`, folder: `/ (root)`, and click **Save**
- Your platform will be live at:
  `https://samielara.github.io/dotnet-senior-interview-prep/`
