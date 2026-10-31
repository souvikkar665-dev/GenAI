// Real browser downloads and server-backed impact refresh for dashboard actions.
(() => {
  const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  function exportRows(action) {
    const audit = action === 'export-audit';
    const rows = audit ? state.audit : state.decisions;
    if (!rows?.length) { toast('There are no records to export yet.', 'warning'); return; }
    const columns = audit
      ? [['time','Time'],['actor','Actor'],['action','Action'],['description','Description']]
      : [['id','Decision ID'],['title','Decision'],['status','Status'],['owner','Owner'],['confidence','Confidence'],['updated','Updated']];
    const content = [columns.map(([,label]) => csvCell(label)).join(','), ...rows.map(row => columns.map(([key]) => csvCell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff',content], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download=audit?'boardroom-audit.csv':'boardroom-portfolio.csv';
    document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    toast(`${rows.length} ${audit?'audit':'portfolio'} records exported as CSV.`);
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'export' || action === 'export-audit') {
      event.preventDefault();event.stopPropagation();exportRows(action);return;
    }
    if (action === 'refresh-impacts') {
      event.preventDefault();event.stopPropagation();
      try {
        state.impacts = await api('/api/impacts');
        if (state.page === 'impact') render();
        toast('Impact view refreshed from saved structured records. No model recalculation is connected.');
      } catch (error) { toast(error.message, 'error'); }
    }
  }, true);
})();
