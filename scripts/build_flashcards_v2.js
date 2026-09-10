const fs = require('fs');

global.window = {};
eval(fs.readFileSync('js/data/flashcards.js', 'utf8'));
const currentCards = window.INTERVIEW_FLASHCARDS || [];

// Group existing cards by pillar
const csharpCards = currentCards.filter(c => c.pillar === 'csharp');
const aspnetCards = currentCards.filter(c => c.pillar === 'aspnet');
const sqlCards = currentCards.filter(c => c.pillar === 'sql');
const efcoreCards = currentCards.filter(c => c.pillar === 'efcore');
const linqCards = currentCards.filter(c => c.pillar === 'linq');
const uiCards = currentCards.filter(c => c.pillar === 'ui');
const cloudCards = currentCards.filter(c => c.pillar === 'cloud');

// Add 4 high-yield SQL flashcards
sqlCards.push(
  {
    topic: "Window Functions: ROW_NUMBER vs RANK vs DENSE_RANK",
    front: "What is the exact difference between ROW_NUMBER(), RANK(), and DENSE_RANK() in SQL Server?",
    back: "Given tie values (e.g. 100, 100, 80):\n• ROW_NUMBER(): Assigns strictly sequential integers without ties (1, 2, 3).\n• RANK(): Assigns identical rank to ties, but SKIPS subsequent ranks with gaps (1, 1, 3).\n• DENSE_RANK(): Assigns identical rank to ties WITHOUT skipping ranks (1, 1, 2).\n\nUse DENSE_RANK() for 'Find 2nd Highest Salary' problems.",
    seniorTip: "Always use DENSE_RANK() inside a CTE when ranking items with potential duplicate values to avoid missing ranks."
  },
  {
    topic: "Temp Tables vs Table Variables",
    front: "Why do Temporary Tables (#table) perform drastically better than Table Variables (@table) for large datasets in SQL Server?",
    back: "• Both reside in tempdb (Table Variables are NOT memory-only!).\n• #Temp Tables have full distribution statistics and support clustered/non-clustered indexes, allowing the optimizer to make accurate cardinality estimates.\n• @Table Variables have NO column statistics (optimizer historically assumes 1 row prior to SQL 2019) and cannot participate in parallel execution plans.",
    seniorTip: "Use @Table Variables only for trivial lookup sets (< 100 rows). For anything larger or join-intensive, always use #Temp tables with an explicit clustered index."
  },
  {
    topic: "Covering Indexes & INCLUDE",
    front: "What is a 'Covering Index', and why is the 'INCLUDE' clause superior to adding columns to the index key?",
    back: "A Covering Index contains all columns requested by a query, completely eliminating costly B-Tree Bookmark / Key Lookups to the clustered index.\n\nThe INCLUDE clause stores non-key columns ONLY at the leaf level of the B-Tree, rather than intermediate index nodes. This minimizes index page size, keeps the B-Tree shallow, and avoids the 16-column / 900-byte index key limit.",
    seniorTip: "Place high-cardinality filtering/sorting columns in the index KEY, and place SELECT-list projection columns in the INCLUDE clause."
  },
  {
    topic: "SARGable Queries",
    front: "What does SARGable mean in SQL, and why does wrapping a column in a function (e.g. YEAR(OrderDate) = 2024) destroy performance?",
    back: "SARGable stands for 'Search Argument Able'. A query is SARGable if the SQL Server optimizer can perform a targeted B-Tree Index Seek rather than an expensive Index Scan.\n\nApplying a function like 'YEAR(OrderDate) = 2024' or 'UPPER(Status) = 'PAID'' forces the engine to evaluate the function row-by-row on every single record in the table, destroying index seek capabilities.\n\nRefactor to range predicates: 'OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01''.",
    seniorTip: "Never wrap indexed columns in functions, arithmetic (+, -), or type conversions in the WHERE clause."
  }
);

