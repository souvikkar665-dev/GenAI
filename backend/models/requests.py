
"""Pydantic schemas for incoming API requests."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DecisionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=140)
    original_question: str = Field(min_length=1, max_length=1200)
    objective: str = Field(min_length=1, max_length=600)
    time_horizon: str = Field(min_length=1, max_length=120)
    constraints: list[str] = Field(min_length=1)
    metrics: list[str] = Field(min_length=1)
    change_description: str | None = None
    business_unit: str = "Corporate"


class ScenarioCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=800)
    variable: str = "Scenario variable"
    value: str = ""
    assumptions: str = ""


class ApprovalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actor_role: str
    action: Literal["approved", "rejected", "change_requested"]
    comment: str = ""


class BriefingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision_id: str = Field(min_length=1, max_length=80)
    scenario_id: str = Field(min_length=1, max_length=80)
    human_notes: str = Field(min_length=1, max_length=5000)
