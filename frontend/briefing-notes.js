/**
 * briefing-notes.js
 * Versioned human notes in the briefing workflow
 * The Counterfactual Boardroom — Topic 08
 */

const BriefingNotesManager = (() => {
  const STORAGE_KEY = 'cfb_briefing_notes_v1';
  const HISTORY_KEY = 'cfb_briefing_history_v1';

  const defaultVersions = [
    {
      version: 3,
      date: '31 Oct 2026 · 14:32',
      author: 'Alex Morgan',
      role: 'VP Operations',
      scenario: '14-day delay (Recommended)',
      status: 'In Review',
      summary: 'Controlled two-week shift to protect CSAT and smooth support peak.',
      notes: 'Customer Operations confirmed training modules complete Nov 08. Finance approved Q1 revenue timing variance buffer of $0.2M.'
    },
    {
      version: 2,
      date: '30 Oct 2026 · 11:15',
      author: 'Priya Shah',
      role: 'Operations Lead',
      scenario: '7-day delay',
      status: 'Superseded',
      summary: 'One-week shift evaluated but discarded due to insufficient training buffer.',
      notes: '7-day delay does not provide adequate margin for Tier 2 agent onboarding.'
    },
    {
      version: 1,
      date: '29 Oct 2026 · 09:40',
      author: 'Alex Morgan',
      role: 'VP Operations',
      scenario: 'Baseline On-time launch',
      status: 'Initial Baseline',
      summary: 'Initial model baseline with peak volume risk of 6.5k tickets.',
      notes: 'Initial simulation showed unmitigated overtime surge and potential CSAT dip to 74.'
    }
  ];

  function getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : defaultVersions;
    } catch {
      return defaultVersions;
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save briefing history to localStorage', e);
    }
  }

  function getDraft(decisionId = 'dec-launch') {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${decisionId}`);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
    return {
      decisionId,
      notes: 'Customer Operations confirmed training modules complete Nov 08. Finance approved Q1 revenue timing variance buffer of $0.2M.',
      lastSaved: new Date().toISOString(),
      execSummary: {
        decision: 'Shift Northstar West launch date by 14 calendar days.',
        recommendation: 'Implement 14-day delay to ensure complete staff readiness and avoid ticket backlog.',
        tradeoff: 'Accept $0.2M delayed revenue timing into early next cycle in exchange for 12% lower ticket volume and CSAT protection.',
        uncertainty: 'Demand stability over the extended window remains unverified; will be tracked weekly through first 60 days.'
      }
    };
  }

  function saveDraft(decisionId, draftData) {
    try {
      const existing = getDraft(decisionId);
      const updated = { ...existing, ...draftData, lastSaved: new Date().toISOString() };
      localStorage.setItem(`${STORAGE_KEY}_${decisionId}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to save draft', e);
      return draftData;
    }
  }

  function createNewVersion(decisionId, notes, summaryObj) {
    const history = getHistory();
    const nextVer = (history[0]?.version || 0) + 1;
    const now = new Date();
    const formattedDate = `${now.getDate()} Oct ${now.getFullYear()} · ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newEntry = {
      version: nextVer,
      date: formattedDate,
      author: 'Aria Morgan',
      role: 'Executive Reviewer',
      scenario: '14-day delay (Recommended)',
      status: 'Submitted for Approval',
      summary: summaryObj?.recommendation || 'Executive recommendation package submitted.',
      notes: notes || 'Updated rationale with verified operational constraints.'
    };

    history.unshift(newEntry);
    saveHistory(history);
    return newEntry;
  }

  function exportMarkdownBrief(decision, scenario, draft) {
    return `# EXECUTIVE DECISION BRIEF: ${decision?.title || 'Counterfactual Decision'}
**Topic 08 // The Counterfactual Boardroom**
**Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
**Owner**: ${decision?.owner || 'Alex Morgan'}
**Status**: Recommended for Review (Version ${getHistory()[0]?.version || 3})

---

## 1. Executive Summary
- **Decision Being Evaluated**: ${draft?.execSummary?.decision || decision?.change_description || 'Proposed operational shift.'}
- **Recommendation**: ${draft?.execSummary?.recommendation || '14-day delay selected as the optimal risk/reward boundary.'}
- **Trade-Off**: ${draft?.execSummary?.tradeoff || 'Postponing early revenue to eliminate first-wave support overload.'}
- **Uncertainty & Observation**: ${draft?.execSummary?.uncertainty || 'Monitoring customer renewal sentiment and staffing ramp.'}

---

## 2. Selected Counterfactual Branch
- **Scenario**: ${scenario?.name || '14-day delay'}
- **Confidence**: ${Math.round((scenario?.confidence || 0.74) * 100)}% (Modeled range [71% – 77%])
- **Upside**: Support volume tickets reduced by 12% below the 6,000 capacity threshold.
- **Downside**: $0.2M mid-point revenue deferred into Q1.

---

## 3. Human Executive Rationale & Annotations
${draft?.notes || 'No custom annotations entered.'}

---

## 4. Post-Decision Measurement Roadmap
| Metric | Baseline Target | Owner | Review Horizon | Revisit Trigger |
| :--- | :--- | :--- | :--- | :--- |
| First-wave Support Tickets | < 5,800 tickets | Customer Operations | Nov 18, 2026 | Volume > 6,200 |
| Regional Account Retention | ≥ 96.8% renewal | Customer Success | Dec 01, 2026 | Churn > 3.2% |
| Customer Satisfaction (CSAT) | ≥ 82 points | Product Quality | Nov 25, 2026 | Score < 78 |

*Generated by The Counterfactual Boardroom — Confidential Decision Instrument*
`;
  }

  return {
    getDraft,
    saveDraft,
    getHistory,
    createNewVersion,
    exportMarkdownBrief
  };
})();

window.BriefingNotesManager = BriefingNotesManager;

