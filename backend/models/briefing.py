"""Versioned briefing entity model."""

from pydantic import BaseModel, Field, ConfigDict


class Briefing(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    decision_id: str
    version: int = Field(ge=1)
    executive_summary: str
    status: str = "draft"
    human_notes: str = ""
