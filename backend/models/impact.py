"""Impact node model."""

from pydantic import BaseModel, Field, ConfigDict


class Impact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    scenario_id: str
    name: str = Field(min_length=1)
    direction: str = Field(min_length=1)
    magnitude_band: str = Field(min_length=1)
    confidence: float | None
    owner: str | None = None
    measurement_requirement: str | None = None
