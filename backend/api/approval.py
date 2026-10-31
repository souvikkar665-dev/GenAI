"""Approval route façade."""
from backend.api.routes import route

def list_approvals():return route('GET','/api/approvals')
def decide(payload):return route('POST','/api/approvals',payload)
