"""Small JSON API router; framework-free and validation-first."""
from urllib.parse import unquote
from backend.core.validation import decision_payload, scenario_payload, required_text
from backend.core.store import MemoryStore, PostgresStore
from backend.services.approval_service import ApprovalEngine
from backend.core.config import settings

_store=None
def get_store():
    global _store
    if _store is None:
        _store=PostgresStore(settings.postgres_dsn) if settings.postgres_dsn else MemoryStore()
    return _store

def route(method,path,body=None):
    body=body or {};store=get_store();path=unquote(path.split('?',1)[0])
    if method=='GET' and path=='/api/health':
        return 200,{'status':'ok','database':'postgresql' if isinstance(store,PostgresStore) else 'in-memory demo','aws_adapters':'not connected'}
    if method=='GET' and path=='/api/portfolio':return 200,store.portfolio()
    if method=='GET' and path=='/api/decisions':return 200,store.decisions()
    if method=='POST' and path=='/api/decisions':return 201,store.create_decision(decision_payload(body))
    if method=='GET' and path.startswith('/api/decisions/'):
        row=store.decision(path.rsplit('/',1)[-1]);return (200,row) if row else (404,{'error':'Decision not found.'})
    if method=='GET' and path=='/api/scenarios':return 200,store.scenarios()
    if method=='POST' and path.startswith('/api/decisions/') and path.endswith('/scenarios'):
        decision_id=path.split('/')[3];row=store.create_scenario(decision_id,scenario_payload(body))
        return (201,row) if row else (404,{'error':'Decision not found.'})
    if method=='GET' and path=='/api/impacts':return 200,store.impacts()
    if method=='GET' and path=='/api/briefings':return 200,store.briefings()
    if method=='POST' and path=='/api/briefings':
        if isinstance(store,PostgresStore):return 501,{'error':'Briefing writes need the trusted server-side identity adapter.'}
        decision_id=required_text(body.get('decision_id'),'Decision',80)
        scenario_id=required_text(body.get('scenario_id'),'Scenario',80)
        notes=required_text(body.get('human_notes'),'Human notes',5000)
        return 201,store.create_briefing(decision_id,scenario_id,notes)
    if method=='POST' and path=='/api/briefings/demo/submit':
        if isinstance(store,PostgresStore):
            return 501,{'error':'Briefing submission needs configured PostgreSQL identity and decision records.'}
        return 201,store.submit_briefing()
    if method=='GET' and path=='/api/approvals':return 200,store.approvals()
    if method=='POST' and path=='/api/approvals':
        if isinstance(store,PostgresStore):return 501,{'error':'Identity provider is not connected. Final approval requires a server-authenticated actor role.'}
        ApprovalEngine.authorize(body.get('actor_role'),body.get('action'))
        return 201,store.decide(body)
    if method=='GET' and path=='/api/audit':return 200,store.audit()
    return 404,{'error':'API route not found.'}
