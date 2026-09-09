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

if (errors > 0) {
  process.exit(1);
}
