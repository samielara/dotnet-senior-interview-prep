// ============================================================================
// ASSEMBLE V3: COMPILES 96 POPULAR INTERVIEW QUESTIONS & FLASHCARDS
// Merges all 6 modular question files into production js/data/questions.js and js/data/flashcards.js
// Accurately categorizes into Entry, Mid, and Senior experience levels
// ============================================================================

const fs = require('fs');
const path = require('path');

const { csharpQuestions } = require('./csharp_questions_v3');
const { aspnetQuestions } = require('./aspnet_questions_v3');
const { efcoreQuestions } = require('./efcore_questions_v3');
const { sqlQuestions } = require('./sql_questions_v3');
const { uiQuestions } = require('./ui_questions_v3');
const { cloudQuestions } = require('./cloud_questions_v3');
const { VISUAL_BLUEPRINTS } = require('./visual_diagrams');

console.log('--- Loaded Question Counts ---');
console.log('C# & OOP:', csharpQuestions.length);
console.log('ASP.NET Core:', aspnetQuestions.length);
console.log('EF Core & LINQ:', efcoreQuestions.length);
console.log('SQL Server:', sqlQuestions.length);
console.log('React & TypeScript:', uiQuestions.length);
console.log('Azure & DevOps:', cloudQuestions.length);

// Explicit Seniority Map per Pillar (1-indexed based on question order)
const seniorityMappings = {
  csharp: {
    1: "Entry",   // 4 OOP Pillars
    2: "Entry",   // Overloading vs Overriding
    3: "Entry",   // Interface vs Abstract Class
    4: "Mid",     // SOLID Principles
    5: "Entry",   // Class vs Struct
    6: "Entry",   // Access Modifiers
    7: "Mid",     // static Keyword & Constructors
    8: "Mid",     // Composition vs Inheritance
    9: "Mid",     // ref vs out vs in
    10: "Mid",    // Task vs Thread
    11: "Senior", // Async/await ThreadPool
    12: "Senior", // Task vs ValueTask
    13: "Senior", // CLR Garbage Collection
    14: "Senior", // IDisposable & Finalizers
    15: "Mid",    // Delegates vs Events
    16: "Mid",    // const vs readonly vs static readonly
    17: "Entry",  // String Immutability & StringBuilder
    18: "Entry"   // Exception Handling (throw vs throw ex)
  },
  aspnet: {
    1: "Mid",     // Thin Controllers
    2: "Entry",   // Dependency Injection Basics
    3: "Mid",     // Transient, Scoped, Singleton
    4: "Mid",     // Middleware vs Filters
    5: "Entry",   // REST Response & Status Codes
    6: "Senior",  // Idempotency & Idempotency-Key
    7: "Mid",     // RFC 7807 Global Exception Handling
    8: "Entry",   // Authentication vs Authorization
    9: "Senior",  // CancellationToken
    10: "Senior", // Hangfire Job Retries
    11: "Senior", // IHttpClientFactory Socket Exhaustion
    12: "Mid",    // CORS Architecture
    13: "Mid",    // Minimal APIs vs Controllers
    14: "Senior"  // JWT Refresh Token Rotation
  },
  efcore: {
    1: "Entry",   // IEnumerable vs IQueryable
    2: "Mid",     // AsNoTracking
    3: "Mid",     // Eliminating N+1 queries
    4: "Mid",     // DbContext Lifetime & Unit of Work
    5: "Senior",  // Database Transactions & Resilient Execution Strategies
    6: "Senior",  // Concurrent Updates (RowVersion)
    7: "Senior",  // Split Queries (.AsSplitQuery)
    8: "Entry",   // First vs Single SQL translation
    9: "Mid",     // Eager vs Explicit vs Lazy loading
    10: "Entry",  // Code-First vs Database-First
    11: "Mid",    // LINQ Deferred Execution
    12: "Entry"   // LINQ Any vs Count
  },
  sql: {
    1: "Entry",   // INNER vs LEFT JOIN & NULLs
    2: "Entry",   // WHERE vs HAVING
    3: "Mid",     // Window Functions vs GROUP BY
    4: "Mid",     // Clustered vs Nonclustered Index
    5: "Mid",     // Covering Index & INCLUDE
    6: "Mid",     // SARGable Queries
    7: "Senior",  // Reading Execution Plans
    8: "Mid",     // Stored Procedures vs EF Core
    9: "Senior",  // Parameter Sniffing
    10: "Senior", // ACID & Isolation Levels (RCSI)
    11: "Senior", // Deadlocks & Extended Events
    12: "Senior", // sp_getapplock Distributed Locking
    13: "Senior", // Pagination (OFFSET/FETCH vs Keyset)
    14: "Mid",    // CTE vs Temp Table vs Table Variable
    15: "Mid",    // Set-Based vs Cursors
    16: "Entry",  // SQL Injection Prevention
    17: "Senior", // Diagnosing Slow Queries
    18: "Entry"   // Normalization (1NF-3NF)
  },
  ui: {
    1: "Entry",   // Props vs State
    2: "Entry",   // Controlled vs Uncontrolled
    3: "Mid",     // Functional State Updates
    4: "Mid",     // useEffect Lifecycle & Cleanup
    5: "Mid",     // useMemo / useCallback / React.memo
    6: "Entry",   // Keys in Lists
    7: "Mid",     // Lifting State vs Context vs Zustand
    8: "Mid",     // Custom Hooks
    9: "Mid",     // TypeScript Generics
    10: "Mid",    // any vs unknown vs never
    11: "Entry",  // interface vs type
    12: "Senior", // Discriminated Unions
    13: "Entry",  // API Loading / Error / Empty / Success
    14: "Senior", // Virtualized Lists (react-window)
    15: "Senior", // Component Testing (Vitest & RTL)
    16: "Senior"  // React 18 Concurrent Transitions
  },
  cloud: {
    1: "Entry",   // CI vs CD vs Continuous Deployment
    2: "Mid",     // Pipeline Stages, Jobs, Steps
    3: "Mid",     // YAML vs Classic Pipelines
    4: "Mid",     // Build Artifacts Immutability
    5: "Entry",   // Branch Policies & PR Gates
    6: "Senior",  // Secrets Handling & Azure Key Vault
    7: "Senior",  // Multi-Stage Environments & Approvals
    8: "Senior",  // Systematic Pipeline Triage
    9: "Senior",  // Zero-Downtime Rollback & Slot Swaps
    10: "Entry",  // Docker Image vs Container
    11: "Mid",    // Dockerfile Layer Caching
    12: "Senior", // Multi-Stage Docker Builds
    13: "Entry",  // EXPOSE vs Port Mapping
    14: "Mid",    // Container Volumes vs Bind Mounts
    15: "Mid",    // Container Health Checks & Logging
    16: "Senior", // Azure Container Apps vs App Service
    17: "Senior", // Honest Kubernetes Fallback
    18: "Mid"     // Infrastructure as Code: Bicep / Terraform
  }
};

