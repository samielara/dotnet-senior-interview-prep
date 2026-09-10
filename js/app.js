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
    questionMastery: {},
    revealedHints: {},
    masteredCards: {},
    reviewCards: {},
    completedChallenges: {},
    userChallengeCode: {},
    mockNotes: {},
    activeView: 'hub',
    selectedExperience: null,
    vaultFilters: {
      search: '',
      pillar: 'all',
      seniority: 'all',
      bookmarkedOnly: false,
      completedOnly: false
    },
    mockSession: null,
    activeLabId: 'remove-string-duplicates',
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
        state.questionMastery = state.questionMastery || {};
        state.revealedHints = state.revealedHints || {};
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
        questionMastery: state.questionMastery,
        revealedHints: state.revealedHints,
        masteredCards: state.masteredCards,
        reviewCards: state.reviewCards,
        completedChallenges: state.completedChallenges,
        userChallengeCode: state.userChallengeCode,
        mockNotes: state.mockNotes,
        selectedExperience: state.selectedExperience
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
    const hudCompletedCount = document.getElementById('hudCompletedCount');
    const hudMasteredCount = document.getElementById('hudMasteredCount');
    const hudTotalQuestionsCount = document.getElementById('hudTotalQuestionsCount');
    const hudTotalFlashcardsCount = document.getElementById('hudTotalFlashcardsCount');
    const badgeVaultCount = document.getElementById('badgeVaultCount');
    const badgeCardsCount = document.getElementById('badgeCardsCount');

    if (hudRankBadge) hudRankBadge.textContent = currentRank.name;
    if (hudXpTotal) hudXpTotal.textContent = `${state.xp.toLocaleString()} XP`;

    const totalQuestions = window.INTERVIEW_QUESTIONS ? window.INTERVIEW_QUESTIONS.length : 85;
    const totalCards = window.INTERVIEW_FLASHCARDS ? window.INTERVIEW_FLASHCARDS.length : 56;

    if (hudCompletedCount) hudCompletedCount.textContent = Object.keys(state.completedQuestions).length;
    if (hudMasteredCount) hudMasteredCount.textContent = Object.keys(state.masteredCards).length;
    if (hudTotalQuestionsCount) hudTotalQuestionsCount.textContent = totalQuestions;
    if (hudTotalFlashcardsCount) hudTotalFlashcardsCount.textContent = totalCards;
    if (badgeVaultCount) badgeVaultCount.textContent = totalQuestions;
    if (badgeCardsCount) badgeCardsCount.textContent = totalCards;

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

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mobview === viewName);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      const isTarget = panel.id === `view-${viewName}`;
      panel.classList.toggle('active', isTarget);
      if (isTarget && window.gsap) {
        window.gsap.fromTo(panel, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      }
    });

    window.SoundEngine.playFlip();

    if (viewName === 'hub') renderExperienceView();
    if (viewName === 'vault') renderQuestionVault();
    if (viewName === 'mock') renderMockView();
    if (viewName === 'lab') renderCodeLab();
    if (viewName === 'whiteboards') renderWhiteboards();
    if (viewName === 'flashcards') renderFlashcards();
  }

  // --- VIEW 0: CURRICULUM HUB & EXPERIENCE TIER SELECTION ---
  const TIER_MODULE_DESCRIPTIONS = {
    Entry: {
      csharp: 'Master core language fundamentals: 4 OOP Pillars, Overloading vs. Overriding, Interface vs. Abstract Class, and Class vs. Struct stack/heap memory.',
      aspnet: 'Understand web basics: Request-response lifecycles, ASP.NET Core controllers, basic dependency injection, and HTTP status codes.',
      efcore: 'Database querying foundations: LINQ syntax, basic DbSet operations, DbContext lifecycle, and simple relations.',
      sql: 'Relational database essentials: INNER vs. LEFT JOIN, WHERE vs. HAVING, primary keys vs. foreign keys, and basic clustered indexes.',
      ui: 'Modern UI essentials: React JSX, Props vs. State, basic useState/useEffect hooks, and TypeScript type annotations.',
      cloud: 'DevOps & release basics: Git branching, CI vs. CD pipelines, container concepts, and deployment drop artifacts.'
    },
    Mid: {
      csharp: 'Software engineering depth: SOLID principles, design patterns, generic constraints, records, and memory allocation awareness.',
      aspnet: 'Web API architecture: DI lifetimes (Transient, Scoped, Singleton), custom middleware, action filters, RFC 7807 ProblemDetails, and JWT auth.',
      efcore: 'Data access optimization: IEnumerable vs. IQueryable, AsNoTracking memory performance, eliminating N+1 queries with projection, and optimistic locking.',
      sql: 'Query performance & indexing: Covering INCLUDE indexes, SARGable predicates, window functions (ROW_NUMBER), and transaction isolation.',
      ui: 'Scalable frontend engineering: Custom React hooks, useMemo/useCallback optimization, component state lifecycles, and TypeScript generics.',
      cloud: 'Pipeline automation: Multi-stage YAML CI/CD pipelines, Docker multi-stage builds, Azure App Service configuration, and PR quality gates.'
    },
    Senior: {
      csharp: 'Deep CLR internals: Task vs. ValueTask allocation mechanics, Roslyn compiler state machines, and Garbage Collection (LOH/POH/Generations).',
      aspnet: 'High-throughput system APIs: Idempotency-Key pattern, zero-allocation pipelines, distributed rate limiting, and resilient telemetry.',
      efcore: 'High-scale data architecture: Split queries, DbContext pooling, compiled models, concurrency token conflicts, and distributed caching.',
      sql: 'Enterprise database concurrency: Deadlock detection & graph analysis, query execution plans, sp_getapplock distributed locking, and partitioning.',
      ui: 'Frontend architecture & performance: React concurrency, memory leak prevention in closures, discriminated unions, and strict typing architectures.',
      cloud: 'Cloud enterprise delivery: Zero-downtime blue/green slot swaps, container orchestration, automated rollback strategies, and infrastructure-as-code.'
    }
  };

  function renderExperienceView() {
    const tierSelectionView = document.getElementById('tierSelectionView');
    const tailoredModulesView = document.getElementById('tailoredModulesView');
    if (!tierSelectionView || !tailoredModulesView) return;

    const selected = state.selectedExperience;

    if (!selected) {
      tierSelectionView.style.display = 'block';
      tailoredModulesView.style.display = 'none';
      if (window.gsap) {
        window.gsap.fromTo('.tier-card',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
        );
      }
    } else {
      tierSelectionView.style.display = 'none';
      tailoredModulesView.style.display = 'block';
      if (window.gsap) {
        window.gsap.fromTo('.module-card',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
        );
      }

      // Update Active Tier Badge and summary
      const badge = document.getElementById('activeTierBadge');
      const summary = document.getElementById('activeTierSummaryText');
      const browseBtn = document.getElementById('btnBrowseTierQuestions');

      const tierConfig = {
        Entry: {
          badgeClass: 'badge-entry',
          badgeText: '🌱 Entry-Level (0–2 YOE)',
          summary: 'Showing 27 fundamental questions covering OOP pillars, basic SQL, class vs struct, and React fundamentals.'
        },
        Mid: {
          badgeClass: 'badge-mid',
          badgeText: '⚡ Mid-Level (3–5 YOE)',
          summary: 'Showing 39 high-yield questions covering SOLID, DI lifetimes, EF Core query tuning, SARGable indexes, and TypeScript.'
        },
        Senior: {
          badgeClass: 'badge-senior',
          badgeText: '🚀 Senior / Lead (5–8+ YOE)',
          summary: 'Showing 30 deep-architecture questions covering Roslyn state machines, CLR GC, deadlocks, and distributed systems.'
        }
      }[selected] || {
        badgeClass: 'badge-mid',
        badgeText: `${selected} Level`,
        summary: `Questions tailored for ${selected} technical screens.`
      };

      if (badge) {
        badge.className = `active-tier-badge ${tierConfig.badgeClass}`;
        badge.textContent = tierConfig.badgeText;
      }
      if (summary) {
        summary.textContent = tierConfig.summary;
      }

      // Calculate and update question count per module for this selected tier
      const questions = window.INTERVIEW_QUESTIONS || [];
      const countFor = (pillar) => questions.filter(q => q.pillar === pillar && q.seniority === selected).length;
      const totalForTier = questions.filter(q => q.seniority === selected).length;

      if (browseBtn) {
        browseBtn.textContent = `📚 Browse ${totalForTier} ${selected}-Level Questions in Vault`;
      }

      const counts = {
        csharp: countFor('csharp'),
        aspnet: countFor('aspnet'),
        efcore: countFor('efcore'),
        sql: countFor('sql'),
        ui: countFor('ui'),
        cloud: countFor('cloud')
      };

      const csharpCountEl = document.getElementById('csharpModuleCount');
      const aspnetCountEl = document.getElementById('aspnetModuleCount');
      const efcoreCountEl = document.getElementById('efcoreModuleCount');
      const sqlCountEl = document.getElementById('sqlModuleCount');
      const uiCountEl = document.getElementById('uiModuleCount');
      const cloudCountEl = document.getElementById('cloudModuleCount');

      if (csharpCountEl) csharpCountEl.textContent = `${counts.csharp} Questions (${selected})`;
      if (aspnetCountEl) aspnetCountEl.textContent = `${counts.aspnet} Questions (${selected})`;
      if (efcoreCountEl) efcoreCountEl.textContent = `${counts.efcore} Questions (${selected})`;
      if (sqlCountEl) sqlCountEl.textContent = `${counts.sql} Questions (${selected})`;
      if (uiCountEl) uiCountEl.textContent = `${counts.ui} Questions (${selected})`;
      if (cloudCountEl) cloudCountEl.textContent = `${counts.cloud} Questions (${selected})`;

      const descs = TIER_MODULE_DESCRIPTIONS[selected];
      if (descs) {
        const cDesc = document.getElementById('csharpModuleDesc');
        const aDesc = document.getElementById('aspnetModuleDesc');
        const eDesc = document.getElementById('efcoreModuleDesc');
        const sDesc = document.getElementById('sqlModuleDesc');
        const uDesc = document.getElementById('uiModuleDesc');
        const clDesc = document.getElementById('cloudModuleDesc');

        if (cDesc && descs.csharp) cDesc.textContent = descs.csharp;
        if (aDesc && descs.aspnet) aDesc.textContent = descs.aspnet;
        if (eDesc && descs.efcore) eDesc.textContent = descs.efcore;
        if (sDesc && descs.sql) sDesc.textContent = descs.sql;
        if (uDesc && descs.ui) uDesc.textContent = descs.ui;
        if (clDesc && descs.cloud) clDesc.textContent = descs.cloud;
      }
    }

    renderAllUnitMastery();
  }

  // --- KHAN ACADEMY UNIT MASTERY & SYLLABUS ENGINE ---
  function calculateUnitMastery(pillar) {
    const questions = window.INTERVIEW_QUESTIONS || [];
    const unitQuestions = questions.filter(q => q.pillar === pillar);
    if (!unitQuestions.length) return { score: 0, level: 'Not Started', badgeClass: 'badge-notstarted', count: 0, mastered: 0, practiced: 0 };

    let mastered = 0;
    let practiced = 0;
    unitQuestions.forEach(q => {
      const m = state.questionMastery[q.id];
      if (m === 'mastered') mastered++;
      else if (m === 'practiced' || state.completedQuestions[q.id]) practiced++;
    });

    const score = Math.min(100, Math.round(((mastered * 1.0 + practiced * 0.5) / unitQuestions.length) * 100));

    let level = 'Not Started';
    let badgeClass = 'badge-notstarted';
    if (score >= 90) {
      level = 'Mastered ⭐';
      badgeClass = 'badge-mastered';
    } else if (score >= 50) {
      level = 'Proficient';
      badgeClass = 'badge-proficient';
    } else if (score > 0) {
      level = 'Practicing';
      badgeClass = 'badge-practicing';
    }

    return { score, level, badgeClass, count: unitQuestions.length, mastered, practiced };
  }

  function renderAllUnitMastery() {
    const pillars = ['csharp', 'aspnet', 'efcore', 'sql', 'ui', 'cloud'];
    pillars.forEach(p => {
      const stats = calculateUnitMastery(p);
      const levelEl = document.getElementById(`${p}MasteryLevel`);
      const scoreEl = document.getElementById(`${p}MasteryScore`);
      const fillEl = document.getElementById(`${p}MasteryFill`);
      const countEl = document.getElementById(`${p}SyllabusCount`);

      if (levelEl) {
        levelEl.textContent = stats.level;
        levelEl.className = `khan-mastery-level-badge ${stats.badgeClass}`;
      }
      if (scoreEl) {
        scoreEl.textContent = `${stats.score}% (${stats.mastered}/${stats.count} Mastered)`;
      }
      if (fillEl) {
        fillEl.style.width = `${stats.score}%`;
      }
      if (countEl) {
        countEl.textContent = `${stats.count} Lessons`;
      }
    });
  }

  function toggleUnitSyllabus(pillar) {
    const drawer = document.getElementById(`${pillar}SyllabusDrawer`);
    const arrow = document.getElementById(`${pillar}SyllabusArrow`);
    if (!drawer) return;

    const isVisible = drawer.style.display !== 'none';
    if (isVisible) {
      drawer.style.display = 'none';
      if (arrow) arrow.textContent = '▼';
    } else {
      drawer.style.display = 'block';
      if (arrow) arrow.textContent = '▲';

      const questions = window.INTERVIEW_QUESTIONS || [];
      const unitQuestions = questions.filter(q => q.pillar === pillar);

      drawer.innerHTML = `
        <div class="syllabus-list">
          ${unitQuestions.map((q, idx) => {
            const mastery = state.questionMastery[q.id];
            let statusIcon = '⚪';
            let statusClass = 'unstarted';
            if (mastery === 'mastered') {
              statusIcon = '⭐';
              statusClass = 'mastered';
            } else if (mastery === 'practiced' || state.completedQuestions[q.id]) {
              statusIcon = '🟡';
              statusClass = 'practiced';
            } else if (mastery === 'review') {
              statusIcon = '🔴';
              statusClass = 'review';
            }

            return `
              <div class="syllabus-item" onclick="window.AppController.jumpToSyllabusQuestion('${q.pillar}', '${q.id}')">
                <div class="syllabus-item-left">
                  <span class="syllabus-status-dot ${statusClass}">${statusIcon}</span>
                  <span class="syllabus-lesson-num">${idx + 1}.</span>
                  <span class="syllabus-lesson-title">${escapeHtml(q.title)}</span>
                </div>
                <div class="syllabus-item-right">
                  <span class="seniority-badge badge-${q.seniority.toLowerCase()}">${q.seniority}</span>
                  <span class="syllabus-jump-arrow">→</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  function jumpToSyllabusQuestion(pillar, qId) {
    state.vaultFilters.pillar = pillar;
    state.vaultFilters.search = '';
    state.vaultFilters.seniority = 'all';
    state.vaultFilters.bookmarkedOnly = false;
    state.vaultFilters.completedOnly = false;

    switchView('vault');
    document.querySelectorAll('#pillarFiltersRow .filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.pillar === pillar);
    });
    renderQuestionVault();

    setTimeout(() => {
      const card = document.getElementById(`card-${qId}`);
      if (card) {
        card.classList.add('expanded');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const bTitle = document.getElementById('breadcrumbQuestionTitle');
        const bSep = document.getElementById('breadcrumbQuestionSep');
        const q = (window.INTERVIEW_QUESTIONS || []).find(item => item.id === qId);
        if (q && bTitle && bSep) {
          bSep.style.display = 'inline';
          bTitle.style.display = 'inline';
          bTitle.textContent = q.title;
        }
      }
    }, 150);
  }

  // --- KHAN ACADEMY PROGRESSIVE HINT DISCLOSURE ---
  function renderRevealedHintsHtml(q, count) {
    if (!count || count === 0) return '';
    let html = '';

    if (count >= 1) {
      html += `
        <div class="khan-hint-box hint-level-1">
          <div class="hint-badge-tag">💡 HINT 1 OF 3 • REAL-WORLD INTUITION &amp; ANALOGY</div>
          <p class="hint-text">${escapeHtml(q.analogy || ("Focus on the core trade-off: " + q.tags.join(', ')))}</p>
        </div>
      `;
    }
    if (count >= 2) {
      const sentences = q.deepDive.split('. ');
      const keyRule = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
      html += `
        <div class="khan-hint-box hint-level-2">
          <div class="hint-badge-tag">🔬 HINT 2 OF 3 • INTERNAL CLR / ARCHITECTURAL MECHANISM</div>
          <p class="hint-text">${escapeHtml(keyRule)}</p>
        </div>
      `;
    }
    if (count >= 3) {
      html += `
        <div class="khan-hint-box hint-level-3">
          <div class="hint-badge-tag">🎯 HINT 3 OF 3 • COMPLETE 20-SECOND VERBAL SOLUTION</div>
          <p class="hint-text">${escapeHtml(q.pitch)}</p>
        </div>
      `;
    }
    return html;
  }

  function revealHint(qId) {
    state.revealedHints[qId] = (state.revealedHints[qId] || 0) + 1;
    if (state.revealedHints[qId] > 3) state.revealedHints[qId] = 3;
    saveState();

    const hintList = document.getElementById(`revealedHints-${qId}`);
    const btnLabel = document.getElementById(`hintBtnLabel-${qId}`);
    const allQuestions = window.INTERVIEW_QUESTIONS || [];
    const q = allQuestions.find(item => item.id === qId);

    if (q && hintList) {
      hintList.innerHTML = renderRevealedHintsHtml(q, state.revealedHints[qId]);
      window.SoundEngine.playChime();
    }
    if (btnLabel) {
      const count = state.revealedHints[qId];
      if (count === 1) btnLabel.textContent = '💡 Next Hint (2 of 3)';
      else if (count === 2) btnLabel.textContent = '💡 Final Solution (3 of 3)';
      else btnLabel.textContent = '✓ All 3 Hints Revealed';
    }
  }

  function switchQuestionTab(qId, tab) {
    const card = document.getElementById(`card-${qId}`);
    if (!card) return;

    card.querySelectorAll('.khan-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    const sectionsWrap = document.getElementById(`sections-${qId}`);
    if (!sectionsWrap) return;

    if (tab === 'all') {
      sectionsWrap.querySelectorAll('.section-box, .code-box').forEach(el => {
        el.style.display = 'block';
      });
    } else {
      sectionsWrap.querySelectorAll('.section-box, .code-box').forEach(el => {
        if (el.classList.contains(`tab-section-${tab}`)) {
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
    }
  }

  function rateQuestionMastery(qId, rating) {
    state.questionMastery = state.questionMastery || {};
    const previous = state.questionMastery[qId];
    state.questionMastery[qId] = rating;

    if (rating === 'mastered') {
      state.completedQuestions[qId] = true;
      if (previous !== 'mastered') {
        addXp(50, 'Mastered Lesson');
        window.SoundEngine.playLevelUp();
        showNotification('⭐ Topic Mastered! (+50 XP)', 'success');
      }
    } else if (rating === 'practiced') {
      state.completedQuestions[qId] = true;
      if (!previous) {
        addXp(25, 'Practiced Lesson');
        window.SoundEngine.playChime();
        showNotification('🟡 Marked as Practiced! (+25 XP)', 'success');
      }
    } else if (rating === 'review') {
      state.reviewCards[qId] = true;
      window.SoundEngine.playFlip();
      showNotification('🔴 Added to Review Queue.', 'info');
    }

    saveState();
    updateHudUI();
    renderAllUnitMastery();

    const card = document.getElementById(`card-${qId}`);
    if (card) {
      const pill = card.querySelector('.q-mastery-status-pill');
      if (pill) {
        if (rating === 'mastered') {
          pill.className = 'q-mastery-status-pill pill-mastered';
          pill.textContent = '⭐ Mastered';
        } else if (rating === 'practiced') {
          pill.className = 'q-mastery-status-pill pill-practiced';
          pill.textContent = '🟡 Practiced';
        } else {
          pill.className = 'q-mastery-status-pill pill-review';
          pill.textContent = '🔴 Needs Review';
        }
      }
      card.querySelectorAll('.khan-rate-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.rating === rating);
      });
    }
  }

  function stepToQuestion(currentId, direction) {
    const allQuestions = window.INTERVIEW_QUESTIONS || [];
    const { search, pillar, seniority, bookmarkedOnly, completedOnly } = state.vaultFilters;

    const filtered = allQuestions.filter(q => {
      if (pillar !== 'all' && q.pillar !== pillar) return false;
      if (seniority !== 'all' && q.seniority !== seniority) return false;
      if (bookmarkedOnly && !state.bookmarkedQuestions[q.id]) return false;
      if (completedOnly && !state.completedQuestions[q.id]) return false;
      if (search) {
        const term = search.toLowerCase();
        return q.title.toLowerCase().includes(term) || q.pitch.toLowerCase().includes(term);
      }
      return true;
    });

    const currentIndex = filtered.findIndex(q => q.id === currentId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    const targetQ = filtered[targetIndex];

    const curCard = document.getElementById(`card-${currentId}`);
    if (curCard) curCard.classList.remove('expanded');

    const targetCard = document.getElementById(`card-${targetQ.id}`);
    if (targetCard) {
      targetCard.classList.add('expanded');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.SoundEngine.playFlip();

      const bTitle = document.getElementById('breadcrumbQuestionTitle');
      const bSep = document.getElementById('breadcrumbQuestionSep');
      if (bTitle && bSep) {
        bSep.style.display = 'inline';
        bTitle.style.display = 'inline';
        bTitle.textContent = targetQ.title;
      }
    }
  }

  // --- MODERN VISUAL ARCHITECTURE BLUEPRINT PARSER & RENDERER ---
  function cleanCellText(text) {
    if (!text) return '';
    return text.replace(/[\[\]]/g, '').trim();
  }

  function parseVisualBlueprint(diagText, q) {
    if (!diagText) return '';
    const lines = diagText.trim().split('\n');

    const hasBox = diagText.includes('┌');
    const hasArrows = diagText.includes('──►') || diagText.includes('-->') || diagText.includes('──>') || diagText.includes('->');

    if (hasBox) {
      return renderBoxBlueprint(diagText, lines, q);
    }
    if (hasArrows) {
      return renderFlowOrMappingBlueprint(diagText, lines, q);
    }
    return renderComparisonBlueprint(diagText, lines, q);
  }

  function renderBoxBlueprint(raw, lines, q) {
    let title = '';
    let tableHeaderCols = [];
    let tableRows = [];
    let postBoxLines = [];
    let insideBox = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('┌')) {
        insideBox = true;
        continue;
      }
      if (line.startsWith('└')) {
        insideBox = false;
        postBoxLines = lines.slice(i + 1).filter(l => l.trim().length > 0);
        break;
      }
      if (insideBox) {
        if (line.startsWith('├')) {
          continue;
        }
        if (line.startsWith('│')) {
          const cleanContent = line.replace(/^│/, '').replace(/│$/, '');
          const parts = cleanContent.split('│').map(p => cleanCellText(p));
          if (parts.length === 1 && !title && !tableHeaderCols.length) {
            title = parts[0];
          } else if (!tableHeaderCols.length) {
            tableHeaderCols = parts;
          } else {
            tableRows.push(parts);
          }
        }
      }
    }

    let html = `<div class="modern-blueprint-wrap">`;

    if (title) {
      html += `
        <div class="blueprint-root-header">
          <span class="blueprint-root-pill">SYSTEM ARCHITECTURE CONCEPT</span>
          <h3 class="blueprint-root-title">${escapeHtml(title)}</h3>
        </div>
      `;
    }

    if (tableHeaderCols.length > 0) {
      const colCount = Math.min(tableHeaderCols.length, 4);
      html += `<div class="blueprint-bento-grid grid-cols-${colCount}">`;
      tableHeaderCols.forEach((colName, colIdx) => {
        const rawColItems = tableRows.map(r => r[colIdx] || '').filter(Boolean);
        const colSubItems = [];
        let currentPhrase = '';
        rawColItems.forEach(item => {
          if (!currentPhrase) {
            currentPhrase = item;
          } else if (currentPhrase.endsWith('/')) {
            currentPhrase = currentPhrase.slice(0, -1).trim() + ' & ' + item;
          } else if (currentPhrase.endsWith(',') || currentPhrase.endsWith('&') || item.startsWith('&')) {
            currentPhrase += ' ' + item;
          } else {
            colSubItems.push(currentPhrase);
            currentPhrase = item;
          }
        });
        if (currentPhrase) colSubItems.push(currentPhrase);

        const accentThemes = ['theme-indigo', 'theme-cyan', 'theme-emerald', 'theme-amber', 'theme-violet'];
        const themeClass = accentThemes[colIdx % accentThemes.length];

        html += `
          <div class="blueprint-node-card ${themeClass}">
            <div class="node-card-badge">PART 0${colIdx + 1}</div>
            <h4 class="node-card-title">${escapeHtml(colName)}</h4>
            <div class="node-card-body">
              ${colSubItems.map(item => `<div class="node-card-detail">${escapeHtml(item)}</div>`).join('')}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    if (postBoxLines.length > 0) {
      html += `<div class="blueprint-mapping-panel">`;
      let lastSource = '';
      const firstLine = postBoxLines[0].trim();
      let startIndex = 0;
      if (firstLine.endsWith(':')) {
        html += `<div class="mapping-panel-title">💡 ${escapeHtml(firstLine)}</div>`;
        startIndex = 1;
      }
      for (let j = startIndex; j < postBoxLines.length; j++) {
        const lineRes = renderMappingLineWithSource(postBoxLines[j], lastSource);
        html += lineRes.html;
        if (lineRes.source) lastSource = lineRes.source;
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderMappingLineWithSource(line, currentSource) {
    const trimmed = line.trim();
    if (!trimmed) return { html: '', source: currentSource };

    const arrowRegex = /(?:──►|-->|──>|->)/;
    if (arrowRegex.test(trimmed)) {
      const parts = trimmed.split(arrowRegex).map(p => p.trim());
      let source = parts[0];
      const target = parts.slice(1).join(' ➔ ');
      
      let isContinuation = false;
      if (!source && currentSource) {
        source = `↳ ${currentSource}`;
        isContinuation = true;
      } else if (source) {
        currentSource = source;
      }

      let targetHtml = escapeHtml(target);
      if (target.includes(':')) {
        const cIdx = target.indexOf(':');
        const cat = target.substring(0, cIdx).trim();
        const rest = target.substring(cIdx + 1).trim();
        targetHtml = `<strong class="mapping-category">${escapeHtml(cat)}:</strong> <span class="mapping-detail">${escapeHtml(rest)}</span>`;
      }

      return {
        html: `
          <div class="blueprint-mapping-row${isContinuation ? ' is-sub-mapping' : ''}">
            ${source ? `<span class="mapping-source-chip${isContinuation ? ' sub-chip' : ''}">${escapeHtml(source)}</span>` : ''}
            <span class="mapping-arrow-icon">➔</span>
            <span class="mapping-target-chip">${targetHtml}</span>
          </div>
        `,
        source: currentSource
      };
    }

    return {
      html: `
        <div class="blueprint-mapping-row single-row">
          <span class="mapping-plain-text">${escapeHtml(trimmed)}</span>
        </div>
      `,
      source: currentSource
    };
  }

  function renderFlowOrMappingBlueprint(raw, lines, q) {
    let title = '';
    let mappingLines = [];

    const first = lines[0].trim();
    let startIdx = 0;
    if (first.endsWith(':')) {
      title = first.slice(0, -1);
      startIdx = 1;
    }

    lines.slice(startIdx).forEach(l => {
      if (l.trim()) mappingLines.push(l);
    });

    let html = `<div class="modern-blueprint-wrap">`;
    if (title) {
      html += `
        <div class="blueprint-root-header">
          <span class="blueprint-root-pill">SYSTEM FLOW ARCHITECTURE</span>
          <h3 class="blueprint-root-title">${escapeHtml(title)}</h3>
        </div>
      `;
    }

    html += `<div class="blueprint-flow-container">`;
    let lastSource = '';
    mappingLines.forEach(l => {
      const res = renderMappingLineWithSource(l, lastSource);
      html += res.html;
      if (res.source) lastSource = res.source;
    });
    html += `</div></div>`;
    return html;
  }

  function renderComparisonBlueprint(raw, lines, q) {
    let title = '';
    let contentLines = [];

    const first = lines[0].trim();
    let startIdx = 0;
    if (first.endsWith(':')) {
      title = first.slice(0, -1);
      startIdx = 1;
    }

    lines.slice(startIdx).forEach(l => {
      if (l.trim()) contentLines.push(l);
    });

    let html = `<div class="modern-blueprint-wrap">`;
    if (title) {
      html += `
        <div class="blueprint-root-header">
          <span class="blueprint-root-pill">COMPARISON MATRIX</span>
          <h3 class="blueprint-root-title">${escapeHtml(title)}</h3>
        </div>
      `;
    }

    html += `<div class="blueprint-comparison-grid">`;
    contentLines.forEach(l => {
      const trimmed = l.trim();
      if (!trimmed) return;
      const isHazard = trimmed.toLowerCase().startsWith('hazard:');
      if (isHazard) {
        html += `
          <div class="blueprint-hazard-callout">
            <span class="hazard-badge">⚠️ CRITICAL ARCHITECTURAL HAZARD</span>
            <p class="hazard-text">${escapeHtml(trimmed.replace(/^hazard:\s*/i, ''))}</p>
          </div>
        `;
      } else if (trimmed.includes(':')) {
        const [key, ...rest] = trimmed.split(':');
        html += `
          <div class="blueprint-comparison-card">
            <div class="comp-card-badge">${escapeHtml(key.trim())}</div>
            <div class="comp-card-desc">${escapeHtml(rest.join(':').trim())}</div>
          </div>
        `;
      } else {
        html += `
          <div class="blueprint-comparison-card">
            <div class="comp-card-desc">${escapeHtml(trimmed)}</div>
          </div>
        `;
      }
    });
    html += `</div></div>`;
    return html;
  }

  // --- VIEW 1: QUESTION VAULT ---
  function renderQuestionVault() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    const allQuestions = window.INTERVIEW_QUESTIONS || [];
    const { search, pillar, seniority, bookmarkedOnly, completedOnly } = state.vaultFilters;

    // Update Khan Academy Breadcrumbs
    const bUnit = document.getElementById('breadcrumbUnitName');
    const bTitle = document.getElementById('breadcrumbQuestionTitle');
    const bSep = document.getElementById('breadcrumbQuestionSep');
    if (bUnit) {
      const pNames = {
        all: 'All Curriculum Modules',
        csharp: '⚡ C# & OOP Fundamentals',
        aspnet: '🌐 ASP.NET Core & Web APIs',
        efcore: '🗄️ EF Core & LINQ',
        sql: '💾 SQL Server & Relational DB',
        ui: '⚛️ React & TypeScript UI',
        cloud: '☁️ Azure DevOps, Docker & CI/CD'
      };
      bUnit.textContent = pNames[pillar] || 'All Curriculum Modules';
    }
    if (bTitle && bSep) {
      bTitle.style.display = 'none';
      bSep.style.display = 'none';
    }

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

    container.innerHTML = filtered.map((q, idx) => {
      const isBookmarked = !!state.bookmarkedQuestions[q.id];
      const mastery = state.questionMastery[q.id] || (state.completedQuestions[q.id] ? 'practiced' : 'unstarted');
      const hintsCount = state.revealedHints[q.id] || 0;

      let masteryBadgeHtml = '';
      if (mastery === 'mastered') {
        masteryBadgeHtml = `<span class="q-mastery-status-pill pill-mastered">⭐ Mastered</span>`;
      } else if (mastery === 'practiced') {
        masteryBadgeHtml = `<span class="q-mastery-status-pill pill-practiced">🟡 Practiced</span>`;
      } else if (mastery === 'review') {
        masteryBadgeHtml = `<span class="q-mastery-status-pill pill-review">🔴 Needs Review</span>`;
      } else {
        masteryBadgeHtml = `<span class="q-mastery-status-pill pill-unstarted">⚪ Not Started</span>`;
      }

      let hintBtnLabel = '💡 Need a hint? (1 of 3)';
      if (hintsCount === 1) hintBtnLabel = '💡 Next Hint (2 of 3)';
      else if (hintsCount === 2) hintBtnLabel = '💡 Final Solution (3 of 3)';
      else if (hintsCount >= 3) hintBtnLabel = '✓ All 3 Hints Revealed';

      const pillarClass = `pillar-${q.pillar}`;
      const pillarLabel = {
        csharp: 'C# & OOP',
        aspnet: 'ASP.NET Core',
        sql: 'SQL Server & DB',
        efcore: 'EF Core & LINQ',
        linq: 'EF Core & LINQ',
        ui: 'React & TS',
        frontend: 'React & TS',
        cloud: 'Azure & DevOps'
      }[q.pillar] || q.pillar;

      const isFirst = idx === 0;
      const isLast = idx === filtered.length - 1;

      return `
        <article class="q-card" id="card-${q.id}">
          <div class="q-card-header" onclick="window.AppController.toggleQuestion('${q.id}')">
            <div class="q-card-meta">
              <div class="q-badges">
                <span class="pillar-badge ${pillarClass}">${pillarLabel}</span>
                <span class="seniority-badge ${q.seniority}">${q.seniority}</span>
                ${masteryBadgeHtml}
                <span class="q-xp-bounty">+50 XP</span>
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
              <button class="check-btn ${mastery === 'mastered' || state.completedQuestions[q.id] ? 'completed' : ''}" 
                onclick="window.AppController.toggleComplete('${q.id}')" 
                title="${state.completedQuestions[q.id] ? 'Mark Incomplete' : 'Quick Check (+25 XP)'}">
                ${state.completedQuestions[q.id] ? '✓' : '○'}
              </button>
              <span class="expand-chevron">▼</span>
            </div>
          </div>

          <div class="q-card-body">
            <!-- Khan Academy Active Recall Mode (Progressive Hint Ladder) -->
            <div class="khan-hint-accordion">
              <div class="khan-hint-prompt-bar">
                <div class="khan-hint-prompt-left">
                  <span class="hint-lamp-icon">💡</span>
                  <div>
                    <strong class="hint-title-text">Active Recall Practice</strong>
                    <span class="hint-prompt-sub">Try explaining this out loud to yourself before reading the solution.</span>
                  </div>
                </div>
                <button class="btn-khan-hint" onclick="window.AppController.revealHint('${q.id}')">
                  <span id="hintBtnLabel-${q.id}">${hintBtnLabel}</span>
                </button>
              </div>
              <div class="khan-revealed-hints" id="revealedHints-${q.id}">
                ${renderRevealedHintsHtml(q, hintsCount)}
              </div>
            </div>

            <!-- Khan Academy Section Tabs Switcher -->
            <div class="khan-card-tabs" onclick="event.stopPropagation()">
              <button class="khan-tab-btn active" data-tab="all" onclick="window.AppController.switchQuestionTab('${q.id}', 'all')">📖 Full Breakdown</button>
              <button class="khan-tab-btn" data-tab="pitch" onclick="window.AppController.switchQuestionTab('${q.id}', 'pitch')">🎯 20s Say It</button>
              ${q.analogy ? `<button class="khan-tab-btn" data-tab="analogy" onclick="window.AppController.switchQuestionTab('${q.id}', 'analogy')">💡 Mental Model</button>` : ''}
              ${q.visualDiagram ? `<button class="khan-tab-btn" data-tab="visual" onclick="window.AppController.switchQuestionTab('${q.id}', 'visual')">📐 Blueprint</button>` : ''}
              <button class="khan-tab-btn" data-tab="deepdive" onclick="window.AppController.switchQuestionTab('${q.id}', 'deepdive')">🔬 Deep Dive</button>
              <button class="khan-tab-btn" data-tab="code" onclick="window.AppController.switchQuestionTab('${q.id}', 'code')">💻 Code</button>
              <button class="khan-tab-btn" data-tab="tips" onclick="window.AppController.switchQuestionTab('${q.id}', 'tips')">⚠️ Red Flags</button>
            </div>

            <div class="q-sections-wrap" id="sections-${q.id}">
              <!-- 20-Second Direct Answer ("Say It") -->
              <div class="section-box pitch-box tab-section-pitch">
                <span class="section-box-title">🎯 20-Second Direct Answer ("Say It")</span>
                <p class="pitch-content">${escapeHtml(q.pitch)}</p>
              </div>

              ${q.analogy ? `
              <!-- The Teenager Analogy -->
              <div class="section-box analogy-box tab-section-analogy">
                <span class="section-box-title">💡 The Teenager Analogy (Mental Model)</span>
                <p class="analogy-content">${escapeHtml(q.analogy)}</p>
              </div>
              ` : ''}

              ${q.visualDiagram ? `
              <!-- Visual Architecture Blueprint & Mental Model -->
              <div class="section-box visual-box tab-section-visual" id="visual-box-${q.id}">
                <div class="visual-box-header">
                  <span class="section-box-title" style="margin-bottom: 0;">📐 Interactive Architecture Blueprint &amp; Model</span>
                  <div class="visual-view-toggle">
                    ${q.id === 'q-csharp-1' ? `<button class="view-toggle-btn active" id="btn-3d-${q.id}" onclick="window.AppController.toggleBlueprintView('${q.id}', '3d')">🚀 3D Car Model</button>` : ''}
                    <button class="view-toggle-btn ${q.id === 'q-csharp-1' ? '' : 'active'}" id="btn-modern-${q.id}" onclick="window.AppController.toggleBlueprintView('${q.id}', 'modern')">🎨 Bento Blueprint</button>
                    <button class="view-toggle-btn" id="btn-ascii-${q.id}" onclick="window.AppController.toggleBlueprintView('${q.id}', 'ascii')">⌨️ Raw Terminal</button>
                  </div>
                </div>
                <div class="visual-diagram-container">
                  ${q.id === 'q-csharp-1' ? `
                  <div class="three-3d-view" id="three-view-${q.id}">
                    <div id="three-car-viewport-${q.id}"></div>
                  </div>
                  ` : ''}
                  <div class="modern-diagram-view" id="modern-diag-${q.id}" style="${q.id === 'q-csharp-1' ? 'display: none;' : ''}">
                    ${parseVisualBlueprint(q.visualDiagram, q)}
                  </div>
                  <div class="ascii-diagram-view" id="ascii-diag-${q.id}" style="display: none;">
                    <pre class="visual-diagram-ascii">${escapeHtml(q.visualDiagram)}</pre>
                  </div>
                </div>
              </div>
              ` : ''}

              <!-- Technical Deep Dive -->
              <div class="section-box deepdive-box tab-section-deepdive">
                <span class="section-box-title">🔬 Technical Deep Dive &amp; Under the Hood</span>
                <p class="deepdive-content">${escapeHtml(q.deepDive)}</p>
              </div>

              <!-- Production Code Snippet -->
              <div class="code-box tab-section-code">
                <div class="code-header">
                  <span>PRODUCTION ARCHITECTURE CODE</span>
                  <button class="copy-code-btn" onclick="window.AppController.copyCode('${q.id}')">
                    📋 Copy Code
                  </button>
                </div>
                <pre class="code-pre" id="snippet-${q.id}">${highlightSyntax(q.codeSnippet)}</pre>
              </div>

              <!-- Junior Red Flags & Senior Pro-Tips -->
              <div class="section-box redflags-box tab-section-tips">
                <span class="section-box-title">⚠️ Junior Red Flags (What candidates say that hurts them)</span>
                <ul class="bullet-list">
                  ${q.redFlags.map(rf => `<li>${escapeHtml(rf)}</li>`).join('')}
                </ul>
              </div>

              <div class="section-box protips-box tab-section-tips">
                <span class="section-box-title">💡 Senior Pro-Tips &amp; Architecture Nuances</span>
                <ul class="protips-list">
                  ${q.proTips.map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Khan Academy 3-Tier Mastery Self-Assessment Bar -->
            <div class="khan-mastery-footer" onclick="event.stopPropagation()">
              <div class="khan-mastery-callout">
                <span class="mastery-callout-icon">🎓</span>
                <span class="mastery-prompt-text">Calibrate your mastery for this topic:</span>
              </div>
              <div class="khan-mastery-buttons">
                <button class="khan-rate-btn rate-review ${mastery === 'review' ? 'active' : ''}" 
                  data-rating="review"
                  onclick="window.AppController.rateQuestionMastery('${q.id}', 'review')" 
                  title="Needs more review">
                  <span>🔴 Needs Review</span>
                </button>
                <button class="khan-rate-btn rate-practiced ${mastery === 'practiced' ? 'active' : ''}" 
                  data-rating="practiced"
                  onclick="window.AppController.rateQuestionMastery('${q.id}', 'practiced')" 
                  title="Practiced and understood (+25 XP)">
                  <span>🟡 Practiced (+25 XP)</span>
                </button>
                <button class="khan-rate-btn rate-mastered ${mastery === 'mastered' ? 'active' : ''}" 
                  data-rating="mastered"
                  onclick="window.AppController.rateQuestionMastery('${q.id}', 'mastered')" 
                  title="Completely mastered (+50 XP)">
                  <span>⭐ Mastered (+50 XP)</span>
                </button>
              </div>
            </div>

            <!-- Khan Academy Sequential Question Stepper -->
            <div class="khan-question-stepper-bar" onclick="event.stopPropagation()">
              <button class="stepper-nav-btn" onclick="window.AppController.stepToQuestion('${q.id}', -1)" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>
                <span>← Previous Lesson</span>
              </button>
              <div class="stepper-dots-wrap">
                <span class="stepper-counter-text">Lesson ${idx + 1} of ${filtered.length}</span>
              </div>
              <button class="stepper-nav-btn" onclick="window.AppController.stepToQuestion('${q.id}', 1)" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>
                <span>Next Lesson →</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- VIEW 2: TIMED MOCK SIMULATOR ---
  let mockTimerInterval = null;

  function renderMockView() {
    const setupCard = document.getElementById('mockSetupCard');
    const activeSession = document.getElementById('mockActiveSession');
    const scorecard = document.getElementById('mockScorecard');

    if (!setupCard || !activeSession || !scorecard) return;

    if (state.mockSession && state.mockSession.questions && state.mockSession.questions.length > 0) {
      setupCard.style.display = 'none';
      scorecard.style.display = 'none';
      activeSession.style.display = 'flex';
      renderMockCurrentQuestion();
    } else {
      setupCard.style.display = 'flex';
      activeSession.style.display = 'none';
      scorecard.style.display = 'none';
    }
  }

  function startMockSimulator() {
    const questions = window.INTERVIEW_QUESTIONS || [];
    if (!questions.length) return;

    // Read selected pillar, count & timer
    const countTile = document.querySelector('#mockCountTiles .radio-tile.selected');
    const timerTile = document.querySelector('#mockTimerTiles .radio-tile.selected');
    const pillarTile = document.querySelector('#mockPillarTiles .radio-tile.selected');

    const count = countTile ? parseInt(countTile.dataset.count, 10) : 5;
    const minutes = timerTile ? parseInt(timerTile.dataset.time, 10) : 30;
    const pillar = pillarTile ? pillarTile.dataset.pillar : 'all';

    let pool = questions;
    if (pillar && pillar !== 'all') {
      pool = questions.filter(q => q.pillar === pillar);
      if (pool.length === 0) pool = questions;
    }

    // Shuffle and pick questions
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

    state.mockSession = {
      questions: selectedQuestions,
      currentIndex: 0,
      scores: {},
      notes: {},
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

    const totalSecs = Math.max(0, state.mockSession.secondsRemaining);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    textEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    timerEl.classList.toggle('warning', totalSecs <= 300 && totalSecs > 60);
    timerEl.classList.toggle('danger', totalSecs <= 60);
  }

  function renderMockCurrentQuestion() {
    const session = state.mockSession;
    if (!session || !session.questions || !session.questions[session.currentIndex]) return;

    const q = session.questions[session.currentIndex];
    session.isModelRevealed = false;

    // Progress counter & progress bar
    document.getElementById('mockQuestionProgress').textContent = 
      `Question ${session.currentIndex + 1} of ${session.questions.length}`;
    const pct = Math.round(((session.currentIndex + 1) / session.questions.length) * 100);
    const barEl = document.getElementById('mockProgressBarFill');
    if (barEl) barEl.style.width = `${pct}%`;

    // Badges & Title
    const badgesEl = document.getElementById('mockCardBadges');
    badgesEl.innerHTML = `
      <span class="pillar-badge pillar-${q.pillar}">${q.pillar.toUpperCase()}</span>
      <span class="seniority-badge ${q.seniority}">${q.seniority}</span>
      ${q.tags.map(t => `<span class="seniority-badge">${t}</span>`).join('')}
    `;
    document.getElementById('mockCardTitle').textContent = q.title;

    // Interviewer Prompt
    const promptEl = document.getElementById('mockInterviewerPrompt');
    if (promptEl) {
      promptEl.textContent = `Scenario / Interviewer Prompt: "Can you explain how ${q.title} works in production? What are the key internal mechanics, memory/performance trade-offs, and failure scenarios you consider when designing senior-level architectures?"`;
    }

    // Restore candidate notes
    const notesInput = document.getElementById('mockNotesInput');
    notesInput.value = (session.notes && session.notes[q.id]) || state.mockNotes[q.id] || '';

    // Hide revealed model answer panel initially for each question
    const modelPanel = document.getElementById('mockModelAnswerPanel');
    modelPanel.style.display = 'none';
    const revealBtn = document.getElementById('mockRevealAnswerBtn');
    if (revealBtn) {
      revealBtn.textContent = '👁️ Reveal Senior Model Answer & Rubric';
      revealBtn.style.background = '#334155';
    }

    // Populate model answer sections
    document.getElementById('mockModelPitch').textContent = q.pitch;

    const analogyEl = document.getElementById('mockModelAnalogy');
    const analogyBox = document.getElementById('mockModelAnalogyBox');
    if (analogyEl && analogyBox) {
      if (q.analogy) {
        analogyEl.textContent = q.analogy;
        analogyBox.style.display = 'flex';
      } else {
        analogyBox.style.display = 'none';
      }
    }

    document.getElementById('mockModelDeepDive').textContent = q.deepDive;
    document.getElementById('mockModelCode').innerHTML = highlightSyntax(q.codeSnippet);

    const redFlagsEl = document.getElementById('mockModelRedFlags');
    if (redFlagsEl) {
      redFlagsEl.innerHTML = q.redFlags.map(rf => `<li>${escapeHtml(rf)}</li>`).join('');
    }

    const proTipsEl = document.getElementById('mockModelProTips');
    if (proTipsEl) {
      proTipsEl.innerHTML = q.proTips.map(pt => `<li>${escapeHtml(pt)}</li>`).join('');
    }

    // Reset rubric stars
    renderMockRubricStars(session.scores[q.id] || 0);

    const promptNote = document.getElementById('mockRatingPromptNote');
    if (promptNote) promptNote.style.display = 'none';

    // Update Nav buttons
    const prevBtn = document.getElementById('mockPrevBtn');
    const nextBtn = document.getElementById('mockNextBtn');
    prevBtn.style.visibility = session.currentIndex > 0 ? 'visible' : 'hidden';
    nextBtn.textContent = session.currentIndex === session.questions.length - 1 ? '🏁 Finish & View Scorecard' : 'Next Question →';
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

    addXp(150, 'Completed Mock Interview');
    window.SoundEngine.playSuccess();

    document.getElementById('mockActiveSession').style.display = 'none';
    const scorecard = document.getElementById('mockScorecard');
    scorecard.style.display = 'flex';

    document.getElementById('scorecardOverallPercent').textContent = `${readinessPct}%`;

    let verdict = 'Needs Foundation Review ⚠️';
    let summary = 'Review core C# internals, memory management, and SQL indexing before senior interview loops.';

    if (readinessPct >= 85) {
      verdict = 'Staff / Principal Architect Ready 🚀';
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

    // Question-by-Question Review List
    const reviewList = document.getElementById('scorecardQuestionsReview');
    if (reviewList) {
      reviewList.innerHTML = session.questions.map((q, idx) => {
        const score = session.scores[q.id] || 0;
        const notes = (session.notes && session.notes[q.id]) || state.mockNotes[q.id] || 'No notes taken during question.';
        const starsText = '★'.repeat(score) + '☆'.repeat(5 - score);

        return `
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
              <div>
                <span class="pillar-badge pillar-${q.pillar}">${q.pillar}</span>
                <span class="seniority-badge ${q.seniority}">${q.seniority}</span>
                <strong style="margin-left: 0.5rem; color: var(--text-primary); font-size: 1rem;">Q${idx + 1}: ${q.title}</strong>
              </div>
              <span style="color: #fbbf24; font-family: var(--font-mono); font-size: 1rem; font-weight: 700; white-space: nowrap;">${starsText} (${score}/5★)</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); background: #090d16; padding: 0.6rem 0.85rem; border-radius: 6px; font-family: var(--font-mono); line-height: 1.5;">
              <strong style="color: #94a3b8;">Your Scratchpad Notes:</strong>
              <div style="margin-top: 0.25rem; color: #e2e8f0; white-space: pre-line;">${escapeHtml(notes)}</div>
            </div>
            <details style="margin-top: 0.25rem; cursor: pointer;">
              <summary style="font-size: 0.85rem; color: var(--accent-indigo-light); font-weight: 600;">🔍 View 60s Senior Pitch &amp; Production Solution</summary>
              <div style="margin-top: 0.75rem; font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; border-left: 3px solid var(--accent-indigo); padding-left: 1rem;">
                <p><strong>Senior Elevator Pitch:</strong> ${escapeHtml(q.pitch)}</p>
                <p style="margin-top: 0.5rem;"><strong>Senior Pro-Tip:</strong> ${escapeHtml(q.proTips[0] || '')}</p>
              </div>
            </details>
          </div>
        `;
      }).join('');
    }
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
            <span class="pillar-badge ${c.category === 'Top 10 Coding' ? 'pillar-coding' : 'pillar-' + c.pillar}">${c.category || c.pillar}</span>
            <span>${isCompleted ? '✅ Passed (+100 XP)' : '⏳ Incomplete'}</span>
          </div>
        </button>
      `;
    }).join('');

    const currentChallenge = challenges.find(c => c.id === state.activeLabId) || challenges[0];
    if (!currentChallenge) return;

    document.getElementById('labTitle').textContent = currentChallenge.title;
    const badge = document.getElementById('labPillarBadge');
    const isTopCoding = currentChallenge.category === 'Top 10 Coding';
    badge.textContent = (currentChallenge.category || currentChallenge.pillar).toUpperCase();
    badge.className = `pillar-badge ${isTopCoding ? 'pillar-coding' : 'pillar-' + currentChallenge.pillar}`;

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

  function highlightSyntax(code, lang = 'csharp') {
    if (!code) return '';
    if (window.Prism && window.Prism.languages && window.Prism.languages[lang]) {
      try {
        return window.Prism.highlight(code, window.Prism.languages[lang], lang);
      } catch (e) {
        // Fall back to built-in highlighter
      }
    }
    let html = escapeHtml(code);

    // Comments (//, /* */, --)
    html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|--.*$)/gm, '<span class="kw-comm">$1</span>');

    // String literals ("..." or '...')
    html = html.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, '<span class="kw-str">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?(?:m|f|d|L)?)\b/g, '<span class="kw-num">$1</span>');

    // C# & TS Keywords
    const keywords = /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|record|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|var|virtual|void|volatile|while|yield|function|let|import|export|type)\b/g;
    html = html.replace(keywords, '<span class="kw-kw">$1</span>');

    // Common Types
    const types = /\b(Task|ValueTask|Span|ReadOnlySpan|Memory|ReadOnlyMemory|CancellationToken|HttpClient|AppDbContext|ILogger|IServiceScopeFactory|SemaphoreSlim|Channel|Dictionary|HashSet|List|Stack|PriorityQueue|LinkedList|LinkedListNode|StringBuilder|DateTime|TimeSpan|Exception|Action|Func|IQueryable|IEnumerable|IList|ICollection|Tuple|ProblemDetails|Activity|HttpContext)\b/g;
    html = html.replace(types, '<span class="kw-type">$1</span>');

    // SQL Keywords
    const sql = /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|CROSS|APPLY|GROUP|BY|ORDER|HAVING|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|CLUSTERED|NONCLUSTERED|INCLUDE|VIEW|WITH|SCHEMABINDING|ALTER|DROP|AS|AND|OR|NOT|IN|LIKE|IS|NULL|COUNT|SUM|AVG|MIN|MAX|TOP|ROW_NUMBER|OVER|PARTITION)\b/g;
    html = html.replace(sql, '<span class="kw-sql">$1</span>');

    return html;
  }



  // --- GLOBAL EXPOSED CONTROLLER ---
  window.AppController = {
    switchView: function (viewName) {
      switchView(viewName);
    },

    selectExperienceLevel: function (level) {
      state.selectedExperience = level;
      saveState();
      renderExperienceView();
      window.SoundEngine.playLevelUp();
      showNotification(`🎯 Selected ${level}-Level Experience Tier!`, 'success');
      const hubEl = document.getElementById('view-hub');
      if (hubEl) hubEl.scrollIntoView({ behavior: 'smooth' });
    },

    resetExperienceLevel: function () {
      state.selectedExperience = null;
      saveState();
      renderExperienceView();
      window.SoundEngine.playFlip();
      showNotification('Experience level reset. Choose your target tier.', 'info');
      const hubEl = document.getElementById('view-hub');
      if (hubEl) hubEl.scrollIntoView({ behavior: 'smooth' });
    },

    openModuleVault: function (pillar, seniority) {
      const targetSeniority = seniority || state.selectedExperience || 'all';
      state.vaultFilters.pillar = pillar;
      state.vaultFilters.search = '';
      state.vaultFilters.seniority = targetSeniority;
      state.vaultFilters.bookmarkedOnly = false;
      state.vaultFilters.completedOnly = false;

      const searchInput = document.getElementById('vaultSearchInput');
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.seniority-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.seniority === targetSeniority);
      });

      switchView('vault');
      document.querySelectorAll('#pillarFiltersRow .filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.pillar === pillar);
      });
      renderQuestionVault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleQuestion: function (qId) {
      const card = document.getElementById(`card-${qId}`);
      if (card) {
        card.classList.toggle('expanded');
        window.SoundEngine.playFlip();

        const bTitle = document.getElementById('breadcrumbQuestionTitle');
        const bSep = document.getElementById('breadcrumbQuestionSep');
        if (card.classList.contains('expanded')) {
          const q = (window.INTERVIEW_QUESTIONS || []).find(item => item.id === qId);
          if (q && bTitle && bSep) {
            bSep.style.display = 'inline';
            bTitle.style.display = 'inline';
            bTitle.textContent = q.title;
          }

          // Auto-mount 3D Car Visualizer if Question 1
          if (qId === 'q-csharp-1') {
            setTimeout(() => {
              const container = document.getElementById(`three-car-viewport-${qId}`);
              if (container && window.CarVisualizer3D) {
                window.CarVisualizer3D.attach(container);
              }
            }, 120);
          }
        } else if (bTitle && bSep) {
          bSep.style.display = 'none';
          bTitle.style.display = 'none';
        }
      }
    },

    toggleUnitSyllabus: function (pillar) {
      toggleUnitSyllabus(pillar);
    },

    jumpToSyllabusQuestion: function (pillar, qId) {
      jumpToSyllabusQuestion(pillar, qId);
    },

    revealHint: function (qId) {
      revealHint(qId);
    },

    switchQuestionTab: function (qId, tab) {
      switchQuestionTab(qId, tab);
    },

    rateQuestionMastery: function (qId, rating) {
      rateQuestionMastery(qId, rating);
    },

    stepToQuestion: function (qId, direction) {
      stepToQuestion(qId, direction);
    },

    toggleBlueprintView: function (qId, view) {
      const threeEl = document.getElementById(`three-view-${qId}`);
      const modernEl = document.getElementById(`modern-diag-${qId}`);
      const asciiEl = document.getElementById(`ascii-diag-${qId}`);

      const btn3D = document.getElementById(`btn-3d-${qId}`);
      const btnModern = document.getElementById(`btn-modern-${qId}`);
      const btnAscii = document.getElementById(`btn-ascii-${qId}`);

      if (btn3D) btn3D.classList.remove('active');
      if (btnModern) btnModern.classList.remove('active');
      if (btnAscii) btnAscii.classList.remove('active');

      if (threeEl) threeEl.style.display = 'none';
      if (modernEl) modernEl.style.display = 'none';
      if (asciiEl) asciiEl.style.display = 'none';

      if (view === '3d') {
        if (threeEl) {
          threeEl.style.display = 'block';
          const container = document.getElementById(`three-car-viewport-${qId}`);
          if (container && window.CarVisualizer3D) {
            window.CarVisualizer3D.attach(container);
          }
        }
        if (btn3D) btn3D.classList.add('active');
      } else if (view === 'modern') {
        if (modernEl) modernEl.style.display = 'block';
        if (btnModern) btnModern.classList.add('active');
      } else {
        if (asciiEl) asciiEl.style.display = 'block';
        if (btnAscii) btnAscii.classList.add('active');
      }
      window.SoundEngine.playFlip();
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
    renderExperienceView();

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
          state.selectedExperience = null;
          updateHudUI();
          renderExperienceView();
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
    document.querySelectorAll('#mockPillarTiles .radio-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        document.querySelectorAll('#mockPillarTiles .radio-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        window.SoundEngine.playFlip();
      });
    });

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
      const btn = document.getElementById('mockRevealAnswerBtn');
      const isCurrentlyHidden = panel.style.display === 'none' || !panel.style.display;

      if (isCurrentlyHidden) {
        panel.style.display = 'flex';
        btn.textContent = '👁️ Hide Model Answer';
        btn.style.background = '#475569';
      } else {
        panel.style.display = 'none';
        btn.textContent = '👁️ Reveal Senior Model Answer & Rubric';
        btn.style.background = '#334155';
      }
      window.SoundEngine.playFlip();
    });

    // Mock Scratchpad auto-save
    let saveTimeout = null;
    document.getElementById('mockNotesInput').addEventListener('input', (e) => {
      if (state.mockSession && state.mockSession.questions) {
        const q = state.mockSession.questions[state.mockSession.currentIndex];
        state.mockNotes[q.id] = e.target.value;
        if (!state.mockSession.notes) state.mockSession.notes = {};
        state.mockSession.notes[q.id] = e.target.value;
        saveState();

        const indicator = document.getElementById('mockSaveIndicator');
        if (indicator) {
          indicator.textContent = 'Saving...';
          indicator.style.color = 'var(--accent-amber)';
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            indicator.textContent = 'Saved ✓';
            indicator.style.color = 'var(--accent-emerald)';
          }, 350);
        }
      }
    });

    // Mock Rubric Stars
    document.querySelectorAll('#mockRubricStars .star-score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.mockSession) return;
        const rating = parseInt(btn.dataset.rating, 10);
        const q = state.mockSession.questions[state.mockSession.currentIndex];
        state.mockSession.scores[q.id] = rating;
        renderMockRubricStars(rating);

        const promptNote = document.getElementById('mockRatingPromptNote');
        if (promptNote) promptNote.style.display = 'none';

        window.SoundEngine.playChime();
      });
    });

    document.getElementById('mockNextBtn').addEventListener('click', () => {
      const session = state.mockSession;
      if (!session || !session.questions) return;

      const currentQ = session.questions[session.currentIndex];
      const hasRating = session.scores[currentQ.id] !== undefined && session.scores[currentQ.id] > 0;
      const promptNote = document.getElementById('mockRatingPromptNote');

      // If user hasn't scored themselves yet, prompt once softly
      if (!hasRating && promptNote && promptNote.style.display === 'none') {
        promptNote.style.display = 'inline-block';
        promptNote.textContent = '⚠️ Self-score 1–5★ before proceeding (or click Next again to skip).';
        window.SoundEngine.playWarning();
        return;
      }
      if (promptNote) promptNote.style.display = 'none';

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
      if (!session) return;
      if (session.currentIndex > 0) {
        session.currentIndex--;
        renderMockCurrentQuestion();
        window.SoundEngine.playFlip();
      }
    });

    document.getElementById('mockEndEarlyBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to finish the mock interview now and view your scorecard?')) {
        finishMockExam();
      }
    });

    document.getElementById('btnRestartMock').addEventListener('click', () => {
      state.mockSession = null;
      document.getElementById('mockScorecard').style.display = 'none';
      document.getElementById('mockActiveSession').style.display = 'none';
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

      // Mobile Touch Swipe Gestures
      let touchStartX = 0;
      let touchStartY = 0;
      fcStage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      fcStage.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            nextFlashcard();
          } else {
            prevFlashcard();
          }
        }
      }, { passive: true });
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
    if (['hub', 'vault', 'mock', 'lab', 'diagrams', 'whiteboards', 'flashcards'].includes(hash)) {
      switchView(hash);
    } else {
      switchView('hub');
    }
  });

})();
