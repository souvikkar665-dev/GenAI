"""Scenario and metric-prediction entity shapes."""
from dataclasses import dataclass,field
@dataclass
class Scenario:
    id:str
    decision_id:str
    name:str
    scenario_type:str='Counterfactual'
    version:int=1
    assumptions:list[str]=field(default_factory=list)
@dataclass
class Prediction:
    metric:str
    value:float|None
    lower_bound:float|None
    upper_bound:float|None
    unit:str
    confidence:float|None
    model_version:str
    data_snapshot:str
    availability:str='available'
