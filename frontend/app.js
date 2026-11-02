/**
 * app.js
 * Core router, state store, interactive view controllers & API integration
 * The Counterfactual Boardroom — Topic 08
 */

(() => {
  'use strict';

  // ========================================================================
  // 1. DEFAULT DATA FIXTURES (Fail-Closed Standalone Support)
  // ========================================================================
  const DEFAULT_STATE = {
    portfolio: {
      active_decisions: 7,
      scenario_count: 16,
      average_confidence: 0.78,
      pending_approvals: 2,
      data_mode: 'connected'
    },
    decisions: [
      {
        id: 'dec-launch',
        title: 'Regional launch timing — Northstar West',
        original_question: 'What if we delay the regional launch by two weeks?',
        change_description: 'Move the Northstar West launch by 14 days',
        objective: 'Reduce first-wave support overload while protecting customer satisfaction and Q4 revenue timing.',
        time_horizon: 'First 60 days after launch',
        business_unit: 'Customer Operations',
        status: 'in_review',
        confidence: 0.74,
        owner: 'Alex Morgan',
        owner_initials: 'AM',
        metric_count: 4,
        updated: '31 Oct 2026',
        constraints: ['Q4 revenue plan', 'Customer satisfaction ≥ 82', 'Support capacity ≤ 6,000 tickets'],
        metrics: ['Revenue', 'Support volume', 'Staffing load', 'Customer satisfaction'],
        warning: 'Measurement due Friday · Demand stability assumption unverified',
        branches_count: 3
      },
      {
        id: 'dec-capacity',
        title: 'Weekend support coverage — service scale-up',
        original_question: 'Should we add weekend support coverage for the first four weeks after the service rollout?',
        change_description: 'Add 2 weekend support shifts for 4 weeks',
        objective: 'Keep urgent ticket backlog below service threshold during onboarding.',
        time_horizon: 'First 30 days after rollout',
        business_unit: 'Operations',
        status: 'active',
        confidence: 0.79,
        owner: 'Priya Shah',
        owner_initials: 'PS',
        metric_count: 3,
        updated: '30 Oct 2026',
        constraints: ['Overtime budget ≤ $42k', 'Response time ≤ 4 hours'],
        metrics: ['Backlog', 'Overtime spend', 'Response time'],
        warning: 'Overtime budget cap close to boundary',
        branches_count: 2
      },
      {
        id: 'dec-retention',
        title: 'Customer retention offer — renewal cohort',
        original_question: 'What if we introduce a targeted retention offer to customers with renewal risk?',
        change_description: 'Offer a limited 60-day service credit to eligible renewal accounts',
        objective: 'Improve renewals without eroding contribution margin.',
        time_horizon: 'Next 2 renewal cycles',
        business_unit: 'Customer Experience',
        status: 'ready',
        confidence: 0.68,
        owner: 'Taylor Chen',
        owner_initials: 'TC',
        metric_count: 3,
        updated: '29 Oct 2026',
        constraints: ['Contribution margin ≥ 68%', 'Offer available to eligible accounts only'],
        metrics: ['Renewal rate', 'Offer cost', 'Contribution margin'],
        warning: 'Cohort eligibility variance ±6%',
        branches_count: 2
      },
      {
        id: 'dec-logistics',
        title: 'Distribution routing — Northeast corridor',
        original_question: 'What if we redirect 20% of volume to the Northeast cross-dock for six weeks?',
        change_description: 'Redirect 20% of Northeast volume to alternate cross-dock',
        objective: 'Reduce late deliveries during seasonal carrier capacity constraints.',
        time_horizon: 'Six-week peak window',
        business_unit: 'Logistics',
        status: 'active',
        confidence: 0.81,
        owner: 'Jordan Lee',
        owner_initials: 'JL',
        metric_count: 4,
        updated: '28 Oct 2026',
        constraints: ['No increase to damage rate', 'Carrier terms remain valid'],
        metrics: ['On-time delivery', 'Cost per shipment', 'Damage rate', 'Inventory days'],
        warning: 'Carrier slot availability expiring in 5 days',
        branches_count: 3
      },
      {
        id: 'dec-pricing',
        title: 'Pricing test — annual plan packaging',
        original_question: 'Should annual plan pricing be adjusted for the next acquisition cycle?',
        change_description: 'Test a revised annual plan price for new customers',
        objective: 'Improve gross margin while keeping conversion stable.',
        time_horizon: 'One acquisition cycle',
        business_unit: 'Growth',
        status: 'draft',
        confidence: null,
        owner: 'Morgan Ellis',
        owner_initials: 'ME',
        metric_count: 3,
        updated: '27 Oct 2026',
        constraints: ['Conversion decline under 3 points'],
        metrics: ['Conversion', 'Gross margin', 'Refund rate'],
        warning: 'Draft stage — waiting for demand elasticity model',
        branches_count: 1
      }
    ],
    scenarios: [
      {
        id: 'sc-base',
        decision_id: 'dec-launch',
        name: 'On-time launch',
        scenario_type: 'Baseline',
        description: 'Current launch date · baseline operating plan',
        confidence: 0.76,
        confidenceRange: '[73% – 78%]',
        metrics: {
          support: '6.1–6.5k tickets',
          revenue: '$4.8–5.2M',
          staffing: '2.8–3.1k hours',
          upside: 'Revenue recognized within current quarterly reporting window.',
          downside: 'High risk of support agent burnout and first-week CSAT decline to ~74.'
        }
      },
      {
        id: 'sc-14d',
        decision_id: 'dec-launch',
        name: '14-day delay',
        scenario_type: 'Recommended',
        recommended: true,
        description: 'Two-week shift · complete regional training',
        confidence: 0.74,
        confidenceRange: '[71% – 77%]',
        metrics: {
          support: '5.35–5.75k tickets (−12%)',
          revenue: '$4.6–5.0M (−$0.2M shift)',
          staffing: '2.55–2.85k hours (−8%)',
          upside: 'First-wave ticket peak smoothed under 6,000 threshold; training complete.',
          downside: 'Timing shift of $0.2M recognized in early Q1 instead of Q4.'
        }
      },
      {
        id: 'sc-7d',
        decision_id: 'dec-launch',
        name: '7-day delay',
        scenario_type: 'Counterfactual',
        description: 'One-week shift · current staffing',
        confidence: 0.71,
        confidenceRange: '[67% – 74%]',
        metrics: {
          support: '5.8–6.2k tickets (−5%)',
          revenue: '$4.7–5.1M (−$0.1M shift)',
          staffing: '2.7–3.0k hours (−3%)',
          upside: 'Minor reduction in ticket pressure with smaller calendar disruption.',
          downside: 'Insufficient buffer for Tier 2 agent certification completion.'
        }
      },
      {
        id: 'sc-staff',
        decision_id: 'dec-launch',
        name: 'On-time + added shifts',
        scenario_type: 'Counterfactual',
        risk_heavy: true,
        description: 'Keep date · add 2 launch-week support shifts',
        confidence: 0.69,
        confidenceRange: '[65% – 72%]',
        metrics: {
          support: '5.7–6.1k tickets (−6%)',
          revenue: '$4.8–5.2M (On plan)',
          staffing: '3.0–3.4k hours (+8%)',
          upside: 'Maintains commercial release timetable without date slippage.',
          downside: 'Overtime budget violated by $18k; high agent fatigue risk.'
        }
      }
    ],
    assumptions: [
      {
        id: 'asm-1',
        title: 'Regional ticket volume per active customer',
        status: 'validated',
        statusLabel: 'Validated in data',
        source: 'Historical Q3 Regional Data',
        impact: 'Affects support volume scale. Adjusting ±10% shifts support curve by ~450 tickets.'
      },
      {
        id: 'asm-2',
        title: 'Tier 2 agent certification curve',
        status: 'user_provided',
        statusLabel: 'User Provided',
        source: 'Customer Operations Lead',
        impact: 'Determines resolution speed. 14 days guarantees 100% agent onboarding.'
      },
      {
        id: 'asm-3',
        title: 'Customer conversion delay elasticity',
        status: 'inferred',
        statusLabel: 'Inferred',
        source: 'Q2 Cohort Elasticity Model',
        impact: 'Affects revenue timing loss. Estimated drop-off is < 1.5% over 14 days.'
      },
      {
        id: 'asm-4',
        title: 'Competitor launch window overlap',
        status: 'expired',
        statusLabel: 'Expired',
        source: 'Market Intelligence (Oct 22)',
        impact: 'Assumption expired 28 Oct. Competitor did not announce regional expansion.'
      }
    ],
    dataSources: [
      { id: 'src-sales', name: 'Sales & Pipeline History', freshness: 'Updated 2 hrs ago', quality: '98% clean', excluded: false },
      { id: 'src-staff', name: 'Staffing & Shift Roster', freshness: 'Updated 45 min ago', quality: '100% verified', excluded: false },
      { id: 'src-launch', name: 'Product Launch Calendar', freshness: 'Updated today · 09:00', quality: '95% synced', excluded: false },
      { id: 'src-demand', name: 'Customer Demand Elasticity', freshness: 'Updated 2 days ago', quality: '88% modeled', excluded: false },
      { id: 'src-logistics', name: 'Logistics & Cross-dock Status', freshness: 'Updated 4 hrs ago', quality: '96% reliable', excluded: false },
      { id: 'src-quality', name: 'Service Quality & CSAT Baseline', freshness: 'Updated 1 hr ago', quality: '99% clean', excluded: false }
    ],
    impactNodes: [
      { id: 'node-finance', label: 'Finance & Revenue', sub: '−$0.2M timing shift', color: 'amber', status: 'Risk / Shift', x: 400, y: 70, r: 35, critical: true, details: { changed: 'Revenue timing shifts into early Q1 reporting period; full-year revenue remains neutral.', root: '14 calendar day delay pushes initial billing cycles across accounting month boundary.', evidence: 'Historical subscription recognition schedules from Western region 2025.', measurement: 'Audit weekly booking run-rate during first 30 days post-launch.' } },
      { id: 'node-support', label: 'Customer Support', sub: '−12% ticket surge', color: 'lime', status: 'Favorable', x: 175, y: 135, r: 38, critical: true, details: { changed: 'Support ticket surge during first 14 days drops by 12% mid-point (5.35k–5.75k tickets), staying below 6,000 threshold.', root: '14-day delay removes initial onboarding wave from peak holiday week.', evidence: 'Q3 regional onboarding showed 22% higher resolution efficiency when agents finished training.', measurement: 'Monitor daily ticket inflow starting Nov 18; verify escalation stays under 8.5%.' } },
      { id: 'node-people', label: 'People Operations', sub: '100% staff readiness', color: 'lime', status: 'Favorable', x: 625, y: 135, r: 36, critical: false, details: { changed: 'Training completion rate reaches 100% without incurring mandatory overtime.', root: 'Added two-week runway gives managers capacity for shadow sessions.', evidence: 'People Ops LMS records confirm 12 remaining modules require 8 business days.', measurement: 'Verify all 24 regional reps complete final exam by Nov 08.' } },
      { id: 'node-marketing', label: 'Marketing Campaigns', sub: 'Flight shift required', color: 'amber', status: 'Risk', x: 195, y: 295, r: 34, critical: true, details: { changed: 'Paid media placement reservations must be moved back by 14 days.', root: 'Commercial launch date alignment.', evidence: 'Ad agency contract allows one date shift with 5 days advance notice at no penalty.', measurement: 'Confirm partner agency re-booking confirmation by Nov 02.' } },
      { id: 'node-customers', label: 'Target Customers', sub: 'CSAT protection', color: 'violet', status: 'Uncertain', x: 400, y: 350, r: 35, critical: true, details: { changed: 'Initial customer sentiment protected by avoiding first-wave onboarding bugs.', root: 'Smoother service onboarding and shorter support wait times.', evidence: 'Regional survey showed 84% of prospects prefer a bug-free launch over early access.', measurement: 'Track Day 7 CSAT survey results; benchmark against 82 point target.' } },
      { id: 'node-logistics', label: 'Warehouse Logistics', sub: 'Low inventory impact', color: 'cyan', status: 'Low Impact', x: 605, y: 295, r: 32, critical: false, details: { changed: 'Physical welcome kits stored in regional fulfillment hub an additional 14 days.', root: 'Holding time expansion.', evidence: 'Cross-dock storage fee is negligible ($350/week).', measurement: 'Check staging warehouse temperature and packaging integrity on Nov 10.' } }
    ],
    impactEdges: [
      { from: 'node-finance', to: 'node-support' },
      { from: 'node-support', to: 'node-customers' },
      { from: 'node-finance', to: 'node-marketing' },
      { from: 'node-people', to: 'node-support' },
      { from: 'node-marketing', to: 'node-customers' },
      { from: 'node-people', to: 'node-logistics' }
    ]
  };

  // State instance
  let appState = {
    currentRoute: 'home',
    activeDecisionId: 'dec-launch',
    selectedScenarioId: 'sc-14d',
    selectedMetric: 'support',
    selectedNodeId: 'node-support',
    homeFilter: 'all',
    queueFilter: 'all',
    impactFilter: 'all',
    showCriticalOnly: false,
    delaySliderVal: 14,
    excludedSources: [],
    ...DEFAULT_STATE
  };

  // ========================================================================
  // 2. BACKEND API CLIENT WITH FAIL-SAFE FALLBACK
  // ========================================================================
  const ApiClient = {
    async fetchWithFallback(url, fallbackData) {
      // If opened directly via file://, bypass network request to prevent CORS error
      if (window.location.protocol === 'file:') {
        return fallbackData;
      }
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.info(`API notice for ${url}: running in local illustrative demo mode.`);
        return fallbackData;
      }
    },

    async postWithFallback(url, body, fallbackResponse) {
      if (window.location.protocol === 'file:') {
        return fallbackResponse;
      }
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        console.warn(`POST API fallback for ${url}:`, err.message);
        return fallbackResponse;
      }
    },

    async loadAllInitialData() {
      if (window.location.protocol !== 'file:') {
        showLoadingStage('Checking data freshness...');
        const portfolio = await this.fetchWithFallback('/api/portfolio', DEFAULT_STATE.portfolio);
        showLoadingStage('Preparing baseline...');
        const decisions = await this.fetchWithFallback('/api/decisions', DEFAULT_STATE.decisions);
        const scenarios = await this.fetchWithFallback('/api/scenarios', DEFAULT_STATE.scenarios);
        hideLoadingStage();

        if (portfolio && typeof portfolio === 'object') appState.portfolio = portfolio;
        if (Array.isArray(decisions) && decisions.length) appState.decisions = decisions;
        if (Array.isArray(scenarios) && scenarios.length) appState.scenarios = scenarios;
      }
    }
  };

  // ========================================================================
  // 3. UI HELPERS: NOTIFICATIONS, LOADING STAGES, MODALS
  // ========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = 'ℹ';
    let borderColor = 'var(--border-subtle)';
    if (type === 'success') { icon = '✓'; borderColor = 'var(--spectral-lime)'; }
    if (type === 'warning') { icon = '⚠'; borderColor = 'var(--ember-amber)'; }
    if (type === 'violet') { icon = '✦'; borderColor = 'var(--electric-violet)'; }

    toast.style.borderColor = borderColor;
    toast.innerHTML = `<span style="font-weight:700;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 320);
    }, 3400);
  }

  function showLoadingStage(stageName) {
    const el = document.getElementById('loadingIndicator');
    const textEl = document.getElementById('loadingStageText');
    if (el && textEl) {
      textEl.textContent = stageName;
      el.classList.add('active');
    }
  }

  function hideLoadingStage() {
    const el = document.getElementById('loadingIndicator');
    if (el) el.classList.remove('active');
  }

  // ========================================================================
  // 4. ROUTER & SECTION SWITCHING
  // ========================================================================
  function handleRoute(routeHash) {
    const cleanRoute = (routeHash || window.location.hash || '#home').replace('#', '').toLowerCase();
    const validRoutes = ['home', 'studio', 'lab', 'impact', 'briefing'];
    const activeRoute = validRoutes.includes(cleanRoute) ? cleanRoute : 'home';

    appState.currentRoute = activeRoute;

    // 1. Update Sections
    document.querySelectorAll('.route-section').forEach(section => {
      section.classList.remove('active-route');
    });
    const targetSection = document.getElementById(`section-${activeRoute}`);
    if (targetSection) targetSection.classList.add('active-route');

    // 2. Update Top Navbar Links
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.route === activeRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 3. Update Journey Stepper Bar
    const routeOrder = ['home', 'studio', 'lab', 'impact', 'briefing'];
    const currentIndex = routeOrder.indexOf(activeRoute);
    document.querySelectorAll('.journey-step-item').forEach(step => {
      const stepName = step.dataset.step;
      const stepIndex = routeOrder.indexOf(stepName);
      step.classList.remove('active', 'completed');
      if (stepIndex === currentIndex) {
        step.classList.add('active');
      } else if (stepIndex < currentIndex) {
        step.classList.add('completed');
      }
    });

    // 4. Update Mobile Bottom Nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.dataset.route === activeRoute) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Scroll to top of main area
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render route-specific dynamic contents
    renderActiveSection(activeRoute);
  }

  function renderActiveSection(route) {
    if (route === 'home') renderHomeSection();
    if (route === 'studio') renderStudioSection();
    if (route === 'lab') renderLabSection();
    if (route === 'impact') renderImpactSection();
    if (route === 'briefing') renderBriefingSection();
  }

  // ========================================================================
  // 5. SECTION 01: HOME CONTROLLER
  // ========================================================================
  function renderHomeSection() {
    // 1. Update Portfolio Metrics
    const pf = appState.portfolio || {};
    const actEl = document.getElementById('metricActiveCount');
    const scEl = document.getElementById('metricScenarioCount');
    const confEl = document.getElementById('metricAvgConfidence');
    const dueEl = document.getElementById('metricDueCount');
    
    if (actEl) actEl.textContent = pf.active_decisions || 7;
    if (scEl) scEl.textContent = pf.scenario_count || 16;
    if (confEl) confEl.textContent = `${Math.round((pf.average_confidence || 0.78) * 100)}%`;
    if (dueEl) dueEl.textContent = '3';

    // 2. Filter Decision Queue
    const container = document.getElementById('decisionCardsList');
    if (!container) return;

    let filtered = appState.decisions;
    if (appState.queueFilter !== 'all') {
      filtered = filtered.filter(d => d.status === appState.queueFilter);
    }

    if (appState.homeFilter === 'scenarios') {
      filtered = filtered.filter(d => (d.branches_count || 0) > 1);
    } else if (appState.homeFilter === 'confidence') {
      filtered = filtered.filter(d => (d.confidence || 0) < 0.75);
    } else if (appState.homeFilter === 'measurements') {
      filtered = filtered.filter(d => d.warning && d.warning.includes('Measurement'));
    }

    const countLabel = document.getElementById('queueCountLabel');
    if (countLabel) countLabel.textContent = `(${filtered.length} Decisions)`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:48px 24px;">
          <div style="font-size:16px; color:var(--bone-white); margin-bottom:8px;">The board is quiet.</div>
          <div style="font-size:13px; color:var(--smoke); margin-bottom:20px;">Start with a question about an operational or strategic change you are considering.</div>
          <a href="#studio" class="btn btn-primary-violet">+ Start a Decision</a>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach((d, index) => {
      const isLead = (index === 0 && appState.homeFilter === 'all' && appState.queueFilter === 'all');
      const cardClass = isLead ? 'decision-card-lead' : 'decision-card-standard';
      const confPercent = d.confidence ? `${Math.round(d.confidence * 100)}%` : 'Unmodeled';
      const statusClass = d.status === 'in_review' ? 'status-pill-violet' : (d.status === 'active' ? 'status-pill-lime' : 'status-pill-smoke');
      const statusLabel = (d.status || 'draft').replace('_', ' ');

      html += `
        <div class="${cardClass}" data-decision-id="${d.id}">
          <div class="decision-card-row">
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span class="status-pill ${statusClass}">${statusLabel}</span>
                <span style="font-size:11px; color:var(--smoke);">${d.business_unit || 'Strategic Ops'}</span>
              </div>
              <h3 class="decision-title-text" onclick="window.appSelectDecision('${d.id}', true)">${d.title}</h3>
              <div class="decision-subtext">“${d.original_question}”</div>
              <div class="decision-meta-tags">
                <span class="decision-meta-item">
                  <span style="width:18px;height:18px;border-radius:50%;background:var(--deep-teal);display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">${d.owner_initials || 'AM'}</span>
                  <span>${d.owner || 'Alex Morgan'}</span>
                </span>
                <span>·</span>
                <span class="decision-meta-item">
                  <span style="color:var(--smoke);">Confidence:</span>
                  <strong style="color:var(--bone-white);">${confPercent}</strong>
                </span>
                <span>·</span>
                <span class="decision-meta-item">
                  <span style="color:var(--smoke);">Branches:</span>
                  <strong style="color:var(--bone-white);">${d.branches_count || 3}</strong>
                </span>
                <span>·</span>
                <span class="decision-meta-item">
                  <span style="color:var(--smoke);">Target Date:</span>
                  <span>${d.updated || '31 Oct 2026'}</span>
                </span>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
              <button class="btn btn-primary-bone btn-sm" onclick="window.appSelectDecision('${d.id}', true)">Open Studio</button>
              <button class="btn btn-ghost btn-sm" onclick="window.appSelectDecision('${d.id}', false); window.location.hash='#lab';">Enter Lab →</button>
            </div>
          </div>

          ${d.warning ? `
            <div class="decision-warning-banner">
              <span>⚠ ${d.warning}</span>
              <span style="font-size:10.5px; opacity:0.85;">Last synced: Oct 31</span>
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ========================================================================
  // 6. SECTION 02: DECISION STUDIO CONTROLLER
  // ========================================================================
  function renderStudioSection() {
    renderDataReadinessList();
    validateStudioCards();
  }

function renderDataReadinessList() {
    const container = document.getElementById('sourcesList');
    if (!container) return;

    let html = '';
    appState.dataSources.forEach(src => {
      const isExcluded = appState.excludedSources.includes(src.id);
      html += `
        <div class="source-item" onclick="window.appToggleSource('${src.id}')" style="cursor:pointer;">
          <div class="source-info">
            <span class="source-name" style="${isExcluded ? 'text-decoration:line-through; opacity:0.4;' : ''}">
              ${src.name}
            </span>
            <span class="source-freshness">${src.freshness} · <span style="color:var(--smoke);">${src.quality}</span></span>
          </div>
          <div>
            <span class="soul-flame-badge ${isExcluded ? 'excluded' : 'active'}">
              ${isExcluded ? '✕ Excluded' : 'Active'}
            </span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Uncertainty Warning
    const warnBox = document.getElementById('dataUncertaintyWarning');
    const warnText = document.getElementById('dataUncertaintyText');
    if (warnBox && warnText) {
      if (appState.excludedSources.length > 0) {
        warnBox.style.display = 'block';
        warnText.textContent = `Excluding ${appState.excludedSources.length} source(s) widens the variance bands on downstream revenue and staffing projections by ±${appState.excludedSources.length * 12}%.`;
      } else {
        warnBox.style.display = 'none';
      }
    }
  }

  function validateStudioCards() {
    const chg = document.getElementById('inputChange')?.value.trim();
    const obj = document.getElementById('inputObjective')?.value.trim();
    const cst = document.getElementById('inputConstraints')?.value.trim();
    const hrz = document.getElementById('inputHorizon')?.value.trim();

    const missingMsg = document.getElementById('studioValidationMsg');
    const continueBtn = document.getElementById('btnContinueToLab');

    const isComplete = Boolean(chg && obj && cst && hrz);

    if (!isComplete) {
      if (missingMsg) {
        missingMsg.style.display = 'inline-flex';
        missingMsg.textContent = '⚠ Complete all 4 definition cards to generate scenario branches';
      }
      if (continueBtn) {
        continueBtn.style.opacity = '0.65';
        continueBtn.style.pointerEvents = 'auto';
        continueBtn.onclick = (e) => {
          e.preventDefault();
          showToast('Please fill out all 4 decision definition cards before proceeding to Scenario Lab.', 'warning');
        };
      }
    } else {
      if (missingMsg) missingMsg.style.display = 'none';
      if (continueBtn) {
        continueBtn.style.opacity = '1';
        continueBtn.style.pointerEvents = 'auto';
        continueBtn.onclick = null;
      }
    }
  }

  // ========================================================================
  // 7. SECTION 03: SCENARIO LAB CONTROLLER
  // ========================================================================
  function renderLabSection() {
    renderBranchCards();
    renderComparisonChart();
    renderAssumptionsList();
  }

