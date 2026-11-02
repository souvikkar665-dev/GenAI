"""Approval event model; final decisions remain human-authored."""

from pydantic import BaseModel, Field, ConfigDict


class Approval(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    decision_id: str
    actor_id: str
    action: str = Field(min_length=1)
    comment: str = ""
