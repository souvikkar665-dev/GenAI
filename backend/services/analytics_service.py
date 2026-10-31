"""Analytics engine: fast portfolio aggregation and measurements due."""
import sqlite3
class AnalyticsEngine:
    def __init__(self, db_path): self.db_path=str(db_path)
    def _db(self):
        c=sqlite3.connect(self.db_path); c.row_factory=sqlite3.Row; return c
    def portfolio_summary(self, organization_id):
        with self._db() as db:
            active=db.execute("SELECT COUNT(*) FROM decisions WHERE organization_id=? AND status NOT IN ('approved','rejected','archived')",(organization_id,)).fetchone()[0]
            scenarios=db.execute('SELECT COUNT(*) FROM scenarios s JOIN decisions d ON d.id=s.decision_id WHERE d.organization_id=?',(organization_id,)).fetchone()[0]
            pending=db.execute("SELECT COUNT(*) FROM approvals a JOIN decisions d ON d.id=a.decision_id WHERE d.organization_id=? AND a.action='requested'",(organization_id,)).fetchone()[0]
            due=db.execute("SELECT COUNT(*) FROM measurement_plans mp JOIN decisions d ON d.id=mp.decision_id WHERE d.organization_id=? AND mp.status IN ('planned','due') AND mp.observation_date IS NOT NULL AND date(mp.observation_date)<=date('now')",(organization_id,)).fetchone()[0]
            conf=db.execute("SELECT AVG(p.confidence) FROM predictions p JOIN model_runs mr ON mr.id=p.model_run_id JOIN scenarios s ON s.id=mr.scenario_id JOIN decisions d ON d.id=s.decision_id WHERE d.organization_id=? AND p.availability='available'",(organization_id,)).fetchone()[0]
            return {'organization_id':organization_id,'active_decisions':active,'scenario_count':scenarios,'average_confidence':round(conf,3) if conf is not None else None,'pending_approvals':pending,'measurements_due':due,'data_freshness':'not_configured','note':'Portfolio values are derived from local SQLite records.'}
    def recent_activity(self, organization_id, limit=10):
        with self._db() as db: return [dict(r) for r in db.execute('SELECT * FROM audit_logs WHERE organization_id=? ORDER BY created_at DESC,id DESC LIMIT ?',(organization_id,max(1,min(int(limit),100))))]
