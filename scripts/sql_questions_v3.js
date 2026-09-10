// ============================================================================
// PILLAR 4: SQL SERVER & RELATIONAL DATABASES (18 Questions)
// Sourced directly from User's Layer 3 PDF Guide and real-world .NET/SQL interview standards
// ============================================================================

const sqlQuestions = [
  {
    title: "What is the difference between INNER JOIN and LEFT JOIN, and how do they handle NULLs?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Joins", "Relational Database", "NULL Handling"],
    pitch: "An INNER JOIN returns only records that have matching keys in both tables. A LEFT JOIN returns all records from the left table, plus matched records from the right table; if no match exists, all columns from the right table are filled with NULLs. For filtering out existing records (anti-joins), a LEFT JOIN with a WHERE right.Key IS NULL is a classic pattern.",
    analogy: "A dance class: INNER JOIN pairs up dancers who both have partners; LEFT JOIN lists every dancer from your school, pairing them if a partner showed up or leaving the partner spot empty (NULL) if nobody came.",
    deepDive: `Join Engine Mechanics:
1. INNER JOIN:
   - Evaluates ON predicate and discards rows without a match on both sides.
   - Evaluated by the query optimizer using Nested Loops, Merge Join, or Hash Match based on table sizes and index availability.
2. LEFT JOIN (Outer Join):
   - Preserves all rows from the outer (left) stream regardless of match.
   - Any column selected from the unmatching right table yields NULL.
3. Common Anti-Join Pattern:
   - 'SELECT c.Id FROM Customers c LEFT JOIN Orders o ON c.Id = o.CustomerId WHERE o.CustomerId IS NULL' finds customers without orders.
4. Predicate Placement Critical Difference:
   - Filtering right table in the ON clause preserves all left rows (e.g. 'ON o.CustomerId = c.Id AND o.Status = 1').
   - Filtering right table in the WHERE clause (e.g. 'WHERE o.Status = 1') converts the LEFT JOIN into an INNER JOIN because NULL == 1 evaluates to UNKNOWN!`,
    codeSnippet: `-- 1. INNER JOIN: Only customers with at least one order
SELECT c.CustomerId, c.CompanyName, o.OrderId, o.TotalAmount
FROM dbo.Customers c
INNER JOIN dbo.Orders o ON c.CustomerId = o.CustomerId;

-- 2. LEFT JOIN Anti-Pattern fix: Preserves left rows even when no orders exist
SELECT c.CustomerId, c.CompanyName, o.OrderId, COALESCE(o.TotalAmount, 0.00) AS TotalAmount
FROM dbo.Customers c
LEFT JOIN dbo.Orders o ON c.CustomerId = o.CustomerId;

-- 3. Anti-Join: Find all customers who have NEVER placed an order
SELECT c.CustomerId, c.CompanyName
FROM dbo.Customers c
LEFT JOIN dbo.Orders o ON c.CustomerId = o.CustomerId
WHERE o.OrderId IS NULL;`,
    redFlags: [
      "Putting right-table filter predicates in the WHERE clause of a LEFT JOIN without realizing it silently turns it into an INNER JOIN.",
      "Assuming INNER JOIN and LEFT JOIN perform identically on unindexed foreign keys.",
      "Not understanding how three-valued logic (TRUE, FALSE, UNKNOWN) interacts with NULLs in JOIN criteria."
    ],
    proTips: [
      "For anti-joins on large datasets, test 'NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerId = c.CustomerId)' against 'LEFT JOIN ... WHERE o.Id IS NULL'. In SQL Server, the optimizer often generates identical anti-semi-join plans, but NOT EXISTS is clearer and immune to NULL-in-WHERE conversion bugs."
    ]
  },
  {
    title: "What is the difference between WHERE and HAVING in SQL?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "WHERE", "HAVING", "Aggregation", "Query Execution"],
    pitch: "WHERE filters raw individual rows before any grouping or aggregate functions are calculated. HAVING filters the summarized groups after the GROUP BY and aggregate functions have executed. You cannot use aggregate functions like SUM() or COUNT() in a WHERE clause, and filtering non-aggregate columns in HAVING instead of WHERE forces SQL Server to aggregate unnecessary rows first, destroying performance.",
    analogy: "Grading high schoolers: WHERE filters out students who were absent before calculating the class averages; HAVING filters out entire classrooms whose overall average score fell below 75%.",
    deepDive: `SQL Logical Query Processing Phase Order:
1. FROM (and JOINs)
2. WHERE (Row-level filtering)
3. GROUP BY (Bucket rows into groups)
4. HAVING (Group-level aggregate filtering)
5. SELECT (Column evaluation, aliases created)
6. DISTINCT
7. ORDER BY (Sorting)
8. TOP / OFFSET-FETCH (Paging)

Performance Rule:
Always filter as many rows as possible in WHERE before they reach GROUP BY. Putting non-aggregated columns in HAVING (e.g. 'HAVING DepartmentId = 5') forces the engine to aggregate all departments across the entire table before discarding them!`,
    codeSnippet: `-- ✅ CORRECT: Pre-filters rows in WHERE, filters aggregate in HAVING
SELECT 
    o.CustomerId,
    COUNT(o.OrderId) AS OrderCount,
    SUM(o.TotalAmount) AS TotalSpent
FROM dbo.Orders o
WHERE o.OrderDate >= '2024-01-01' -- Row filter: only 2024 orders evaluated
GROUP BY o.CustomerId
HAVING SUM(o.TotalAmount) > 10000.00; -- Aggregate filter: high-value customers only

-- ❌ AVOID: Filtering raw columns inside HAVING
-- Forces SQL Server to group all dates across history before discarding them!
SELECT o.CustomerId, SUM(o.TotalAmount)
FROM dbo.Orders o
GROUP BY o.CustomerId, o.OrderDate
HAVING o.OrderDate >= '2024-01-01';`,
    redFlags: [
      "Trying to use aggregates in WHERE like 'WHERE COUNT(OrderId) > 5' (syntax error).",
      "Filtering unaggregated columns in HAVING instead of WHERE, forcing unnecessary row aggregation.",
      "Not knowing the logical order of query processing operations."
    ],
    proTips: [
      "Remember the query processing mnemonic: 'Fresh Wind Gives Heavy Scented Daisies Open' -> FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY."
    ]
  },
  {
    title: "How do Window Functions differ from GROUP BY, and when do you use ROW_NUMBER vs DENSE_RANK vs RANK?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Window Functions", "GROUP BY", "Ranking", "Analytics"],
    pitch: "GROUP BY collapses multiple rows into a single summary row per group. Window functions (OVER clause) calculate aggregates or rankings across a partitioned window of rows while preserving each individual row's identity and detail columns. Among ranking functions: ROW_NUMBER assigns unique sequential integers (1,2,3,4) regardless of ties; RANK skips numbers on ties (1,2,2,4); and DENSE_RANK does not skip numbers on ties (1,2,2,3).",
    analogy: "GROUP BY replaces every row in a department with one manager report stating '5 employees, average salary $100k'. A Window Function leaves every employee seated at their desk, but tapes a sticker to their computer showing their rank and the department average salary next to their individual name.",
    deepDive: `Ranking Function Tie-Break Mechanics:
Given salaries: [100k, 90k, 90k, 80k]:
- ROW_NUMBER(): 1, 2, 3, 4 (Deterministic only if secondary ORDER BY key provided).
- RANK(): 1, 2, 2, 4 (Leaves a gap because 2 people tied for 2nd place).
- DENSE_RANK(): 1, 2, 2, 3 (No gap; next highest gets the consecutive rank).

Core Use Cases:
1. De-duplication: Delete duplicates keeping the newest row ('WHERE RowNum = 1').
2. Top-N per Group: Top 3 highest earning employees in each department.
3. Running Totals: 'SUM(Amount) OVER (PARTITION BY CustomerId ORDER BY OrderDate ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)'.`,
    codeSnippet: `-- 1. Top 2 highest-paid employees per department using DENSE_RANK
WITH RankedEmployees AS (
    SELECT 
        EmployeeId,
        DepartmentId,
        Salary,
        ROW_NUMBER() OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS RowNum,
        RANK()       OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS RankVal,
        DENSE_RANK() OVER (PARTITION BY DepartmentId ORDER BY Salary DESC) AS DenseRankVal
    FROM dbo.Employees
)
SELECT EmployeeId, DepartmentId, Salary, DenseRankVal
FROM RankedEmployees
WHERE DenseRankVal <= 2;

-- 2. Safe deduplication pattern
WITH DuplicateRecords AS (
    SELECT 
        Id,
        Email,
        ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedDate DESC) AS rn
    FROM dbo.Users
)
DELETE FROM DuplicateRecords WHERE rn > 1;`,
    redFlags: [
      "Using GROUP BY when individual row details still need to be returned alongside aggregates.",
      "Confusing RANK() and DENSE_RANK() and getting missing rank numbers or unexpected duplicates in Top-N queries.",
      "Trying to put a window function directly in the WHERE clause (Must wrap in a CTE or subquery)."
    ],
    proTips: [
      "Window functions cannot be placed directly in WHERE or HAVING clauses because WHERE is evaluated in Step 2, long before Step 5 (Window/SELECT). Always wrap in a CTE or subquery to filter on 'rn = 1'."
    ]
  },
  {
    title: "What is the difference between a Clustered Index and a Nonclustered Index?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Indexes", "Clustered Index", "Nonclustered Index", "B-Tree"],
    pitch: "A Clustered Index physically determines the storage order of the actual table data rows on disk; therefore, a table can only have one clustered index (usually the Primary Key). The leaf level of a clustered index IS the table data. A Nonclustered Index is a separate B-tree structure that stores indexed key columns plus a row locator (pointer or clustering key) pointing back to the actual data row. A table can have many nonclustered indexes.",
    analogy: "A phone book is a Clustered Index (entries are physically sorted alphabetically by last name from page 1 to the end). The index at the back of a textbook is a Nonclustered Index (topics sorted alphabetically, each with a page number pointing to where the full text lives).",
    deepDive: `Storage Architecture:
1. Heap: A table without a clustered index. Rows are stored in arbitrary order across 8KB data pages.
2. Clustered Index B-Tree:
   - Root and intermediate pages contain index navigation keys.
   - Leaf pages contain the actual table rows (all columns).
   - Ideal clustered key: Unique, narrow (e.g. INT/BIGINT), static (never updated), and sequential (e.g. IDENTITY) to avoid B-Tree page splits.
3. Nonclustered Index B-Tree:
   - Leaf level contains indexed columns + the Clustering Key (Row Locator).
   - If a query requests columns not present in the nonclustered index, SQL Server must execute a 'Key Lookup' back into the clustered index, incurring random I/O.`,
    codeSnippet: `-- 1. Clustered Index (Typically created automatically by PRIMARY KEY constraint)
CREATE TABLE dbo.Orders (
    OrderId INT IDENTITY(1,1) NOT NULL,
    CustomerId INT NOT NULL,
    OrderDate DATETIME2 NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderId)
);

-- 2. Nonclustered Index on Foreign Key
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId
ON dbo.Orders (CustomerId);

-- 3. Composite Nonclustered Index with Sort Order
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate
ON dbo.Orders (CustomerId ASC, OrderDate DESC);`,
    redFlags: [
      "Putting a clustered index on a non-sequential GUID (GUID page splits fragment physical disk pages).",
      "Believing a table can have multiple clustered indexes.",
      "Creating dozens of nonclustered indexes without considering the overhead on INSERT, UPDATE, and DELETE operations."
    ],
    proTips: [
      "If you use GUIDs as primary keys, use 'NEWSEQUENTIALID()' instead of 'NEWID()', or keep the primary key as a nonclustered GUID and cluster on an internal sequential BIGINT IDENTITY column to prevent devastating B-Tree page splitting."
    ]
  },
  {
    title: "What is a Covering Index and how do INCLUDE columns prevent Key Lookups?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Covering Index", "INCLUDE", "Key Lookup", "Performance Optimization"],
    pitch: "A Covering Index contains all columns requested by a specific query in its B-tree structure, allowing SQL Server to fulfill the entire query directly from index pages without touching the underlying table data. By using the INCLUDE clause, non-key columns are stored only at the leaf level of the nonclustered index. This satisfies SELECT queries while keeping the intermediate index tree levels narrow and fast without the 900-byte index key width limitation.",
    analogy: "Carrying a cheat sheet with your friend's name, phone number, and address into a call. If you need their address, it is already on the cheat sheet (Covering Index). If the cheat sheet only had names and phone numbers, you'd have to drive to their house just to look up their address (Key Lookup).",
    deepDive: `Key Lookup Elimination Mechanics:
1. When a query filters by CustomerId and selects OrderDate and TotalAmount:
   - With IX(CustomerId): SQL searches IX for matching CustomerIds, then performs a 'Key Lookup' into the Clustered Index for each row to fetch TotalAmount.
   - If 10,000 rows match, that is 10,000 random I/O seek operations!
2. The Fix - Covering Index:
   - 'CREATE NONCLUSTERED INDEX IX_Orders_Cust ON dbo.Orders(CustomerId) INCLUDE (OrderDate, TotalAmount);'
   - SQL Server seeks the CustomerId in the B-Tree and reads OrderDate and TotalAmount directly from the leaf node.
   - Execution plan changes from 'Index Seek + Key Lookup + Nested Loops' (costly) to pure 'Index Seek' (near-zero I/O).
3. INCLUDE vs Composite Key:
   - Key columns participate in B-Tree sorting and affect tree depth and size (limit 1,700 bytes in modern SQL Server).
   - INCLUDE columns reside ONLY on leaf pages, allowing columns like VARCHAR(MAX) (or large text) without bloating intermediate branch nodes.`,
    codeSnippet: `-- ❌ Uncovered Query: Generates expensive Key Lookup if IX only has CustomerId
-- SELECT CustomerId, OrderDate, TotalAmount FROM dbo.Orders WHERE CustomerId = @CustId;

-- ✅ PERFECT COVERING INDEX:
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_Covering
ON dbo.Orders (CustomerId)
INCLUDE (OrderDate, TotalAmount, Status);

-- Now this query is 100% COVERED:
SELECT CustomerId, OrderDate, TotalAmount, Status
FROM dbo.Orders
WHERE CustomerId = 1042;
-- In Execution Plan: 100% Index Seek, 0 Key Lookups, 0 Table Scans!`,
    redFlags: [
      "Adding every single column to the index key columns instead of using INCLUDE.",
      "Leaving Key Lookups inside high-frequency OLTP queries where thousands of rows are touched per second.",
      "Over-indexing every query by including 20+ columns, causing massive storage inflation and slow INSERT/UPDATE writes."
    ],
    proTips: [
      "Look at SQL Server execution plans for thick arrow lines going into a 'Key Lookup (Clustered)' with a high cost percentage. Add the missing output columns to the INCLUDE list of the seeking index to eliminate the lookup instantly."
    ]
  },
  {
    title: "What does SARGable mean, and why does wrapping columns in functions destroy index utilization?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "SARGable", "Indexes", "Index Scan", "Performance"],
    pitch: "SARGable stands for 'Search Argument Able'. A query predicate is SARGable when SQL Server can utilize an Index Seek along the B-Tree rather than having to scan the entire index or table. Wrapping an indexed column inside a scalar function like WHERE YEAR(OrderDate) = 2024 or WHERE LEFT(LastName, 3) = 'SMI' is non-SARGable; SQL Server cannot evaluate the index's sorted order and must execute the function against every single row in the table (Index Scan).",
    analogy: "Looking for 'Smith' in a telephone book: SARGable is flipping directly to the 'S-m-i' page (Index Seek). Non-SARGable is hiring someone to read every single name in the entire book and check 'Does the 3rd letter match 'i'?' (Full Scan).",
    deepDive: `Common Non-SARGable Culprits & SARGable Rewrites:
1. Date Functions:
   - Non-SARGable: WHERE YEAR(OrderDate) = 2024 (Scans 100% of rows).
   - SARGable: WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01' (Seeks exact B-Tree range).
2. String Concatenation & Substrings:
   - Non-SARGable: WHERE FirstName + ' ' + LastName = 'John Doe'
   - SARGable: WHERE FirstName = 'John' AND LastName = 'Doe'
3. Implicit Data Type Conversion:
   - Comparing a VARCHAR column to an NVARCHAR parameter ('@nvcVar') causes SQL Server to execute CONVERT_IMPLICIT on the column, disabling index seek!
4. Leading Wildcards:
   - Non-SARGable: WHERE Email LIKE '%@gmail.com' (Cannot seek start of string).
   - SARGable: WHERE Email LIKE 'john%' (Can seek the prefix).`,
    codeSnippet: `-- ❌ NON-SARGABLE: SQL Server must run YEAR() on 10,000,000 rows (Index Scan)
SELECT OrderId, CustomerId, TotalAmount
FROM dbo.Orders
WHERE YEAR(OrderDate) = 2024;

-- ✅ SARGABLE REWRITE: Direct Index Seek over closed-open date boundary
SELECT OrderId, CustomerId, TotalAmount
FROM dbo.Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';

-- ❌ NON-SARGABLE: ISNULL / COALESCE on column
SELECT Id FROM dbo.Customers WHERE ISNULL(Status, 0) = 0;

-- ✅ SARGABLE REWRITE:
SELECT Id FROM dbo.Customers WHERE Status = 0 OR Status IS NULL;`,
    redFlags: [
      "Using functions on column names in WHERE or JOIN conditions (e.g. DATEDIFF, UPPER, SUBSTRING).",
      "Using implicit type conversion (passing string to integer column or nvarchar parameter to varchar column).",
      "Using '%search%' leading wildcard searches on large tables without Full-Text Indexing."
    ],
    proTips: [
      "In EF Core, writing 'where o.OrderDate.Year == 2024' translates to non-SARGable 'DATEPART(year, ...)' in older versions. Always use date ranges 'o.OrderDate >= startDate && o.OrderDate < endDate' to guarantee SARGable index seeks."
    ]
  },
  {
    title: "How do you read a SQL Server Execution Plan to diagnose query performance?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Execution Plan", "Performance Tuning", "Index Seek", "Table Scan"],
    pitch: "You read an Execution Plan from right-to-left and top-to-bottom, following the data stream arrows. Thick arrows indicate high row counts. Key operators to look for include: Table Scan (scanning unindexed heap), Clustered Index Scan (reading every row of the table), Index Seek (optimal B-tree key navigation), Key Lookup (fetching missing columns from clustered index), and Sort / Hash Match (high-memory operations). You also compare 'Actual Number of Rows' with 'Estimated Number of Rows' to spot stale statistics.",
    analogy: "Reading a factory assembly line blueprint from the loading dock (right) to the shipping warehouse (left). If you see a forklift carrying 10 million parts when the blueprint estimated 1 part, you immediately found where the bottleneck is.",
    deepDive: `Step-by-Step Execution Plan Audit:
1. Operator Hierarchy:
   - Index Seek (Good): B-Tree traversal directly to target rows.
   - Index Scan (Warning): Read every leaf page of an index.
   - Table Scan (Critical): Table has no clustered index and must scan all pages.
   - Key Lookup (Warning): Missing columns in nonclustered index; causes random I/O per row.
2. Join Operators:
   - Nested Loops: Great for small outer set seeking into indexed inner set.
   - Merge Join: Extremely fast if both inputs are pre-sorted on join key.
   - Hash Match: High memory consumption; used for large unsorted sets.
3. Statistics Health Check:
   - Hover over operators: Check 'Estimated Number of Rows' vs 'Actual Number of Rows'.
   - A 10x or 1000x disparity indicates stale table statistics, causing the query optimizer to pick terrible join strategies.
4. Warning Icons:
   - Yellow exclamation mark on operators indicates implicit conversions, tempdb spilling, or missing index recommendations.`,
    codeSnippet: `-- Display Actual Execution Plan in SSMS: Press Ctrl + M before executing
SET STATISTICS IO, TIME ON;

SELECT o.OrderId, o.OrderDate, c.CompanyName
FROM dbo.Orders o
INNER JOIN dbo.Customers c ON o.CustomerId = c.CustomerId
WHERE o.OrderDate >= '2024-01-01';

SET STATISTICS IO, TIME OFF;

-- Output in Messages Tab shows logical reads:
-- Table 'Orders'. Scan count 1, logical reads 34...
-- Table 'Customers'. Scan count 1, logical reads 6...
-- Goal: Minimize logical reads! Every 8KB read saved = faster queries.`,
    redFlags: [
      "Relying solely on query execution time instead of checking 'Logical Reads' via 'STATISTICS IO'.",
      "Ignoring yellow warning triangles on SELECT nodes (which signal cardinality estimate errors or missing indexes).",
      "Accepting SSMS 'Missing Index' recommendations blindly without evaluating existing overlapping indexes."
    ],
    proTips: [
      "Always look for 'Tempdb Spills' (Sort Warnings or Hash Warnings). When SQL Server drastically underestimates row counts, it allocates too little memory workspace; the sort spills to tempdb disk, multiplying query latency by 100x."
    ]
  },
  {
    title: "When should you use Stored Procedures vs EF Core / ORM, and how do they compare?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Stored Procedures", "EF Core", "Architecture", "Trade-offs"],
    pitch: "EF Core is ideal for standard OLTP operations, rapid feature delivery, compile-time type safety, automated database migrations, and clean domain modeling. Stored Procedures are superior for complex batch transformations, high-security environments requiring zero direct table permissions, heavy reporting aggregations where raw SQL tuning is paramount, and reducing cross-network round-trips for multi-step transactional procedures.",
    analogy: "EF Core is an Uber ride: effortless, standardized, and handles the driving for your everyday commutes. A Stored Procedure is a specialized cargo freight train: requires track maintenance and specialized operators, but moves massive tonnage across the system far more efficiently.",
    deepDive: `Comparative Architectural Matrix:
1. EF Core Advantages:
   - Strong typing, compile-time verification with LINQ.
   - Change Tracking & Unit of Work pattern out of the box.
   - Cross-database flexibility and automated schema migrations.
   - Fast developer velocity for standard CRUD.
2. Stored Procedure Advantages:
   - Network Efficiency: Multi-step calculations run directly on the database engine; zero payload transfer between server and DB until final output.
   - Security: DB users can be granted EXECUTE permissions on procedures without granting SELECT/UPDATE on raw tables.
   - Fine-Tuned Query Plans: Ability to use query hints (FORCESEEK, RECOMPILE, OPTION(MAXDOP)).
3. Modern Senior Consensus (Hybrid Architecture):
   - 90% of business domain logic and CRUD lives in ASP.NET Core via EF Core / Dapper.
   - 10% high-throughput bulk processing, financial reconciliations, and nightly batch jobs live in Stored Procedures.`,
    codeSnippet: `-- Calling Stored Procedure from EF Core safely
public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year, CancellationToken ct)
{
    var yearParam = new SqlParameter("@Year", year);

    // ✅ Strongly typed mapping using EF Core's SqlQuery
    return await _context.Database
        .SqlQueryRaw<MonthlyRevenueDto>(
            "EXEC dbo.usp_GetMonthlyRevenueReport @Year", 
            yearParam)
        .ToListAsync(ct);
}

-- Stored Procedure Definition:
CREATE PROCEDURE dbo.usp_GetMonthlyRevenueReport
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        MONTH(OrderDate) AS [Month],
        COUNT(OrderId) AS TotalOrders,
        SUM(TotalAmount) AS TotalRevenue
    FROM dbo.Orders
    WHERE YEAR(OrderDate) = @Year
    GROUP BY MONTH(OrderDate)
    ORDER BY [Month];
END;`,
    redFlags: [
      "Claiming 'Stored procedures are always faster because they are precompiled' (SQL Server caches execution plans for parameterized queries identically).",
      "Embedding all business domain validation rules in stored procedures, making unit testing impossible without live DB instances.",
      "String-concatenating user input into dynamic SQL inside a stored procedure."
    ],
    proTips: [
      "Always specify 'SET NOCOUNT ON;' at the start of every Stored Procedure to suppress the 'X rows affected' wire messages sent to the client after every INSERT/UPDATE statement."
    ]
  },
  {
    title: "What is Parameter Sniffing in SQL Server, how do you detect it, and how do you fix it?",
    seniority: "Senior",
    tags: ["SQL", "Parameter Sniffing", "Execution Plan", "Performance Tuning"],
    pitch: "Parameter Sniffing occurs when SQL Server compiles and caches an execution plan based on the specific parameter values passed on the very first execution of a stored procedure. If the first run passes an atypical or rare value (e.g. a tenant with 1 row vs a tenant with 5,000,000 rows), the optimizer chooses a plan tailored to that value (e.g. Index Seek + Key Lookup instead of Table Scan). Subsequent executions with typical parameters are forced to use the suboptimal cached plan, causing severe performance degradation.",
    analogy: "A tailor makes clothes for an entire basketball team based solely on measurements taken from the 5-foot-2 team mascot because he walked into the shop first. Now none of the 6-foot-8 players can fit into their uniforms.",
    deepDive: `Diagnostic and Resolution Workflow:
1. How to Identify:
   - Procedure runs instantly in SSMS with local variables ('DECLARE @Id INT = 5') but times out when called from the application with parameters.
   - Execution plan properties show a massive difference between 'Parameter Compiled Value' and 'Parameter Runtime Value'.
2. Remediation Options:
   - OPTION (RECOMPILE): Optimizer creates a fresh plan on every execution. Ideal if procedure is called infrequently or parameter variability is high.
   - OPTION (OPTIMIZE FOR (@Param = <Value>)): Tells the optimizer to build a plan tailored to the typical average distribution.
   - Local Variable Copy: Copying parameter to local variable ('DECLARE @LocalId INT = @Id') prevents the optimizer from sniffing the parameter at compile time (uses average density statistics).
   - SQL Server 2022 Parameter Sensitive Plan (PSP) Optimization: Automatically caches multiple plans for different parameter sizes.`,
    codeSnippet: `-- ❌ VULNERABLE: Caches plan based on first execution
CREATE PROCEDURE dbo.GetOrdersByStatus
    @Status INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT OrderId, CustomerId, TotalAmount 
    FROM dbo.Orders 
    WHERE Status = @Status;
END;

-- ✅ FIX 1: Use OPTION (RECOMPILE) for uneven distribution (e.g. Status=1 has 10 rows, Status=2 has 5M)
CREATE PROCEDURE dbo.GetOrdersByStatus_Recompile
    @Status INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT OrderId, CustomerId, TotalAmount 
    FROM dbo.Orders 
    WHERE Status = @Status
    OPTION (RECOMPILE);
END;

-- ✅ FIX 2: OPTIMIZE FOR UNKNOWN (Uses general density statistics)
CREATE PROCEDURE dbo.GetOrdersByStatus_OptimizeUnknown
    @Status INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT OrderId, CustomerId, TotalAmount 
    FROM dbo.Orders 
    WHERE Status = @Status
    OPTION (OPTIMIZE FOR (@Status UNKNOWN));
END;`,
    redFlags: [
      "Assuming a stored procedure that suddenly becomes slow must have an index corruption problem instead of checking parameter sniffing.",
      "Placing OPTION (RECOMPILE) on a stored procedure called 5,000 times per second (causing severe CPU pressure from compilation).",
      "Restarting SQL Server or clearing the entire procedure cache ('DBCC FREEPROCCACHE') in production as a permanent fix."
    ],
    proTips: [
      "Check SQL Server query plan XML for the tags '<ParameterList>' -> '<ColumnReference ParameterCompiledValue=\"...\" ParameterRuntimeValue=\"...\" />'. If Compiled is '1' and Runtime is '500,000', parameter sniffing is confirmed."
    ]
  },
  {
    title: "What are ACID properties and how do SQL Server Transaction Isolation Levels balance consistency vs concurrency?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "ACID", "Transactions", "Isolation Levels", "Concurrency"],
    pitch: "ACID guarantees database reliability: Atomicity (all or nothing), Consistency (preserves schema/business invariants), Isolation (concurrent transactions do not interfere), and Durability (committed data survives server crashes). SQL Server provides isolation levels with increasing protection: READ UNCOMMITTED (allows dirty reads), READ COMMITTED (default, prevents dirty reads), REPEATABLE READ (prevents non-repeatable reads), SERIALIZABLE (prevents phantom reads via range locks), and SNAPSHOT (optimistic row-versioning in tempdb).",
    analogy: "Atomicity is buying a flight and hotel together—if the hotel fails, your flight is refunded. Durability is an airplane black box that survives a crash. Isolation is taking a private test where no other student can see or edit your test sheet while you are writing.",
    deepDive: `Concurrency Phenomena & Isolation Levels:
1. Concurrency Anomalies:
   - Dirty Read: Reading uncommitted, rollback-prone data from another transaction.
   - Non-Repeatable Read: Re-reading the same row within a transaction and finding modified data because another transaction committed an UPDATE.
   - Phantom Read: Re-executing a range query and finding newly inserted rows committed by another transaction.
2. Isolation Levels Matrix:
   - Read Uncommitted: Dirty Reads YES, Non-Repeatable YES, Phantoms YES (Zero shared locks).
   - Read Committed: Dirty Reads NO, Non-Repeatable YES, Phantoms YES.
   - Repeatable Read: Dirty Reads NO, Non-Repeatable NO, Phantoms YES (Holds shared locks till end).
   - Serializable: Dirty Reads NO, Non-Repeatable NO, Phantoms NO (Key-range locks).
   - Read Committed Snapshot Isolation (RCSI): Readers do not block writers, writers do not block readers! Uses row versioning in tempdb.`,
    codeSnippet: `-- 1. Enabling Read Committed Snapshot Isolation (RCSI) at database level
-- Highly recommended for modern high-concurrency ASP.NET Core apps:
ALTER DATABASE CurrentDatabase
SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;

-- 2. Explicit Transaction with Isolation Level
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;

BEGIN TRANSACTION;
BEGIN TRY
    UPDATE dbo.Accounts SET Balance = Balance - 100 WHERE AccountId = 1;
    UPDATE dbo.Accounts SET Balance = Balance + 100 WHERE AccountId = 2;
    
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;`,
    redFlags: [
      "Using 'WITH (NOLOCK)' on every SELECT query as a lazy fix for blocking, resulting in dirty reads and duplicated/skipped rows.",
      "Leaving transactions open across external HTTP API calls or user think time.",
      "Not checking '@@TRANCOUNT > 0' before issuing a ROLLBACK TRANSACTION inside a CATCH block."
    ],
    proTips: [
      "Enable RCSI (Read Committed Snapshot Isolation) on your SQL Server database. It eliminates read-write blocking by serving row versions from tempdb without modifying your C# application code or adding NOLOCK hints."
    ]
  },
  {
    title: "What causes Deadlocks in SQL Server, and how do you diagnose and prevent them?",
    seniority: "Senior",
    tags: ["SQL", "Deadlocks", "Concurrency", "Locking", "Troubleshooting"],
    pitch: "A deadlock occurs when two or more transactions hold exclusive locks on resources the other transaction needs to proceed, creating a cyclic dependency where neither can continue. SQL Server automatically detects deadlocks within seconds, chooses the transaction with the lowest rollback cost as the 'Deadlock Victim', and kills it with Error 1205. Deadlocks are diagnosed using Extended Events or Deadlock Graphs and prevented by accessing tables in identical order, keeping transactions brief, and using appropriate indexing.",
    analogy: "Two cars enter a one-lane bridge from opposite sides: Car A won't reverse until Car B moves, and Car B won't reverse until Car A moves. The bridge controller (SQL Server) steps in and tows Car A away so Car B can pass.",
    deepDive: `Root Causes & Remediation Strategies:
1. Opposite Object Access Order:
   - Tx 1 updates Table A then Table B.
   - Tx 2 updates Table B then Table A.
   - Resolution: Standardize access order across all codebase stored procedures and services (Always Table A -> Table B).
2. Missing Indexes causing Lock Escalation:
   - An UPDATE lacking a covering index escalates from row-level locks to page or table locks, colliding with concurrent reads.
3. Long-Running Transactions:
   - Transactions wrapping external HTTP calls, email sending, or heavy processing keep exclusive (X) locks open far too long.
4. How to Capture:
   - Extended Events session 'system_health' captures all xml_deadlock_report events by default.
   - In C#, implement Polly exponential backoff retries on SqlException with Number 1205.`,
    codeSnippet: `-- Capture Deadlock Graph from system_health session:
SELECT 
    XEvent.value('(event/@timestamp)[1]', 'datetime2') AS [Timestamp],
    XEvent.query('(event/data[@name="xml_report"]/value/deadlock)[1]') AS DeadlockGraph
FROM (
    SELECT CAST(target_data AS XML) AS TargetData
    FROM sys.dm_xe_session_targets st
    JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address
    WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'
) AS Data
CROSS APPLY TargetData.nodes('RingBufferTarget/event[@name="xml_deadlock_report"]') AS XEventData(XEvent);

-- C# Polly Deadlock Retry Policy
var deadlockPolicy = Policy
    .Handle<SqlException>(ex => ex.Number == 1205) // SQL Server Deadlock Error Code
    .WaitAndRetryAsync(3, retryAttempt => 
        TimeSpan.FromMilliseconds(50 * Math.Pow(2, retryAttempt)));`,
    redFlags: [
      "Assuming deadlocks are purely a database DBA problem rather than application-layer code ordering issues.",
      "Not catching SQL Error 1205 in C# microservices to provide graceful automatic retries.",
      "Setting transaction isolation level to SERIALIZABLE everywhere, which dramatically increases lock contention and deadlocks."
    ],
    proTips: [
      "In the XML Deadlock Graph, look for the 'victim-list' and 'resource-list'. Pay special attention to 'inputbuf'—it reveals the exact SQL statement or stored procedure executed by each colliding transaction."
    ]
  },
  {
    title: "How and when do you use sp_getapplock for application-level distributed locking?",
    seniority: "Senior",
    tags: ["SQL", "sp_getapplock", "Distributed Lock", "Concurrency", "Synchronization"],
    pitch: "sp_getapplock is a built-in SQL Server stored procedure that lets applications acquire custom named locks using SQL Server's enterprise lock manager. It allows you to synchronize distributed processes or prevent duplicate concurrent executions across multiple web server instances without creating custom lock tables or managing external lock stores like Redis. Locks can be bound to the lifetime of a transaction or an explicit database session.",
    analogy: "Borrowing the conference room key from the front desk concierge. Even if 10 different employees from different offices rush to use the room at the exact same second, only the person with the physical key gets in; the rest wait outside until it is returned.",
    deepDive: `Mechanics of sp_getapplock:
1. Syntax & Parameters:
   - 'sp_getapplock [@Resource =] 'LockName', [@LockMode =] 'Exclusive', [@LockOwner =] 'Transaction' | 'Session', [@LockTimeout =] milliseconds'
2. Return Values:
   - 0: Lock acquired synchronously.
   - 1: Lock acquired after waiting.
   - -1: Lock request timed out.
   - -2: Lock request canceled.
   - -3: Lock request was chosen as deadlock victim.
3. Why Not Custom Lock Tables?
   - Custom lock tables ('UPDATE LockTable SET IsLocked = 1') require manual cleanup if a server crashes midway, risking permanent deadlocks.
   - SQL Server automatically releases 'Transaction' or 'Session' applocks immediately if the connection drops or server restarts!`,
    codeSnippet: `-- Thread-safe payment or invoice generation across 10 API instances
CREATE PROCEDURE dbo.usp_ProcessMonthlyBilling
    @TenantId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @LockResource VARCHAR(100) = 'BillingLock_Tenant_' + CAST(@TenantId AS VARCHAR(10));
    DECLARE @Result INT;

    BEGIN TRANSACTION;

    -- Acquire exclusive lock for this tenant with 5-second timeout
    EXEC @Result = sp_getapplock 
        @Resource = @LockResource,
        @LockMode = 'Exclusive',
        @LockOwner = 'Transaction',
        @LockTimeout = 5000;

    IF @Result < 0
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50001, 'Unable to acquire billing lock. Another billing run is in progress.', 1;
    END;

    -- CRITICAL SECTION: Safe from concurrent duplicate billing runs
    -- Execute complex billing queries here...

    -- Lock is automatically released upon COMMIT or ROLLBACK
    COMMIT TRANSACTION;
END;`,
    redFlags: [
      "Using session-level locks ('Session') without calling 'sp_releaseapplock', leaking locks in connection pools.",
      "Setting LockTimeout to indefinitely wait without monitoring potential queue pileups.",
      "Creating physical database tables with boolean flags to handle distributed locking instead of using sp_getapplock."
    ],
    proTips: [
      "For .NET microservices that already use SQL Server, 'sp_getapplock' gives you rock-solid distributed locking across all ECS/Kubernetes pods for free, eliminating the operational overhead of deploying and clustering Redis Redlock."
    ]
  },
  {
    title: "How do you implement high-performance pagination in SQL Server, and why is OFFSET / FETCH better than subqueries?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Pagination", "OFFSET FETCH", "Performance", "Query Optimization"],
    pitch: "Modern SQL Server uses the ANSI-standard OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY clause, which requires an explicit ORDER BY clause. For deep pagination (e.g. page 10,000), OFFSET/FETCH can degrade because SQL Server must still traverse and discard all preceding 100,000 rows. In massive datasets, Keyset Pagination (Seek Pagination / 'WHERE Id > @LastSeenId') delivers constant O(1) time complexity by seeking directly off the clustered or covered index.",
    analogy: "Reading a 1,000-page book: OFFSET 500 requires flipping through and counting the first 500 pages one by one before reading. Keyset pagination is using a bookmark: you open directly to page 501 in one motion.",
    deepDive: `Pagination Paradigms:
1. OFFSET / FETCH NEXT:
   - Clean, standard, and translates directly from EF Core's '.Skip(x).Take(y)'.
   - Cost increases linearly: Page 1 reads 20 rows; Page 10,000 reads 200,020 rows and discards 200,000.
2. Keyset Pagination (Keyset / Seek Method):
   - Client sends the last seen value: 'WHERE (CreatedDate < @LastDate) OR (CreatedDate = @LastDate AND Id < @LastId) ORDER BY CreatedDate DESC, Id DESC'.
   - Direct B-Tree Index Seek regardless of whether you are on item 10 or item 10,000,000.
   - Prevents 'missed row' or 'duplicated row' anomalies when new records are inserted while users navigate pages.`,
    codeSnippet: `-- 1. Standard OFFSET / FETCH (EF Core Skip/Take translation)
DECLARE @PageNumber INT = 3;
DECLARE @PageSize INT = 20;

SELECT OrderId, CustomerId, OrderDate, TotalAmount
FROM dbo.Orders
ORDER BY OrderDate DESC, OrderId DESC
OFFSET (@PageNumber - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;

-- 2. High-Scale Keyset Pagination (Constant O(1) performance at any depth)
DECLARE @LastSeenDate DATETIME2 = '2024-05-15 14:22:10';
DECLARE @LastSeenId INT = 89452;

SELECT TOP (20) OrderId, CustomerId, OrderDate, TotalAmount
FROM dbo.Orders
WHERE (OrderDate < @LastSeenDate)
   OR (OrderDate = @LastSeenDate AND OrderId < @LastSeenId)
ORDER BY OrderDate DESC, OrderId DESC;`,
    redFlags: [
      "Using OFFSET / FETCH without a deterministic, tie-breaking ORDER BY (e.g. ordering only by non-unique OrderDate causes random row jumping between pages).",
      "Using legacy ROW_NUMBER() subquery pagination in modern SQL Server 2012+ projects.",
      "Performing in-memory pagination by loading all 50,000 records to the C# web server and running LINQ '.Skip().Take()'."
    ],
    proTips: [
      "Always include a unique tie-breaker column (such as the Primary Key 'OrderId') at the end of your ORDER BY clause. Without it, SQL Server does not guarantee row stability across consecutive page queries if two rows share the exact same timestamp."
    ]
  },
  {
    title: "What are the trade-offs between CTEs, Temporary Tables (#temp), and Table Variables (@table)?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "CTE", "Temp Tables", "Table Variables", "Tempdb"],
    pitch: "A CTE is an in-memory syntactic expression that exists only for the duration of a single query; it does not persist data and is re-evaluated every time it is referenced. A Temporary Table (#temp) is a physical table stored in tempdb with full statistics, indexability, and transaction logging—ideal for medium-to-large datasets. A Table Variable (@table) is also stored in tempdb but lacks column statistics (assumed 1 row in older SQL Server) and cannot participate in parallel query plans, making it suitable only for very small sets (< 100 rows).",
    analogy: "A CTE is a formula written on a whiteboard that you erase when you leave the room. A Table Variable is a sticky note in your pocket. A Temp Table is a full metal filing cabinet brought into your office with folders, dividers, and alphabetical tabs.",
    deepDive: `Deep Performance Comparison:
1. Common Table Expression (CTE):
   - Zero physical storage overhead. Great for recursive queries (organizational hierarchies) and readability.
   - Gotcha: If referenced multiple times in the same statement, SQL Server evaluates it multiple times! It is NOT a cache.
2. Temporary Table (#temp):
   - Physical table in tempdb.
   - Has full distribution statistics; query optimizer can make highly accurate cost estimations.
   - Supports creating custom Nonclustered Indexes after population.
   - Excellent for large intermediate result sets (> 1,000 rows).
3. Table Variable (@table):
   - Lives in tempdb (NOT memory-only, despite popular myth!).
   - Does NOT have column statistics (cardinality estimation defaults to 1 row in SQL Server pre-2019).
   - Does not allow explicit CREATE INDEX (only PRIMARY KEY / UNIQUE constraints).
   - Changes are NOT rolled back if the outer transaction rolls back!`,
    codeSnippet: `-- 1. CTE: Great for hierarchical recursion
WITH OrgChartCTE AS (
    SELECT EmployeeId, ManagerId, Title, 1 AS Level
    FROM dbo.Employees WHERE ManagerId IS NULL
    UNION ALL
    SELECT e.EmployeeId, e.ManagerId, e.Title, o.Level + 1
    FROM dbo.Employees e
    INNER JOIN OrgChartCTE o ON e.ManagerId = o.EmployeeId
)
SELECT * FROM OrgChartCTE;

-- 2. Temp Table: Best for heavy intermediate processing
CREATE TABLE #FilteredOrders (
    OrderId INT PRIMARY KEY,
    CustomerId INT,
    TotalAmount DECIMAL(18,2)
);

INSERT INTO #FilteredOrders (OrderId, CustomerId, TotalAmount)
SELECT OrderId, CustomerId, TotalAmount FROM dbo.Orders WHERE OrderDate >= '2024-01-01';

-- Can add dedicated indexes to temp tables!
CREATE NONCLUSTERED INDEX IX_Temp_Customer ON #FilteredOrders (CustomerId);

SELECT * FROM #FilteredOrders;
DROP TABLE #FilteredOrders;`,
    redFlags: [
      "Believing Table Variables exist only in RAM (they write to tempdb just like temp tables).",
      "Using Table Variables with 100,000 rows, causing the optimizer to pick terrible 1-row nested loop plans.",
      "Assuming referencing a CTE three times in a query runs the CTE logic once and caches it (it runs 3 separate times)."
    ],
    proTips: [
      "If you have a complex CTE that is joined multiple times in a query, materialize it into a '#temp' table first. The query optimizer can generate accurate statistics and use indexes, often reducing execution time from minutes to milliseconds."
    ]
  },
  {
    title: "Why are Set-Based operations vastly superior to Cursors and iterative loops in SQL?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Set-Based", "Cursors", "WHILE Loops", "Query Optimization"],
    pitch: "SQL Server is a relational engine designed mathematically for relational algebra and set theory. Set-based operations process entire datasets simultaneously in bulk, allowing the query optimizer to leverage parallelism, B-tree indexes, vector CPU instructions, and bulk logging. Cursors and WHILE loops operate iteratively (row-by-agonizing-row / RBAR), incurring massive transaction log overhead, repeated context switching, lock escalation, and disabling query parallelism.",
    analogy: "Moving a truckload of bricks: A Set-Based operation is a forklift lifting an entire pallet of 500 bricks into the truck in one 5-second movement. A Cursor is an individual walking back and forth 500 times, carrying one brick in each hand.",
    deepDive: `The Cost of RBAR (Row By Agonizing Row):
1. Lock Overhead: Each fetch in a cursor acquires and releases row locks individually.
2. Transaction Log Writes: Iterative updates create thousands of separate log records instead of a single bulk transaction entry.
3. Optimization Prevention: The optimizer cannot build a global execution plan across iterations; it treats each row execution as an isolated step.
4. When are Cursors acceptable?
   - Administrative maintenance tasks (e.g. iterating over database names to run DBCC CHECKDB or BACKUP DATABASE).
   - Calling external stored procedures that cannot accept table-valued parameters.`,
    codeSnippet: `-- ❌ TERRIBLE: Cursor / RBAR updating interest row-by-row
DECLARE @AccId INT, @Bal DECIMAL(18,2);
DECLARE cur CURSOR FAST_FORWARD FOR 
    SELECT AccountId, Balance FROM dbo.Accounts WHERE IsActive = 1;
OPEN cur;
FETCH NEXT FROM cur INTO @AccId, @Bal;
WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE dbo.Accounts SET Balance = Balance * 1.05 WHERE AccountId = @AccId;
    FETCH NEXT FROM cur INTO @AccId, @Bal;
END;
CLOSE cur;
DEALLOCATE cur;

-- ✅ SET-BASED: Single atomic vectorized statement; 100x-1000x faster!
UPDATE dbo.Accounts
SET Balance = Balance * 1.05
WHERE IsActive = 1;`,
    redFlags: [
      "Using a cursor or WHILE loop to calculate running totals instead of using window functions ('SUM() OVER (...)').",
      "Using cursors to perform bulk data inserts or updates.",
      "Leaving cursors open in production without closing and deallocating them in an error handler."
    ],
    proTips: [
      "If you find yourself reaching for a cursor to format strings or aggregate child rows, use 'STRING_AGG(ColumnName, \", \")' (SQL Server 2017+) or Set-Based Window Functions instead."
    ]
  },
  {
    title: "How do you prevent SQL Injection, and why is dynamic SQL so dangerous?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Security", "SQL Injection", "Parameterized Queries", "sp_executesql"],
    pitch: "SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL command string, allowing an attacker to alter the query's syntax and execute arbitrary commands. You prevent SQL Injection by using Parameterized Queries via SqlCommand, EF Core, or sp_executesql. Parameters treat user input strictly as literal values, never as executable SQL tokens, regardless of whether the string contains quotes, semicolons, or DROP statements.",
    analogy: "Sending money through a drive-through teller tube: A Parameterized Query places the money inside an airtight, sealed capsule that the teller opens safely. SQL Injection is throwing loose paper into the pneumatic pipe where someone slipped in an explosive firecracker disguised as cash.",
    deepDive: `Vulnerability Vectors & Defenses:
1. Direct String Concatenation:
   - 'SELECT * FROM Users WHERE User = \'' + userInput + '\''
   - Input: 'admin\' --' comments out the password verification.
2. Dynamic SQL in Stored Procedures:
   - Stored procedures are NOT automatically immune to SQL injection if they concatenate strings inside 'EXEC(@sql)'.
   - Secure fix: Use 'sp_executesql' with strongly-typed parameter definitions.
3. EF Core Safety & Pitfalls:
   - LINQ queries ('db.Users.Where(u => u.Name == input)') are 100% immune (parameterized by design).
   - 'FromSqlInterpolated($\"SELECT * FROM Users WHERE Name = {input}\")' is SAFE (EF Core parameterizes interpolated strings).
   - 'FromSqlRaw(\"SELECT * FROM Users WHERE Name = '\" + input + \"'\")' is VULNERABLE!`,
    codeSnippet: `-- ❌ VULNERABLE Dynamic SQL inside Stored Procedure
CREATE PROCEDURE dbo.UnsafeSearch @SearchText NVARCHAR(100) AS
BEGIN
    DECLARE @sql NVARCHAR(MAX) = 'SELECT * FROM dbo.Products WHERE Name LIKE ''%' + @SearchText + '%''';
    EXEC(@sql); -- If @SearchText is "'; DROP TABLE dbo.Products; --" -> DISASTER!
END;

-- ✅ SECURE: sp_executesql with explicit strongly-typed parameter definitions
CREATE PROCEDURE dbo.SafeSearch @SearchText NVARCHAR(100) AS
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'SELECT * FROM dbo.Products WHERE Name LIKE @SearchPattern';
    DECLARE @pattern NVARCHAR(102) = '%' + @SearchText + '%';
    
    EXEC sp_executesql 
        @stmt = @sql,
        @params = N'@SearchPattern NVARCHAR(102)',
        @SearchPattern = @pattern;
END;`,
    redFlags: [
      "Claiming 'Stored procedures automatically prevent SQL Injection' (Dynamic SQL inside an SP is completely vulnerable).",
      "Using 'FromSqlRaw' with string concatenation in EF Core.",
      "Attempting to sanitize input by stripping out single quotes instead of using parameterized queries."
    ],
    proTips: [
      "In EF Core 7+, use 'context.Database.SqlQuery<T>()' or 'FromSqlInterpolated()'. If dynamic column sorting is required (which cannot be parameterized), validate the column name against an explicit whitelist of allowed property names before appending it."
    ]
  },
  {
    title: "How do you systematically diagnose and fix a slow query in a production SQL Server?",
    seniority: "Senior",
    tags: ["SQL", "Performance Tuning", "DMVs", "Troubleshooting", "Production"],
    pitch: "I follow a systematic 5-step triage process: 1) Measure actual resource consumption (CPU vs I/O vs Duration) using 'SET STATISTICS IO, TIME ON' or DMVs; 2) Inspect the Actual Execution Plan to locate expensive operators, missing indexes, or cardinality misestimates; 3) Check wait statistics to see if the query is CPU-bound (SOS_SCHEDULER_YIELD) or I/O-bound (PAGEIOLATCH); 4) Inspect table statistics and index fragmentation; and 5) Apply targeted fixes—such as rewriting non-SARGable predicates, creating covering indexes with INCLUDE, updating statistics, or using query hints.",
    analogy: "A doctor examining a sick patient: First check vitals (blood pressure, temperature = wait stats and IO reads), take an X-ray (execution plan), inspect previous lab history (statistics), and then prescribe targeted medication instead of doing random surgery.",
    deepDive: `The Senior Diagnostic Playbook:
1. Find the Slow Query:
   - Query 'sys.dm_exec_query_stats' ordered by 'total_worker_time' (CPU) or 'total_logical_reads' (Disk I/O).
2. Is it Waiting? Check Wait Types:
   - 'PAGEIOLATCH_SH': Waiting for disk reads (missing indexes, insufficient RAM / buffer pool pressure).
   - 'LCK_M_*': Query is being blocked by another uncommitted transaction.
   - 'CXPACKET': Query is parallelized; often unbalanced work distribution.
3. Cardinality Estimates:
   - Compare Actual vs Estimated rows. If off by orders of magnitude, run 'UPDATE STATISTICS TableName WITH FULLSCAN'.
4. Index Verification:
   - Eliminate Key Lookups by adding INCLUDE columns to nonclustered indexes.
   - Remove functions on columns in WHERE clauses to convert scans into seeks.`,
    codeSnippet: `-- Top 5 most resource-intensive queries by Total Logical Reads (I/O)
SELECT TOP 5
    qs.total_logical_reads / qs.execution_count AS AvgLogicalReads,
    qs.total_worker_time / qs.execution_count / 1000 AS AvgCpuMs,
    qs.total_elapsed_time / qs.execution_count / 1000 AS AvgDurationMs,
    qs.execution_count,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS QueryText,
    qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
ORDER BY AvgLogicalReads DESC;`,
    redFlags: [
      "Guessing what is wrong and blindly adding indexes to production without inspecting execution plans.",
      "Tuning queries in SSMS with small test datasets instead of realistic production-sized data distributions.",
      "Assuming slow queries are always caused by missing indexes when blocking or stale statistics are the real culprit."
    ],
    proTips: [
      "Always query 'sys.dm_os_waiting_tasks' when an active query is hanging in production. It tells you immediately if the query is actively executing or blocked waiting for a lock held by another session ID."
    ]
  },
  {
    title: "What is Database Normalization (1NF, 2NF, 3NF), and when do you intentionally denormalize?",
    seniority: "Mid-to-Senior",
    tags: ["SQL", "Normalization", "Denormalization", "Database Design", "Architecture"],
    pitch: "Normalization organizes relational tables to minimize data redundancy and prevent update, insert, and delete anomalies. First Normal Form (1NF) eliminates duplicate columns and ensures atomic values. Second Normal Form (2NF) requires 1NF and ensures all non-key columns depend on the entire primary key. Third Normal Form (3NF) requires 2NF and ensures non-key columns depend only on the primary key (no transitive dependencies). We intentionally denormalize in read-heavy reporting systems, OLAP data warehouses, or high-throughput caches to eliminate expensive multi-table joins.",
    analogy: "Packing clothes for a trip: Normalization is putting all shirts in one packing cube, pants in another, and shoes in a separate bag so nothing gets crumpled and duplicates are easy to spot. Denormalization is pre-packing complete outfits together in a carry-on so you can grab a full set in 2 seconds without searching 3 different bags.",
    deepDive: `The Normal Forms Breakdown:
1. 1NF (Atomic):
   - No repeating groups or comma-separated lists in a single cell (e.g. 'Phones: 555-1234, 555-5678' violates 1NF).
   - Must have a primary key.
2. 2NF (Full Functional Dependency):
   - Applies to tables with composite primary keys.
   - Every column must depend on the whole primary key, not just part of it.
3. 3NF (No Transitive Dependency):
   - 'Non-key attributes must depend on the key, the whole key, and nothing but the key'.
   - Example violation: Storing 'ZipCode' and 'State' in the Customers table where State is functionally dependent on ZipCode.
4. When to Denormalize:
   - High-throughput read dashboards where joining 8 normalized tables introduces latency.
   - Storing pre-calculated aggregates (e.g. 'TotalOrderCount', 'CurrentBalance') updated via background events or triggers.`,
    codeSnippet: `-- ❌ Denormalized / Violates 1NF & 3NF:
-- Comma-separated tags violate 1NF; CategoryName depends on CategoryId (3NF violation)
CREATE TABLE dbo.UnsafeProducts (
    ProductId INT PRIMARY KEY,
    ProductName VARCHAR(100),
    Tags VARCHAR(255), -- 'tech,laptop,sale' -> ❌ Violates 1NF
    CategoryId INT,
    CategoryName VARCHAR(100) -- ❌ Violates 3NF (transitive dependency)
);

-- ✅ Normalized (3NF Compliant):
CREATE TABLE dbo.Categories (
    CategoryId INT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL
);

CREATE TABLE dbo.Products (
    ProductId INT PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    CategoryId INT REFERENCES dbo.Categories(CategoryId)
);

CREATE TABLE dbo.ProductTags (
    ProductId INT REFERENCES dbo.Products(ProductId),
    Tag VARCHAR(50),
    PRIMARY KEY (ProductId, Tag)
);`,
    redFlags: [
      "Storing comma-separated strings in database columns to represent collections.",
      "Denormalizing transactional OLTP tables prematurely before measuring actual query performance.",
      "Not having synchronization strategies (like messaging or transactions) when duplicating denormalized data."
    ],
    proTips: [
      "In transactional systems (OLTP), normalize to 3NF to guarantee absolute data integrity. In read-heavy reporting systems (OLAP / CQRS Read Models), denormalize into flat summary tables or Materialized Views to achieve sub-10ms query times."
    ]
  }
];

console.log('Total SQL questions:', sqlQuestions.length);

module.exports = { sqlQuestions };
