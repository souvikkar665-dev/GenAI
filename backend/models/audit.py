"""Audit event model with actor, action, timestamp, and business reference."""
from dataclasses import dataclass
@dataclass
class AuditEvent:
    organization_id:str
    entity_type:str
    entity_id:str
    action:str
    description:str
    actor_id:str|None=None
    created_at:str|None=None
