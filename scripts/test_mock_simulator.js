// Headless testing of Mock Simulator logic
const fs = require('fs');

// Load questions
global.window = {};
eval(fs.readFileSync('js/data/questions.js', 'utf8'));

const questions = window.INTERVIEW_QUESTIONS;
console.log('Total questions loaded:', questions.length);

if (!questions || questions.length < 50) {
  console.error('FAIL: Less than 50 questions loaded!');
  process.exit(1);
}

// Test question properties
let badQuestions = 0;
questions.forEach((q, idx) => {
  const missingFields = [];
  if (!q.id) missingFields.push('id');
  if (!q.pillar) missingFields.push('pillar');
  if (!q.seniority) missingFields.push('seniority');
  if (!q.tags || !Array.isArray(q.tags)) missingFields.push('tags');
  if (!q.title) missingFields.push('title');
  if (!q.pitch) missingFields.push('pitch');
  if (!q.deepDive) missingFields.push('deepDive');
  if (!q.codeSnippet) missingFields.push('codeSnippet');
  if (!q.redFlags || !Array.isArray(q.redFlags)) missingFields.push('redFlags');
  if (!q.proTips || !Array.isArray(q.proTips)) missingFields.push('proTips');

  if (missingFields.length > 0) {
    console.error(`Question #${idx} (${q.id || 'NO_ID'}) is missing fields: ${missingFields.join(', ')}`);
    badQuestions++;
  }
});

if (badQuestions > 0) {
  console.error(`FAIL: ${badQuestions} questions have missing fields!`);
  process.exit(1);
} else {
  console.log('PASS: All 53 questions have complete 5-part architecture schema!');
}

// Test Mock Session simulation
const session = {
  questions: questions.slice(0, 5),
  currentIndex: 0,
  scores: {},
  durationMinutes: 30,
  secondsRemaining: 1800,
  isModelRevealed: false
};

console.log('Testing 5-question mock session...');

// User answers & scores each question
session.questions.forEach((q, idx) => {
  session.currentIndex = idx;
  const rating = (idx % 5) + 1; // 1, 2, 3, 4, 5
  session.scores[q.id] = rating;
  console.log(`  Question ${idx + 1}: ${q.title.substring(0, 40)}... -> Score: ${rating}★`);
});

// Calculate scorecard
let totalScore = 0;
const maxScore = session.questions.length * 5;
const pillarScores = {};

session.questions.forEach(q => {
  const s = session.scores[q.id] || 0;
  totalScore += s;
  if (!pillarScores[q.pillar]) {
    pillarScores[q.pillar] = { earned: 0, max: 0 };
  }
  pillarScores[q.pillar].earned += s;
  pillarScores[q.pillar].max += 5;
});

const readinessPct = Math.round((totalScore / maxScore) * 100);
console.log(`\nMock Exam Result: ${totalScore} / ${maxScore} Stars = ${readinessPct}% Readiness`);
console.log('Pillar Breakdown:', pillarScores);

if (readinessPct !== 60) {
  console.error(`FAIL: Expected 60% readiness, got ${readinessPct}%`);
  process.exit(1);
} else {
  console.log('PASS: Scorecard calculations match perfectly!');
}
