"""Approval engine: explicit human approval with role validation and idempotency."""
import sqlite3, uuid
class ApprovalEngine:
    ALLOWED={'approved','rejected','change_requested'}
    def __init__(self, db_path): self.db_path=str(db_path)
    def _db(self):
        c=sqlite3.connect(self.db_path); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c
    def submit(self, decision_id, briefing_id, actor_id, idempotency_key=None):
        return self._record(decision_id,briefing_id,actor_id,'requested','',idempotency_key,require_role=False)
    def decide(self, decision_id, briefing_id, actor_id, action, comment='', idempotency_key=None):
        if action not in self.ALLOWED: raise ValueError('Action must be approved, rejected, or change_requested.')
        return self._record(decision_id,briefing_id,actor_id,action,comment,idempotency_key,require_role=True)
    def _record(self, decision_id, briefing_id, actor_id, action, comment, key, require_role):
        with self._db() as db:
            if key:
                old=db.execute('SELECT * FROM approvals WHERE idempotency_key=?',(key,)).fetchone()
                if old: return dict(old)
            d=db.execute('SELECT organization_id FROM decisions WHERE id=?',(decision_id,)).fetchone()
            if not d: raise LookupError('Decision not found.')
            u=db.execute('SELECT role,organization_id FROM users WHERE id=?',(actor_id,)).fetchone()
            if not u or u['organization_id']!=d['organization_id']: raise PermissionError('Actor is not authorized for this organization.')
            if require_role and u['role'] not in ('Approver','Admin'): raise PermissionError('Only an Approver or Admin can decide.')
            if briefing_id and not db.execute('SELECT 1 FROM briefings WHERE id=? AND decision_id=?',(briefing_id,decision_id)).fetchone(): raise ValueError('Briefing does not belong to this decision.')
            aid=str(uuid.uuid4()); db.execute('INSERT INTO approvals(id,decision_id,briefing_id,actor_id,action,comment,idempotency_key) VALUES(?,?,?,?,?,?,?)',(aid,decision_id,briefing_id,actor_id,action,comment,key))
            new_status={'approved':'approved','rejected':'rejected','change_requested':'in_review','requested':'in_review'}[action]
            db.execute('UPDATE decisions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',(new_status,decision_id))
            db.execute('UPDATE briefings SET status=? WHERE id=?',({'approved':'approved','rejected':'rejected','change_requested':'changes_requested','requested':'submitted'}[action],briefing_id)) if briefing_id else None
            db.execute('INSERT INTO audit_logs(organization_id,actor_id,entity_type,entity_id,action,description) VALUES(?,?,?,?,?,?)',(d['organization_id'],actor_id,'decision',decision_id,action,comment or 'Approval workflow event.'))
            return dict(db.execute('SELECT * FROM approvals WHERE id=?',(aid,)).fetchone())
