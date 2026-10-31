"""Freshness and range helpers; they do not infer missing business values."""
from datetime import datetime,timezone

def is_stale(timestamp,maximum_age_hours):
    if not timestamp:return True
    value=datetime.fromisoformat(timestamp.replace('Z','+00:00'))
    if value.tzinfo is None:value=value.replace(tzinfo=timezone.utc)
    age=(datetime.now(timezone.utc)-value.astimezone(timezone.utc)).total_seconds()/3600
    return age>maximum_age_hours

def bounded_range(lower,upper):
    if lower is None or upper is None:return None
    if lower>upper:raise ValueError('Lower bound cannot exceed upper bound.')
    return {'lower':lower,'upper':upper}
