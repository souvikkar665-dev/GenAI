"""Impact engine: translates persisted model deltas into transparent impact nodes."""
import sqlite3, uuid
class ImpactEngine:
    def __init__(self, db_path): self.db_path=str(db_path)
    def _db(self):
        c=sqlite3.connect(self.db_path); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c
    def build(self, scenario_id, baseline_scenario_id=None, owners=None):
        owners=owners or {}
        with self._db() as db:
            current=db.execute("""SELECT p.metric_id,m.name,p.value,p.confidence,p.availability FROM model_runs r JOIN predictions p ON p.model_run_id=r.id JOIN metrics m ON m.id=p.metric_id WHERE r.scenario_id=? ORDER BY r.generated_at DESC""",(scenario_id,)).fetchall()
            base={}
            if baseline_scenario_id:
                for r in db.execute("""SELECT p.metric_id,p.value,p.availability FROM model_runs mr JOIN predictions p ON p.model_run_id=mr.id WHERE mr.scenario_id=? ORDER BY mr.generated_at DESC""",(baseline_scenario_id,)):
                    base.setdefault(r['metric_id'],r)
            out=[]
            for p in current:
                if p['availability']!='available' or p['value'] is None: direction='uncertain'; mag='unknown'; reason='Prediction unavailable; impact is not estimated.'
                else:
                    b=base.get(p['metric_id']); delta=(p['value']-b['value']) if b and b['availability']=='available' and b['value'] is not None else None
                    direction=('positive' if delta>0 else 'negative' if delta<0 else 'neutral') if delta is not None else 'uncertain'
                    mag='small' if delta is not None and abs(delta)<5 else 'moderate' if delta is not None and abs(delta)<20 else 'large' if delta is not None else 'unknown'
                    reason=f"Estimated {p['name']} value: {p['value']}; delta vs baseline: {delta if delta is not None else 'not available'} ."
                iid=str(uuid.uuid4()); db.execute('INSERT INTO impacts(id,scenario_id,metric_id,name,direction,magnitude_band,confidence,explanation,owner,measurement_requirement) VALUES(?,?,?,?,?,?,?,?,?,?)',(iid,scenario_id,p['metric_id'],p['name'],direction,mag,p['confidence'],reason,owners.get(p['metric_id']),'Track this metric against observed outcomes.'))
                out.append({'id':iid,'name':p['name'],'direction':direction,'magnitude_band':mag,'confidence':p['confidence'],'explanation':reason})
            return out
    def list_for_scenario(self, scenario_id, min_confidence=None, direction=None):
        sql='SELECT * FROM impacts WHERE scenario_id=?'; args=[scenario_id]
        if min_confidence is not None: sql+=' AND confidence>=?'; args.append(min_confidence)
        if direction: sql+=' AND direction=?'; args.append(direction)
        with self._db() as db: return [dict(r) for r in db.execute(sql,args)]
