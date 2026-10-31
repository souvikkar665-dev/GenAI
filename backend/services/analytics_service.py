"""Fast aggregate helpers used by Home and operational reporting."""
class AnalyticsEngine:
    @staticmethod
    def summary(decisions,scenarios,approvals,predictions):
        available=[x.get('confidence') for x in predictions if x.get('availability','available')=='available' and x.get('confidence') is not None]
        active=sum(1 for x in decisions if x.get('status') not in ('approved','rejected','archived'))
        pending=sum(1 for x in approvals if x.get('action')=='requested')
        return {'active_decisions':active,'scenario_count':len(scenarios),'pending_approvals':pending,'average_confidence':round(sum(available)/len(available),3) if available else None}
