// ============================================================================
// SYSTEM DESIGN WHITEBOARDS DATA
// Interactive architectural blueprints with inspectable components
// ============================================================================

window.SYSTEM_ARCHITECTURES = [
  {
    id: "distributed-saga",
    title: "1. Distributed E-Commerce Saga (Choreography & Outbox)",
    pillar: "Cloud & Microservices",
    description: "Production microservices transaction pattern replacing 2-Phase Commit (2PC) with asynchronous eventual consistency, compensating transactions, and Transactional Outbox to prevent dual-write bugs.",
    summary: "Guarantees cross-service consistency between Order, Payment, and Inventory services using MassTransit, RabbitMQ / Azure Service Bus, and Postgres/SQL Server Outbox tables.",
    nodes: [
      {
        id: "api-gateway",
        name: "YARP / API Gateway",
        category: "Gateway",
        protocol: "HTTPS / HTTP/2",
        latency: "p99 < 15ms",
        role: "Edge routing, rate limiting (.NET 8 TokenBucket), JWT verification, and SSL termination.",
        failureModes: "Gateway CPU saturation; Downstream timeout.",
        mitigation: "Autoscale instances, circuit breaker with Polly, fail-fast timeout (3s).",
        talkingPoints: [
          "Why YARP over NGINX: Native C# extensibility, high throughput, direct integration with ASP.NET Core middleware.",
          "Rate Limiting: TokenBucket algorithm partitioned by ClientId / IP with 429 Retry-After header."
        ]
      },
      {
        id: "order-service",
        name: "Order Service (Agg Root)",
        category: "Microservice",
        protocol: "ASP.NET Core 8 / EF Core",
        latency: "p99 < 40ms",
        role: "Coordinates Order Aggregate state machine. Writes Order entity and Outbox message in a single database transaction.",
        failureModes: "Dual-write failure (DB succeeds but message broker publish fails).",
        mitigation: "Transactional Outbox Pattern guarantees at-least-once message publishing without distributed 2PC locks.",
        talkingPoints: [
          "Eliminating the 2PC Anti-Pattern: Distributed transactions hold database locks across network boundaries, destroying scalability.",
          "State Machine: Order states: Submitted -> PaymentPending -> Confirmed / Cancelled (Compensating)."
        ]
      },
      {
        id: "order-outbox-db",
        name: "Order DB & Outbox Table",
        category: "Storage",
        protocol: "TDS / SQL Server (RCSI)",
        latency: "p99 < 5ms",
        role: "ACID store holding Orders and OutboxMessage records. Background worker polls or CDC streams messages to broker.",
        failureModes: "Outbox table growth and contention; slow polling.",
        mitigation: "Use MassTransit outbox with indexed 'ProcessedAt' column or Debezium CDC streaming to message broker.",
        talkingPoints: [
          "RCSI (Read Committed Snapshot Isolation) avoids readers blocking writers during heavy order surges.",
          "MassTransit Outbox: Automatically captures domain events emitted inside EF Core DbContext SaveChangesAsync."
        ]
      },
      {
        id: "message-bus",
        name: "Azure Service Bus / RabbitMQ",
        category: "Messaging",
        protocol: "AMQP 1.0",
        latency: "p99 < 20ms",
        role: "Durable event bus routing 'OrderSubmittedEvent', 'PaymentCompletedEvent', and 'PaymentFailedEvent' topics.",
        failureModes: "Broker partition outage, poison messages crashing consumer.",
        mitigation: "Dead-Letter Queues (DLQ) with exponential backoff retry policy (5 retries + jitter) and message deduplication via MessageId.",
        talkingPoints: [
          "Topics vs Queues: 1-to-many publish-subscribe pattern allows Audit, Analytics, and Inventory to subscribe independently.",
          "Partitioning & Message Ordering: Partition by OrderId (SessionId) to guarantee sequential processing per customer order."
        ]
      },
      {
        id: "payment-service",
        name: "Payment Service & Gateway",
        category: "Microservice",
        protocol: "gRPC / HTTPS",
        latency: "p99 < 250ms (3rd party)",
        role: "Consumes OrderSubmittedEvent, charges payment provider (Stripe/Adyen) with idempotency key, emits PaymentCompleted/Failed.",
        failureModes: "Payment gateway timeout; network drop after card charge.",
        mitigation: "Unique Idempotency-Key header passed to Stripe; idempotent consumer table tracking processed OrderIds.",
        talkingPoints: [
          "Idempotent Consumer: Store processed MessageId in local DB; if duplicate arrives, acknowledge immediately without re-charging.",
          "Compensating Action: If payment fails, emit PaymentFailedEvent, triggering Order Service to mark status 'Cancelled' and unlock inventory."
        ]
      },
      {
        id: "inventory-service",
        name: "Inventory Service (Reservations)",
        category: "Microservice",
        protocol: "ASP.NET Core / Redis",
        latency: "p99 < 10ms",
        role: "Holds inventory reservations. Releases stock if payment fails (compensating transaction).",
        failureModes: "Race condition on last item in stock.",
        mitigation: "Redis Lua script or SQL optimistic concurrency 'UPDATE Stock SET Qty = Qty - 1 WHERE Sku = @sku AND Qty >= 1'.",
        talkingPoints: [
          "Choreography vs Orchestration: Choreography (events) is decentralized and loosely coupled; Orchestration (Temporal / MassTransit State Machine Saga) is better for 10+ complex step workflows."
        ]
      }
    ],
    flowSteps: [
      "1. Client POSTs /orders -> YARP forwards to Order Service.",
      "2. Order Service begins local ACID transaction: Inserts Order (Status: Submitted) + Inserts Outbox record.",
      "3. MassTransit Outbox worker pushes 'OrderSubmittedEvent' to Azure Service Bus Topic.",
      "4. Payment Service and Inventory Service consume event in parallel.",
      "5. Payment Service charges gateway using Idempotency-Key; emits 'PaymentCompletedEvent'.",
      "6. Order Service consumes event, updates Order status to 'Confirmed', and pushes email notification."
    ]
  },
  {
    id: "signalr-scaleout",
    title: "2. Horizontally Scaled Real-Time SignalR Hub",
    pillar: "ASP.NET Core & Real-Time",
    description: "High-scale bidirectional real-time push architecture for 100,000+ concurrent WebSockets across a load-balanced ASP.NET Core cluster using Azure SignalR Service and Redis Backplane.",
    summary: "Solves WebSocket sticky session termination, connection memory overhead, and cross-server broadcast distribution.",
    nodes: [
      {
        id: "clients-browser",
        name: "React / Mobile Clients",
        category: "Client",
        protocol: "WebSocket (fallback to SSE / Long Polling)",
        latency: "p99 < 5ms",
        role: "Establishes persistent bidirectional connection to SignalR hub for live stock quotes, notifications, or chat.",
        failureModes: "Network disconnects during mobile cellular switching.",
        mitigation: "SignalR client automatic reconnect policy with exponential backoff: [0, 2000, 10000, 30000]ms.",
        talkingPoints: [
          "Transport Negotiation: WebSockets -> Server-Sent Events -> Long Polling fallback matrix.",
          "MessagePack Protocol: Replaces JSON serialization with binary MessagePack, shrinking payload size by 60% and reducing GC allocations."
        ]
      },
      {
        id: "azure-signalr",
        name: "Azure SignalR Service (Fully Managed)",
        category: "PaaS Backplane",
        protocol: "WebSocket / HTTPS",
        latency: "p99 < 15ms",
        role: "Offloads 100,000+ persistent WebSocket connections from App Service servers. Handles SSL handshakes and connection heartbeats.",
        failureModes: "Service unit throttling if message quota exceeded.",
        mitigation: "Autoscale units based on connection count and message throughput metrics.",
        talkingPoints: [
          "Why Not Self-Hosted WebSockets on App Service: Holding 100k open WebSockets consumes gigabytes of server RAM and ties up ephemeral TCP ports.",
          "Serverless Mode vs Default Mode: Default mode forwards invocations to your backend hub; Serverless mode pairs with Azure Functions."
        ]
      },
      {
        id: "aspnet-signalr-nodes",
        name: "ASP.NET Core Hub Pods (AKS / App Service)",
        category: "Backend Cluster",
        protocol: "Kestrel / HTTP/2",
        latency: "p99 < 10ms",
        role: "Stateless backend nodes executing business logic, authoring hub methods, and broadcasting messages to groups or specific users.",
        failureModes: "Pod crash / node restart during live session.",
        mitigation: "Stateless design: Connection state is maintained in Azure SignalR / Redis, so any node can send to any client.",
        talkingPoints: [
          "Zero Sticky Session Dependency: Because Azure SignalR Service terminates client connections, backend web servers do NOT require ARR sticky cookies.",
          "User & Group Mapping: 'Clients.Group(\"org-123\").SendAsync(...)' routes accurately through the backplane."
        ]
      },
      {
        id: "redis-backplane",
        name: "Redis Cache / Pub-Sub (Alternative Self-Hosted)",
        category: "Backplane",
        protocol: "RESP (Redis Protocol)",
        latency: "p99 < 2ms",
        role: "If not using Azure SignalR: Acts as the L2 message bus connecting all SignalR pods via Redis Pub/Sub channels.",
        failureModes: "Redis CPU saturation from high-frequency message broadcasting.",
        mitigation: "Batch notifications, use Redis Cluster, or migrate to Azure SignalR Service for scale > 50k connections.",
        talkingPoints: [
          "Redis Backplane Overhead: Every message sent to any group is replicated to EVERY connected server, creating $O(N \\times M)$ network traffic.",
          "Azure SignalR Advantage: Only routes messages to servers with active subscribers for that specific channel."
        ]
      }
    ],
    flowSteps: [
      "1. React client requests negotiate endpoint: POST /chat/negotiate -> receives Azure SignalR Service redirect URL & temporary JWT access token.",
      "2. Client establishes direct WebSocket connection to Azure SignalR Service edge.",
      "3. Client sends 'SendMessage(content)' -> Azure SignalR forwards invocation to one of the backend ASP.NET Core pods over persistent multiplexed gRPC/WebSocket tunnel.",
      "4. ASP.NET Core hub validates message, persists to database, and calls Clients.Group('RoomA').SendAsync(...).",
      "5. Azure SignalR Service instantly broadcasts message to all client sockets subscribed to 'RoomA'."
    ]
  },
  {
    id: "clean-architecture-ddd",
    title: "3. Enterprise Clean Architecture & DDD",
    pillar: "Software Architecture",
    description: "Robust enterprise Onion/Hexagonal architecture separating Domain Rules, Application Use Cases (CQRS MediatR), Infrastructure (EF Core + Dapper), and Presentation Minimal APIs.",
    summary: "Enforces strict inward dependency flow: Domain depends on nothing; Application orchestrates use cases; Infrastructure implements abstractions; API is a thin entry point.",
    nodes: [
      {
        id: "domain-layer",
        name: "Core Domain Layer",
        category: "Domain Core",
        protocol: "Pure C# (Zero Dependencies)",
        latency: "In-Memory (0ms)",
        role: "Houses Domain Entities, Value Objects, Domain Events, Aggregate Roots, and Business Exceptions. No framework dependencies!",
        failureModes: "Anemic Domain Model anti-pattern (public getters/setters everywhere with logic in services).",
        mitigation: "Encapsulate state with private setters, factory methods, and domain invariant validation rules inside entity methods.",
        talkingPoints: [
          "Value Objects: Immutable objects without identity, compared by value (e.g. Money, Address, DateRange). Use C# 10+ 'readonly record struct'.",
          "Aggregate Roots: Ensure consistency boundary. Child entities cannot be modified directly from outside the root."
        ]
      },
      {
        id: "application-cqrs",
        name: "Application Layer (CQRS & MediatR)",
        category: "Application Use Cases",
        protocol: "MediatR / FluentValidation",
        latency: "In-Memory (< 2ms)",
        role: "Orchestrates use cases via Commands (CreateOrderCommand) and Queries (GetOrderByIdQuery). MediatR Pipeline Behaviors.",
        failureModes: "Fat controllers, bloated services, cross-cutting concern duplication.",
        mitigation: "Pipeline Behaviors: Centralize ValidationBehavior, LoggingBehavior, PerformanceBehavior, and TransactionBehavior.",
        talkingPoints: [
          "CQRS Separation: Commands mutate state and return Unit/Id; Queries are read-only and return optimized DTOs.",
          "Pipeline Behaviors: Act as MediatR middleware, executing before/after handlers without polluting business logic."
        ]
      },
      {
        id: "infrastructure-layer",
        name: "Infrastructure (EF Core + Dapper)",
        category: "Persistence & External",
        protocol: "SQL Server / Azure SDK",
        latency: "Network I/O",
        role: "Implements repository interfaces, DbContext configurations, external API adapters, email senders, and caching.",
        failureModes: "Leaking EF Core IQueryable to Presentation layer, bypassing domain invariants.",
        mitigation: "Repositories return domain aggregates or explicit DTO projections; never expose raw IQueryable.",
        talkingPoints: [
          "Hybrid Persistence: EF Core handles write aggregates with change tracking & concurrency tokens; Dapper executes high-speed read queries.",
          "Interface Segregation: IOrderRepository defined in Application layer; implemented in Infrastructure layer (Dependency Inversion Principle)."
        ]
      },
      {
        id: "presentation-layer",
        name: "Presentation (Minimal APIs / ASP.NET)",
        category: "Presentation / UI",
        protocol: "HTTP / OpenAPI",
        latency: "< 5ms framework overhead",
        role: "Thin HTTP endpoints mapping requests to MediatR commands/queries, returning RFC 7807 ProblemDetails on failure.",
        failureModes: "Putting business calculations or database queries directly in endpoint handlers.",
        mitigation: "Endpoints only accept DTO, send to MediatR ISender, and return TypedResults.Ok() or TypedResults.NotFound().",
        talkingPoints: [
          "Minimal APIs vs Controllers: Minimal APIs have lower startup time, zero reflection overhead, and lower memory footprint.",
          "Endpoint Filters: IEndpointFilter for route-specific validation or metric instrumentation."
        ]
      }
    ],
    flowSteps: [
      "1. HTTP POST /api/orders received by Minimal API endpoint.",
      "2. Endpoint calls _mediator.Send(new CreateOrderCommand(...)).",
      "3. MediatR Pipeline: ValidationBehavior validates command using FluentValidation -> LoggingBehavior logs payload.",
      "4. CreateOrderCommandHandler loads customer Aggregate from IOrderRepository.",
      "5. Domain Entity enforces invariants (e.g. order.AddItem(sku, qty)) and raises OrderCreatedDomainEvent.",
      "6. Unit of Work commits EF Core DbContext SaveChangesAsync.",
      "7. Result returned cleanly to client as HTTP 201 Created."
    ]
  },
  {
    id: "azure-multiregion",
    title: "4. High-Availability Multi-Region Azure Cloud Architecture",
    pillar: "Azure Cloud & DevOps",
    description: "Zero-data-loss active-active/active-passive multi-region cloud deployment providing 99.99% SLA across Azure East US and West Europe with Azure Front Door, Geo-Replication, and Managed Identities.",
    summary: "Guarantees business continuity during complete Azure region outage using global anycast routing and automated failover groups.",
    nodes: [
      {
        id: "front-door",
        name: "Azure Front Door (Global Anycast)",
        category: "Global Load Balancer",
        protocol: "Anycast HTTP/3 / TLS 1.3",
        latency: "Edge latency < 20ms",
        role: "Global Layer 7 load balancer, WAF (Web Application Firewall), DDoS protection, and health-probe failover.",
        failureModes: "Misconfigured health probe causing flapping between regions.",
        mitigation: "Configure probe interval to 15s, 3 probe failures before failover, HTTP /health/ready probe endpoint.",
        talkingPoints: [
          "Front Door vs Traffic Manager: Traffic Manager is DNS-based (slow TTL caching); Front Door is Layer 7 reverse proxy with instant split-second failover.",
          "WAF OWASP Core Rule Set: Blocks SQL injection, cross-site scripting (XSS), and bot attacks at Microsoft's global edge."
        ]
      },
      {
        id: "app-services-primary",
        name: "App Service / Container Apps (East US - Primary)",
        category: "Compute",
        protocol: "Linux Container / .NET 8",
        latency: "p99 < 25ms",
        role: "Runs .NET 8 web API in Docker Chiseled containers with deployment slots (Production & Staging).",
        failureModes: "Host VM degradation; unhealthy app deployment.",
        mitigation: "Autoscale from 2 to 10 instances based on CPU > 70% and HTTP queue length; deployment slots with warmup before swap.",
        talkingPoints: [
          "Chiseled Ubuntu Containers: Distroless image < 100MB, no package manager, non-root user, eliminates 95% of CVE vulnerabilities.",
          "Deployment Slot Swap: Automatically warms up JIT / cache on staging slot before switching virtual IP with production."
        ]
      },
      {
        id: "azure-sql-geo",
        name: "Azure SQL Failover Group (Auto-Failover)",
        category: "Relational Database",
        protocol: "TDS / Managed Identity",
        latency: "Primary: < 2ms / Cross-region sync: ~60ms",
        role: "Active-Passive geo-replication. Primary in East US accepts reads/writes; Secondary in West Europe accepts read-only queries.",
        failureModes: "Primary region catastrophe / data center loss.",
        mitigation: "Auto-failover policy with 1-hour grace period (prevents false-positive split-brain) or manual emergency failover command.",
        talkingPoints: [
          "Passwordless Security: Microsoft.Data.SqlClient with 'Authentication=Active Directory Default' uses Managed Identity token instead of connection strings.",
          "Read-Scale Out: Route read-only reporting queries to the geo-replica endpoint: 'server.secondary.database.windows.net'."
        ]
      },
      {
        id: "key-vault-managed-id",
        name: "Azure Key Vault & Managed Identity",
        category: "Secrets & Security",
        protocol: "HTTPS / REST",
        latency: "Cached in memory",
        role: "Hardware Security Module (HSM) storing certificates and API keys. Accessed via Azure System-Assigned Managed Identity.",
        failureModes: "API rate limiting on Key Vault.",
        mitigation: "Use App Service Key Vault references (managed by host platform) or Azure.Security.KeyVault with client-side caching.",
        talkingPoints: [
          "Zero Secrets in Source Control: No connection strings, passwords, or certificates stored in appsettings.json or Git.",
          "Secret Rotation: Azure Event Grid triggers Function app when certificate or secret is rotated, updating App Service configurations."
        ]
      }
    ],
    flowSteps: [
      "1. User in New York sends request to api.company.com.",
      "2. Azure Front Door Anycast edge routes user to closest healthy backend (East US).",
      "3. East US App Service executes request using Managed Identity to query Azure SQL Primary.",
      "4. Azure SQL asynchronously replicates transactions to West Europe geo-secondary.",
      "5. If East US region suffers a total datacenter outage, Front Door health probes fail (3x consecutive).",
      "6. Front Door redirects 100% of global traffic to West Europe App Service instantly (< 30s) while Azure SQL Failover Group promotes secondary to read/write."
    ]
  }
];
