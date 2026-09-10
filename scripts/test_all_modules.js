const fs = require('fs');

global.window = {
  addEventListener: () => {},
  location: { hash: '' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};

global.document = {
  addEventListener: () => {},
  querySelectorAll: () => [],
  getElementById: () => ({
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} }
  })
};

const files = [
  'js/audio.js',
  'js/data/questions.js',
  'js/data/challenges.js',
  'js/data/architectures.js',
  'js/data/flashcards.js',
  'js/app.js'
];

let errors = 0;
files.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    eval(code);
    console.log(`✅ ${f} evaluated cleanly without runtime errors.`);
  } catch (err) {
    console.error(`❌ ${f} FAILED with error:`, err);
    errors++;
  }
});

console.log('\nData summary:');
console.log('- Total Questions:', window.INTERVIEW_QUESTIONS ? window.INTERVIEW_QUESTIONS.length : 'MISSING');
console.log('- Total Challenges:', window.INTERVIEW_CHALLENGES ? window.INTERVIEW_CHALLENGES.length : 'MISSING');
console.log('- Total Architectures:', window.SYSTEM_ARCHITECTURES ? window.SYSTEM_ARCHITECTURES.length : 'MISSING');
console.log('- Total Flashcards:', window.INTERVIEW_FLASHCARDS ? window.INTERVIEW_FLASHCARDS.length : 'MISSING');

// Experience Tier & Pillar Matrix Validation
const qs = window.INTERVIEW_QUESTIONS || [];
const tiers = { Entry: 0, Mid: 0, Senior: 0 };
const pillars = ['csharp', 'aspnet', 'efcore', 'sql', 'ui', 'cloud'];
const matrix = {};
pillars.forEach(p => { matrix[p] = { Entry: 0, Mid: 0, Senior: 0 }; });

qs.forEach(q => {
  if (!['Entry', 'Mid', 'Senior'].includes(q.seniority)) {
    console.error(`❌ Invalid seniority "${q.seniority}" on question ${q.id}`);
    errors++;
  } else {
    tiers[q.seniority]++;
    if (matrix[q.pillar]) matrix[q.pillar][q.seniority]++;
  }
});

console.log('\nSeniority Tiers:', tiers);
console.log('Pillar x Tier Matrix:');
console.table(matrix);

if (tiers.Entry !== 27 || tiers.Mid !== 39 || tiers.Senior !== 30) {
  console.error(`❌ Unexpected tier counts: Entry: ${tiers.Entry}, Mid: ${tiers.Mid}, Senior: ${tiers.Senior}`);
  errors++;
} else {
  console.log('✅ 3-Tier Distribution: 27 Entry, 39 Mid, 30 Senior perfectly balanced.');
}

pillars.forEach(p => {
  ['Entry', 'Mid', 'Senior'].forEach(t => {
    if (matrix[p][t] < 3) {
      console.error(`❌ Pillar ${p} has fewer than 3 questions for tier ${t}`);
      errors++;
    }
  });
});

if (errors > 0) {
  process.exit(1);
}
console.log('✅ All modules, tiers, and schemas verified successfully! 🚀\n');

