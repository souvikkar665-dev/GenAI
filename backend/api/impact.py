"""Impact route facade."""
from backend.api.routes import get_store

def list_impacts():
    """
    Retrieves all counterfactual impacts from the active data store.
    """
    store = get_store()
    return 200, store.impacts()