const allQuestions = [];
const allFlashcards = [];

function addPillar(questions, pillarId, prefix) {
  questions.forEach((q, idx) => {
    const questionNumber = idx + 1;
    const mappedSeniority = (seniorityMappings[pillarId] && seniorityMappings[pillarId][questionNumber]) 
      || q.seniority 
      || "Mid";

    const id = `q-${prefix}-${questionNumber}`;
    const questionObj = {
      id,
      pillar: pillarId,
      seniority: mappedSeniority,
      tags: q.tags || [],
      title: q.title,
      pitch: q.pitch,
      analogy: q.analogy || "",
      visualDiagram: (VISUAL_BLUEPRINTS[pillarId] && VISUAL_BLUEPRINTS[pillarId][questionNumber]) || "",
      deepDive: q.deepDive,
      codeSnippet: q.codeSnippet,
      redFlags: q.redFlags || [],
      proTips: q.proTips || []
    };
    allQuestions.push(questionObj);

    // Build flashcard for each question
    const firstTag = q.tags && q.tags[0] ? q.tags[0] : pillarId.toUpperCase();
    const proTip = q.proTips && q.proTips[0] ? q.proTips[0] : "";
    allFlashcards.push({
      id: `fc-${prefix}-${questionNumber}`,
      pillar: pillarId,
      seniority: mappedSeniority,
      topic: firstTag,
      front: q.title,
      back: `${q.pitch}\n\n💡 Teenager Analogy: ${q.analogy}`,
      seniorTip: proTip
    });
  });
}

addPillar(csharpQuestions, 'csharp', 'csharp');
addPillar(aspnetQuestions, 'aspnet', 'aspnet');
addPillar(efcoreQuestions, 'efcore', 'efcore');
addPillar(sqlQuestions, 'sql', 'sql');
addPillar(uiQuestions, 'ui', 'ui');
addPillar(cloudQuestions, 'cloud', 'cloud');

console.log(`\nTotal questions assembled: ${allQuestions.length}`);
console.log(`Total flashcards assembled: ${allFlashcards.length}`);

// Count distribution
const counts = { Entry: 0, Mid: 0, Senior: 0 };
allQuestions.forEach(q => { counts[q.seniority] = (counts[q.seniority] || 0) + 1; });
console.log('Seniority breakdown:', counts);

// Write js/data/questions.js
const questionsFilePath = path.join(__dirname, '..', 'js', 'data', 'questions.js');
const questionsContent = `// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM (POPULAR QUESTIONS)
// Sourced from User's Layer 1-4 Guide, OOP Core Standards & Top GitHub .NET Repos
// 96 Popular, High-Frequency Questions Categorized by Experience Level (Entry, Mid, Senior)
// ============================================================================

window.INTERVIEW_QUESTIONS = ${JSON.stringify(allQuestions, null, 2)};
`;

fs.writeFileSync(questionsFilePath, questionsContent, 'utf-8');
console.log(`Successfully wrote ${questionsFilePath} (${(Buffer.byteLength(questionsContent)/1024).toFixed(1)} KB)`);

// Write js/data/flashcards.js
const flashcardsFilePath = path.join(__dirname, '..', 'js', 'data', 'flashcards.js');
const flashcardsContent = `// ============================================================================
// RAPID-FIRE FLASHCARDS DATA (POPULAR CURRICULUM)
// Spaced-Repetition Cards with Teenager Analogies across all 6 Core Modules
// ============================================================================

window.INTERVIEW_FLASHCARDS = ${JSON.stringify(allFlashcards, null, 2)};
`;

fs.writeFileSync(flashcardsFilePath, flashcardsContent, 'utf-8');
console.log(`Successfully wrote ${flashcardsFilePath} (${(Buffer.byteLength(flashcardsContent)/1024).toFixed(1)} KB)`);
