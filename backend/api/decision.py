"""Decision route façade."""
from backend.api.routes import route

def list_decisions():return route('GET','/api/decisions')
def create_decision(payload):return route('POST','/api/decisions',payload)
def get_decision(decision_id):return route('GET',f'/api/decisions/{decision_id}')
