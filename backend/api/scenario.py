"""Scenario route façade."""
from backend.api.routes import route

def list_scenarios():return route('GET','/api/scenarios')
def create_scenario(decision_id,payload):return route('POST',f'/api/decisions/{decision_id}/scenarios',payload)
