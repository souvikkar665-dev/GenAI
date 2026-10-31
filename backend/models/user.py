"""Organization-scoped user role shape; a live identity provider is not connected."""
from dataclasses import dataclass
@dataclass
class User:
    id:str
    organization_id:str
    name:str
    role:str
    active:bool=True