function renderBranchCards() {
    const container = document.getElementById('branchesGrid');
    if (!container) return;

    let html = '';
    appState.scenarios.forEach(sc => {
      const isSelected = sc.id === appState.selectedScenarioId;
      const isBaseline = sc.scenario_type === 'Baseline';
      let cardClass = 'branch-card';
      if (isSelected) cardClass += ' branch-active';
      if (isBaseline) cardClass += ' branch-baseline';
      if (sc.risk_heavy) cardClass += ' card-risk-amber';

      // Parse delta highlights if available
      let supDelta = '';
      if (sc.metrics.support.includes('(')) {
        const parts = sc.metrics.support.split('(');
        supDelta = `<span class="metric-delta-favorable">(${parts[1]}</span>`;
      }
      let revDelta = '';
      if (sc.metrics.revenue.includes('(')) {
        const parts = sc.metrics.revenue.split('(');
        revDelta = `<span class="metric-delta-shift">(${parts[1]}</span>`;
      }
      let stfDelta = '';
      if (sc.metrics.staffing.includes('(')) {
        const parts = sc.metrics.staffing.split('(');
        stfDelta = `<span class="${sc.risk_heavy ? 'metric-delta-shift' : 'metric-delta-favorable'}">(${parts[1]}</span>`;
      }

      html += `
        <div class="${cardClass}" onclick="window.appSelectScenario('${sc.id}')">
          ${sc.recommended ? '<span class="branch-tag-recommended">RECOMMENDED</span>' : ''}
          <div class="branch-header-top">
            <div class="branch-name">${sc.name}</div>
          </div>
          <div class="branch-type">${sc.scenario_type} · ${sc.description}</div>

          <div class="branch-metrics-list">
            <div class="branch-metric-row">
              <span class="branch-metric-name">Support Volume:</span>
              <span class="branch-metric-val">
                ${sc.metrics.support.split('(')[0]} ${supDelta}
              </span>
            </div>
            <div class="branch-metric-row">
              <span class="branch-metric-name">Revenue:</span>
              <span class="branch-metric-val">
                ${sc.metrics.revenue.split('(')[0]} ${revDelta}
              </span>
            </div>
            <div class="branch-metric-row">
              <span class="branch-metric-name">Staffing Load:</span>
              <span class="branch-metric-val">
                ${sc.metrics.staffing.split('(')[0]} ${stfDelta}
              </span>
            </div>
          </div>

          <div class="branch-confidence-box">
            <span>Confidence Range:</span>
            <strong style="color:var(--bone-white);">${sc.confidenceRange || '[71% – 77%]'}</strong>
          </div>
          <button class="branch-cta-btn">
            ${isSelected ? '● Active Scenario' : '⚔ Compare'}
          </button>
        </div>
      `;
    });

    container.innerHTML = html;
  }