// Add 4 high-yield EF Core flashcards
efcoreCards.push(
  {
    topic: "Eager vs Lazy vs Explicit Loading",
    front: "What is the critical danger of enabling Lazy Loading proxies in modern ASP.NET Core Web APIs?",
    back: "1. N+1 Query Storms: Iterating over child collections in a loop executes N separate SQL round-trips.\n2. Circular Serialization Crashes: Serializers like System.Text.Json navigate child -> parent -> child infinitely, throwing stack overflow exceptions.\n3. ThreadPool Blocking: Lazy loading executes synchronous I/O on property access, defeating async/await benefits.",
    seniorTip: "In high-throughput microservices, disable lazy loading completely and use explicit DTO projection (.Select()) to query only required columns."
  },
  {
    topic: "First vs Single SQL Translation",
    front: "What SQL does EF Core generate for FirstOrDefault() vs. SingleOrDefault(), and why does SingleOrDefault() cost more?",
    back: "• FirstOrDefaultAsync(): Generates 'SELECT TOP (1) ...'. SQL Server stops scanning immediately after finding 1 matching row.\n• SingleOrDefaultAsync(): Generates 'SELECT TOP (2) ...'. SQL Server MUST verify that a second matching row does not exist!\n\nIf the column is not backed by a Unique Index, SingleOrDefault continues scanning the table/index looking for a second match.",
    seniorTip: "Only use SingleOrDefault when encountering duplicate rows signifies catastrophic data corruption; otherwise use FirstOrDefault."
  },
  {
    topic: "EF Core Split Queries (.AsSplitQuery)",
    front: "Why does including multiple child collections in EF Core cause a 'Cartesian Explosion', and how does .AsSplitQuery() fix it?",
    back: "Eagerly loading multiple collections (e.g. Order.Items and Order.Shipments) via SQL JOINs duplicates parent data for every combination (e.g. 10 items * 5 shipments = 50 rows returned for a single order).\n\n'.AsSplitQuery()' splits the query into separate SELECT statements (1 for Orders, 1 for Items, 1 for Shipments), transferring far fewer bytes across the network.",
    seniorTip: "Enable split queries globally via 'options.UseSqlServer(..., o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))' in read-heavy applications."
  },
  {
    topic: "RowVersion & Optimistic Concurrency",
    front: "How does EF Core implement Optimistic Concurrency Control using a byte[] RowVersion column?",
    back: "1. The entity has a 'byte[] RowVersion' property configured with '.IsRowVersion()'.\n2. In SQL Server, this is a ROWVERSION / TIMESTAMP column that auto-increments on every UPDATE.\n3. When updating, EF Core generates: 'UPDATE Orders SET ... WHERE Id = @id AND RowVersion = @originalRowVersion'.\n4. If another transaction modified the row, 0 rows are affected, causing EF Core to throw DbUpdateConcurrencyException.",
    seniorTip: "Catch DbUpdateConcurrencyException in your application service and inspect entry.GetDatabaseValuesAsync() to implement automatic retry or merge conflict logic."
  }
);

