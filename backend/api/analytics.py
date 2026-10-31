"""Analytics route façade."""
from backend.api.routes import route

def portfolio():return route('GET','/api/portfolio')
