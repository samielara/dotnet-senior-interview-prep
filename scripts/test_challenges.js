const fs = require('fs');

global.window = {};
eval(fs.readFileSync('js/data/challenges.js', 'utf8'));

const challenges = window.INTERVIEW_CHALLENGES;
console.log(`Loaded ${challenges.length} code challenges.`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

challenges.forEach((c, idx) => {
  console.log(`\nTesting Challenge ${idx + 1}: ${c.title} (${c.id})`);
  const solution = c.solution;
  if (!solution) {
    console.error(`  ❌ Missing solution!`);
    failedTests++;
    return;
  }

  c.tests.forEach((t, tIdx) => {
    totalTests++;
    let passed = false;
    try {
      passed = t.validate(solution);
    } catch (err) {
      console.error(`  ❌ Test ${tIdx + 1} threw error:`, err);
    }

    if (passed) {
      console.log(`  ✅ [PASS] ${t.name}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${t.name} - Message: ${t.failureMessage}`);
      failedTests++;
    }
  });
});

console.log(`\n========================================`);
console.log(`Challenge Test Summary: ${passedTests} / ${totalTests} passed.`);
if (failedTests > 0) {
  console.error(`FAILED with ${failedTests} failed test assertions.`);
  process.exit(1);
} else {
  console.log(`ALL REFERENCE SOLUTIONS PASS 100%! 🚀`);
}
