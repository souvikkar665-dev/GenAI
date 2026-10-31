"""Decision entity shape for validated Python services."""
from dataclasses import dataclass,field
@dataclass
class Decision:
    id:str
    title:str
    original_question:str
    objective:str
    time_horizon:str
    constraints:list[str]=field(default_factory=list)
    metrics:list[str]=field(default_factory=list)
    status:str='draft'
