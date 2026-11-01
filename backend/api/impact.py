"""Impact route facade."""
from backend.api.routes import route

def list_impacts():
    """
    Retrieves all counterfactual impacts from the active data store.
    """
    return route('GET', '/api/impacts')
