"""Organization-scoped user role model."""

from pydantic import BaseModel, Field, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    organization_id: str
    name: str = Field(min_length=1)
    role: str = Field(min_length=1)
    active: bool = True
