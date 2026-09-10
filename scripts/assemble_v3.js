// ============================================================================
// ASSEMBLE V3: COMPILES 96 POPULAR INTERVIEW QUESTIONS & FLASHCARDS
// Merges all 6 modular question files into production js/data/questions.js and js/data/flashcards.js
// ============================================================================

const fs = require('fs');
const path = require('path');

const { csharpQuestions } = require('./csharp_questions_v3');
const { aspnetQuestions } = require('./aspnet_questions_v3');
const { efcoreQuestions } = require('./efcore_questions_v3');
const { sqlQuestions } = require('./sql_questions_v3');
const { uiQuestions } = require('./ui_questions_v3');
const { cloudQuestions } = require('./cloud_questions_v3');

console.log('--- Loaded Question Counts ---');
console.log('C# & OOP:', csharpQuestions.length);
console.log('ASP.NET Core:', aspnetQuestions.length);
console.log('EF Core & LINQ:', efcoreQuestions.length);
console.log('SQL Server:', sqlQuestions.length);
console.log('React & TypeScript:', uiQuestions.length);
console.log('Azure & DevOps:', cloudQuestions.length);

const allQuestions = [];
const allFlashcards = [];

// Helper to format and add
function addPillar(questions, pillarId, prefix) {
  questions.forEach((q, idx) => {
    const id = `q-${prefix}-${idx + 1}`;
    const questionObj = {
      id,
      pillar: pillarId,
      seniority: q.seniority || "Mid-to-Senior",
      tags: q.tags || [],
      title: q.title,
      pitch: q.pitch,
      analogy: q.analogy || "",
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
      id: `fc-${prefix}-${idx + 1}`,
      pillar: pillarId,
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

// Write js/data/questions.js
const questionsFilePath = path.join(__dirname, '..', 'js', 'data', 'questions.js');
const questionsContent = `// ============================================================================
// HIGH-YIELD SENIOR FULL-STACK .NET INTERVIEW CURRICULUM (POPULAR QUESTIONS)
// Sourced from User's Layer 1-4 Guide, OOP Core Standards & Top GitHub .NET Repos
// 96 Popular, High-Frequency Questions Across 6 Pillars with Teenager Analogies
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