function renderComparisonChart() {
    const svg = document.getElementById('scenarioChartSvg');
    if (!svg) return;

    const metric = appState.selectedMetric;
    const days = appState.delaySliderVal || 14;
    const sim = (window.DataActions && window.DataActions.simulateSensitivity)
      ? window.DataActions.simulateSensitivity(days, appState.excludedSources)
      : {
          supportVolume: '5.35–5.75k',
          supportDelta: '12% reduction',
          revenueDelta: '−$0.2M timing shift',
          staffingDelta: '8% peak load',
          staffingLoad: '2.55–2.85k h',
          confidenceRange: '[71% – 77%]'
        };

    const width = 1000;
    const height = 300;
    const padX = 65;
    const padY = 35;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    let baselinePts = [];
    let scenarioPts = [];
    let upperBand = [];
    let lowerBand = [];
    let yLabels = [];
    let narrative = '';
    let metricUnit = '';

    if (metric === 'support') {
      baselinePts = [60, 180, 240, 220, 190, 150, 120, 100];
      scenarioPts = [60, 90, 120, 135, 140, 130, 110, 95];
      upperBand   = [70, 105, 138, 152, 158, 145, 125, 108];
      lowerBand   = [50, 75, 102, 118, 122, 115, 95, 82];
      yLabels = ['7,000', '6,000 (Cap)', '5,000', '4,000'];
      metricUnit = 'tickets';
      narrative = `The ${days}-day delay lowers the first-wave ticket peak by ${sim.supportDelta} (modeled: ${sim.supportVolume}), safely preventing capacity overflow while training completes.`;
    } else if (metric === 'revenue') {
      baselinePts = [40, 120, 190, 230, 240, 250, 260, 265];
      scenarioPts = [30, 45, 75, 135, 190, 225, 248, 260];
      upperBand   = [35, 55, 90, 150, 208, 242, 265, 275];
      lowerBand   = [25, 35, 60, 120, 172, 208, 230, 245];
      yLabels = ['$5.5M', '$4.5M', '$3.5M', '$2.5M'];
      metricUnit = '$';
      narrative = `Revenue recognition is postponed by ${sim.revenueDelta} into early next period; full year contribution variance recovers by Week 8 with improved retention.`;
    } else if (metric === 'staffing') {
      baselinePts = [80, 210, 240, 225, 180, 140, 110, 90];
      scenarioPts = [70, 110, 130, 145, 140, 130, 105, 85];
      upperBand   = [80, 125, 148, 162, 155, 142, 118, 98];
      lowerBand   = [60, 95, 112, 128, 125, 118, 92, 72];
      yLabels = ['3.5k h', '3.0k h', '2.5k h', '2.0k h'];
      metricUnit = 'hours';
      narrative = `Peak staffing hours drop by ${sim.staffingDelta} (modeled: ${sim.staffingLoad}), eliminating mandatory overtime costs and reducing agent turnover risk.`;
    } else {
      baselinePts = [70, 160, 200, 190, 160, 130, 100, 80];
      scenarioPts = [60, 85, 115, 130, 125, 115, 95, 80];
      upperBand   = [70, 100, 130, 145, 140, 128, 108, 92];
      lowerBand   = [50, 70, 100, 115, 110, 102, 82, 68];
      yLabels = ['High', 'Moderate', 'Baseline', 'Low'];
      metricUnit = 'index';
      narrative = `Second-order trade-offs stabilize within expected enterprise tolerances; modeled confidence stands at ${sim.confidenceRange}.`;
    }

    const narrativeEl = document.getElementById('chartNarrativeText');
    if (narrativeEl) narrativeEl.innerHTML = `<strong>Executive Narrative:</strong> ${narrative}`;

    const stepX = chartW / 7;
    const toY = (val) => padY + chartH - (val / 280) * chartH;

    // Smooth cubic bezier path generator
    const buildSmoothPath = (pts) => {
      const points = pts.map((v, i) => ({ x: padX + i * stepX, y: toY(v) }));
      let path = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx1 = prev.x + stepX * 0.45;
        const cpx2 = curr.x - stepX * 0.45;
        path += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
      }
      return path;
    };

    const scenarioPath = buildSmoothPath(scenarioPts);
    const baselinePath = buildSmoothPath(baselinePts);

    // Smooth uncertainty band path
    let bandPath = `M ${padX},${toY(upperBand[0])}`;
    for (let i = 1; i < 8; i++) {
      const px = padX + i * stepX;
      const prevPx = padX + (i - 1) * stepX;
      bandPath += ` C ${prevPx + stepX * 0.45},${toY(upperBand[i - 1])} ${px - stepX * 0.45},${toY(upperBand[i])} ${px},${toY(upperBand[i])}`;
    }
    for (let i = 7; i >= 1; i--) {
      const px = padX + i * stepX;
      const nextPx = padX + (i - 1) * stepX;
      bandPath += ` C ${px - stepX * 0.45},${toY(lowerBand[i])} ${nextPx + stepX * 0.45},${toY(lowerBand[i - 1])} ${nextPx},${toY(lowerBand[i - 1])}`;
    }
    bandPath += ' Z';

    const weekLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];

    // Critical Cap indicator for support volume
    const capY = padY + chartH * 0.33;

    let svgContent = `
      <defs>
        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(167, 107, 255, 0.24)" />
          <stop offset="60%" stop-color="rgba(167, 107, 255, 0.08)" />
          <stop offset="100%" stop-color="rgba(167, 107, 255, 0.01)" />
        </linearGradient>
        <linearGradient id="scenarioLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8a4dff" />
          <stop offset="50%" stop-color="#b688ff" />
          <stop offset="100%" stop-color="#8a4dff" />
        </linearGradient>
        <filter id="chartLineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="nodeOrbGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Occult Celestial Watermark Sigil -->
      <g opacity="0.035" transform="translate(${width/2}, ${height/2})">
        <circle r="90" fill="none" stroke="var(--electric-violet)" stroke-width="1.5" stroke-dasharray="6 4" />
        <circle r="60" fill="none" stroke="var(--electric-violet)" stroke-width="1" />
        <polygon points="0,-70 60,35 -60,35" fill="none" stroke="var(--electric-violet)" stroke-width="1" />
        <polygon points="0,70 60,-35 -60,-35" fill="none" stroke="var(--electric-violet)" stroke-width="1" />
      </g>

      <!-- Vertical grid markers -->
      ${weekLabels.map((_, idx) => `
        <line x1="${padX + idx * stepX}" y1="${padY}" x2="${padX + idx * stepX}" y2="${padY + chartH}" stroke="rgba(255,255,255,0.035)" />
      `).join('')}

      <!-- Horizontal grid lines -->
      <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="rgba(255,255,255,0.05)" />
      <line x1="${padX}" y1="${padY + chartH * 0.33}" x2="${width - padX}" y2="${padY + chartH * 0.33}" stroke="${metric === 'support' ? 'rgba(242, 140, 56, 0.35)' : 'rgba(255,255,255,0.05)'}" stroke-dasharray="${metric === 'support' ? '6 4' : 'none'}" />
      <line x1="${padX}" y1="${padY + chartH * 0.66}" x2="${width - padX}" y2="${padY + chartH * 0.66}" stroke="rgba(255,255,255,0.05)" />
      <line x1="${padX}" y1="${padY + chartH}" x2="${width - padX}" y2="${padY + chartH}" stroke="rgba(255,255,255,0.12)" />

      <!-- Y Axis Labels -->
      <text x="${padX - 10}" y="${padY + 4}" fill="var(--smoke)" font-size="10.5" text-anchor="end" opacity="0.75">${yLabels[0]}</text>
      <text x="${padX - 10}" y="${padY + chartH * 0.33 + 4}" fill="${metric === 'support' ? 'var(--ember-amber)' : 'var(--smoke)'}" font-size="10.5" font-weight="${metric === 'support' ? '700' : '400'}" text-anchor="end">${yLabels[1]}</text>
      <text x="${padX - 10}" y="${padY + chartH * 0.66 + 4}" fill="var(--smoke)" font-size="10.5" text-anchor="end" opacity="0.75">${yLabels[2]}</text>
      <text x="${padX - 10}" y="${padY + chartH + 4}" fill="var(--smoke)" font-size="10.5" text-anchor="end" opacity="0.75">${yLabels[3]}</text>

      <!-- Smooth 90% Confidence Interval Band -->
      <path d="${bandPath}" fill="url(#bandGrad)" />

      <!-- Baseline Line: Ghostly dashed bone-white -->
      <path d="${baselinePath}" fill="none" stroke="rgba(232, 231, 223, 0.45)" stroke-width="2" stroke-dasharray="7 5" />

      <!-- Active Scenario Line: Luminous electric violet stream -->
      <path d="${scenarioPath}" fill="none" stroke="url(#scenarioLineGrad)" stroke-width="3.5" filter="url(#chartLineGlow)" />

      <!-- Baseline Data Markers -->
      ${baselinePts.map((v, idx) => `
        <circle cx="${padX + idx * stepX}" cy="${toY(v)}" r="2.8"
          fill="rgba(232,231,223,0.35)" stroke="rgba(232,231,223,0.18)" stroke-width="1" />
      `).join('')}

      <!-- Scenario Data Markers with Pulse animation -->
      ${scenarioPts.map((v, idx) => `
        <g class="chart-data-point" transform="translate(${padX + idx * stepX}, ${toY(v)})"
           data-week="${idx + 1}" data-val="${v}">
          <circle r="4" fill="var(--electric-violet)" stroke="rgba(232,231,223,0.4)" stroke-width="1.5" filter="url(#nodeOrbGlow)">
            <animate attributeName="r" values="3.8;5.2;3.8" dur="2.8s" begin="${idx * 0.35}s" repeatCount="indefinite" />
          </circle>
          <circle r="8" fill="rgba(167,107,255,0.12)">
            <animate attributeName="r" values="6;12;6" dur="2.8s" begin="${idx * 0.35}s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2.8s" begin="${idx * 0.35}s" repeatCount="indefinite" />
          </circle>
        </g>
      `).join('')}

      <!-- X Axis Week Markers -->
      ${weekLabels.map((lbl, idx) => `
        <text x="${padX + idx * stepX}" y="${padY + chartH + 22}" fill="var(--smoke)" font-size="10.5" font-weight="600" text-anchor="middle" opacity="0.8">${lbl}</text>
      `).join('')}

      <!-- Chart Legend in Corner -->
      <g transform="translate(${width - 290}, 14)">
        <line x1="0" y1="0" x2="22" y2="0" stroke="rgba(232,231,223,0.5)" stroke-width="2" stroke-dasharray="5 3" />
        <text x="28" y="3" fill="var(--smoke)" font-size="10.5">Baseline Plan</text>
        <circle cx="124" cy="0" r="4" fill="var(--electric-violet)" filter="url(#nodeOrbGlow)" />
        <line x1="132" y1="0" x2="154" y2="0" stroke="var(--electric-violet)" stroke-width="3" />
        <text x="160" y="3" fill="var(--bone-white)" font-weight="600" font-size="10.5">${days}-Day Delay (±90% CI)</text>
      </g>
    `;

    svg.innerHTML = svgContent;
  }

