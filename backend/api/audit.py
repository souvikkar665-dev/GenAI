"""Audit history route façade."""
from backend.api.routes import route

def list_audit():return route('GET','/api/audit')
