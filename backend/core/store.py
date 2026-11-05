"""Store boundary: PostgreSQL persistence or explicitly labeled in-memory demo."""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4
from backend.core.demo_data import DEMO_STATE

class MemoryStore:
    def __init__(self):
        self.state = deepcopy(DEMO_STATE)

    def portfolio(self):
        return deepcopy(self.state['portfolio'])

    def decisions(self):
        return deepcopy(self.state['decisions'])

    
    def decision(self, decision_id):
        for row in self.state['decisions']:
            if row['id'] == decision_id:
                return deepcopy(row)
        return None


    def scenarios(self):
        return deepcopy(self.state['scenarios'])

    def impacts(self):
        return deepcopy(self.state['impacts'])

    def approvals(self):
        return deepcopy(self.state['approvals'])

    def briefings(self):
        return deepcopy(self.state['briefings'])

    def create_briefing(self, decision_id, scenario_id, notes):
        decision = self.decision(decision_id)
        scenario = next((row for row in self.state['scenarios'] if row['id'] == scenario_id and row['decision_id'] == decision_id), None)
        if not decision or not scenario:
            raise ValueError('Choose a saved scenario belonging to the selected decision.')
        prior = [row['version'] for row in self.state['briefings'] if row.get('decision_id') == decision_id]
        record = {'id': str(uuid4()), 'decision_id': decision_id, 'scenario_id': scenario_id,
                  'version': max(prior, default=0) + 1, 'title': decision['title'],
                  'executive_summary': 'Human judgment appended to the selected decision and scenario.',
                  'human_notes': notes, 'status': 'draft', 'created_at': 'Just now'}
        self.state['briefings'].insert(0, record)
        self._audit('Briefing version created', f"{decision['title']} · version {record['version']}", 'Alex Morgan')
        return deepcopy(record)

    def audit(self):
        return deepcopy(self.state['audit'])

    def create_decision(self, item):
        row = {**item, 'id': str(uuid4()), 'status': 'draft', 'confidence': None,
               'created_at': '31 Oct 2026', 'updated': 'Just now', 'owner': 'Alex Morgan',
               'owner_initials': 'AM', 'metric_count': len(item.get('metrics', [])),
               'provenance': 'User-provided decision description; no forecast has been generated.'}
        self.state['decisions'].insert(0, row)
        self._audit('Decision draft created', f"{row['title']} · required fields captured", 'Alex Morgan')
        self.state['portfolio']['active_decisions'] += 1
        return deepcopy(row)

    def create_scenario(self, decision_id, item):
        if not self.decision(decision_id):
            return None
        row = {**item, 'id': str(uuid4()), 'decision_id': decision_id,
               'scenario_type': 'Counterfactual', 'model_version': 'Not connected',
               'data_snapshot': 'User supplied', 'predictions': [], 'mini_metrics': [],
               'source': 'Model unavailable', 'generated': 'Not run', 'recommended': False,
               'confidence': None}
        self.state['scenarios'].append(row)
        self._audit('Scenario branch created', f"{item['name']} · numerical output not available", 'Alex Morgan')
        self.state['portfolio']['scenario_count'] += 1
        return deepcopy(row)

    def submit_briefing(self, actor='Alex Morgan'):
        briefing = {'id': str(uuid4()), 'decision_id': 'dec-launch', 'scenario_id': 'sc-14d',
                    'version': len(self.state['briefings']) + 1, 'title': 'Regional launch timing — 14-day shift',
                    'status': 'submitted', 'summary': 'Decision package · scenario comparison and measurement plan attached.'}
        self.state['briefings'].insert(0, briefing)
        row = {'id': str(uuid4()), 'briefing_id': briefing['id'], 'title': 'Regional launch timing — 14-day shift',
               'summary': 'Decision package · scenario comparison and measurement plan attached.',
               'requested_by': actor, 'requested_at': '31 Oct 2026', 'action': 'requested'}
        self.state['approvals'].insert(0, row)
        self.state['portfolio']['pending_approvals'] += 1
        self._audit('Briefing submitted for approval', row['title'], actor)
        return deepcopy(row)

    def decide(self, payload):
        if payload.get('actor_role') not in ('Approver', 'Admin'):
            raise PermissionError('Only an authorized Approver or Admin can record a decision.')
        action = payload.get('action')
        if action not in ('approved', 'rejected', 'change_requested'):
            raise ValueError('Unsupported approval action.')
        row = {'id': payload.get('id') or str(uuid4()),
               'title': 'Regional launch timing — 14-day shift',
               'summary': payload.get('comment', 'Human decision recorded.'),
               'requested_by': 'Alex Morgan', 'requested_at': 'Just now', 'action': action}
        self.state['approvals'] = [x for x in self.state['approvals'] if x.get('id') != row['id']]
        self.state['portfolio']['pending_approvals'] = max(0, self.state['portfolio']['pending_approvals'] - 1)
        self._audit(f"Approval {action.replace('_', ' ')}", payload.get('comment') or row['title'], 'Prototype approver')
        return row

    def _audit(self, action, description, actor):
        self.state['audit'].insert(0, {'action': action, 'description': description,
            'actor': actor, 'time': datetime.now(timezone.utc).strftime('%d %b · %H:%M UTC')})

