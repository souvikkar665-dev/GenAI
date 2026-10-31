"""Briefing route façade."""
from backend.api.routes import route

def list_briefings():return route('GET','/api/briefings')
def submit_for_approval():return route('POST','/api/briefings/demo/submit',{})
