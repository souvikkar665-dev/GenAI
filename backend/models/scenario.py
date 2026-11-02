"""Scenario and metric-prediction models."""

from pydantic import BaseModel, Field, ConfigDict


class Scenario(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    decision_id: str
    name: str = Field(min_length=1, max_length=120)
    scenario_type: str = "Counterfactual"
    version: int = Field(default=1, ge=1)
    assumptions: list[str] = Field(default_factory=list)


class Prediction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    metric: str
    value: float | None
    lower_bound: float | None
    upper_bound: float | None
    unit: str
    confidence: float | None
    model_version: str
    data_snapshot: str
    availability: str = "available"
