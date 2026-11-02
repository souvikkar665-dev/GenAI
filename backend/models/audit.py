"""Audit event model with actor, action, timestamp, and business reference."""

from pydantic import BaseModel, Field, ConfigDict


class AuditEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    organization_id: str
    entity_type: str = Field(min_length=1)
    entity_id: str
    action: str = Field(min_length=1)
    description: str
    actor_id: str | None = None
    created_at: str | None = None
