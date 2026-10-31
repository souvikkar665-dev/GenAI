"""Impact node entity shape."""
from dataclasses import dataclass
@dataclass
class Impact:
    id:str
    scenario_id:str
    name:str
    direction:str
    magnitude_band:str
    confidence:float|None
    owner:str|None=None
    measurement_requirement:str|None=None
