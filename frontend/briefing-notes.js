// Persist briefing notes as a new backend version and render the latest saved note.
(() => {
  const originalRender = window.render;
  let savedNoteLoading = false;
  async function renderSavedNote() {
    const host = document.querySelector('.briefing-preview');
    if (!host || host.querySelector('.saved-human-notes') || savedNoteLoading) return;
    savedNoteLoading = true;
    try {
      const rows = await api('/api/briefings');
      const decisionId = state.selectedDecision || 'dec-launch';
      const saved = rows.find(row => row.decision_id === decisionId && row.human_notes);
      if (!saved || !document.querySelector('.briefing-preview') || document.querySelector('.saved-human-notes')) return;
      document.querySelector('.briefing-preview').insertAdjacentHTML('beforeend', `<div class="provenance-note saved-human-notes"><strong>Human judgment · briefing version ${esc(saved.version)}</strong><p>${esc(saved.human_notes)}</p></div>`);
    } catch (_) { /* The main page displays API errors; do not fail page rendering here. */ }
    finally { savedNoteLoading = false; }
  }
  if (typeof originalRender === 'function') {
    window.render = function () {
      originalRender();
      if (state.page === 'briefings') void renderSavedNote();
    };
  }
  document.addEventListener('click', async event => {
    if (event.target?.id !== 'save-notes') return;
    event.preventDefault();
    event.stopPropagation();
    const decision = state.decisions.find(row => row.id === state.selectedDecision)
      || state.decisions.find(row => row.id === 'dec-launch')
      || state.decisions[0];
    const scenario = state.scenarios.find(row => row.decision_id === decision?.id && row.recommended)
      || state.scenarios.find(row => row.decision_id === decision?.id);
    const notes = document.getElementById('human-notes')?.value?.trim() || '';
    if (!decision || !scenario) { toast('Choose a decision with a saved scenario before creating a briefing version.', 'warning'); return; }
    if (!notes) { toast('Add a note before saving the briefing version.', 'warning'); return; }
    try {
      const saved = await api('/api/briefings', {
        method: 'POST',
        body: JSON.stringify({ decision_id: decision.id, scenario_id: scenario.id, human_notes: notes })
      });
      document.querySelector('.modal-backdrop')?.remove();
      toast(`Briefing version ${saved.version} saved.`);
      await load();
      await renderSavedNote();
    } catch (error) { toast(error.message, 'error'); }
  }, true);
})();
