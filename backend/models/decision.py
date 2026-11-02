"""Decision model using Pydantic."""

from pydantic import BaseModel, Field, ConfigDict


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    title: str = Field(min_length=1, max_length=140)
    original_question: str = Field(min_length=1, max_length=1200)
    objective: str = Field(min_length=1, max_length=600)
    time_horizon: str = Field(min_length=1, max_length=120)

    constraints: list[str] = Field(min_length=1)
    metrics: list[str] = Field(min_length=1)

    status: str = "draft"
