"""Decision-definition business rules."""
from backend.core.validation import decision_payload
class DecisionEngine:
    @staticmethod
    def validate(body):return decision_payload(body)
    @staticmethod
    def readiness(decision, sources=None):
        missing=[k for k in ('objective','time_horizon') if not decision.get(k)]
        if not decision.get('constraints'):missing.append('constraints')
        if not decision.get('metrics'):missing.append('metrics')
        stale=[s['name'] for s in (sources or []) if s.get('stale')]
        return {'ready':not missing,'missing_fields':missing,'stale_sources':stale,'can_simulate':not missing}
