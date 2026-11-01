"""Impact route façade."""
from backend.api.routes import route

def list_impacts():return route('GET','/api/impacts')