function renderAssumptionsList() {
    const container = document.getElementById('assumptionsList');
    if (!container) return;

    let html = '';
    appState.assumptions.forEach(asm => {
      let badgeClass = 'status-pill-smoke';
      let itemClass = 'asm-user-provided';
      if (asm.status === 'validated') { badgeClass = 'status-pill-lime'; itemClass = 'asm-validated'; }
      if (asm.status === 'inferred') { badgeClass = 'status-pill-violet'; itemClass = 'asm-inferred'; }
      if (asm.status === 'expired') { badgeClass = 'status-pill-amber'; itemClass = 'asm-expired'; }

      html += `
        <div class="assumption-item ${itemClass}" onclick="window.appInspectAssumption('${asm.id}')">
          <div class="assumption-item-header">
            <span class="assumption-title">${asm.title}</span>
            <span class="status-pill ${badgeClass}">${asm.statusLabel}</span>
          </div>
          <div class="assumption-impact-note">${asm.impact}</div>
          <div class="assumption-source-line">Source: ${asm.source}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ========================================================================
  // 8. SECTION 04: IMPACT MAP CONTROLLER
  // ========================================================================
  function renderImpactSection() {
    renderNetworkSvg();
    renderRankedTable();
    updateDetailPanel(appState.selectedNodeId);
  }

  function renderNetworkSvg() {
    const svg = document.getElementById('networkSvg');
    if (!svg) return;

    const nodes = appState.impactNodes;
    const edges = appState.impactEdges;
    const filter = appState.impactFilter;
    const criticalOnly = appState.showCriticalOnly;

    const activeNodes = nodes.filter(n => {
      if (criticalOnly && !n.critical) return false;
      if (filter === 'positive' && n.color !== 'lime') return false;
      if (filter === 'negative' && n.color !== 'amber') return false;
      if (filter === 'uncertain' && n.color !== 'violet') return false;
      return true;
    });

    const activeIds = new Set(activeNodes.map(n => n.id));
    const cx = 400, cy = 210; // Center coordinate of the web & Third Eye

    let html = `
      <defs>
        <!-- Gradients for Cursed Void Sphere Nodes -->
        <radialGradient id="voidSphereGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#14262f" />
          <stop offset="60%" stop-color="#0a141a" />
          <stop offset="100%" stop-color="#04080a" />
        </radialGradient>

        <radialGradient id="haloLimeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(72, 229, 138, 0.7)" />
          <stop offset="50%" stop-color="rgba(72, 229, 138, 0.25)" />
          <stop offset="100%" stop-color="rgba(72, 229, 138, 0)" />
        </radialGradient>

        <radialGradient id="haloAmberGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(242, 140, 56, 0.75)" />
          <stop offset="50%" stop-color="rgba(242, 140, 56, 0.25)" />
          <stop offset="100%" stop-color="rgba(242, 140, 56, 0)" />
        </radialGradient>

        <radialGradient id="haloVioletGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(167, 107, 255, 0.75)" />
          <stop offset="50%" stop-color="rgba(167, 107, 255, 0.25)" />
          <stop offset="100%" stop-color="rgba(167, 107, 255, 0)" />
        </radialGradient>

        <radialGradient id="haloCyanGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0, 229, 255, 0.75)" />
          <stop offset="50%" stop-color="rgba(38, 180, 180, 0.25)" />
          <stop offset="100%" stop-color="rgba(38, 180, 180, 0)" />
        </radialGradient>

        <radialGradient id="eyeIrisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="45%" stop-color="#a76bff" />
          <stop offset="85%" stop-color="#1e1035" />
          <stop offset="100%" stop-color="#061016" />
        </radialGradient>

        <!-- Plasma Arc Gradients -->
        <linearGradient id="plasmaGradCyanLime" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#48e58a" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#a76bff" stop-opacity="0.8" />
        </linearGradient>

        <linearGradient id="plasmaGradAmberViolet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f28c38" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#ff4444" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#a76bff" stop-opacity="0.8" />
        </linearGradient>

        <!-- Filters -->
        <filter id="spectralGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- ── LAYER 1: OCCULT RADAR WEB & CAUSALITY SPIDERWEB RINGS ── -->
      <g class="occult-web-backdrop" opacity="0.85">
        <!-- Concentric circles -->
        <circle cx="${cx}" cy="${cy}" r="50" class="occult-radar-ring" />
        <circle cx="${cx}" cy="${cy}" r="110" class="occult-radar-ring dashed" />
        <circle cx="${cx}" cy="${cy}" r="170" class="occult-radar-ring" />
        <circle cx="${cx}" cy="${cy}" r="230" class="occult-radar-ring dashed" />
        <circle cx="${cx}" cy="${cy}" r="290" class="occult-radar-ring" opacity="0.4" />

        <!-- Radial Spokes (8 axes) -->
        <line x1="${cx - 290}" y1="${cy}" x2="${cx + 290}" y2="${cy}" class="occult-radar-spoke" />
        <line x1="${cx}" y1="${cy - 200}" x2="${cx}" y2="${cy + 200}" class="occult-radar-spoke" />
        <line x1="${cx - 210}" y1="${cy - 145}" x2="${cx + 210}" y2="${cy + 145}" class="occult-radar-spoke" />
        <line x1="${cx - 210}" y1="${cy + 145}" x2="${cx + 210}" y2="${cy - 145}" class="occult-radar-spoke" />

        <!-- Spiderweb Cross Arcs (Connecting the spokes like an ancient web) -->
        <path d="M 400,100 Q 475,130 510,210 Q 475,290 400,320 Q 325,290 290,210 Q 325,130 400,100 Z" class="occult-spider-arc" />
        <path d="M 400,40 Q 525,85 570,210 Q 525,335 400,380 Q 275,335 230,210 Q 275,85 400,40 Z" class="occult-spider-arc" />
      </g>

      <!-- ── LAYER 2: CENTRAL SPECTRAL ALL-SEEING EYE ── -->
      <g class="central-eye-group" onclick="showToast('Spectral Eye: Causality focal point synchronized with active scenario', 'violet')">
        <!-- Expanding shockwave ripples -->
        <circle cx="${cx}" cy="${cy}" r="28" class="central-eye-shockwave" />
        <circle cx="${cx}" cy="${cy}" r="28" class="central-eye-shockwave delay-1" />

        <!-- Eye Socket Shape -->
        <path d="M ${cx - 36} ${cy} Q ${cx} ${cy - 24} ${cx + 36} ${cy} Q ${cx} ${cy + 24} ${cx - 36} ${cy} Z" class="central-eye-body" />

        <!-- Glowing Iris -->
        <circle cx="${cx}" cy="${cy}" r="13" fill="url(#eyeIrisGrad)" class="central-eye-iris" />

        <!-- Vertical Slit Pupil -->
        <ellipse cx="${cx}" cy="${cy}" rx="3.5" ry="9" fill="#000000" />
        <circle cx="${cx - 1.5}" cy="${cy - 2.5}" r="2" fill="#ffffff" opacity="0.9" />
      </g>

      <!-- ── LAYER 3: DEPENDENCY PLASMA STREAMS (EDGES) ── -->
    `;

    // Render edges
    edges.forEach((e, idx) => {
      if (activeIds.has(e.from) && activeIds.has(e.to)) {
        const fromNode = nodes.find(n => n.id === e.from);
        const toNode = nodes.find(n => n.id === e.to);
        if (fromNode && toNode) {
          // Subtle curve offset
          const midX = (fromNode.x + toNode.x) / 2 + (fromNode.y > toNode.y ? 15 : -15);
          const midY = (fromNode.y + toNode.y) / 2 - 15;
          const isSelectedEdge = appState.selectedNodeId === fromNode.id || appState.selectedNodeId === toNode.id;
          const strokeGrad = fromNode.color === 'amber' || toNode.color === 'amber' ? 'url(#plasmaGradAmberViolet)' : 'url(#plasmaGradCyanLime)';
          const baseOpacity = isSelectedEdge ? 0.8 : 0.35;
          const flowWidth = isSelectedEdge ? 2.5 : 1.8;

          html += `
            <g class="edge-group">
              <!-- Glow tube -->
              <path d="M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}"
                    fill="none" stroke="${strokeGrad}" stroke-width="${flowWidth + 2}" opacity="${baseOpacity}" class="plasma-arc-base" />

              <!-- Flowing energy pulse filament -->
              <path id="edgePath_${idx}" d="M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}"
                    fill="none" stroke="${strokeGrad}" stroke-width="${flowWidth}" stroke-dasharray="6, 12" class="plasma-arc-flow" />

              <!-- Traveling Soul Mote (Particle animation) -->
              <circle r="${isSelectedEdge ? 3.5 : 2.5}" fill="#ffffff" opacity="0.9" class="soul-mote">
                <animateMotion dur="${3.5 + (idx % 3)}s" repeatCount="indefinite" path="M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}" />
              </circle>
            </g>
          `;
        }
      }
    });

    // ── LAYER 4: BIOLUMINESCENT CURSED VOID ORBS (NODES) ──
    activeNodes.forEach(node => {
      const isSelected = node.id === appState.selectedNodeId;
      let haloGrad = 'url(#haloLimeGrad)';
      let jewelColor = '#48e58a';
      let ringStroke = 'rgba(72, 229, 138, 0.6)';
      let subColor = 'var(--spectral-lime)';

      if (node.color === 'amber') {
        haloGrad = 'url(#haloAmberGrad)';
        jewelColor = '#f28c38';
        ringStroke = 'rgba(242, 140, 56, 0.6)';
        subColor = 'var(--ember-amber)';
      } else if (node.color === 'violet') {
        haloGrad = 'url(#haloVioletGrad)';
        jewelColor = '#a76bff';
        ringStroke = 'rgba(167, 107, 255, 0.6)';
        subColor = 'var(--electric-violet)';
      } else if (node.color === 'cyan') {
        haloGrad = 'url(#haloCyanGrad)';
        jewelColor = '#00e5ff';
        ringStroke = 'rgba(0, 229, 255, 0.6)';
        subColor = '#00e5ff';
      }

      // Dynamic text placement
      const labelY = node.y > cy ? node.y + node.r + 20 : node.y - node.r - 18;
      const sublabelY = node.y > cy ? node.y + node.r + 34 : node.y - node.r - 6;

      html += `
        <g class="spooky-node-orb ${isSelected ? 'selected' : ''}" style="color:${jewelColor};" onclick="window.appSelectNode('${node.id}')">
          <!-- 1. Outer Breathing Aura Halo -->
          <circle cx="${node.x}" cy="${node.y}" r="${node.r + 18}" fill="${haloGrad}" class="spooky-node-halo" />

          <!-- 2. Rotating Runic Energy Ring -->
          <circle cx="${node.x}" cy="${node.y}" r="${node.r + 6}" fill="none" stroke="${ringStroke}" stroke-width="1.5" stroke-dasharray="6, 5" class="spooky-node-ring" />

          <!-- 3. Obsidian Void Body -->
          <circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="url(#voidSphereGrad)" stroke="${jewelColor}" stroke-width="${isSelected ? 3.5 : 2}" />

          <!-- 4. Inner Bioluminescent Jewel Core -->
          <circle cx="${node.x}" cy="${node.y}" r="${isSelected ? 12 : 9}" fill="${jewelColor}" filter="url(#spectralGlow)" />
          <circle cx="${node.x - 3}" cy="${node.y - 3}" r="${isSelected ? 4 : 3}" fill="#ffffff" opacity="0.85" />

          <!-- 5. Bone-White Horror Label -->
          <text x="${node.x}" y="${labelY}" class="spooky-node-label">${node.label}</text>

          <!-- 6. Status-Colored Sublabel -->
          <text x="${node.x}" y="${sublabelY}" class="spooky-node-sublabel" fill="${subColor}">${node.sub}</text>
        </g>
      `;
    });

    svg.innerHTML = html;
  }
function renderRankedTable() {
    const tbody = document.getElementById('rankedTableBody');
    if (!tbody) return;

    let html = '';
    appState.impactNodes.forEach(n => {
      const isSelected = n.id === appState.selectedNodeId;
      let dirIcon = '↔';
      let dirColor = 'var(--smoke)';
      if (n.color === 'lime') { dirIcon = '↑ Favorable'; dirColor = 'var(--spectral-lime)'; }
      if (n.color === 'amber') { dirIcon = '↓ Risk / Shift'; dirColor = 'var(--ember-amber)'; }
      if (n.color === 'violet') { dirIcon = '↔ Uncertain'; dirColor = 'var(--electric-violet)'; }
      if (n.color === 'cyan') { dirIcon = '• Stable'; dirColor = '#00e5ff'; }

      const rowClass = isSelected ? 'ranked-row active-impact-row' : 'ranked-row';

      html += `
        <tr class="${rowClass}" onclick="window.appSelectNode('${n.id}')" style="cursor:pointer;">
          <td><strong>${n.label}</strong></td>
          <td style="color:${dirColor}; font-weight:600;">${dirIcon}</td>
          <td>${n.sub}</td>
          <td><span class="status-pill ${n.color === 'lime' ? 'status-pill-lime' : (n.color === 'amber' ? 'status-pill-amber' : (n.color === 'violet' ? 'status-pill-violet' : 'status-pill-smoke'))}">${n.color === 'lime' ? '92%' : (n.color === 'amber' ? '74%' : '84%')}</span></td>
          <td>${n.label.includes('Support') ? 'Alex Morgan' : (n.label.includes('Finance') ? 'CFO Group' : (n.label.includes('People') ? 'Ops Lead' : 'Strategy Lead'))}</td>
          <td>First 14–30 Days</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  
  function updateDetailPanel(nodeId) {
    const node = appState.impactNodes.find(n => n.id === nodeId) || appState.impactNodes[0];
    if (!node) return;

    const nameEl = document.getElementById('detailNodeName');
    if (nameEl) nameEl.textContent = node.label;

    const statusEl = document.getElementById('detailNodeStatus');
    if (statusEl) {
      statusEl.textContent = `${node.status} · ${node.sub}`;
      let pillClass = 'status-pill-lime';
      if (node.color === 'amber') pillClass = 'status-pill-amber';
      if (node.color === 'violet') pillClass = 'status-pill-violet';
      if (node.color === 'cyan') pillClass = 'status-pill-smoke';
      statusEl.className = `status-pill ${pillClass}`;
    }

    const chgEl = document.getElementById('detailWhatChanged');
    const rootEl = document.getElementById('detailRootVariable');
    const evidEl = document.getElementById('detailEvidence');
    const measEl = document.getElementById('detailMeasurement');

    if (chgEl) chgEl.textContent = node.details.changed;
    if (rootEl) rootEl.textContent = node.details.root;
    if (evidEl) evidEl.textContent = node.details.evidence;
    if (measEl) measEl.textContent = node.details.measurement;

    // Update Sparkline Visualizer
    const sparkValEl = document.getElementById('sparklineVal');
    const sparkPathEl = document.getElementById('sparklinePath');
    const sparkFillEl = document.getElementById('sparklineFill');
    const sparkDotEl = document.getElementById('sparklineDot');

    if (sparkValEl && sparkPathEl && sparkFillEl && sparkDotEl) {
      let strokeColor = 'var(--spectral-lime)';
      let valText = '22.18%';
      let pathD = 'M 0,35 Q 20,28 35,30 T 70,18 T 105,24 T 140,8';
      let fillD = 'M 0,35 Q 20,28 35,30 T 70,18 T 105,24 T 140,8 L 140,42 L 0,42 Z';
      let dotY = 8;

      if (node.color === 'amber') {
        strokeColor = 'var(--ember-amber)';
        valText = '-$0.2M';
        pathD = 'M 0,12 Q 25,18 45,22 T 85,28 T 115,24 T 140,34';
        fillD = 'M 0,12 Q 25,18 45,22 T 85,28 T 115,24 T 140,34 L 140,42 L 0,42 Z';
        dotY = 34;
      } else if (node.color === 'violet') {
        strokeColor = 'var(--electric-violet)';
        valText = '84.0 CSAT';
        pathD = 'M 0,24 Q 25,10 50,26 T 95,14 T 120,22 T 140,16';
        fillD = 'M 0,24 Q 25,10 50,26 T 95,14 T 120,22 T 140,16 L 140,42 L 0,42 Z';
        dotY = 16;
      } else if (node.color === 'cyan') {
        strokeColor = '#00e5ff';
        valText = '96% Sync';
        pathD = 'M 0,20 Q 30,22 60,18 T 100,19 T 140,18';
        fillD = 'M 0,20 Q 30,22 60,18 T 100,19 T 140,18 L 140,42 L 0,42 Z';
        dotY = 18;
      }

      sparkValEl.textContent = valText;
      sparkPathEl.setAttribute('d', pathD);
      sparkPathEl.setAttribute('stroke', strokeColor);
      sparkFillEl.setAttribute('d', fillD);
      sparkDotEl.setAttribute('cy', dotY);
      sparkDotEl.setAttribute('stroke', strokeColor);
    }
  }

  // ========================================================================
  // 9. SECTION 05: BRIEFING ROOM CONTROLLER
  // ========================================================================
  function renderBriefingSection() {
    const draft = (window.BriefingNotesManager && window.BriefingNotesManager.getDraft) 
      ? window.BriefingNotesManager.getDraft(appState.activeDecisionId)
      : null;
    
    if (draft && draft.execSummary) {
      if (document.getElementById('execBlockDecision')) document.getElementById('execBlockDecision').value = draft.execSummary.decision || '';
      if (document.getElementById('execBlockRecommendation')) document.getElementById('execBlockRecommendation').value = draft.execSummary.recommendation || '';
      if (document.getElementById('execBlockTradeoff')) document.getElementById('execBlockTradeoff').value = draft.execSummary.tradeoff || '';
      if (document.getElementById('execBlockUncertainty')) document.getElementById('execBlockUncertainty').value = draft.execSummary.uncertainty || '';
    }

    if (document.getElementById('briefingHumanNotes') && draft) {
      document.getElementById('briefingHumanNotes').value = draft.notes || '';
    }

    renderBriefingHistory();
  }

  function renderBriefingHistory() {
    const container = document.getElementById('briefingHistoryList');
    if (!container) return;

    const history = (window.BriefingNotesManager && window.BriefingNotesManager.getHistory)
      ? window.BriefingNotesManager.getHistory()
      : [
          { version: 3, scenario: '14-day delay (Recommended)', date: '31 Oct 2026 · 14:32', author: 'Alex Morgan', status: 'In Review' },
          { version: 2, scenario: '7-day delay', date: '30 Oct 2026 · 11:15', author: 'Priya Shah', status: 'Superseded' },
          { version: 1, scenario: 'Baseline On-time launch', date: '29 Oct 2026 · 09:40', author: 'Alex Morgan', status: 'Initial Baseline' }
        ];

    let html = '';
    history.forEach(item => {
      html += `
        <div class="history-item">
          <div>
            <div style="font-weight:600; color:var(--bone-white);">v${item.version} · ${item.scenario}</div>
            <div style="font-size:10.5px; color:var(--smoke);">${item.date} by ${item.author}</div>
          </div>
          <span class="status-pill status-pill-smoke">${item.status}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ========================================================================
  // 10. GLOBAL ACTIONS & ATTACHED METHODS
  // ========================================================================
  window.appSelectDecision = (decId, openStudio = true) => {
    appState.activeDecisionId = decId;
    const d = appState.decisions.find(item => item.id === decId);
    if (d) {
      const nameEl = document.getElementById('activeDecisionName');
      const qEl = document.getElementById('labScenarioQuestion');
      if (nameEl) nameEl.textContent = d.title.split('—')[0].trim();
      if (qEl) qEl.textContent = `“${d.original_question}”`;
      showToast(`Active decision switched to: ${d.title}`, 'violet');
    }
    if (openStudio) window.location.hash = '#studio';
  };

  window.appSelectScenario = (scId) => {
    appState.selectedScenarioId = scId;
    renderBranchCards();
    renderComparisonChart();
    showToast(`Switched scenario comparison view`, 'violet');
  };

  window.appSelectNode = (nodeId) => {
    appState.selectedNodeId = nodeId;
    renderNetworkSvg();
    renderRankedTable();
    updateDetailPanel(nodeId);
  };

  window.appToggleSource = (srcId) => {
    if (appState.excludedSources.includes(srcId)) {
      appState.excludedSources = appState.excludedSources.filter(id => id !== srcId);
      showToast('Source re-included in analysis', 'success');
    } else {
      appState.excludedSources.push(srcId);
      showToast('Source excluded; model variance widened', 'warning');
    }
    renderDataReadinessList();
    renderComparisonChart();
  };

  window.appInspectAssumption = (asmId) => {
    const asm = appState.assumptions.find(a => a.id === asmId);
    if (!asm) return;
    showToast(`Inspecting sensitivity: ${asm.title}`, 'info');
    if (asm.title.includes('ticket')) {
      document.querySelectorAll('.metric-pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.metric === 'support');
      });
      appState.selectedMetric = 'support';
      renderComparisonChart();
    }
  };

  // ========================================================================
  // 11. EVENT LISTENERS SETUP
  // ========================================================================
  
  // ═══════════════════════════════════════════════════════════════════════════
  // S+++++ ELDRITCH ABYSS NEXUS INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════
  window.appTriggerAbyssPulse = () => {
    const nexus = document.getElementById('demonAbyssNexus');
    if (nexus) {
      nexus.style.filter = 'drop-shadow(0 0 50px rgba(255, 51, 102, 0.9))';
      setTimeout(() => {
        nexus.style.filter = '';
      }, 700);
    }
    showToast('⛧ The Counterfactual Abyss stirs... Demonic variance amplified!', 'violet');
  };

  function setupEventListeners() {
    window.addEventListener('hashchange', () => handleRoute(window.location.hash));

    // Dynamic Video Atmosphere Switcher
    function switchBackgroundVideo(videoFilename, title, activeCardId) {
      const videoEl = document.getElementById('bgVideo');
      const atmosphereLabel = document.getElementById('activeAtmosphereLabel');
      if (atmosphereLabel) atmosphereLabel.textContent = title;

      // Update active card styling on all corresponding scenario preview cards
      document.querySelectorAll('.scenario-preview-card').forEach(card => card.classList.remove('preview-active'));
      if (activeCardId) {
        if (activeCardId.includes('Ghost')) {
          document.getElementById('btnThemeGhost')?.classList.add('preview-active');
          document.getElementById('btnThemeGhostLeft')?.classList.add('preview-active');
        } else if (activeCardId.includes('Spectral')) {
          document.getElementById('btnThemeSpectral')?.classList.add('preview-active');
          document.getElementById('btnThemeSpectralLeft')?.classList.add('preview-active');
        }
      }

      if (!videoEl) return;

      const isHttp = window.location.protocol.startsWith('http');
      const targetSrc = (isHttp ? '/frontend/videos/' : 'videos/') + videoFilename;

      videoEl.classList.add('crossfade-out');
      setTimeout(() => {
        videoEl.src = targetSrc;
        videoEl.load();
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Auto-play fallback:', err);
            // If http failed or path issue, try relative path fallback
            if (isHttp) {
              videoEl.src = 'videos/' + videoFilename;
              videoEl.load();
              videoEl.play().catch(() => {});
            }
          });
        }
        setTimeout(() => {
          videoEl.classList.remove('crossfade-out');
        }, 300);
      }, 400);

      showToast(`Atmosphere switched: ${title}`, 'violet');
    }

    const triggerGhost = () => switchBackgroundVideo('Creatures_moving_in_haunted_forest_992f5255.mp4', 'THE GHOST IN THE SYSTEM', 'Ghost');
    const triggerSpectral = () => switchBackgroundVideo('Supernatural_forest_horror_cinema_49736ee5.mp4', 'THE SPECTRAL TAKEOVER', 'Spectral');
    const triggerReset = () => switchBackgroundVideo('Monster_hand_moving_in_forest_9e2c59b1.mp4', 'MONSTER FOREST (DEFAULT)', null);

    document.getElementById('btnThemeGhost')?.addEventListener('click', triggerGhost);
    document.getElementById('btnThemeGhostLeft')?.addEventListener('click', triggerGhost);
    document.getElementById('btnThemeSpectral')?.addEventListener('click', triggerSpectral);
    document.getElementById('btnThemeSpectralLeft')?.addEventListener('click', triggerSpectral);
    document.getElementById('btnResetVideo')?.addEventListener('click', triggerReset);

    // Mobile nav & hamburger toggler
    document.getElementById('navHamburgerBtn')?.addEventListener('click', () => {
      const nav = document.getElementById('navbarDestinations');
      if (nav) {
        if (nav.style.display === 'flex') {
          nav.style.display = '';
        } else {
          nav.style.display = 'flex';
        }
      }
    });

    // Decision Pulse Medallion Click: displays audit & engine status
    document.getElementById('decisionPulseBadge')?.addEventListener('click', () => {
      showToast('Decision Pulse: 99.9% simulation uptime · 16 counterfactual branches active', 'info');
    });

    // Crystal Skull Emblem Click
    document.getElementById('heroCrystalEmblem')?.addEventListener('click', () => {
      showToast('Obsidian Aegis active · Counterfactual models validated', 'violet');
    });

    // Home Metric Cards Filter
    document.querySelectorAll('.metric-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active-metric-filter'));
        card.classList.add('active-metric-filter');
        appState.homeFilter = card.dataset.filter || 'all';
        renderHomeSection();
      });
    });

    // Home Queue Filter Buttons
    document.querySelectorAll('[data-queue-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-queue-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.queueFilter = btn.dataset.queueFilter || 'all';
        renderHomeSection();
      });
    });

    // Decision Studio Quick Examples
    document.querySelectorAll('.quick-example-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.question;
        const textarea = document.getElementById('boardroomQuestionInput');
        if (textarea && q) {
          textarea.value = q;
          showToast('Boardroom question updated', 'violet');
        }
      });
    });

    // Decision Studio Definitions Input Listeners
    ['inputChange', 'inputObjective', 'inputConstraints', 'inputHorizon'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', validateStudioCards);
    });

    // Decision Studio "Why we ask this" modal
    document.querySelectorAll('.why-link').forEach(link => {
      link.addEventListener('click', () => {
        const type = link.dataset.why;
        const scrim = document.getElementById('whyModalScrim');
        const titleEl = document.getElementById('whyModalTitle');
        const bodyEl = document.getElementById('whyModalBody');

        const explanations = {
          change: 'Specifying the exact delta avoids vague exploratory drift. Models require concrete operational levers (such as dates, headcounts, or discount rates) to project deterministic shifts.',
          objective: 'Defining the primary target metric prevents cherry-picking results. The simulator benchmarks all scenario branches against whether this core outcome is maximized.',
          constraints: 'A counterfactual branch that violates non-negotiables (like cash reserves, regulatory thresholds, or SLA commitments) is useless. Setting bounds automatically flags risky scenarios.',
          horizon: 'Strategic effects develop along distinct S-curves. Knowing the observation period allows the model to differentiate between temporary startup dips and permanent trend shifts.'
        };

        if (scrim && titleEl && bodyEl) {
          titleEl.textContent = `Framing Rationale: ${type.toUpperCase()}`;
          bodyEl.textContent = explanations[type] || 'Enterprise decision framing guidelines.';
          scrim.classList.add('open');
        }
      });
    });

    document.getElementById('btnCloseWhyModal')?.addEventListener('click', () => {
      document.getElementById('whyModalScrim')?.classList.remove('open');
    });

    // Studio Save Draft Button
    document.getElementById('btnSaveDraftStudio')?.addEventListener('click', () => {
      showToast('Decision framing draft saved to enterprise store', 'success');
    });

    // Scenario Lab Metric Switcher
    document.querySelectorAll('.metric-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.metric) {
          document.querySelectorAll('.metric-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          appState.selectedMetric = btn.dataset.metric;
          renderComparisonChart();
        }
      });
    });

    // Scenario Lab Slider
    // Duplicate Branch action
    const btnDup = document.getElementById('btnDuplicateBranch');
    if (btnDup) {
      btnDup.onclick = () => {
        const days = appState.delaySliderVal || 14;
        const newBranchId = `sc-custom-${Date.now()}`;
        const newBranch = {
          id: newBranchId,
          decision_id: appState.activeDecisionId,
          name: `${days}-day custom shift`,
          scenario_type: 'Counterfactual',
          description: `Custom ${days}-day simulation branch generated from Séance Dial`,
          confidence: 0.72,
          confidenceRange: '[69% – 75%]',
          metrics: {
            support: `5.4–5.8k tickets (−${Math.min(24, Math.round(days * 0.85))}%)`,
            revenue: `$4.6–5.0M (−$0.${Math.round(days * 0.15)}M shift)`,
            staffing: `2.6–2.9k hours (−${Math.min(16, Math.round(days * 0.55))}%)`
          }
        };
        appState.scenarios.push(newBranch);
        appState.selectedScenarioId = newBranchId;
        renderBranchCards();
        renderComparisonChart();
        showToast(`Eldritch branch created: ${days}-day custom shift`, 'violet');
      };
    }

    // Pin to Summary action
    const btnPin = document.getElementById('btnPinBranch');
    if (btnPin) {
      btnPin.onclick = () => {
        const currentSc = appState.scenarios.find(s => s.id === appState.selectedScenarioId);
        const name = currentSc ? currentSc.name : 'Active Scenario';
        showToast(`Scenario pinned to Executive Grimoire: ${name}`, 'success');
      };
    }

    const slider = document.getElementById('delayDaysSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        appState.delaySliderVal = val;
        const disp = document.getElementById('sliderValDisplay');
        if (disp) disp.textContent = `${val}`;
        
        const badge = document.getElementById('scenarioUpdateBadge');
        if (badge) {
          badge.style.opacity = '1';
          setTimeout(() => { badge.style.opacity = '0'; }, 1600);
        }

        renderComparisonChart();
      });
    }

    // Impact Map View Buttons
    document.querySelectorAll('[data-impact-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-impact-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(`Impact surface switched to: ${btn.textContent} view`, 'info');
      });
    });

    // Impact Map Filters
    document.querySelectorAll('[data-impact-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-impact-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.impactFilter = btn.dataset.impactFilter;
        renderNetworkSvg();
      });
    });

    // Impact Map Decision-Critical Toggle
    document.getElementById('chkDecisionCritical')?.addEventListener('change', (e) => {
      appState.showCriticalOnly = e.target.checked;
      renderNetworkSvg();
    });

    // Impact CSV Export
    document.getElementById('btnExportImpactsCSV')?.addEventListener('click', () => {
      if (window.DataActions && window.DataActions.exportPortfolioCSV) {
        window.DataActions.exportPortfolioCSV(appState.decisions);
      }
      showToast('Exported consequence dataset to CSV', 'success');
    });

    // Briefing Human Notes Autosave
    document.getElementById('briefingHumanNotes')?.addEventListener('input', (e) => {
      if (window.BriefingNotesManager) {
        window.BriefingNotesManager.saveDraft(appState.activeDecisionId, { notes: e.target.value });
      }
      const statusEl = document.getElementById('notesSaveStatus');
      if (statusEl) {
        statusEl.textContent = 'Saving...';
        setTimeout(() => { statusEl.textContent = 'Autosaved'; }, 500);
      }
    });

    // Briefing Submit Approval
    document.getElementById('btnRequestApproval')?.addEventListener('click', async () => {
      showLoadingStage('Preparing briefing package...');
      
      const draft = (window.BriefingNotesManager && window.BriefingNotesManager.getDraft) 
        ? window.BriefingNotesManager.getDraft(appState.activeDecisionId)
        : { notes: '' };

      const summaryObj = {
        decision: document.getElementById('execBlockDecision')?.value || '',
        recommendation: document.getElementById('execBlockRecommendation')?.value || '',
        tradeoff: document.getElementById('execBlockTradeoff')?.value || '',
        uncertainty: document.getElementById('execBlockUncertainty')?.value || ''
      };

      await ApiClient.postWithFallback('/api/approvals', {
        title: 'Regional launch timing — 14-day shift',
        actor_role: 'VP Operations',
        action: 'requested',
        summary: summaryObj.recommendation
      }, { status: 'submitted' });

      hideLoadingStage();

      if (window.BriefingNotesManager) {
        window.BriefingNotesManager.createNewVersion(appState.activeDecisionId, draft.notes, summaryObj);
      }
      renderBriefingHistory();
      showToast('Decision brief submitted for VP Ops & CFO authorization', 'success');
    });

    // Briefing "Create Briefing Document" modal
    document.getElementById('btnCreateBriefingModal')?.addEventListener('click', () => {
      const modal = document.getElementById('briefingDocModalScrim');
      const body = document.getElementById('briefingDocBody');
      const dec = appState.decisions.find(d => d.id === appState.activeDecisionId) || appState.decisions[0];
      const sc = appState.scenarios.find(s => s.id === appState.selectedScenarioId) || appState.scenarios[1];
      const draft = (window.BriefingNotesManager && window.BriefingNotesManager.getDraft)
        ? window.BriefingNotesManager.getDraft(appState.activeDecisionId)
        : {};

      const markdown = (window.BriefingNotesManager && window.BriefingNotesManager.exportMarkdownBrief)
        ? window.BriefingNotesManager.exportMarkdownBrief(dec, sc, draft)
        : 'Executive Brief Document';

      if (body) {
        body.innerHTML = `
          <div style="margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.18em; color:var(--smoke);">CONFIDENTIAL EXECUTIVE RECORD</div>
            <h2 style="font-size:18px; color:var(--bone-white); margin-top:4px;">${dec.title}</h2>
          </div>
          <pre style="white-space:pre-wrap; font-family:var(--font-sans); font-size:12.5px; color:var(--bone-white);">${markdown}</pre>
        `;
      }
      if (modal) modal.classList.add('open');
    });

    document.getElementById('btnCloseDocModal')?.addEventListener('click', () => {
      document.getElementById('briefingDocModalScrim')?.classList.remove('open');
    });

    document.getElementById('btnPrintBriefingBtn')?.addEventListener('click', () => {
      if (window.DataActions && window.DataActions.printBriefing) {
        window.DataActions.printBriefing();
      } else {
        window.print();
      }
    });

    document.getElementById('btnCopyBriefingBtn')?.addEventListener('click', () => {
      const dec = appState.decisions.find(d => d.id === appState.activeDecisionId) || appState.decisions[0];
      const sc = appState.scenarios.find(s => s.id === appState.selectedScenarioId) || appState.scenarios[1];
      const draft = (window.BriefingNotesManager && window.BriefingNotesManager.getDraft)
        ? window.BriefingNotesManager.getDraft(appState.activeDecisionId)
        : {};
      const markdown = (window.BriefingNotesManager && window.BriefingNotesManager.exportMarkdownBrief)
        ? window.BriefingNotesManager.exportMarkdownBrief(dec, sc, draft)
        : 'Executive Brief Document';

      navigator.clipboard.writeText(markdown).then(() => {
        showToast('Executive brief copied to clipboard', 'success');
      });
    });

    // Global Search Modal (Ctrl+K)
    document.getElementById('btnOpenSearch')?.addEventListener('click', () => {
      document.getElementById('searchModalScrim')?.classList.add('open');
      document.getElementById('globalSearchInput')?.focus();
    });

    document.getElementById('btnCloseSearchModal')?.addEventListener('click', () => {
      document.getElementById('searchModalScrim')?.classList.remove('open');
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('searchModalScrim')?.classList.toggle('open');
        document.getElementById('globalSearchInput')?.focus();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-scrim').forEach(m => m.classList.remove('open'));
      }
    });

    document.querySelectorAll('.modal-scrim').forEach(scrim => {
      scrim.addEventListener('click', (e) => {
        if (e.target === scrim) scrim.classList.remove('open');
      });
    });
  }

  // ========================================================================
  // 12. INITIALIZATION
  // ========================================================================
  async function init() {
    setupEventListeners();
    await ApiClient.loadAllInitialData();
    renderStudioSection();
    renderLabSection();
    renderImpactSection();
    handleRoute(window.location.hash);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// THE CONJURING — CURSED NAVBAR AMBIENT EFFECTS & TACHYCARDIA HEARTBEAT
// ═══════════════════════════════════════════════════════════════════════════════
(function initConjuringNavbar() {
  const navbar = document.querySelector('.conjuring-navbar');
  if (!navbar) return;

  // ── Random micro-flicker on navbar (dying lightbulb in haunted cellar) ──
  function triggerNavbarFlicker() {
    const intensity = Math.random();
    if (intensity > 0.92) {
      navbar.style.opacity = '0.88';
      setTimeout(() => {
        navbar.style.opacity = '0.96';
        setTimeout(() => {
          navbar.style.opacity = '0.84';
          setTimeout(() => {
            navbar.style.opacity = '1';
          }, 50 + Math.random() * 30);
        }, 40 + Math.random() * 40);
      }, 30 + Math.random() * 50);
    }
    setTimeout(triggerNavbarFlicker, 3500 + Math.random() * 7500);
  }
  setTimeout(triggerNavbarFlicker, 4000);

  // ── Blood drip glow intensifies on scroll ──
  const bloodDrip = navbar.querySelector('.conjuring-blood-drip');
  if (bloodDrip) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const delta = Math.abs(scrollY - lastScroll);
      if (delta > 5) {
        const glowIntensity = Math.min(delta / 10, 1);
        bloodDrip.style.filter = 'drop-shadow(0 ' + (2 + glowIntensity * 4) + 'px ' + (4 + glowIntensity * 8) + 'px rgba(220, 20, 60, ' + (0.6 + glowIntensity * 0.4) + '))';
        setTimeout(() => {
          bloodDrip.style.filter = '';
        }, 300);
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  // ── Nav link hover sound-like visual pulse (cross trembles) ──
  const navLinks = navbar.querySelectorAll('.gothic-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const cross = link.querySelector('.nav-cross-icon');
      if (cross) {
        cross.style.transition = 'transform 0.15s ease';
        cross.style.transform = 'rotate(12deg) scale(1.35)';
        setTimeout(() => {
          cross.style.transform = 'rotate(-8deg) scale(1.15)';
          setTimeout(() => {
            cross.style.transform = 'rotate(0deg) scale(1)';
          }, 120);
        }, 100);
      }
    });
  });

  // ── Heartbeat Tachycardia (Accelerates to rapid panicked pulse on hover) ──
  const pulsePod = navbar.querySelector('.conjuring-pulse-pod');
  const medallion = navbar.querySelector('.conjuring-medallion');
  const pulseText = navbar.querySelector('#pulseLabel');

  if (pulsePod && medallion) {
    pulsePod.addEventListener('mouseenter', () => {
      // Rapid frightened heartbeat (0.65s cycle)
      medallion.style.animationDuration = '0.65s';
      if (pulseText) pulseText.style.animationDuration = '0.65s';
      const waves = medallion.querySelectorAll('.heartbeat-shockwave');
      waves.forEach(w => w.style.animationDuration = '0.65s');
      const core = medallion.querySelector('.conjuring-core');
      if (core) core.style.animationDuration = '0.65s';
    });

    pulsePod.addEventListener('mouseleave', () => {
      // Return to ominous steady heartbeat (1.25s cycle)
      medallion.style.animationDuration = '1.25s';
      if (pulseText) pulseText.style.animationDuration = '1.25s';
      const waves = medallion.querySelectorAll('.heartbeat-shockwave');
      waves.forEach(w => w.style.animationDuration = '1.25s');
      const core = medallion.querySelector('.conjuring-core');
      if (core) core.style.animationDuration = '1.25s';
    });
  }
})();