// Add 4 high-yield LINQ flashcards
linqCards.push(
  {
    topic: "IEnumerable vs IQueryable",
    front: "What is the fatal difference between filtering on IEnumerable<T> vs IQueryable<T> in Entity Framework Core?",
    back: "• IQueryable<T> takes 'Expression<Func<T, bool>>'. The LINQ provider translates the expression tree into native SQL, executing the WHERE filter directly on the database engine.\n• IEnumerable<T> takes compiled delegates 'Func<T, bool>'. Filtering evaluates in CLR memory on the client machine.\n\nCasting an EF query to IEnumerable before .Where() pulls ALL rows from the database into RAM first!",
    seniorTip: "Never call .ToList() or .AsEnumerable() before applying filters (.Where), pagination (.Skip/.Take), or projections (.Select)."
  },
  {
    topic: "LINQ Deferred Execution",
    front: "What is the 'Multiple Enumeration' bug in LINQ, and how do you prevent it?",
    back: "LINQ query definitions (Where, Select, Skip) use deferred execution: code is NOT evaluated until iterated (via foreach, Any, ToList).\n\nIf you iterate an unmaterialized sequence multiple times (e.g. 'if (query.Any()) { foreach (var x in query) ... }'), the underlying query or database roundtrip re-executes each time!\n\nFix: Materialize with '.ToList()' or '.ToArray()' once if re-enumerating.",
    seniorTip: "Use JetBrains ReSharper / Roslyn analyzer 'Possible multiple enumeration of IEnumerable' to detect and fix these in pull requests."
  },
  {
    topic: "Any() vs Count() > 0",
    front: "Why is .Any() asymptotically superior to .Count() > 0 when checking if a collection or database table has elements?",
    back: "• In-Memory: .Any() calls MoveNext() once and returns true immediately (O(1)). .Count() > 0 must iterate the entire collection (O(N)).\n• SQL Generation: In EF Core, .Any() compiles to 'IF EXISTS (SELECT 1 FROM ...)', which terminates on the very first row. .Count() > 0 forces 'SELECT COUNT(*)', reading all matching index pages.",
    seniorTip: "For in-memory List<T>, use list.Exists(p) instead of list.Any(p) to avoid heap allocation of an IEnumerator object."
  },
  {
    topic: "SelectMany vs Select",
    front: "What is the difference between .Select() and .SelectMany() in LINQ?",
    back: "• .Select() transforms each element in a sequence into a new element (1:1 mapping, returning IEnumerable<TResult>).\n• .SelectMany() projects each element to an IEnumerable<TResult> and flattens the resulting sequences into a single sequence (1:N mapping, returning a flattened 1D sequence).\n\nExample: customers.SelectMany(c => c.Orders) flattens all orders across all customers into a single list.",
    seniorTip: "SelectMany can also take a result selector: collection.SelectMany(parent => parent.Children, (parent, child) => new { parent, child }) to perform cross-joins."
  }
);

// Standardize IDs for all flashcards
const allCards = [
  ...csharpCards.map((c, i) => ({ ...c, id: `fc-csharp-${i + 1}`, pillar: 'csharp' })),
  ...aspnetCards.map((c, i) => ({ ...c, id: `fc-aspnet-${i + 1}`, pillar: 'aspnet' })),
  ...linqCards.map((c, i) => ({ ...c, id: `fc-linq-${i + 1}`, pillar: 'linq' })),
  ...efcoreCards.map((c, i) => ({ ...c, id: `fc-efcore-${i + 1}`, pillar: 'efcore' })),
  ...sqlCards.map((c, i) => ({ ...c, id: `fc-sql-${i + 1}`, pillar: 'sql' })),
  ...uiCards.map((c, i) => ({ ...c, id: `fc-ui-${i + 1}`, pillar: 'ui' })),
  ...cloudCards.map((c, i) => ({ ...c, id: `fc-cloud-${i + 1}`, pillar: 'cloud' }))
];

console.log('\nFinal flashcards summary:');
console.log('- C# Flashcards:', csharpCards.length);
console.log('- ASP.NET Flashcards:', aspnetCards.length);
console.log('- LINQ Flashcards:', linqCards.length);
console.log('- EF Core Flashcards:', efcoreCards.length);
console.log('- SQL Flashcards:', sqlCards.length);
console.log('- UI/React Flashcards:', uiCards.length);
console.log('- Cloud/DevOps Flashcards:', cloudCards.length);
console.log('TOTAL FLASHCARDS:', allCards.length);

const fileContent = `// ============================================================================
// RAPID-FIRE FLASHCARDS DATA
// Spaced-Repetition Cards Across the 7 Modular Interview Domains
// Sourced from top GitHub .NET repositories & Reddit interview patterns
// ============================================================================

window.INTERVIEW_FLASHCARDS = ${JSON.stringify(allCards, null, 2)};
`;

fs.writeFileSync('js/data/flashcards.js', fileContent, 'utf8');
console.log('✅ Successfully wrote js/data/flashcards.js with 0 errors!');
