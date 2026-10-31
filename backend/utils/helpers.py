"""Small standard-library helpers shared by API-facing code."""
def normalized_words(values):
    if not isinstance(values,list):return []
    return [value.strip() for value in values if isinstance(value,str) and value.strip()]

def safe_limit(value,default=50,maximum=250):
    try:return max(1,min(int(value),maximum))
    except (TypeError,ValueError):return default
