"""Approval event model; final decisions remain human-authored."""
from dataclasses import dataclass
@dataclass
class Approval:
    id:str
    decision_id:str
    actor_id:str
    action:str
    comment:str=''
