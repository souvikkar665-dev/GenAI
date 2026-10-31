"""Versioned briefing entity shape."""
from dataclasses import dataclass
@dataclass
class Briefing:
    id:str
    decision_id:str
    version:int
    executive_summary:str
    status:str='draft'
    human_notes:str=''
