const fs = require('fs');

global.window = {};
eval(fs.readFileSync('js/data/flashcards.js', 'utf8'));
const cards = window.INTERVIEW_FLASHCARDS;

const newCards = [];
cards.forEach(c => {
  let p = c.pillar;
  if (p === 'frontend') p = 'ui';
  if (c.id === 'fc-21' || c.id === 'fc-22' || c.id === 'fc-23' || c.id === 'fc-24') {
    p = 'efcore';
  }
  newCards.push({
    ...c,
    pillar: p
  });
});

// Add LINQ flashcards
const linqCards = [
  {
    id: "fc-linq-1",
    pillar: "linq",
    topic: "IEnumerable vs IQueryable",
    front: "What is the critical performance difference between IEnumerable<T> and IQueryable<T> in LINQ?",
    back: "• IEnumerable<T> uses Func<T, bool> delegates and evaluates IN-MEMORY on the client machine.\n• IQueryable<T> uses Expression<Func<T, bool>> (expression trees) and evaluates OUT-OF-PROCESS by translating LINQ into native SQL on the database server.\n\nCasting to IEnumerable before applying Where/Take forces EF Core to pull the entire table into client memory!",
    seniorTip: "Always keep queries as IQueryable<T> until all WHERE, TAKE, and SELECT projections are applied."
  },
  {
    id: "fc-linq-2",
    pillar: "linq",
    topic: "Multiple Enumeration",
    front: "What causes the 'Possible multiple enumeration of IEnumerable' bug, and how do you prevent it?",
    back: "LINQ queries are deferred. If an unmaterialized sequence is evaluated more than once (e.g. 'if (items.Any()) ... foreach (var x in items)'), the underlying query/generator/database call re-runs on every evaluation!\n\nFix: Materialize with .ToList() or .ToArray() before multiple iterations, or use TryGetNonEnumeratedCount() in .NET 6+.",
    seniorTip: "If you only need a single forward pass over millions of items, do NOT call .ToList(); stream with 'foreach' to preserve O(1) memory."
  },
  {
    id: "fc-linq-3",
    pillar: "linq",
    topic: "SelectMany vs Select",
    front: "What is the difference between .Select() and .SelectMany() in LINQ?",
    back: "• .Select() produces a 1-to-1 projection (transforms each element, returning IEnumerable<TOut>).\n• .SelectMany() flattens 1-to-many intermediate sequences into a single flat collection (monadic flatMap).\n\nIn EF Core, SelectMany translates into SQL CROSS APPLY or INNER JOIN.",
    seniorTip: "Use SelectMany to query nested child collections (e.g., all order items across all orders) without writing nested foreach loops."
  },
  {
    id: "fc-linq-4",
    pillar: "linq",
    topic: "GroupBy vs ToLookup",
    front: "When should you use .ToLookup() instead of .GroupBy() or .ToDictionary()?",
    back: "• GroupBy(): Deferred and streamed. Multiple enumerations re-evaluate.\n• ToLookup(): Immediately materialized in memory. Allows duplicate keys, and querying a non-existent key safely returns an empty sequence without throwing.\n• ToDictionary(): Immediately materialized, but requires strictly UNIQUE keys (duplicate keys throw ArgumentException).",
    seniorTip: "Use ToLookup() when creating in-memory 1-to-many indexes for sub-millisecond parent-child lookups."
  }
];

const finalCards = [...newCards, ...linqCards];

const content = `// ============================================================================
// RAPID-FIRE FLASHCARDS DATA
// Spaced-Repetition Cards Across the 7 Modular Interview Domains
// ============================================================================

window.INTERVIEW_FLASHCARDS = ${JSON.stringify(finalCards, null, 2)};
`;

fs.writeFileSync('js/data/flashcards.js', content, 'utf8');
console.log('Successfully updated flashcards.js! Total cards:', finalCards.length);
const counts = {};
finalCards.forEach(c => counts[c.pillar] = (counts[c.pillar] || 0) + 1);
console.log('Cards by Pillar:', counts);
