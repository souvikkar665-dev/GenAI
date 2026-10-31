"""Briefing engine: composes a versioned decision package from canonical stored data."""
import sqlite3, uuid
class BriefingEngine:
    def __init__(self, db_path): self.db_path=str(db_path)
    def _db(self):
        c=sqlite3.connect(self.db_path); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c
    def create(self, decision_id, scenario_id=None, human_notes='', created_by=None):
        with self._db() as db:
            d=db.execute('SELECT * FROM decisions WHERE id=?',(decision_id,)).fetchone()
            if not d: raise LookupError('Decision not found.')
            if scenario_id and not db.execute('SELECT 1 FROM scenarios WHERE id=? AND decision_id=?',(scenario_id,decision_id)).fetchone(): raise ValueError('Scenario must belong to the specified decision.')
            version=db.execute('SELECT COALESCE(MAX(version),0)+1 FROM briefings WHERE decision_id=?',(decision_id,)).fetchone()[0]
            bid=str(uuid.uuid4()); summary=f"Decision: {d['title']}. Objective: {d['objective']}. Change: {d['change_description']}. Horizon: {d['time_horizon']}. This prototype briefing uses stored estimates only; uncertainty and assumptions should be reviewed before action."
            db.execute('INSERT INTO briefings(id,decision_id,scenario_id,version,executive_summary,human_notes,created_by) VALUES(?,?,?,?,?,?,?)',(bid,decision_id,scenario_id,version,summary,human_notes,created_by))
            db.execute("INSERT INTO audit_logs(organization_id,actor_id,entity_type,entity_id,action,description) VALUES(?,?,?,?,?,?)",(d['organization_id'],created_by,'briefing',bid,'created','Versioned briefing created.'))
            return dict(db.execute('SELECT * FROM briefings WHERE id=?',(bid,)).fetchone())
    def get(self, briefing_id):
        with self._db() as db:
            r=db.execute('SELECT * FROM briefings WHERE id=?',(briefing_id,)).fetchone()
            if not r: raise LookupError('Briefing not found.')
            return dict(r)
