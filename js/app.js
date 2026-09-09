// ============================================================================
// FULL-STACK .NET INTERVIEW PREP - APPLICATION CONTROLLER & ROUTER
// State persistence, gamification engine, mock simulator, and code test runner
// ============================================================================

(function () {
  'use strict';

  // --- APPLICATION STATE & LOCALSTORAGE ---
  const STORAGE_KEY = 'dotnet_senior_prep_v1';

  let state = {
    xp: 0,
    completedQuestions: {},
    bookmarkedQuestions: {},
    masteredCards: {},
    reviewCards: {},
    completedChallenges: {},
    userChallengeCode: {},
    mockNotes: {},
    activeView: 'vault',
    vaultFilters: {
      search: '',
      pillar: 'all',
      seniority: 'all',
      bookmarkedOnly: false,
      completedOnly: false
    },
    mockSession: null,
    activeLabId: 'captive-dependency',
    activeArchId: 'distributed-saga',
    flashcardIndex: 0,
    flashcardPillar: 'all',
    isCardFlipped: false
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        xp: state.xp,
        completedQuestions: state.completedQuestions,
        bookmarkedQuestions: state.bookmarkedQuestions,
        masteredCards: state.masteredCards,
        reviewCards: state.reviewCards,
        completedChallenges: state.completedChallenges,
        userChallengeCode: state.userChallengeCode,
        mockNotes: state.mockNotes
      }));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  // --- GAMIFICATION & CAREER XP ENGINE ---
  const RANKS = [
    { name: 'Junior Dev', minXp: 0, maxXp: 500, badgeClass: 'rank-junior' },
    { name: 'Mid-Level Dev', minXp: 500, maxXp: 1500, badgeClass: 'rank-mid' },
    { name: 'Senior Dev', minXp: 1500, maxXp: 3000, badgeClass: 'rank-senior' },
    { name: 'Lead Architect', minXp: 3000, maxXp: 5000, badgeClass: 'rank-lead' },
    { name: 'Staff / Principal Architect', minXp: 5000, maxXp: Infinity, badgeClass: 'rank-principal' }
  ];

  function getRank(xp) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].minXp) return RANKS[i];
    }
    return RANKS[0];
  }

  function addXp(amount, reason) {
    const oldRank = getRank(state.xp);
    state.xp += amount;
    const newRank = getRank(state.xp);

    saveState();
    updateHudUI();

    if (newRank.name !== oldRank.name) {
      window.SoundEngine.playLevelUp();
      showNotification(`🎉 LEVEL UP! Promoted to ${newRank.name}!`, 'success');
    }
  }

  function updateHudUI() {
    const currentRank = getRank(state.xp);
    const hudRankBadge = document.getElementById('hudRankBadge');
    const hudXpTotal = document.getElementById('hudXpTotal');
    const hudXpNext = document.getElementById('hudXpNext');
    const hudXpFill = document.getElementById('hudXpFill');

    if (hudRankBadge) hudRankBadge.textContent = currentRank.name;
    if (hudXpTotal) hudXpTotal.textContent = `${state.xp.toLocaleString()} XP`;

    if (currentRank.maxXp === Infinity) {
      if (hudXpNext) hudXpNext.textContent = 'MAX RANK';
      if (hudXpFill) hudXpFill.style.width = '100%';
    } else {
      const range = currentRank.maxXp - currentRank.minXp;
      const progress = state.xp - currentRank.minXp;
      const pct = Math.min(100, Math.max(0, (progress / range) * 100));
      if (hudXpNext) hudXpNext.textContent = `${currentRank.maxXp.toLocaleString()} XP`;
      if (hudXpFill) hudXpFill.style.width = `${pct}%`;
    }
  }

  function showNotification(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(99, 102, 241, 0.95)'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: fadeIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // --- SPA ROUTING ---
  function switchView(viewName) {
    state.activeView = viewName;
    window.location.hash = viewName;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    window.SoundEngine.playFlip();

    if (viewName === 'vault') renderQuestionVault();
    if (viewName === 'lab') renderCodeLab();
    if (viewName === 'whiteboards') renderWhiteboards();
    if (viewName === 'flashcards') renderFlashcards();
  }

  // --- VIEW 1: QUESTION VAULT ---
  function renderQuestionVault() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    const allQuestions = window.INTERVIEW_QUESTIONS || [];
    const { search, pillar, seniority, bookmarkedOnly, completedOnly } = state.vaultFilters;

    const filtered = allQuestions.filter(q => {
      if (pillar !== 'all' && q.pillar !== pillar) return false;
      if (seniority !== 'all' && q.seniority !== seniority) return false;
      if (bookmarkedOnly && !state.bookmarkedQuestions[q.id]) return false;
      if (completedOnly && !state.completedQuestions[q.id]) return false;

      if (search) {
        const term = search.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(term);
        const matchPitch = q.pitch.toLowerCase().includes(term);
        const matchTags = q.tags.some(t => t.toLowerCase().includes(term));
        const matchDeep = q.deepDive.toLowerCase().includes(term);
        if (!matchTitle && !matchPitch && !matchTags && !matchDeep) return false;
      }
      return true;
    });

    // Update count labels
    const countEl = document.getElementById('vaultFilteredCount');
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${allQuestions.length} questions`;
    }

    const compCount = Object.keys(state.completedQuestions).length;
    const ratioEl = document.getElementById('vaultCompletionRatio');
    if (ratioEl) {
      const pct = allQuestions.length ? Math.round((compCount / allQuestions.length) * 100) : 0;
      ratioEl.textContent = `${pct}% Studied (${compCount}/${allQuestions.length})`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <h3>No questions match your current filters.</h3>
          <p style="margin-top: 0.5rem;">Try clearing search keywords or selecting 'All Pillars'.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(q => {
      const isBookmarked = !!state.bookmarkedQuestions[q.id];
      const isCompleted = !!state.completedQuestions[q.id];

      const pillarClass = `pillar-${q.pillar}`;
      const pillarLabel = {
        csharp: 'C# Internals',
        aspnet: 'ASP.NET Core',
        sql: 'SQL & EF Core',
        frontend: 'React & TS',
        cloud: 'Azure & Cloud'
      }[q.pillar] || q.pillar;

      return `
        <article class="q-card" id="card-${q.id}">
          <div class="q-card-header" onclick="window.AppController.toggleQuestion('${q.id}')">
            <div class="q-card-meta">
              <div class="q-badges">
                <span class="pillar-badge ${pillarClass}">${pillarLabel}</span>
                <span class="seniority-badge ${q.seniority}">${q.seniority}</span>
                ${q.tags.map(t => `<span class="seniority-badge">${t}</span>`).join('')}
              </div>
              <h2 class="q-title">${q.title}</h2>
            </div>
            <div class="q-actions" onclick="event.stopPropagation()">
              <button class="star-btn ${isBookmarked ? 'bookmarked' : ''}" 
                onclick="window.AppController.toggleBookmark('${q.id}')" 
                title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}">
                ${isBookmarked ? '★' : '☆'}
              </button>
              <button class="check-btn ${isCompleted ? 'completed' : ''}" 
                onclick="window.AppController.toggleComplete('${q.id}')" 
                title="${isCompleted ? 'Mark Incomplete' : 'Mark Completed (+25 XP)'}">
                ${isCompleted ? '✓' : '○'}
              </button>
              <span class="expand-chevron">▼</span>
            </div>
          </div>

          <div class="q-card-body">
            <!-- 60-Second Senior Elevator Pitch -->
            <div class="section-box pitch-box">
              <span class="section-box-title">🎯 60-Second Senior Elevator Pitch</span>
              <p class="pitch-content">${escapeHtml(q.pitch)}</p>
            </div>

            <!-- Technical Deep Dive -->
            <div class="section-box deepdive-box">
              <span class="section-box-title">🔬 Technical Deep Dive & Under the Hood</span>
              <p class="deepdive-content">${escapeHtml(q.deepDive)}</p>
            </div>

            <!-- Production Code Snippet -->
            <div class="code-box">
              <div class="code-header">
                <span>PRODUCTION ARCHITECTURE CODE</span>
                <button class="copy-code-btn" onclick="window.AppController.copyCode('${q.id}')">
                  📋 Copy Code
                </button>
              </div>
              <pre class="code-pre" id="snippet-${q.id}">${escapeHtml(q.codeSnippet)}</pre>
            </div>

            <!-- Junior Red Flags -->
            <div class="section-box redflags-box">
              <span class="section-box-title">⚠️ Junior Red Flags (What candidates say that hurts them)</span>
              <ul class="bullet-list">
                ${q.redFlags.map(rf => `<li>${escapeHtml(rf)}</li>`).join('')}
              </ul>
            </div>

            <!-- Senior Pro-Tips -->
            <div class="section-box protips-box">
              <span class="section-box-title">💡 Senior Pro-Tips & Architecture Nuances</span>
              <ul class="protips-list">
                ${q.proTips.map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- VIEW 2: TIMED MOCK SIMULATOR ---
  let mockTimerInterval = null;

  function startMockSimulator() {
    const questions = window.INTERVIEW_QUESTIONS || [];
    if (!questions.length) return;

    // Read selected count & timer
    const countTile = document.querySelector('#mockCountTiles .radio-tile.selected');
    const timerTile = document.querySelector('#mockTimerTiles .radio-tile.selected');

    const count = countTile ? parseInt(countTile.dataset.count, 10) : 5;
    const minutes = timerTile ? parseInt(timerTile.dataset.time, 10) : 30;

    // Shuffle and pick questions across pillars
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);

    state.mockSession = {
      questions: selectedQuestions,
      currentIndex: 0,
      scores: {},
      durationMinutes: minutes,
      secondsRemaining: minutes * 60,
      isModelRevealed: false
    };

    document.getElementById('mockSetupCard').style.display = 'none';
    document.getElementById('mockScorecard').style.display = 'none';
    document.getElementById('mockActiveSession').style.display = 'flex';

    renderMockCurrentQuestion();
    startMockTimer();
  }

  function startMockTimer() {
    clearInterval(mockTimerInterval);
    if (state.mockSession.durationMinutes === 0) {
      document.getElementById('mockTimerText').textContent = 'Untimed';
      return;
    }

    mockTimerInterval = setInterval(() => {
      if (!state.mockSession) {
        clearInterval(mockTimerInterval);
        return;
      }

      state.mockSession.secondsRemaining--;
      updateMockTimerDisplay();

      if (state.mockSession.secondsRemaining === 300) {
        window.SoundEngine.playWarning();
        showNotification('⚠️ 5 Minutes remaining in mock interview!', 'warning');
      }

      if (state.mockSession.secondsRemaining <= 0) {
        clearInterval(mockTimerInterval);
        window.SoundEngine.playWarning();
        finishMockExam();
      }
    }, 1000);
  }

  function updateMockTimerDisplay() {
    const timerEl = document.getElementById('mockTimerDisplay');
    const textEl = document.getElementById('mockTimerText');
    if (!textEl || !timerEl || !state.mockSession) return;

    const totalSecs = state.mockSession.secondsRemaining;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    textEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    timerEl.classList.toggle('warning', totalSecs <= 300 && totalSecs > 60);
    timerEl.classList.toggle('danger', totalSecs <= 60);
  }

  function renderMockCurrentQuestion() {
    const session = state.mockSession;
    if (!session) return;

    const q = session.questions[session.currentIndex];
    session.isModelRevealed = false;

    // Update counter
    document.getElementById('mockQuestionProgress').textContent = 
      `Question ${session.currentIndex + 1} of ${session.questions.length}`;

    // Badges & Title
    const badgesEl = document.getElementById('mockCardBadges');
    badgesEl.innerHTML = `
      <span class="pillar-badge pillar-${q.pillar}">${q.pillar.toUpperCase()}</span>
      <span class="seniority-badge ${q.seniority}">${q.seniority}</span>
      ${q.tags.map(t => `<span class="seniority-badge">${t}</span>`).join('')}
    `;
    document.getElementById('mockCardTitle').textContent = q.title;

    // Restore candidate notes
    const notesInput = document.getElementById('mockNotesInput');
    notesInput.value = state.mockNotes[q.id] || '';

    // Hide revealed model answer
    const modelPanel = document.getElementById('mockModelAnswerPanel');
    modelPanel.style.display = 'none';
    document.getElementById('mockRevealAnswerBtn').textContent = '👁️ Reveal Senior Model Answer & Rubric';

    // Reset rubric stars
    renderMockRubricStars(session.scores[q.id] || 0);

    // Update Nav buttons
    const prevBtn = document.getElementById('mockPrevBtn');
    const nextBtn = document.getElementById('mockNextBtn');
    prevBtn.style.visibility = session.currentIndex > 0 ? 'visible' : 'hidden';
    nextBtn.textContent = session.currentIndex === session.questions.length - 1 ? '🏁 Finish Mock' : 'Next Question →';
  }

  function renderMockRubricStars(score) {
    const starBtns = document.querySelectorAll('#mockRubricStars .star-score-btn');
    starBtns.forEach(btn => {
      const rating = parseInt(btn.dataset.rating, 10);
      btn.classList.toggle('selected', rating <= score);
    });

    const labels = [
      'Click a star to grade your response.',
      '1★: Conceptually incorrect or junior gaps',
      '2★: Surface level, missed core under-the-hood mechanics',
      '3★: Solid Mid-level explanation',
      '4★: Strong Senior answer with trade-offs & edge cases',
      '5★: Staff / Principal Architect mastery'
    ];
    document.getElementById('mockRubricLabel').textContent = labels[score] || labels[0];
  }

  function finishMockExam() {
    clearInterval(mockTimerInterval);
    const session = state.mockSession;
    if (!session) return;

    // Calculate score
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

    const readinessPct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Award XP
    addXp(150, 'Completed Mock Interview');
    window.SoundEngine.playSuccess();

    // Display Scorecard
    document.getElementById('mockActiveSession').style.display = 'none';
    const scorecard = document.getElementById('mockScorecard');
    scorecard.style.display = 'flex';

    document.getElementById('scorecardOverallPercent').textContent = `${readinessPct}%`;

    let verdict = 'Needs Foundation Review';
    let summary = 'Review core C# internals, memory management, and SQL indexing before senior interview loops.';

    if (readinessPct >= 85) {
      verdict = 'Staff / Principal Ready 🚀';
      summary = 'Elite mastery across low-level CLR concurrency, clean architecture, and cloud resiliency.';
    } else if (readinessPct >= 70) {
      verdict = 'Senior Full-Stack Ready 💼';
      summary = 'Solid grasp of architectural trade-offs, SARGability, and asynchronous pipelines.';
    } else if (readinessPct >= 50) {
      verdict = 'Mid-Level Strong 📈';
      summary = 'Good functional knowledge; deepen explanations on thread pools, GC generations, and captive dependencies.';
    }

    document.getElementById('scorecardVerdict').textContent = verdict;
    document.getElementById('scorecardSummary').textContent = summary;

    // Render pillar breakdown
    const grid = document.getElementById('scorecardPillarGrid');
    grid.innerHTML = Object.keys(pillarScores).map(p => {
      const data = pillarScores[p];
      const pPct = data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0;
      return `
        <div class="pillar-score-card">
          <div class="pillar-score-header">
            <span style="text-transform: uppercase;">${p}</span>
            <span>${pPct}%</span>
          </div>
          <div class="xp-progress-bg">
            <div class="xp-progress-fill" style="width: ${pPct}%;"></div>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${data.earned} / ${data.max} Stars</span>
        </div>
      `;
    }).join('');
  }

  // --- VIEW 3: CODE & BUG LAB ---
  function renderCodeLab() {
    const sidebar = document.getElementById('labSidebar');
    if (!sidebar) return;

    const challenges = window.INTERVIEW_CHALLENGES || [];

    sidebar.innerHTML = challenges.map(c => {
      const isCompleted = !!state.completedChallenges[c.id];
      const isActive = c.id === state.activeLabId;
      return `
        <button class="challenge-item-btn ${isActive ? 'active' : ''}" 
          onclick="window.AppController.selectChallenge('${c.id}')">
          <span class="challenge-item-title">${c.title}</span>
          <div class="challenge-item-meta">
            <span class="pillar-badge pillar-${c.pillar}">${c.pillar}</span>
            <span>${isCompleted ? '✅ Passed (+100 XP)' : '⏳ Incomplete'}</span>
          </div>
        </button>
      `;
    }).join('');

    const currentChallenge = challenges.find(c => c.id === state.activeLabId) || challenges[0];
    if (!currentChallenge) return;

    document.getElementById('labTitle').textContent = currentChallenge.title;
    const badge = document.getElementById('labPillarBadge');
    badge.textContent = currentChallenge.pillar.toUpperCase();
    badge.className = `pillar-badge pillar-${currentChallenge.pillar}`;

    document.getElementById('labScenario').textContent = currentChallenge.scenario;

    const editor = document.getElementById('labCodeEditor');
    editor.value = state.userChallengeCode[currentChallenge.id] || currentChallenge.initialCode;

    // Render test cases
    const testsContainer = document.getElementById('labTestsContainer');
    testsContainer.innerHTML = currentChallenge.tests.map(t => `
      <div class="test-row">
        <span class="test-status-icon">⚪</span>
        <span>${t.name}</span>
      </div>
    `).join('');

    document.getElementById('labValidationStatus').textContent = 'Make your edits and click Run Tests.';
  }

  function runChallengeTests() {
    const challenges = window.INTERVIEW_CHALLENGES || [];
    const current = challenges.find(c => c.id === state.activeLabId);
    if (!current) return;

    const editor = document.getElementById('labCodeEditor');
    const userCode = editor.value;

    state.userChallengeCode[current.id] = userCode;
    saveState();

    const testsContainer = document.getElementById('labTestsContainer');
    let allPassed = true;

    testsContainer.innerHTML = current.tests.map(t => {
      let passed = false;
      try {
        passed = t.validate(userCode);
      } catch (e) {
        passed = false;
      }

      if (!passed) allPassed = false;

      return `
        <div class="test-row ${passed ? 'passed' : 'failed'}">
          <span class="test-status-icon">${passed ? '✅' : '❌'}</span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600;">${t.name}</span>
            ${!passed ? `<span style="font-size: 0.78rem; opacity: 0.85;">${t.failureMessage}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const statusEl = document.getElementById('labValidationStatus');
    if (allPassed) {
      statusEl.textContent = '🎉 All test assertions passed! Senior architecture verified.';
      statusEl.style.color = 'var(--accent-emerald)';
      window.SoundEngine.playSuccess();

      if (!state.completedChallenges[current.id]) {
        state.completedChallenges[current.id] = true;
        addXp(100, `Completed Lab: ${current.title}`);
        renderCodeLab();
      }
    } else {
      statusEl.textContent = '❌ Some test cases failed. Inspect failures above.';
      statusEl.style.color = 'var(--accent-rose)';
      window.SoundEngine.playWarning();
    }
  }

  // --- VIEW 4: SYSTEM DESIGN WHITEBOARDS ---
  function renderWhiteboards() {
    const archs = window.SYSTEM_ARCHITECTURES || [];
    const selector = document.getElementById('archSelectorRow');
    if (!selector) return;

    selector.innerHTML = archs.map(a => `
      <button class="arch-btn ${a.id === state.activeArchId ? 'active' : ''}" 
        onclick="window.AppController.selectArch('${a.id}')">
        ${a.title}
      </button>
    `).join('');

    const currentArch = archs.find(a => a.id === state.activeArchId) || archs[0];
    if (!currentArch) return;

    document.getElementById('archTitle').textContent = currentArch.title;
    document.getElementById('archSummary').textContent = currentArch.summary;

    // Render nodes
    const grid = document.getElementById('archNodesGrid');
    grid.innerHTML = currentArch.nodes.map(n => `
      <div class="node-card" onclick="window.AppController.inspectNode('${currentArch.id}', '${n.id}')">
        <span class="node-category">${n.category}</span>
        <span class="node-name">${n.name}</span>
        <div class="node-metrics">
          <span>${n.protocol}</span>
          <span>${n.latency}</span>
        </div>
      </div>
    `).join('');

    // Render execution flow
    const flowContainer = document.getElementById('archFlowSteps');
    flowContainer.innerHTML = currentArch.flowSteps.map(step => `
      <div style="padding: 0.25rem 0;">${escapeHtml(step)}</div>
    `).join('');

    // Default inspect first node
    if (currentArch.nodes.length > 0) {
      inspectArchNode(currentArch.nodes[0]);
    }
  }

  function inspectArchNode(node) {
    document.getElementById('inspectNodeCategory').textContent = `${node.category} • ${node.protocol}`;
    document.getElementById('inspectNodeLatency').textContent = `Target: ${node.latency}`;
    document.getElementById('inspectNodeName').textContent = node.name;
    document.getElementById('inspectNodeRole').textContent = node.role;
    document.getElementById('inspectNodeFailures').textContent = node.failureModes;
    document.getElementById('inspectNodeMitigation').textContent = node.mitigation;

    const talkingPointsList = document.getElementById('inspectNodeTalkingPoints');
    talkingPointsList.innerHTML = node.talkingPoints.map(tp => `<li>${escapeHtml(tp)}</li>`).join('');
  }

  // --- VIEW 5: RAPID FLASHCARDS ---
  function getActiveFlashcards() {
    const allCards = window.INTERVIEW_FLASHCARDS || [];
    if (state.flashcardPillar === 'all') return allCards;
    return allCards.filter(c => c.pillar === state.flashcardPillar);
  }

  function renderFlashcards() {
    const cards = getActiveFlashcards();
    if (!cards.length) return;

    if (state.flashcardIndex >= cards.length) state.flashcardIndex = 0;
    if (state.flashcardIndex < 0) state.flashcardIndex = cards.length - 1;

    const card = cards[state.flashcardIndex];
    state.isCardFlipped = false;

    const inner = document.getElementById('flashcardInner');
    inner.classList.remove('flipped');

    document.getElementById('fcCurrentIndex').textContent = state.flashcardIndex + 1;
    document.getElementById('fcTotalCount').textContent = cards.length;

    document.getElementById('fcTopicFront').textContent = card.topic;
    document.getElementById('fcPillarBadge').textContent = card.pillar.toUpperCase();
    document.getElementById('fcPillarBadge').className = `pillar-badge pillar-${card.pillar}`;
    document.getElementById('fcQuestionFront').textContent = card.front;

    document.getElementById('fcAnswerBack').textContent = card.back;
    document.getElementById('fcTipBack').textContent = card.seniorTip;
  }

  function flipFlashcard() {
    const inner = document.getElementById('flashcardInner');
    state.isCardFlipped = !state.isCardFlipped;
    inner.classList.toggle('flipped', state.isCardFlipped);
    window.SoundEngine.playFlip();
  }

  function nextFlashcard() {
    const cards = getActiveFlashcards();
    state.flashcardIndex = (state.flashcardIndex + 1) % cards.length;
    renderFlashcards();
  }

  function prevFlashcard() {
    const cards = getActiveFlashcards();
    state.flashcardIndex = (state.flashcardIndex - 1 + cards.length) % cards.length;
    renderFlashcards();
  }

  // --- UTILITIES ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- GLOBAL EXPOSED CONTROLLER ---
  window.AppController = {
    toggleQuestion: function (qId) {
      const card = document.getElementById(`card-${qId}`);
      if (card) {
        card.classList.toggle('expanded');
        window.SoundEngine.playFlip();
      }
    },

    toggleBookmark: function (qId) {
      state.bookmarkedQuestions[qId] = !state.bookmarkedQuestions[qId];
      if (!state.bookmarkedQuestions[qId]) delete state.bookmarkedQuestions[qId];
      saveState();
      renderQuestionVault();
      window.SoundEngine.playFlip();
    },

    toggleComplete: function (qId) {
      const wasCompleted = !!state.completedQuestions[qId];
      state.completedQuestions[qId] = !wasCompleted;
      if (!state.completedQuestions[qId]) {
        delete state.completedQuestions[qId];
      } else {
        addXp(25, 'Studied Question');
        window.SoundEngine.playChime();
      }
      saveState();
      renderQuestionVault();
    },

    copyCode: function (qId) {
      const snippet = document.getElementById(`snippet-${qId}`);
      if (snippet) {
        navigator.clipboard.writeText(snippet.textContent).then(() => {
          showNotification('📋 Code copied to clipboard!', 'info');
          window.SoundEngine.playFlip();
        });
      }
    },

    selectChallenge: function (id) {
      state.activeLabId = id;
      renderCodeLab();
      window.SoundEngine.playFlip();
    },

    selectArch: function (id) {
      state.activeArchId = id;
      renderWhiteboards();
      window.SoundEngine.playFlip();
    },

    inspectNode: function (archId, nodeId) {
      const arch = (window.SYSTEM_ARCHITECTURES || []).find(a => a.id === archId);
      if (!arch) return;
      const node = arch.nodes.find(n => n.id === nodeId);
      if (node) {
        inspectArchNode(node);
        window.SoundEngine.playFlip();
      }
    }
  };

  // --- INITIALIZATION & DOM EVENTS ---
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateHudUI();

    // Tab buttons event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
      });
    });

    // Sound toggle button
    const soundBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    if (soundBtn && soundIcon) {
      soundIcon.textContent = window.SoundEngine.isMuted() ? '🔇' : '🔊';
      soundBtn.addEventListener('click', () => {
        const muted = window.SoundEngine.toggleMute();
        soundIcon.textContent = muted ? '🔇' : '🔊';
        showNotification(muted ? 'Audio Muted' : 'Audio Enabled', 'info');
      });
    }

    // Reset progress button
    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your Career XP, bookmarks, and completed questions?')) {
          localStorage.removeItem(STORAGE_KEY);
          state.xp = 0;
          state.completedQuestions = {};
          state.bookmarkedQuestions = {};
          state.masteredCards = {};
          state.completedChallenges = {};
          state.userChallengeCode = {};
          state.mockNotes = {};
          updateHudUI();
          renderQuestionVault();
          showNotification('Progress reset successfully.', 'info');
        }
      });
    }

    // Vault search & filter inputs
    const searchInput = document.getElementById('vaultSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.vaultFilters.search = e.target.value.trim();
        renderQuestionVault();
      });
    }

    // Vault pillar filters
    document.querySelectorAll('#pillarFiltersRow .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#pillarFiltersRow .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.vaultFilters.pillar = pill.dataset.pillar;
        renderQuestionVault();
        window.SoundEngine.playFlip();
      });
    });

    // Vault seniority filters
    document.querySelectorAll('.seniority-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.seniority-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.vaultFilters.seniority = pill.dataset.seniority;
        renderQuestionVault();
        window.SoundEngine.playFlip();
      });
    });

    // Vault Bookmark and Completed flags
    const bmBtn = document.getElementById('filterBookmarkedBtn');
    if (bmBtn) {
      bmBtn.addEventListener('click', () => {
        state.vaultFilters.bookmarkedOnly = !state.vaultFilters.bookmarkedOnly;
        bmBtn.classList.toggle('active', state.vaultFilters.bookmarkedOnly);
        renderQuestionVault();
        window.SoundEngine.playFlip();
      });
    }

    const compBtn = document.getElementById('filterCompletedBtn');
    if (compBtn) {
      compBtn.addEventListener('click', () => {
        state.vaultFilters.completedOnly = !state.vaultFilters.completedOnly;
        compBtn.classList.toggle('active', state.vaultFilters.completedOnly);
        renderQuestionVault();
        window.SoundEngine.playFlip();
      });
    }

    // Mock Setup Options (Tiles)
    document.querySelectorAll('#mockCountTiles .radio-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        document.querySelectorAll('#mockCountTiles .radio-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        window.SoundEngine.playFlip();
      });
    });

    document.querySelectorAll('#mockTimerTiles .radio-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        document.querySelectorAll('#mockTimerTiles .radio-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        window.SoundEngine.playFlip();
      });
    });

    document.getElementById('btnStartMock').addEventListener('click', startMockSimulator);

    // Mock Exam Navigation
    document.getElementById('mockRevealAnswerBtn').addEventListener('click', () => {
      const panel = document.getElementById('mockModelAnswerPanel');
      const q = state.mockSession.questions[state.mockSession.currentIndex];

      document.getElementById('mockModelPitch').textContent = q.pitch;
      document.getElementById('mockModelDeepDive').textContent = q.deepDive;
      document.getElementById('mockModelCode').textContent = q.codeSnippet;

      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      window.SoundEngine.playFlip();
    });

    // Mock Scratchpad auto-save
    document.getElementById('mockNotesInput').addEventListener('input', (e) => {
      if (state.mockSession) {
        const q = state.mockSession.questions[state.mockSession.currentIndex];
        state.mockNotes[q.id] = e.target.value;
        saveState();
      }
    });

    // Mock Rubric Stars
    document.querySelectorAll('#mockRubricStars .star-score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.dataset.rating, 10);
        const q = state.mockSession.questions[state.mockSession.currentIndex];
        state.mockSession.scores[q.id] = rating;
        renderMockRubricStars(rating);
        window.SoundEngine.playChime();
      });
    });

    document.getElementById('mockNextBtn').addEventListener('click', () => {
      const session = state.mockSession;
      if (session.currentIndex === session.questions.length - 1) {
        finishMockExam();
      } else {
        session.currentIndex++;
        renderMockCurrentQuestion();
        window.SoundEngine.playFlip();
      }
    });

    document.getElementById('mockPrevBtn').addEventListener('click', () => {
      const session = state.mockSession;
      if (session.currentIndex > 0) {
        session.currentIndex--;
        renderMockCurrentQuestion();
        window.SoundEngine.playFlip();
      }
    });

    document.getElementById('mockEndEarlyBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to finish the mock interview now?')) {
        finishMockExam();
      }
    });

    document.getElementById('btnRestartMock').addEventListener('click', () => {
      document.getElementById('mockScorecard').style.display = 'none';
      document.getElementById('mockSetupCard').style.display = 'flex';
      window.SoundEngine.playFlip();
    });

    // Code Lab Events
    document.getElementById('labRunTestsBtn').addEventListener('click', runChallengeTests);

    document.getElementById('labHintBtn').addEventListener('click', () => {
      const challenges = window.INTERVIEW_CHALLENGES || [];
      const current = challenges.find(c => c.id === state.activeLabId);
      if (current && current.hints && current.hints.length) {
        alert(`💡 INTERVIEW HINT:\n\n${current.hints.join('\n\n')}`);
      }
    });

    document.getElementById('labSolutionBtn').addEventListener('click', () => {
      const challenges = window.INTERVIEW_CHALLENGES || [];
      const current = challenges.find(c => c.id === state.activeLabId);
      if (current && current.solution) {
        if (confirm('View the senior reference solution?')) {
          const editor = document.getElementById('labCodeEditor');
          editor.value = current.solution;
          state.userChallengeCode[current.id] = current.solution;
          saveState();
          runChallengeTests();
        }
      }
    });

    document.getElementById('labResetBtn').addEventListener('click', () => {
      const challenges = window.INTERVIEW_CHALLENGES || [];
      const current = challenges.find(c => c.id === state.activeLabId);
      if (current && confirm('Reset code to buggy starter state?')) {
        document.getElementById('labCodeEditor').value = current.initialCode;
        delete state.userChallengeCode[current.id];
        saveState();
        renderCodeLab();
      }
    });

    // Editor Tab Key Indentation
    const labEditor = document.getElementById('labCodeEditor');
    if (labEditor) {
      labEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = labEditor.selectionStart;
          const end = labEditor.selectionEnd;
          labEditor.value = labEditor.value.substring(0, start) + '    ' + labEditor.value.substring(end);
          labEditor.selectionStart = labEditor.selectionEnd = start + 4;
        }
      });
    }

    // Flashcard Flip & Navigation
    const fcStage = document.getElementById('flashcardStage');
    if (fcStage) {
      fcStage.addEventListener('click', flipFlashcard);
    }

    document.getElementById('fcNextBtn').addEventListener('click', nextFlashcard);
    document.getElementById('fcPrevBtn').addEventListener('click', prevFlashcard);

    document.getElementById('fcMasterBtn').addEventListener('click', () => {
      const cards = getActiveFlashcards();
      const current = cards[state.flashcardIndex];
      if (!state.masteredCards[current.id]) {
        state.masteredCards[current.id] = true;
        addXp(50, 'Mastered Flashcard');
        window.SoundEngine.playChime();
      }
      nextFlashcard();
    });

    document.getElementById('fcReviewBtn').addEventListener('click', () => {
      const cards = getActiveFlashcards();
      const current = cards[state.flashcardIndex];
      state.reviewCards[current.id] = true;
      saveState();
      nextFlashcard();
    });

    // Flashcards Pillar Filters
    document.querySelectorAll('#fcPillarFiltersRow .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#fcPillarFiltersRow .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.flashcardPillar = pill.dataset.fcpillar;
        state.flashcardIndex = 0;
        renderFlashcards();
        window.SoundEngine.playFlip();
      });
    });

    // Keyboard Shortcuts for Flashcards
    window.addEventListener('keydown', (e) => {
      if (state.activeView === 'flashcards') {
        if (e.code === 'Space') {
          e.preventDefault();
          flipFlashcard();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          nextFlashcard();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          prevFlashcard();
        }
      }
    });

    // Initial View Routing from URL Hash
    const hash = window.location.hash.replace('#', '');
    if (['vault', 'mock', 'lab', 'whiteboards', 'flashcards'].includes(hash)) {
      switchView(hash);
    } else {
      switchView('vault');
    }
  });

})();