class PostgresStore:
    """PostgreSQL repository; psycopg is a Python driver, PostgreSQL is the only database."""
    def __init__(self, dsn):
        try:
            import psycopg
        except ImportError as exc:
            raise RuntimeError('PostgreSQL is configured but psycopg is not installed. Install backend/requirements.txt.') from exc
        self.psycopg = psycopg
        self.dsn = dsn
        self.organization_id = '00000000-0000-4000-8000-000000000001'
        self.owner_id = '00000000-0000-4000-8000-000000000011'
        with self.connect() as db:
            db.execute('SELECT 1')

    def connect(self):
        return self.psycopg.connect(self.dsn, row_factory=self.psycopg.rows.dict_row)

    def portfolio(self):
        query = """SELECT
          (SELECT count(*) FROM decisions WHERE organization_id=%s::uuid AND status NOT IN ('approved','rejected','archived')) AS active_decisions,
          (SELECT count(*) FROM scenarios s JOIN decisions d ON d.id=s.decision_id WHERE d.organization_id=%s::uuid) AS scenario_count,
          (SELECT count(*) FROM approvals a JOIN decisions d ON d.id=a.decision_id WHERE d.organization_id=%s::uuid AND a.action='requested') AS pending_approvals,
          (SELECT avg(p.confidence) FROM predictions p JOIN model_runs mr ON mr.id=p.model_run_id JOIN scenarios s ON s.id=mr.scenario_id JOIN decisions d ON d.id=s.decision_id WHERE d.organization_id=%s::uuid AND p.availability='available') AS average_confidence"""
        with self.connect() as db:
            row = db.execute(query, (self.organization_id,)*4).fetchone()
        return {**row, 'average_confidence': float(row['average_confidence']) if row['average_confidence'] is not None else None,
                'data_mode': 'postgresql'}

    def _list(self, db, sql, args, key):
        return [row[key] for row in db.execute(sql, args).fetchall()]

    def decisions(self):
        query = """SELECT d.id,d.title,d.original_question,d.change_description,d.objective,d.time_horizon,
          d.status,d.created_at,d.updated_at,d.business_unit,u.name AS owner,
          round(avg(p.confidence)::numeric,2)::float AS confidence,
          count(DISTINCT dm.metric_id)::int AS metric_count
          FROM decisions d LEFT JOIN users u ON u.id=d.created_by
          LEFT JOIN scenarios s ON s.decision_id=d.id
          LEFT JOIN model_runs mr ON mr.scenario_id=s.id
          LEFT JOIN predictions p ON p.model_run_id=mr.id
          LEFT JOIN decision_metrics dm ON dm.decision_id=d.id
          WHERE d.organization_id=%s::uuid
          GROUP BY d.id,u.name ORDER BY d.updated_at DESC"""
        with self.connect() as db:
            rows = db.execute(query, (self.organization_id,)).fetchall()
            for row in rows:
                owner = row.get('owner') or 'Decision owner'
                row['owner_initials'] = ''.join(part[0] for part in owner.split()[:2]).upper()
                row['updated'] = str(row.get('updated_at') or '')[:10]
                row['constraints'] = self._list(db, 'SELECT description FROM decision_constraints WHERE decision_id=%s::uuid ORDER BY id', (str(row['id']),), 'description')
                row['metrics'] = self._list(db, 'SELECT m.name FROM decision_metrics dm JOIN metrics m ON m.id=dm.metric_id WHERE dm.decision_id=%s::uuid ORDER BY m.name', (str(row['id']),), 'name')
        return rows

    def decision(self, decision_id):
        return next((row for row in self.decisions() if str(row['id']) == str(decision_id)), None)

    def scenarios(self):
        query = """SELECT s.id,s.decision_id,s.name,s.scenario_type,s.status,s.version,s.created_at,
          mr.model_version,mr.data_snapshot,mr.generated_at,mr.model_name
          FROM scenarios s LEFT JOIN LATERAL
          (SELECT * FROM model_runs WHERE scenario_id=s.id ORDER BY generated_at DESC LIMIT 1) mr ON true
          JOIN decisions d ON d.id=s.decision_id
          WHERE d.organization_id=%s::uuid ORDER BY s.created_at"""
        with self.connect() as db:
            rows = db.execute(query, (self.organization_id,)).fetchall()
            for row in rows:
                preds = db.execute("""SELECT m.name AS metric,p.value,p.lower_bound,p.upper_bound,p.unit,p.confidence,p.availability
                  FROM predictions p JOIN metrics m ON m.id=p.metric_id JOIN model_runs mr ON mr.id=p.model_run_id
                  WHERE mr.scenario_id=%s::uuid ORDER BY mr.generated_at DESC LIMIT 20""", (str(row['id']),)).fetchall()
                row['predictions'] = [{'name': p['metric'], 'value': p['value'],
                    'formatted': f"{p['lower_bound']:,.0f}–{p['upper_bound']:,.0f}" if p['availability']=='available' and p['lower_bound'] is not None else None,
                    'unit': p['unit'], 'confidence': float(p['confidence']) if p['confidence'] is not None else None,
                    'availability': p['availability']} for p in preds]
                row['generated'] = str(row.get('generated_at') or '')[:10]
                row['source'] = 'PostgreSQL model-run record'
                row['description'] = row['scenario_type']
                row['mini_metrics'] = []
        return rows

    def impacts(self):
        with self.connect() as db:
            return db.execute("SELECT i.id,i.scenario_id,i.name,i.direction,i.magnitude_band,i.confidence,i.explanation AS detail,i.owner FROM impacts i JOIN scenarios s ON s.id=i.scenario_id JOIN decisions d ON d.id=s.decision_id WHERE d.organization_id=%s::uuid ORDER BY i.created_at DESC", (self.organization_id,)).fetchall()

    def approvals(self):
        with self.connect() as db:
            return db.execute("""SELECT a.id,d.title,a.comment AS summary,u.name AS requested_by,a.created_at AS requested_at,a.action
              FROM approvals a JOIN decisions d ON d.id=a.decision_id JOIN users u ON u.id=a.actor_id
              WHERE d.organization_id=%s::uuid AND a.action='requested' ORDER BY a.created_at""", (self.organization_id,)).fetchall()

    def briefings(self):
        with self.connect() as db:
            return db.execute("""SELECT b.id,b.decision_id,b.scenario_id,b.version,b.executive_summary,b.human_notes,b.status,b.created_at
              FROM briefings b JOIN decisions d ON d.id=b.decision_id WHERE d.organization_id=%s::uuid ORDER BY b.created_at DESC""", (self.organization_id,)).fetchall()

    def audit(self):
        with self.connect() as db:
            return db.execute("""SELECT a.action,a.description,u.name AS actor,
              to_char(a.created_at,'DD Mon · HH24:MI UTC') AS time
              FROM audit_events a LEFT JOIN users u ON u.id=a.actor_id
              WHERE a.organization_id=%s::uuid ORDER BY a.created_at DESC LIMIT 100""", (self.organization_id,)).fetchall()

    def create_decision(self, item):
        org = self.organization_id
        actor = self.owner_id
        change = item.get('change_description') or item['original_question']
        with self.connect() as db:
            did = str(uuid4())
            db.execute("""INSERT INTO decisions(id,organization_id,title,original_question,change_description,objective,time_horizon,business_unit,status,created_by)
              VALUES(%s::uuid,%s::uuid,%s,%s,%s,%s,%s,%s,'draft',%s::uuid)""",
              (did, org, item['title'], item['original_question'], change, item['objective'], item['time_horizon'], item['business_unit'], actor))
            for constraint in item['constraints']:
                db.execute('INSERT INTO decision_constraints(decision_id,description) VALUES(%s::uuid,%s)', (did, constraint))
            for metric in item['metrics']:
                db.execute("INSERT INTO metrics(organization_id,name,unit,definition) VALUES(%s::uuid,%s,'unspecified','Definition pending analyst review') ON CONFLICT(organization_id,name) DO NOTHING", (org, metric))
                db.execute('INSERT INTO decision_metrics(decision_id,metric_id) SELECT %s::uuid,id FROM metrics WHERE organization_id=%s::uuid AND lower(name)=lower(%s)', (did, org, metric))
            db.execute("INSERT INTO audit_events(organization_id,actor_id,entity_type,entity_id,action,description) VALUES(%s::uuid,%s::uuid,'decision',%s,'created','Decision draft created through Decision Studio')", (org, actor, did))
        return self.decision(did)

    def create_scenario(self, decision_id, item):
        sid = str(uuid4())
        with self.connect() as db:
            inserted = db.execute("INSERT INTO scenarios(id,decision_id,name,scenario_type,status) SELECT %s::uuid,d.id,%s,'Counterfactual','draft' FROM decisions d WHERE d.id=%s::uuid AND d.organization_id=%s::uuid", (sid, item['name'], decision_id, self.organization_id))
            if inserted.rowcount != 1:
                raise ValueError('Decision was not found in the active organization.')
            db.execute('INSERT INTO scenario_variables(scenario_id,name,changed_value,unit,source) VALUES(%s::uuid,%s,%s,%s,%s)', (sid, item['variable'], item['value'], '', 'user'))
            for assumption in item.get('assumptions', []):
                db.execute("INSERT INTO assumptions(id,scenario_id,description,source_type,status) VALUES(%s::uuid,%s::uuid,%s,'user','unverified')", (str(uuid4()), sid, assumption))
            db.execute("INSERT INTO audit_events(organization_id,entity_type,entity_id,action,description) SELECT organization_id,'scenario',%s,'created','Scenario branch saved; model output not connected' FROM decisions WHERE id=%s::uuid", (sid, decision_id))
        return next((row for row in self.scenarios() if str(row['id']) == sid), None)

    def submit_briefing(self, actor='Alex Morgan'):
        with self.connect() as db:
            user = db.execute('SELECT id FROM users WHERE name=%s AND organization_id=%s::uuid ORDER BY created_at LIMIT 1', (actor, self.organization_id)).fetchone()
            decision = db.execute('SELECT id FROM decisions WHERE organization_id=%s::uuid ORDER BY updated_at DESC LIMIT 1', (self.organization_id,)).fetchone()
            if not user or not decision:
                raise ValueError('A configured user and decision are required before submission.')
            bid = str(uuid4())
            version = db.execute('SELECT COALESCE(MAX(version),0)+1 AS version FROM briefings WHERE decision_id=%s::uuid', (decision['id'],)).fetchone()['version']
            db.execute("INSERT INTO briefings(id,decision_id,version,executive_summary,status,created_by) VALUES(%s::uuid,%s::uuid,%s,%s,'submitted',%s::uuid)", (bid, str(decision['id']), version, 'Human review requested. See the linked decision and model lineage.', str(user['id'])))
            aid = str(uuid4())
            db.execute("INSERT INTO approvals(id,decision_id,briefing_id,actor_id,action,comment) VALUES(%s::uuid,%s::uuid,%s::uuid,%s::uuid,'requested','Briefing submitted for human review')", (aid, str(decision['id']), bid, str(user['id'])))
            db.execute("INSERT INTO audit_events(organization_id,actor_id,entity_type,entity_id,action,description) SELECT organization_id,%s::uuid,'decision',%s,'submitted','Briefing submitted for human approval' FROM decisions WHERE id=%s::uuid", (str(user['id']), str(decision['id']), str(decision['id'])))
        return {'id': aid, 'briefing_id': bid, 'action': 'requested'}
