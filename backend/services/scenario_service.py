"""Scenario engine: creates versioned branches and persists validated estimates."""
import sqlite3, uuid
class ScenarioEngine:
    def __init__(self, db_path): self.db_path=str(db_path)
    def _db(self):
        c=sqlite3.connect(self.db_path); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c
    def create(self, decision_id, name, scenario_type='Counterfactual', variables=None, assumptions=None, idempotency_key=None):
        variables=variables or []; assumptions=assumptions or []
        if scenario_type not in ('Baseline','Counterfactual','Recommended'): raise ValueError('Invalid scenario type.')
        with self._db() as db:
            decision=db.execute('SELECT id FROM decisions WHERE id=?',(decision_id,)).fetchone()
            if not decision: raise LookupError('Decision not found.')
            if idempotency_key:
                existing=db.execute('SELECT scenario_id FROM jobs WHERE idempotency_key=?',(idempotency_key,)).fetchone()
                if existing and existing[0]: return existing[0]
            sid=str(uuid.uuid4()); db.execute('INSERT INTO scenarios(id,decision_id,name,scenario_type) VALUES(?,?,?,?)',(sid,decision_id,name,scenario_type))
            for v in variables:
                if not v.get('name'): raise ValueError('Each scenario variable requires a name.')
                db.execute('INSERT INTO scenario_variables(scenario_id,name,baseline_value,changed_value,unit,source) VALUES(?,?,?,?,?,?)',(sid,v['name'],v.get('baseline'),v.get('changed'),v.get('unit',''),v.get('source','user')))
            for a in assumptions:
                aid=str(uuid.uuid4()); db.execute('INSERT INTO assumptions(id,scenario_id,description,value,source_type,status,confidence,expires_at) VALUES(?,?,?,?,?,?,?,?)',(aid,sid,a['description'],str(a.get('value','')),a.get('source_type','inferred'),a.get('status','unverified'),a.get('confidence'),a.get('expires_at')))
            db.execute("INSERT INTO audit_logs(organization_id,entity_type,entity_id,action,description) SELECT organization_id,'scenario',?,'created',? FROM decisions WHERE id=?",(sid,'Scenario branch created.',decision_id))
            return sid
    def record_predictions(self, scenario_id, predictions, model_name='prototype-explicit-input', model_version='0.1', data_snapshot='manual-demo', training_period=None):
        """Persist supplied numeric predictions; never fabricates outputs. Missing values must be unavailable."""
        with self._db() as db:
            if not db.execute('SELECT 1 FROM scenarios WHERE id=?',(scenario_id,)).fetchone(): raise LookupError('Scenario not found.')
            run_id=str(uuid.uuid4()); db.execute('INSERT INTO model_runs(id,scenario_id,model_name,model_version,data_snapshot,training_period) VALUES(?,?,?,?,?,?)',(run_id,scenario_id,model_name,model_version,data_snapshot,training_period))
            for p in predictions:
                avail=p.get('availability','available'); val=p.get('value'); lo=p.get('lower_bound'); hi=p.get('upper_bound'); conf=p.get('confidence')
                if avail=='available':
                    if not isinstance(val,(int,float)) or lo is None or hi is None: raise ValueError('Available predictions require numeric value and bounds.')
                    if lo > hi: raise ValueError('Lower bound cannot exceed upper bound.')
                    if conf is None or not 0 <= conf <= 1: raise ValueError('Confidence must be between 0 and 1.')
                elif avail!='unavailable': raise ValueError('Invalid availability.')
                db.execute('INSERT INTO predictions(model_run_id,metric_id,value,lower_bound,upper_bound,unit,confidence,availability) VALUES(?,?,?,?,?,?,?,?)',(run_id,p['metric_id'],val,lo,hi,p.get('unit',''),conf,avail))
            db.execute("UPDATE scenarios SET status='completed' WHERE id=?",(scenario_id,))
            return run_id
    def compare(self, decision_id):
        with self._db() as db:
            rows=db.execute("""SELECT s.id scenario_id,s.name,s.scenario_type,m.name metric,p.value,p.lower_bound,p.upper_bound,p.unit,p.confidence,p.availability,mr.model_version,mr.data_snapshot
              FROM scenarios s LEFT JOIN model_runs mr ON mr.scenario_id=s.id LEFT JOIN predictions p ON p.model_run_id=mr.id LEFT JOIN metrics m ON m.id=p.metric_id WHERE s.decision_id=? ORDER BY s.created_at,mr.generated_at""",(decision_id,)).fetchall()
            return [dict(r) for r in rows]
