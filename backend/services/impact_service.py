"""Derive impact records only from structured predictions and linked dependencies."""
class ImpactEngine:
    @staticmethod
    def classify(delta, confidence):
        if delta is None or confidence is None:return {'direction':'uncertain','magnitude_band':'unknown'}
        band='small' if abs(delta)<5 else 'moderate' if abs(delta)<20 else 'large'
        return {'direction':'positive' if delta>0 else 'negative' if delta<0 else 'neutral','magnitude_band':band}
    @staticmethod
    def explain(metric,value,unit,delta,baseline,confidence):
        return {'metric':metric,'value':value,'unit':unit,'delta':delta,'baseline':baseline,'confidence':confidence,'causal_claim':'Association only; not proof of causation.'}
