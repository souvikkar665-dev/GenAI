"""Decision engine: validates and persists structured decision definitions."""
import sqlite3, uuid
from pathlib import Path

class DecisionEngine:
    def __init__(self, db_path): self.db_path = str(db_path)
    def _db(self):
        c = sqlite3.connect(self.db_path); c.row_factory = sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c
    def create(self, organization_id, title, original_question, change_description, objective, time_horizon, constraints, metric_ids, created_by=None):
        if not all(str(x).strip() for x in (organization_id,title,original_question,change_description,objective,time_horizon)):
            raise ValueError('Required decision fields are missing.')
        if not constraints or not metric_ids: raise ValueError('At least one constraint and one required metric are required.')
        did = str(uuid.uuid4())
        with self._db() as db:
            db.execute('INSERT INTO decisions(id,organization_id,title,original_question,change_description,objective,time_horizon,created_by,status) VALUES(?,?,?,?,?,?,?,?,?)', (did,organization_id,title,original_question,change_description,objective,time_horizon,created_by,'ready'))
            db.executemany('INSERT INTO decision_constraints(decision_id,description) VALUES(?,?)', [(did,str(x)) for x in constraints])
            for mid in metric_ids: db.execute('INSERT INTO decision_metrics(decision_id,metric_id) VALUES(?,?)', (did,mid))
            db.execute("INSERT INTO audit_logs(organization_id,actor_id,entity_type,entity_id,action,description) VALUES(?,?,?,?,?,?)", (organization_id,created_by,'decision',did,'created','Structured decision created and validated.'))
        return self.get(did, organization_id)
    def get(self, decision_id, organization_id):
        with self._db() as db:
            row = db.execute('SELECT * FROM decisions WHERE id=? AND organization_id=?',(decision_id,organization_id)).fetchone()
            if not row: raise LookupError('Decision not found in this organization.')
            d=dict(row); d['constraints']=[r[0] for r in db.execute('SELECT description FROM decision_constraints WHERE decision_id=?',(decision_id,))]
            d['metric_ids']=[r[0] for r in db.execute('SELECT metric_id FROM decision_metrics WHERE decision_id=?',(decision_id,))]
            return d
    def analyze_question(self, question):
        """Offline stub: returns clarification-needed rather than inventing structured facts."""
        if not question or len(question.strip()) < 12: return {'status':'needs_clarification','original_question':question or '', 'missing':['decision change','objective','time horizon','required metrics']}
        return {'status':'needs_structuring','original_question':question.strip(), 'message':'Provide objective, constraints, horizon, and metrics explicitly; language-model integration is not enabled.'}
