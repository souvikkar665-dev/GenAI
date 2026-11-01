/**
 * data-actions.js
 * Portfolio/audit CSV exports, scenario recalculations, and impact refresh handlers
 * The Counterfactual Boardroom — Topic 08
 */

const DataActions = (() => {
  function downloadCSV(filename, rows) {
    const processRow = row => row.map(val => {
      let text = (val === null || val === undefined) ? '' : String(val);
      if (text.search(/("|,|\n)/g) >= 0) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',');

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPortfolioCSV(decisions = []) {
    const headers = ['ID', 'Title', 'Original Question', 'Status', 'Confidence', 'Owner', 'Business Unit', 'Metrics', 'Constraints'];
    const rows = [headers];
    
    decisions.forEach(d => {
      rows.push([
        d.id || '',
        d.title || '',
        d.original_question || '',
        d.status || '',
        d.confidence ? `${Math.round(d.confidence * 100)}%` : 'Unmodeled',
        d.owner || '',
        d.business_unit || '',
        (d.metrics || []).join('; '),
        (d.constraints || []).join('; ')
      ]);
    });

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(`counterfactual_portfolio_${timestamp}.csv`, rows);
  }

  function exportAuditCSV(auditLogs = []) {
    const headers = ['Timestamp', 'Actor', 'Action', 'Description'];
    const rows = [headers];

    auditLogs.forEach(log => {
      rows.push([
        log.time || '',
        log.actor || '',
        log.action || '',
        log.description || ''
      ]);
    });

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(`counterfactual_audit_${timestamp}.csv`, rows);
  }

  function exportScenarioCSV(scenarios = []) {
    const headers = ['Scenario ID', 'Scenario Name', 'Type', 'Confidence', 'Metric', 'Modeled Range', 'Delta Label'];
    const rows = [headers];

    scenarios.forEach(sc => {
      (sc.predictions || []).forEach(pred => {
        rows.push([
          sc.id || '',
          sc.name || '',
          sc.scenario_type || '',
          sc.confidence ? `${Math.round(sc.confidence * 100)}%` : 'N/A',
          pred.name || '',
          pred.formatted || '',
          pred.delta_label || ''
        ]);
      });
    });

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(`counterfactual_scenarios_${timestamp}.csv`, rows);
  }

  function simulateSensitivity(baseDelayDays = 14, excludeSources = []) {
    // Computes dynamic outputs with uncertainty bands based on delay days parameter
    const delayRatio = baseDelayDays / 14;
    const uncertaintyMultiplier = 1 + (excludeSources.length * 0.12);

    const supportMid = Math.max(4.8, 6.3 - (delayRatio * 0.75));
    const supportRange = [
      (supportMid - 0.2 * uncertaintyMultiplier).toFixed(2),
      (supportMid + 0.2 * uncertaintyMultiplier).toFixed(2)
    ];

    const revenueMid = Math.max(4.2, 5.0 - (delayRatio * 0.2));
    const revenueRange = [
      (revenueMid - 0.2 * uncertaintyMultiplier).toFixed(2),
      (revenueMid + 0.2 * uncertaintyMultiplier).toFixed(2)
    ];

    const staffingMid = Math.max(2.2, 2.95 - (delayRatio * 0.25));
    const staffingRange = [
      (staffingMid - 0.15 * uncertaintyMultiplier).toFixed(2),
      (staffingMid + 0.15 * uncertaintyMultiplier).toFixed(2)
    ];

    const confidence = Math.max(0.55, Math.min(0.85, 0.76 - (excludeSources.length * 0.05) + (baseDelayDays >= 10 && baseDelayDays <= 18 ? 0.04 : -0.05)));

    return {
      delayDays: baseDelayDays,
      supportVolume: `${supportRange[0]}–${supportRange[1]}k`,
      supportDelta: `${Math.round((6.3 - supportMid) / 6.3 * 100)}% reduction`,
      revenue: `$${revenueRange[0]}–${revenueRange[1]}M`,
      revenueDelta: `−$${(5.0 - revenueMid).toFixed(1)}M timing shift`,
      staffingLoad: `${staffingRange[0]}–${staffingRange[1]}k h`,
      staffingDelta: `−${Math.round((2.95 - staffingMid) / 2.95 * 100)}% peak load`,
      confidence: confidence,
      confidenceRange: `[${Math.round((confidence - 0.04) * 100)}% – ${Math.round((confidence + 0.04) * 100)}%]`
    };
  }

  function printBriefing() {
    window.print();
  }

  return {
    exportPortfolioCSV,
    exportAuditCSV,
    exportScenarioCSV,
    simulateSensitivity,
    printBriefing
  };
})();

window.DataActions = DataActions;

